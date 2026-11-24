# Supplementary Material S1 — Data Dictionary & Forensic QA Rulebook

**Dataset:** `data/processed/wildlife_mortality_clean.csv` (`n = 516` records, `45` columns)  
**Audit Log:** `data/processed/change_log.csv` (`669` logged edits)  
**Pipeline Version:** `MIIS-QA-v2.0` (`analysis/clean_wildlife_mortality.py`)

## 1. Field-Level Data Dictionary

| Column | Type | Description |
| :--- | :--- | :--- |
| `record_id` | String | Stable unique identifier (`MIN-WM-0001` .. `MIN-WM-0516`). |
| `record_no` | Integer | 1-based sequential index after removing 25 blank workbook rows. |
| `excel_row` | Integer | Original row number in `Wildlife_mortality_raw.xlsx` for complete traceability. |
| `event_date` | ISO Date | Cleaned date (`YYYY-MM-DD`); blank if missing in raw register (`n = 1`). |
| `date_precision` | Enum | `day` or `missing`. |
| `date_flag` | String | Forensic date flags: `day_month_swapped` (`n=167`), `same_day_month_unambiguous` (`n=20`), `minor_log_order_inversion` (`n=1`), `date_missing` (`n=1`). |
| `year`, `month`, `iso_week` | Integer | Derived calendar year, month (1–12), and ISO-8601 week number. |
| `season` | Enum | Sri Lanka climatological season: `SW monsoon (May-Sep)`, `Second inter-monsoon (Oct-Nov)`, `NE monsoon (Dec-Feb)`, `First inter-monsoon (Mar-Apr)`. |
| `days_since_xpp_sinking` | Float | Signed day offset relative to MV *X-Press Pearl* sinking (`2021-06-02`). |
| `province`, `district` | String | Authoritative Sri Lanka Survey Dept / DS Division administrative hierarchy. |
| `locality_std` | String | Canonical coastal beach/settlement name from `sl_coastal_gazetteer.csv` (`164` sites). |
| `place_original_clean` | String | Whitespace-normalized original place text (newlines flattened). |
| `site_type` | String | Habitat/site type (`beach / shoreline`, `harbour / anchorage`, `lagoon / island coast`, etc.). |
| `latitude`, `longitude` | Float | WGS84 decimal degrees (null only when district and place are both missing, `n=1`). |
| `coord_precision` | Enum | `locality` (`484`), `town` (`2`), `district` (`29`), `none` (`1`). |
| `coord_confidence` | Enum | `high` ($\pm 1\text{ km}$), `medium` ($\pm 2\text{ km}$), `low` ($\pm 3\text{–}5\text{ km}$), `district` ($\pm 25\text{ km}$), `none`. |
| `coord_uncertainty_km` | Float | Approximate horizontal coordinate uncertainty radius in km. |
| `location_flag` | String | Semicolon-delimited spatial QA flags (`province_corrected`, `district_corrected_from_place`, `non_coastal_district_in_raw`, `column_shift_recovered`, `place_missing`, etc.). |
| `reported_category` | String | Raw common group (`Sea turtle`, `Dolphin`, `Whale`, `Porpoise`, `Dugong`). |
| `taxon_group` | Enum | Higher-order scientific grouping (`Sea turtle`, `Cetacean`, `Sirenian`, `Unknown`). |
| `scientific_name`, `common_name`, `order_name`, `family` | String | WoRMS-aligned taxonomic hierarchy. |
| `identification_level` | Enum | `species`, `genus`, `family`, `order`, `unidentified`. |
| `iucn_global_status` | Enum | IUCN Red List 2025/2026 global category (`CR`, `EN`, `EN*`, `VU`, `NT`, `LC`). |
| `life_stage` | String | Extracted life stage when reported (e.g., `fetus`). |
| `same_day_site_species_n` | Integer | Count of rows sharing identical date, locality, and taxon (multi-carcass or duplicate review). |
| `duplicate_review_group` | String | Group ID (`DG-001` .. `DG-037`) for records with `same_day_site_species_n > 1`. |
| `record_completeness` | Float | 5-attribute completeness index (`0.00` to `1.00`). |
| `fit_for_use` | String | Semicolon-delimited analytic suitability tags (`temporal`, `spatial_fine`, `spatial_coarse`, `species_level`). |
| `qc_status` | Enum | `clean` (`285`) or `cleaned_with_flags` (`231`). |
| `date_cell`, `province_raw`, `district_raw`, `place_raw`, `species_raw`, `scientific_raw` | String | Verbatim raw values preserved for full auditability. |

## 2. Deterministic Cleaning Rules (`R1`–`R12`)

| Rule ID | Count | Operational Logic |
| :--- | :---: | :--- |
| `R1_DATE_DAY_MONTH_SWAP` | 167 | Transpose `YYYY-DD-MM` $\rightarrow$ `YYYY-MM-DD` on native Excel datetime serials where `month != day`. |
| `R2_DATE_TEXT_PARSE` | 328 | Parse literal `DD/MM/YYYY` text strings to ISO-8601. |
| `R3_COLUMN_SHIFT` | 1 | Recover shifted place text from Province column when District and Place are blank (`MIN-WM-0499`). |
| `R4_DISTRICT_SPELLING` | 13 | Normalize `Baticaloa` $\rightarrow$ `Batticaloa`. |
| `R5_DISTRICT_FROM_PLACE` | 2 | Impute missing District from gazetteer-verified locality. |
| `R6_DISTRICT_PLACE_CONFLICT` | 13 | Reconcile District to Survey Dept / DS Division containing the named locality. |
| `R7_PROVINCE_FILLED` | 3 | Populate blank/invalid Province from authoritative District. |
| `R8_PROVINCE_INVALID_VALUE` | 2 | Strip non-province strings (`Galleface beach`) from Province column. |
| `R9_PROVINCE_DISTRICT_MISMATCH` | 10 | Correct invalid Province–District pairs (e.g., `Kalutara` in `Southern` $\rightarrow$ `Western`). |
| `R10_PROVINCE_SPELLING` | 122 | Standardize case (`North western` $\rightarrow$ `North Western`). |
| `R11_SCI_NAME_STANDARDISED` | 7 | Fix taxonomy typos/case (`Neophocena`, `delphinus`, `\nDugong`, `Sousa spp`, `B. edeni/B. musculus`). |
| `R12_PLACEHOLDER_TO_NULL` | 1 | Replace literal `-` in scientific name with indeterminate null. |

## 3. Compact 2G SMS Protocol Specification (`MIIS1`)

Maximum length: `<130` GSM 7-bit characters (guaranteed single-segment SMS delivery).  
Format: `MIIS1|<UUID8>|<LAT>,<LON>|A<ACC_M>|<YYMMDDHHMM>Z|<EVT>|<TAX>|<COND>|Q<QTY>|F<FLAGS>`

- **Example:** `MIIS1|A4F91C02|7.12050,79.80120|A12|2611240815Z|ENT|TRT|E|Q1|FN`
- **Decoded meaning:** Incident `A4F91C02`, `7.12050°N, 79.80120°E` ($\pm 12\text{ m}$ satellite GNSS), observed `2026-11-24 08:15 UTC`, Entangled Sea Turtle (`n = 1`), fishing net/gear hazard (`N`).
