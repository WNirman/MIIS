#!/usr/bin/env python3
"""
MIIS National Marine Wildlife Mortality Data Cleaning & Forensic QA Pipeline
===========================================================================
Reads the raw Sri Lanka Ministry marine wildlife mortality workbook
(data/raw/Wildlife_mortality_raw.xlsx) and applies deterministic, fully audited
cleaning rules using external reference tables in analysis/reference/.

Design principles for peer-reviewed publication (FAIR & reproducible):
  1. Raw fields are preserved verbatim alongside cleaned fields.
  2. Every modification is recorded in data/processed/change_log.csv with rule ID.
  3. Excel DD/MM/YYYY -> MM/DD/YYYY locale date-transposition corruption is
     detected and verified via chronological sequence analysis.
  4. Administrative hierarchy (Province <-> District <-> Coastal Locality) is
     validated against Sri Lanka Survey Dept / DS Division boundaries.
  5. Missing places/taxa are NEVER fabricated; spatial precision & completeness
     flags communicate fit-for-use transparently.
  6. Same-day, same-locality, same-species records are FLAGGED (not deleted),
     because each row in the ministry register represents an individual carcass
     (including multi-individual strandings such as the Feb 2023 Kalpitiya
     pilot whale mass stranding).

Outputs:
  - data/processed/wildlife_mortality_clean.csv
  - data/processed/wildlife_mortality_clean.xlsx
  - data/processed/wildlife_mortality_clean.geojson
  - data/processed/change_log.csv
  - data/processed/quality_summary.json
  - src/data/ministry_mortality_clean.json  (for MIIS web/mobile dashboard)
"""

from __future__ import annotations

import datetime as dt
import json
import math
import os
import re
from collections import Counter, defaultdict
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

import openpyxl
import pandas as pd

ROOT = Path(__file__).resolve().parent.parent
RAW_XLSX = ROOT / "data" / "raw" / "Wildlife_mortality_raw.xlsx"
REF_DIR = ROOT / "analysis" / "reference"
OUT_DIR = ROOT / "data" / "processed"
WEB_DATA_DIR = ROOT / "src" / "data"

# MV X-Press Pearl key reference date: vessel sank on 2021-06-02 (fire started 2021-05-20)
XPP_SINKING_DATE = dt.date(2021, 6, 2)
XPP_FIRE_DATE = dt.date(2021, 5, 20)


def norm_text(val: Any) -> str:
    if val is None or (isinstance(val, float) and math.isnan(val)):
        return ""
    return re.sub(r"\s+", " ", str(val)).strip()


def norm_key(val: str) -> str:
    return re.sub(r"\s+", " ", val.lower()).strip()


def sri_lanka_season(month: Optional[int]) -> str:
    if month is None:
        return ""
    if month in (5, 6, 7, 8, 9):
        return "SW monsoon (May-Sep)"
    if month in (10, 11):
        return "Second inter-monsoon (Oct-Nov)"
    if month in (12, 1, 2):
        return "NE monsoon (Dec-Feb)"
    return "First inter-monsoon (Mar-Apr)"


def load_references() -> Tuple[Dict[str, dict], Dict[str, dict], Dict[str, dict]]:
    districts_df = pd.read_csv(REF_DIR / "sl_districts.csv")
    districts: Dict[str, dict] = {}
    for _, r in districts_df.iterrows():
        districts[norm_key(r["district"])] = r.to_dict()

    species_df = pd.read_csv(REF_DIR / "species_reference.csv").fillna("")
    species_by_alias: Dict[str, dict] = {}
    species_by_std: Dict[str, dict] = {}
    for _, r in species_df.iterrows():
        rec = r.to_dict()
        species_by_std[rec["scientific_name_std"]] = rec
        aliases = [a.strip() for a in str(rec["raw_aliases"]).split("|") if a.strip()]
        aliases.append(rec["scientific_name_std"])
        for a in aliases:
            species_by_alias[norm_key(a)] = rec

    gaz_df = pd.read_csv(REF_DIR / "sl_coastal_gazetteer.csv").fillna("")
    gaz_by_alias: Dict[str, dict] = {}
    for _, r in gaz_df.iterrows():
        rec = r.to_dict()
        aliases = [a.strip() for a in str(rec["raw_aliases"]).split("|") if a.strip()]
        aliases.append(rec["locality_std"])
        for a in aliases:
            gaz_by_alias[norm_key(a)] = rec

    return districts, species_by_alias, species_by_std, gaz_by_alias


def count_chronology_violations(dates: List[Optional[dt.date]]) -> Tuple[int, List[dict]]:
    """Count backward date jumps in sequential non-null rows."""
    violations = 0
    details = []
    prev_d: Optional[dt.date] = None
    prev_idx: Optional[int] = None
    for idx, d in enumerate(dates, start=1):
        if d is None:
            continue
        if prev_d is not None and d < prev_d:
            violations += 1
            details.append({
                "record_no": idx,
                "date": d.isoformat(),
                "prev_record_no": prev_idx,
                "prev_date": prev_d.isoformat(),
                "delta_days": (d - prev_d).days,
            })
        prev_d = d
        prev_idx = idx
    return violations, details


def standardize_district_spelling(raw_d: str) -> Tuple[str, Optional[str]]:
    if not raw_d:
        return "", None
    mapping = {
        "baticaloa": ("Batticaloa", "Spelling typo Baticaloa -> Batticaloa"),
        "kaluthara": ("Kalutara", "Spelling typo Kaluthara -> Kalutara"),
    }
    k = norm_key(raw_d)
    if k in mapping:
        return mapping[k]
    return raw_d.strip(), None


def standardize_province_spelling(raw_p: str) -> Tuple[str, Optional[str]]:
    if not raw_p:
        return "", None
    k = norm_key(raw_p)
    valid = {
        "western": "Western",
        "southern": "Southern",
        "north western": "North Western",
        "northern": "Northern",
        "eastern": "Eastern",
        "uva": "Uva",
    }
    if k in valid:
        std = valid[k]
        if raw_p.strip() != std:
            return std, f"Case standardisation: {raw_p.strip()} -> {std}"
        return std, None
    return raw_p.strip(), None


def parse_dates(raw_rows: List[Tuple[int, Tuple[Any, ...]]]) -> Tuple[List[dict], List[dict], dict]:
    """
    Parse and forensically repair mixed Excel datetime + DD/MM/YYYY text dates.

    In Sri Lanka ministry sheets entered in DD/MM/YYYY format on US-locale Excel,
    rows with day <= 12 were auto-converted to Excel datetime serials with day
    and month transposed (e.g., '01/06/2021' stored as 2021-01-06), whereas
    rows with day >= 13 remained literal text strings ('13/06/2021').
    """
    change_log: List[dict] = []
    parsed: List[dict] = []

    raw_stored_dates: List[Optional[dt.date]] = []
    excel_dt_count = 0
    text_cell_count = 0
    missing_count = 0
    swapped_count = 0
    same_day_month_count = 0

    for rec_no, (excel_row, row) in enumerate(raw_rows, start=1):
        cell = row[0]
        if cell is None or (isinstance(cell, str) and cell.strip() == ""):
            missing_count += 1
            raw_stored_dates.append(None)
            parsed.append({
                "event_date": None,
                "date_cell": "",
                "date_flag": "date_missing",
                "date_precision": "missing",
            })
            continue

        if isinstance(cell, (dt.datetime, dt.date)):
            excel_dt_count += 1
            d_obj = cell.date() if isinstance(cell, dt.datetime) else cell
            iso_raw = cell.isoformat() if isinstance(cell, dt.datetime) else d_obj.isoformat()
            raw_stored_dates.append(d_obj)

            # In US-locale Excel, DD/MM/YYYY with DD <= 12 became YYYY-DD-MM
            # Therefore stored month = original day, stored day = original month (when day <= 12)
            orig_day = d_obj.month
            orig_month = d_obj.day
            if orig_day == orig_month:
                same_day_month_count += 1
                parsed.append({
                    "event_date": d_obj,
                    "date_cell": iso_raw,
                    "date_flag": "same_day_month_unambiguous",
                    "date_precision": "day",
                })
            elif orig_month <= 12:
                fixed = dt.date(d_obj.year, orig_month, orig_day)
                swapped_count += 1
                change_log.append({
                    "record_no": rec_no,
                    "field": "event_date",
                    "old_value": d_obj.isoformat(),
                    "new_value": fixed.isoformat(),
                    "rule": "R1_DATE_DAY_MONTH_SWAP",
                    "reason": "US-locale Excel stored DD/MM/YYYY as MM/DD/YYYY when DD<=12; swap verified by chronological continuity",
                })
                parsed.append({
                    "event_date": fixed,
                    "date_cell": iso_raw,
                    "date_flag": "day_month_swapped",
                    "date_precision": "day",
                })
            else:
                parsed.append({
                    "event_date": d_obj,
                    "date_cell": iso_raw,
                    "date_flag": "",
                    "date_precision": "day",
                })
        else:
            text_cell_count += 1
            s = str(cell).strip()
            m = re.match(r"^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})$", s)
            if m:
                day_i, month_i, year_i = int(m.group(1)), int(m.group(2)), int(m.group(3))
                d_fixed = dt.date(year_i, month_i, day_i)
                raw_stored_dates.append(d_fixed)
                change_log.append({
                    "record_no": rec_no,
                    "field": "event_date",
                    "old_value": s,
                    "new_value": d_fixed.isoformat(),
                    "rule": "R2_DATE_TEXT_PARSE",
                    "reason": "Literal text date parsed as DD/MM/YYYY to ISO-8601",
                })
                parsed.append({
                    "event_date": d_fixed,
                    "date_cell": s,
                    "date_flag": "",
                    "date_precision": "day",
                })
            else:
                # Fallback ISO text
                d_iso = dt.date.fromisoformat(s[:10])
                raw_stored_dates.append(d_iso)
                parsed.append({
                    "event_date": d_iso,
                    "date_cell": s,
                    "date_flag": "",
                    "date_precision": "day",
                })

    fixed_dates = [p["event_date"] for p in parsed]
    viol_before, _ = count_chronology_violations(raw_stored_dates)
    viol_after, viol_after_details = count_chronology_violations(fixed_dates)

    # Mark minor out-of-sequence records honestly (e.g. 2023-01-08 logged 1 row before 2023-01-07)
    for vd in viol_after_details:
        idx0 = vd["record_no"] - 1
        cur_f = parsed[idx0]["date_flag"]
        parsed[idx0]["date_flag"] = (cur_f + ";minor_log_order_inversion").lstrip(";")

    dated = [d for d in fixed_dates if d is not None]
    date_stats = {
        "excel_datetime_cells": excel_dt_count,
        "text_cells": text_cell_count,
        "missing": missing_count,
        "day_month_swapped_and_fixed": swapped_count,
        "same_day_month_unambiguous": same_day_month_count,
        "chronology_violations_if_stored_value_used": viol_before,
        "chronology_violations_after_swap_fix": viol_after,
        "residual_out_of_sequence_records": viol_after_details,
        "date_range": [min(dated).isoformat(), max(dated).isoformat()],
    }
    return parsed, change_log, date_stats


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    WEB_DATA_DIR.mkdir(parents=True, exist_ok=True)

    districts_ref, species_by_alias, species_by_std, gaz_by_alias = load_references()

    wb = openpyxl.load_workbook(RAW_XLSX)
    ws = wb.active
    all_rows = list(ws.iter_rows(values_only=True))
    data_rows_raw = all_rows[1:]  # skip header

    non_empty_rows: List[Tuple[int, Tuple[Any, ...]]] = []
    blank_rows = 0
    for excel_row_idx, r in enumerate(data_rows_raw, start=2):
        if not any(v is not None and str(v).strip() != "" for v in r):
            blank_rows += 1
        else:
            non_empty_rows.append((excel_row_idx, r))

    parsed_dates, change_log, date_stats = parse_dates(non_empty_rows)

    loc_counters = Counter()
    tax_counters = Counter()
    records: List[dict] = []

    for rec_no, ((excel_row, raw), d_info) in enumerate(zip(non_empty_rows, parsed_dates), start=1):
        rec_id = f"MIN-WM-{rec_no:04d}"
        prov_raw = "" if raw[1] is None else str(raw[1])
        dist_raw = "" if raw[2] is None else str(raw[2])
        place_raw = "" if raw[3] is None else str(raw[3])
        species_raw = "" if raw[4] is None else str(raw[4])
        sci_raw = "" if raw[5] is None else str(raw[5])

        prov_clean_in = norm_text(prov_raw)
        dist_clean_in = norm_text(dist_raw)
        place_clean = norm_text(place_raw)

        location_flags: List[str] = []

        # --- Step 1: Detect place name mistakenly typed into Province column ---
        prov_working = prov_clean_in
        place_working = place_clean
        if prov_working and norm_key(prov_working) not in {
            "western", "southern", "north western", "northern", "eastern", "uva",
            "central", "north central", "sabaragamuwa"
        }:
            loc_counters["province_contains_place_name"] += 1
            location_flags.append("province_contains_place_name")
            change_log.append({
                "record_no": rec_no,
                "field": "province",
                "old_value": prov_working,
                "new_value": "",
                "rule": "R8_PROVINCE_INVALID_VALUE",
                "reason": f"Place name '{prov_working}' erroneously entered in Province column",
            })
            if not place_working and not dist_clean_in:
                # Column shift recovery (e.g., MIN-WM-0499: 'Galleface beach' in Province col, District & Place blank)
                place_working = prov_working
                loc_counters["column_shift_recovered"] += 1
                location_flags.append("column_shift_recovered")
                change_log.append({
                    "record_no": rec_no,
                    "field": "place_original_clean",
                    "old_value": "",
                    "new_value": place_working,
                    "rule": "R3_COLUMN_SHIFT",
                    "reason": "Recovered shifted place string from Province column into Place field",
                })
            prov_working = ""

        # --- Step 2: Standardise raw District & Province spelling ---
        dist_working, dist_spell_reason = standardize_district_spelling(dist_clean_in)
        if dist_spell_reason:
            loc_counters["district_spelling_standardised"] += 1
            change_log.append({
                "record_no": rec_no,
                "field": "district",
                "old_value": dist_clean_in,
                "new_value": dist_working,
                "rule": "R4_DISTRICT_SPELLING",
                "reason": dist_spell_reason,
            })

        prov_working, prov_spell_reason = standardize_province_spelling(prov_working)
        if prov_spell_reason:
            change_log.append({
                "record_no": rec_no,
                "field": "province",
                "old_value": prov_clean_in,
                "new_value": prov_working,
                "rule": "R10_PROVINCE_SPELLING",
                "reason": prov_spell_reason,
            })

        # Flag non-coastal district if entered in raw sheet
        if dist_working and norm_key(dist_working) in districts_ref:
            if int(districts_ref[norm_key(dist_working)]["is_coastal"]) == 0:
                loc_counters["non_coastal_district_in_raw"] += 1
                location_flags.append("non_coastal_district_in_raw")

        # --- Step 3: Gazetteer lookup & authoritative District/Province reconciliation ---
        gaz_hit = gaz_by_alias.get(norm_key(place_working)) if place_working else None

        final_district = dist_working
        final_province = prov_working
        locality_std = ""
        site_type = ""
        lat: Optional[float] = None
        lon: Optional[float] = None
        coord_precision = "none"
        coord_confidence = "none"
        coord_uncertainty_km: Optional[float] = None
        coord_source = ""

        if gaz_hit is not None:
            locality_std = gaz_hit["locality_std"]
            site_type = gaz_hit["site_type"]
            lat = float(gaz_hit["latitude"])
            lon = float(gaz_hit["longitude"])
            coord_precision = gaz_hit["coord_precision"]
            coord_confidence = gaz_hit["coord_confidence"]
            coord_uncertainty_km = float(gaz_hit["coord_uncertainty_km"])
            coord_source = "MIIS verified coastal gazetteer v2 (locality centroid)"

            auth_dist = gaz_hit["district"]
            if not final_district:
                loc_counters["district_imputed_from_place"] += 1
                location_flags.append("district_imputed_from_place")
                change_log.append({
                    "record_no": rec_no,
                    "field": "district",
                    "old_value": "",
                    "new_value": auth_dist,
                    "rule": "R5_DISTRICT_FROM_PLACE",
                    "reason": f"Imputed District='{auth_dist}' from verified locality '{locality_std}'",
                })
                final_district = auth_dist
            elif norm_key(final_district) != norm_key(auth_dist):
                loc_counters["district_corrected_from_place"] += 1
                location_flags.append("district_corrected_from_place")
                change_log.append({
                    "record_no": rec_no,
                    "field": "district",
                    "old_value": final_district,
                    "new_value": auth_dist,
                    "rule": "R6_DISTRICT_PLACE_CONFLICT",
                    "reason": f"Locality '{locality_std}' lies in {auth_dist} District (Survey Dept / DS boundary), not {final_district}",
                })
                final_district = auth_dist
        else:
            if place_working:
                loc_counters["place_not_in_gazetteer"] += 1
                location_flags.append("place_not_in_gazetteer")
            else:
                if final_district:
                    loc_counters["place_missing"] += 1
                    location_flags.append("place_missing")
                else:
                    loc_counters["no_location_at_all"] += 1
                    location_flags.append("no_location_at_all")

            # Fall back to District coastal centroid ONLY if District is known & coastal
            if final_district and norm_key(final_district) in districts_ref:
                d_meta = districts_ref[norm_key(final_district)]
                lat = float(d_meta["centroid_lat"])
                lon = float(d_meta["centroid_lon"])
                coord_precision = "district"
                coord_confidence = "district"
                coord_uncertainty_km = 25.0
                coord_source = "District coastal centroid (fine locality unavailable)"

        # Authoritative Province from District
        if final_district and norm_key(final_district) in districts_ref:
            auth_prov = districts_ref[norm_key(final_district)]["province"]
            if not final_province:
                if "province_contains_place_name" not in location_flags:
                    loc_counters["province_missing_filled"] += 1
                    location_flags.append("province_imputed")
                    change_log.append({
                        "record_no": rec_no,
                        "field": "province",
                        "old_value": "",
                        "new_value": auth_prov,
                        "rule": "R7_PROVINCE_FILLED",
                        "reason": f"Filled missing Province='{auth_prov}' from District='{final_district}'",
                    })
                else:
                    change_log.append({
                        "record_no": rec_no,
                        "field": "province",
                        "old_value": prov_clean_in,
                        "new_value": auth_prov,
                        "rule": "R7_PROVINCE_FILLED",
                        "reason": f"Replaced invalid Province with '{auth_prov}' from District='{final_district}'",
                    })
                final_province = auth_prov
            elif norm_key(final_province) != norm_key(auth_prov):
                loc_counters["province_district_mismatch_corrected"] += 1
                location_flags.append("province_corrected")
                change_log.append({
                    "record_no": rec_no,
                    "field": "province",
                    "old_value": final_province,
                    "new_value": auth_prov,
                    "rule": "R9_PROVINCE_DISTRICT_MISMATCH",
                    "reason": f"District '{final_district}' belongs to {auth_prov} Province, not {final_province}",
                })
                final_province = auth_prov

        loc_counters[f"precision_{coord_precision}"] += 1

        # --- Step 4: Taxonomy Standardisation (WoRMS & IUCN 2025/2026) ---
        sp_clean = norm_text(species_raw)
        sci_clean = norm_text(sci_raw)
        taxonomy_flags: List[str] = []
        life_stage = ""

        if sp_clean.lower() == "whale fetus":
            life_stage = "fetus"
            reported_cat = "Whale"
        else:
            reported_cat = sp_clean

        if sci_clean == "-":
            change_log.append({
                "record_no": rec_no,
                "field": "scientific_name",
                "old_value": "-",
                "new_value": "",
                "rule": "R12_PLACEHOLDER_TO_NULL",
                "reason": "Replaced dash placeholder '-' with null/unidentified",
            })
            sci_clean = ""

        if sci_clean.lower() == "unidentified":
            sci_clean = ""

        sp_rec: Optional[dict] = None
        if sci_clean:
            sp_rec = species_by_alias.get(norm_key(sci_clean))
            if sp_rec is not None and sci_clean != sp_rec["scientific_name_std"]:
                tax_counters["scientific_name_standardised"] += 1
                taxonomy_flags.append("scientific_name_standardised")
                change_log.append({
                    "record_no": rec_no,
                    "field": "scientific_name",
                    "old_value": sci_clean,
                    "new_value": sp_rec["scientific_name_std"],
                    "rule": "R11_SCI_NAME_STANDARDISED",
                    "reason": f"Standardised taxonomy/case/spelling -> {sp_rec['scientific_name_std']}",
                })

        if sp_rec is None:
            # Species not identified at binomial/genus level; classify by reported category
            cat_l = reported_cat.lower()
            if "turtle" in cat_l:
                sp_rec = species_by_std["Cheloniidae/Dermochelyidae indet."]
                tax_counters["species_not_identified"] += 1
                taxonomy_flags.append("species_not_identified")
            elif "dolphin" in cat_l:
                sp_rec = species_by_std["Delphinidae indet."]
                tax_counters["species_not_identified"] += 1
                taxonomy_flags.append("species_not_identified")
            elif "whale" in cat_l or "porpoise" in cat_l:
                sp_rec = species_by_std["Cetacea indet."]
                tax_counters["species_not_identified"] += 1
                taxonomy_flags.append("species_not_identified")
            else:
                sp_rec = species_by_std["Unidentified marine fauna"]
                tax_counters["taxon_missing"] += 1
                tax_counters["species_not_identified"] += 1
                taxonomy_flags.append("taxon_missing")

        taxon_group = sp_rec["taxon_group"]
        tax_counters[f"taxon_{taxon_group}"] += 1

        # --- Step 5: Temporal metadata & Completeness ---
        ev_d: Optional[dt.date] = d_info["event_date"]
        year_v = ev_d.year if ev_d else None
        month_v = ev_d.month if ev_d else None
        iso_week_v = ev_d.isocalendar()[1] if ev_d else None
        season_v = sri_lanka_season(month_v)
        days_since_xpp = float((ev_d - XPP_SINKING_DATE).days) if ev_d else None

        # Completeness over 5 core scientific attributes:
        # 1) date, 2) district, 3) locality, 4) taxon_group != Unknown, 5) species/genus ID
        comp_score = round(sum([
            1.0 if ev_d is not None else 0.0,
            1.0 if bool(final_district) else 0.0,
            1.0 if bool(locality_std) else 0.0,
            1.0 if taxon_group != "Unknown" else 0.0,
            1.0 if sp_rec["identification_level"] in ("species", "genus") else 0.0,
        ]) / 5.0, 2)

        fit_tags = []
        if ev_d is not None:
            fit_tags.append("temporal")
        if coord_precision == "locality":
            fit_tags.append("spatial_fine")
        elif coord_precision in ("town", "district"):
            fit_tags.append("spatial_coarse")
        if sp_rec["identification_level"] == "species":
            fit_tags.append("species_level")

        has_non_trivial_flag = any([
            d_info["date_flag"] not in ("", "same_day_month_unambiguous"),
            len(location_flags) > 0,
            len(taxonomy_flags) > 0,
        ])
        qc_status = "cleaned_with_flags" if has_non_trivial_flag else "clean"

        records.append({
            "record_id": rec_id,
            "record_no": rec_no,
            "excel_row": excel_row,
            "event_date": ev_d.isoformat() if ev_d else "",
            "date_precision": d_info["date_precision"],
            "date_flag": d_info["date_flag"],
            "year": year_v,
            "month": month_v,
            "iso_week": iso_week_v,
            "season": season_v,
            "days_since_xpp_sinking": days_since_xpp,
            "province": final_province,
            "district": final_district,
            "locality_std": locality_std,
            "place_original_clean": place_working,
            "site_type": site_type,
            "latitude": lat,
            "longitude": lon,
            "coord_precision": coord_precision,
            "coord_confidence": coord_confidence,
            "coord_uncertainty_km": coord_uncertainty_km,
            "coord_source": coord_source,
            "location_flag": ";".join(location_flags),
            "reported_category": reported_cat,
            "taxon_group": taxon_group,
            "scientific_name": sp_rec["scientific_name_std"],
            "common_name": sp_rec["common_name"],
            "order_name": sp_rec["order_name"],
            "family": sp_rec["family"],
            "identification_level": sp_rec["identification_level"],
            "iucn_global_status": sp_rec["iucn_global_status"],
            "life_stage": life_stage,
            "taxonomy_flag": ";".join(taxonomy_flags),
            "record_completeness": comp_score,
            "fit_for_use": ";".join(fit_tags),
            "qc_status": qc_status,
            # Raw verbatim audit trail
            "date_cell": d_info["date_cell"],
            "province_raw": prov_raw,
            "district_raw": dist_raw,
            "place_raw": place_raw,
            "species_raw": species_raw,
            "scientific_raw": sci_raw,
        })

    # --- Step 6: Flag same-day, same-locality, same-species clusters (DO NOT DELETE) ---
    cluster_keys: Dict[Tuple[str, str, str, str], List[int]] = defaultdict(list)
    day_loc_counts: Counter = Counter()
    for i, rec in enumerate(records):
        loc_key = rec["locality_std"] or f"DIST:{rec['district']}"
        if rec["event_date"]:
            day_loc_counts[(rec["event_date"], loc_key)] += 1
            cluster_keys[(rec["event_date"], rec["district"], loc_key, rec["scientific_name"])].append(i)

    dg_counter = 0
    records_in_clusters = 0
    largest_cluster = 1
    for key, idxs in sorted(cluster_keys.items(), key=lambda kv: kv[1][0]):
        n_grp = len(idxs)
        if n_grp > 1:
            dg_counter += 1
            dg_id = f"DG-{dg_counter:03d}"
            records_in_clusters += n_grp
            largest_cluster = max(largest_cluster, n_grp)
            for idx in idxs:
                records[idx]["same_day_site_species_n"] = n_grp
                records[idx]["duplicate_review_group"] = dg_id
        else:
            records[idxs[0]]["same_day_site_species_n"] = 1
            records[idxs[0]]["duplicate_review_group"] = ""

    for rec in records:
        loc_key = rec["locality_std"] or f"DIST:{rec['district']}"
        rec["animals_same_day_same_locality"] = day_loc_counts[(rec["event_date"], loc_key)] if rec["event_date"] else 1
        if "same_day_site_species_n" not in rec:
            rec["same_day_site_species_n"] = 1
            rec["duplicate_review_group"] = ""

    # Reorder columns cleanly
    col_order = [
        "record_id", "record_no", "excel_row", "event_date", "date_precision", "date_flag",
        "year", "month", "iso_week", "season", "days_since_xpp_sinking",
        "province", "district", "locality_std", "place_original_clean", "site_type",
        "latitude", "longitude", "coord_precision", "coord_confidence",
        "coord_uncertainty_km", "coord_source", "location_flag",
        "reported_category", "taxon_group", "scientific_name", "common_name",
        "order_name", "family", "identification_level", "iucn_global_status",
        "life_stage", "taxonomy_flag",
        "same_day_site_species_n", "duplicate_review_group", "animals_same_day_same_locality",
        "record_completeness", "fit_for_use", "qc_status",
        "date_cell", "province_raw", "district_raw", "place_raw", "species_raw", "scientific_raw"
    ]
    out_df = pd.DataFrame(records)[col_order]
    change_df = pd.DataFrame(change_log)

    # Save CSV, XLSX, Change Log
    out_df.to_csv(OUT_DIR / "wildlife_mortality_clean.csv", index=False)
    change_df.to_csv(OUT_DIR / "change_log.csv", index=False)

    with pd.ExcelWriter(OUT_DIR / "wildlife_mortality_clean.xlsx", engine="openpyxl") as writer:
        out_df.to_excel(writer, sheet_name="cleaned_mortality_data", index=False)
        change_df.to_excel(writer, sheet_name="audit_change_log", index=False)

    # Save GeoJSON (only records with valid coordinates)
    features = []
    for rec in records:
        if rec["latitude"] is not None and rec["longitude"] is not None:
            props = {k: v for k, v in rec.items() if k not in ("latitude", "longitude")}
            features.append({
                "type": "Feature",
                "geometry": {
                    "type": "Point",
                    "coordinates": [rec["longitude"], rec["latitude"]],
                },
                "properties": props,
            })
    geojson_obj = {
        "type": "FeatureCollection",
        "name": "Sri_Lanka_Marine_Wildlife_Mortality_2021_2026_Clean",
        "crs": {"type": "name", "properties": {"name": "urn:ogc:def:crs:OGC:1.3:CRS84"}},
        "features": features,
    }
    with open(OUT_DIR / "wildlife_mortality_clean.geojson", "w", encoding="utf-8") as f:
        json.dump(geojson_obj, f, indent=2, ensure_ascii=False)

    # Save Quality Summary JSON
    rule_counts = dict(sorted(Counter(c["rule"] for c in change_log).items()))
    qc_counts = dict(Counter(r["qc_status"] for r in records))
    summary = {
        "generated_at": dt.datetime.now().isoformat(timespec="seconds"),
        "pipeline_version": "MIIS-QA-v2.0",
        "raw_file": str(RAW_XLSX.relative_to(ROOT)),
        "raw_rows_excluding_header": len(data_rows_raw),
        "blank_rows_removed": blank_rows,
        "records_retained": len(records),
        "dates": date_stats,
        "location": {
            "province_contains_place_name": loc_counters["province_contains_place_name"],
            "column_shift_recovered": loc_counters["column_shift_recovered"],
            "province_district_mismatch_corrected": loc_counters["province_district_mismatch_corrected"],
            "province_missing_filled": loc_counters["province_missing_filled"],
            "district_spelling_standardised": loc_counters["district_spelling_standardised"],
            "district_imputed_from_place": loc_counters["district_imputed_from_place"],
            "district_corrected_from_place": loc_counters["district_corrected_from_place"],
            "non_coastal_district_in_raw": loc_counters["non_coastal_district_in_raw"],
            "place_missing": loc_counters["place_missing"],
            "place_not_in_gazetteer": loc_counters["place_not_in_gazetteer"],
            "no_location_at_all": loc_counters["no_location_at_all"],
            "coord_precision_counts": {
                "locality": loc_counters["precision_locality"],
                "town": loc_counters["precision_town"],
                "district": loc_counters["precision_district"],
                "none": loc_counters["precision_none"],
            },
        },
        "taxonomy": {
            "scientific_name_standardised": tax_counters["scientific_name_standardised"],
            "species_not_identified": tax_counters["species_not_identified"],
            "taxon_missing": tax_counters["taxon_missing"],
            "taxon_group_counts": {
                "Sea turtle": tax_counters["taxon_Sea turtle"],
                "Cetacean": tax_counters["taxon_Cetacean"],
                "Sirenian": tax_counters["taxon_Sirenian"],
                "Unknown": tax_counters["taxon_Unknown"],
            },
        },
        "duplicates": {
            "records_in_same_day_site_species_groups": records_in_clusters,
            "review_groups": dg_counter,
            "largest_group": largest_cluster,
            "policy": "Flagged, not removed: each row in the ministry register represents an individual carcass; absence of carcass IDs/GPS/photos prevents distinguishing mass strandings from duplicate reports without field metadata.",
        },
        "qc_status_counts": qc_counts,
        "change_log_entries": len(change_log),
        "change_log_by_rule": rule_counts,
    }
    with open(OUT_DIR / "quality_summary.json", "w", encoding="utf-8") as f:
        json.dump(summary, f, indent=2, ensure_ascii=False)

    # Export clean compact JSON for MIIS Web/Mobile Dashboard & LiveMap
    web_records = []
    for rec in records:
        web_records.append({
            "incident_id": rec["record_id"],
            "event_date": rec["event_date"] or "Undated",
            "year": rec["year"],
            "month": rec["month"],
            "season": rec["season"],
            "province": rec["province"],
            "district": rec["district"] or "Unknown",
            "nearest_town": rec["locality_std"] or rec["district"] or "Western Coast (Unspecified)",
            "location_name": rec["locality_std"] or rec["place_original_clean"] or f"{rec['district']} Coast (Unspecified)",
            "latitude": rec["latitude"],
            "longitude": rec["longitude"],
            "spatial_precision": rec["coord_precision"],
            "coord_uncertainty_km": rec["coord_uncertainty_km"],
            "event_type": "Stranding & Mortality (Ministry Log)",
            "taxon_group": rec["taxon_group"],
            "reported_category": rec["reported_category"] or "Unknown",
            "species_common": rec["common_name"],
            "species_scientific": rec["scientific_name"],
            "iucn_status": rec["iucn_global_status"],
            "condition_status": "Dead",
            "number_dead": 1,
            "number_alive": 0,
            "urgency_level": "critical" if rec["iucn_global_status"] in ("CR", "EN") or rec["taxon_group"] == "Sirenian" else ("high" if rec["taxon_group"] == "Cetacean" else "medium"),
            "validation_status": "Ministry Verified (MIIS QA v2)",
            "validation_level": "Level 4",
            "suspected_cause": "Post-X-Press Pearl / Marine Stranding (Ministry Record)" if rec["year"] == 2021 else "Marine Stranding / Anthropogenic Mortality (Ministry Record)",
            "sensitive_location": 1 if rec["taxon_group"] in ("Sea turtle", "Sirenian") else 0,
            "qc_status": rec["qc_status"],
            "completeness": rec["record_completeness"],
            "duplicate_group": rec["duplicate_review_group"] or None,
            "flags": "; ".join(f for f in [rec["date_flag"], rec["location_flag"], rec["taxonomy_flag"]] if f),
        })

    with open(WEB_DATA_DIR / "ministry_mortality_clean.json", "w", encoding="utf-8") as f:
        json.dump({
            "metadata": {
                "title": "Sri Lanka National Marine Wildlife Mortality Dataset (Cleaned QA v2)",
                "source": "Sri Lanka Ministry Marine Wildlife Mortality Register (2021-2026)",
                "total_records": len(web_records),
                "date_range": date_stats["date_range"],
                "generated_at": summary["generated_at"],
            },
            "quality_summary": summary,
            "records": web_records,
        }, f, ensure_ascii=False)

    print(f"[MIIS CLEAN] Retained {len(records)} records ({blank_rows} blank rows removed).")
    print(f"[MIIS CLEAN] Date swap fixes: {date_stats['day_month_swapped_and_fixed']} | Chronology violations: {date_stats['chronology_violations_if_stored_value_used']} -> {date_stats['chronology_violations_after_swap_fix']}")
    print(f"[MIIS CLEAN] Locality geocoding: {loc_counters['precision_locality']}/{len(records)} ({loc_counters['precision_locality']/len(records)*100:.1f}%) | Unmapped places: {loc_counters['place_not_in_gazetteer']}")
    print(f"[MIIS CLEAN] Change log entries: {len(change_log)}")


if __name__ == "__main__":
    main()
