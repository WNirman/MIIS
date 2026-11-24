#!/usr/bin/env python3
"""
MIIS National Marine Wildlife Mortality — Statistical Trend Analysis & Figures
=============================================================================
Consumes data/processed/wildlife_mortality_clean.csv and data/processed/quality_summary.json
and generates publication-ready tables (T1-T8), 300-DPI figures (F1-F8), and a
machine-readable summary JSON for both the research manuscript and the MIIS
interactive Analytics Dashboard.

Statistical analyses included:
  - Post-MV X-Press Pearl surge quantification (within 90d of 2021-06-02 sinking)
  - Weekly exponential decay model (Poisson GLM / weighted log-linear fit with
    bootstrap 95% CI for mortality half-life)
  - Seasonal monsoonal chi-square goodness-of-fit test
  - Inter-provincial taxon composition (Chi-square + Monte Carlo exact p-value
    and Cramer's V)
  - Spatial-temporal West Coast arrival & latitudinal spread analysis (2021)
  - Multi-year (2021-2026) reporting volume & data-quality degradation audit
"""

from __future__ import annotations

import json
import math
from pathlib import Path
from typing import Dict, List

import matplotlib
matplotlib.use("Agg")
import matplotlib.dates as mdates
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
from scipy import optimize, stats

ROOT = Path(__file__).resolve().parent.parent
CLEAN_CSV = ROOT / "data" / "processed" / "wildlife_mortality_clean.csv"
QA_JSON = ROOT / "data" / "processed" / "quality_summary.json"
DIST_CSV = ROOT / "analysis" / "reference" / "sl_districts.csv"
OUT_BASE = ROOT / "analysis" / "outputs"
FIG_DIR = OUT_BASE / "figures"
TAB_DIR = OUT_BASE / "tables"
WEB_DATA_DIR = ROOT / "src" / "data"

XPP_FIRE = pd.Timestamp("2021-05-20")
XPP_SINK = pd.Timestamp("2021-06-02")

# Publication styling
plt.rcParams.update({
    "font.family": "DejaVu Sans",
    "font.size": 10,
    "axes.titlesize": 12,
    "axes.titleweight": "bold",
    "axes.labelsize": 10,
    "axes.spines.top": False,
    "axes.spines.right": False,
    "figure.dpi": 300,
    "savefig.dpi": 300,
    "savefig.bbox": "tight",
})

PALETTE = {
    "Sea turtle": "#0D9488",
    "Cetacean": "#2563EB",
    "Sirenian": "#D97706",
    "Unknown": "#64748B",
}


def fit_poisson_decay(weeks_idx: np.ndarray, counts: np.ndarray, n_boot: int = 2000, seed: int = 42) -> dict:
    """Fit Poisson exponential decay lambda(t) = exp(a - k*t) via MLE + bootstrap 95% CI."""
    def neg_ll(params):
        a, k = params
        mu = np.exp(np.clip(a - k * weeks_idx, -20, 20))
        return np.sum(mu - counts * np.log(mu + 1e-12))

    res = optimize.minimize(neg_ll, x0=[np.log(max(counts[0], 1)), 0.2], method="BFGS")
    a_hat, k_hat = float(res.x[0]), float(res.x[1])
    half_life = math.log(2) / k_hat if k_hat > 0 else float("nan")

    # Parametric Poisson bootstrap for 95% CI
    rng = np.random.default_rng(seed)
    mu_hat = np.exp(a_hat - k_hat * weeks_idx)
    hl_boots = []
    for _ in range(n_boot):
        sim = rng.poisson(mu_hat)
        r_b = optimize.minimize(
            lambda p: np.sum(np.exp(np.clip(p[0] - p[1] * weeks_idx, -20, 20)) - sim * (p[0] - p[1] * weeks_idx)),
            x0=[a_hat, k_hat],
            method="BFGS",
        )
        if r_b.success and r_b.x[1] > 0.01:
            hl_boots.append(math.log(2) / float(r_b.x[1]))

    ci_lo, ci_hi = np.percentile(hl_boots, [2.5, 97.5])
    # Pseudo-R^2 (McFadden / deviance explained) — safe mask for zero counts
    null_mu = np.mean(counts)
    pos = counts > 0
    dev_model = 2.0 * np.sum(
        np.where(pos, counts * np.log(np.where(pos, counts, 1.0) / (mu_hat + 1e-12)), 0.0) - (counts - mu_hat)
    )
    dev_null = 2.0 * np.sum(
        np.where(pos, counts * np.log(np.where(pos, counts, 1.0) / max(null_mu, 1e-12)), 0.0) - (counts - null_mu)
    )
    deviance_r2 = 1.0 - (dev_model / dev_null) if dev_null > 0 else 0.0

    return {
        "weeks_used": int(len(weeks_idx)),
        "intercept_log": round(a_hat, 4),
        "rate_per_week": round(k_hat, 4),
        "half_life_weeks": round(half_life, 2),
        "half_life_95ci_weeks": [round(float(ci_lo), 2), round(float(ci_hi), 2)],
        "deviance_explained_pct": round(deviance_r2 * 100, 1),
        "fitted_counts": [round(float(v), 2) for v in mu_hat],
    }


def monte_carlo_chi2(table: np.ndarray, n_sim: int = 10000, seed: int = 42) -> float:
    chi2_obs, _, _, expected = stats.chi2_contingency(table)
    rng = np.random.default_rng(seed)
    n_tot = int(table.sum())
    probs = (expected / n_tot).ravel()
    exceed = 0
    for _ in range(n_sim):
        sim = rng.multinomial(n_tot, probs).reshape(table.shape)
        if np.any(sim.sum(axis=0) == 0) or np.any(sim.sum(axis=1) == 0):
            continue
        c_sim, _, _, _ = stats.chi2_contingency(sim)
        if c_sim >= chi2_obs - 1e-12:
            exceed += 1
    return (exceed + 1) / (n_sim + 1)


def main() -> None:
    FIG_DIR.mkdir(parents=True, exist_ok=True)
    TAB_DIR.mkdir(parents=True, exist_ok=True)

    df = pd.read_csv(CLEAN_CSV)
    with open(QA_JSON, "r", encoding="utf-8") as f:
        qa = json.load(f)
    dist_ref = pd.read_csv(DIST_CSV)

    df["dt"] = pd.to_datetime(df["event_date"], errors="coerce")
    dated = df[df["dt"].notna()].copy()
    dated["year_int"] = dated["dt"].dt.year.astype(int)
    dated["ym"] = dated["dt"].dt.to_period("M").astype(str)

    # =========================================================================
    # TABLE 1: Records by Year x Taxon Group
    # =========================================================================
    t1 = pd.crosstab(dated["year_int"], dated["taxon_group"], margins=True, margins_name="Total")
    for col in ["Cetacean", "Sea turtle", "Sirenian", "Unknown"]:
        if col not in t1.columns:
            t1[col] = 0
    t1 = t1[["Cetacean", "Sea turtle", "Sirenian", "Unknown", "Total"]]
    t1.index.name = "year"
    t1.to_csv(TAB_DIR / "T1_records_by_year_taxon.csv")

    # =========================================================================
    # TABLE 2: Species Composition & Conservation Threat Status
    # =========================================================================
    sp_grp = (
        df.groupby(["taxon_group", "scientific_name", "common_name", "iucn_global_status"], dropna=False)
        .size()
        .reset_index(name="n")
        .sort_values("n", ascending=False)
    )
    sp_grp["pct_of_all_records"] = (sp_grp["n"] / len(df) * 100).round(2)
    sp_grp.to_csv(TAB_DIR / "T2_species_composition.csv", index=False)

    # =========================================================================
    # TABLE 3: Province x District x Taxon (plus coastline density!)
    # =========================================================================
    t3_base = df[df["district"].notna() & (df["district"] != "")].copy()
    t3 = pd.crosstab([t3_base["province"], t3_base["district"]], t3_base["taxon_group"])
    for col in ["Cetacean", "Sea turtle", "Sirenian", "Unknown"]:
        if col not in t3.columns:
            t3[col] = 0
    t3["Total"] = t3.sum(axis=1)
    t3 = t3.reset_index().merge(dist_ref[["district", "coastline_km", "coast_sector"]], on="district", how="left")
    t3["records_per_100km_coast"] = np.where(t3["coastline_km"] > 0, (t3["Total"] / t3["coastline_km"] * 100).round(1), np.nan)
    t3 = t3.sort_values("Total", ascending=False)
    t3.to_csv(TAB_DIR / "T3_records_by_province_district.csv", index=False)

    # Identify coastal districts with ZERO records in the ministry log
    coastal_all = set(dist_ref[dist_ref["is_coastal"] == 1]["district"])
    coastal_reported = set(t3["district"])
    unreported_coastal_districts = sorted(coastal_all - coastal_reported)

    # =========================================================================
    # TABLE 4: Top Localities
    # =========================================================================
    loc_df = df[df["locality_std"].notna() & (df["locality_std"] != "")].copy()
    t4 = (
        loc_df.groupby(["province", "district", "locality_std"])
        .agg(
            n=("record_id", "count"),
            turtles=("taxon_group", lambda s: int((s == "Sea turtle").sum())),
            cetaceans=("taxon_group", lambda s: int((s == "Cetacean").sum())),
            first=("event_date", "min"),
            last=("event_date", "max"),
            lat=("latitude", "first"),
            lon=("longitude", "first"),
        )
        .reset_index()
        .sort_values("n", ascending=False)
    )
    t4.head(25).to_csv(TAB_DIR / "T4_top_localities.csv", index=False)

    # =========================================================================
    # TABLE 5: Weekly 2021 Time Series & Exponential Decay Fit
    # =========================================================================
    d2021 = dated[dated["year_int"] == 2021].copy()
    d2021["week_start"] = d2021["dt"].dt.to_period("W-SUN").apply(lambda p: p.start_time)
    t5 = pd.crosstab(d2021["week_start"], d2021["taxon_group"])
    for col in ["Cetacean", "Sea turtle"]:
        if col not in t5.columns:
            t5[col] = 0
    full_weeks = pd.date_range(t5.index.min(), t5.index.max(), freq="W-MON")
    t5 = t5.reindex(full_weeks, fill_value=0)
    t5["Total"] = t5.sum(axis=1)
    t5.index.name = "week_start"
    t5.to_csv(TAB_DIR / "T5_weekly_2021_by_taxon.csv")

    peak_week_ts = t5["Total"].idxmax()
    peak_week_n = int(t5["Total"].max())
    post_peak = t5.loc[peak_week_ts:]
    decay_fit = fit_poisson_decay(np.arange(len(post_peak), dtype=float), post_peak["Total"].values.astype(float))

    # =========================================================================
    # TABLE 6: First Record per District in 2021 (West-to-East Propagation)
    # =========================================================================
    t6 = (
        d2021[d2021["district"].notna()]
        .groupby(["province", "district"])
        .agg(
            first_date=("dt", "min"),
            peak_date=("dt", lambda s: s.value_counts().idxmax()),
            total_2021=("record_id", "count"),
            days_after_fire=("dt", lambda s: int((s.min() - XPP_FIRE).days)),
            days_after_sinking=("dt", lambda s: int((s.min() - XPP_SINK).days)),
        )
        .reset_index()
        .sort_values("first_date")
    )
    t6["first_date"] = t6["first_date"].dt.strftime("%Y-%m-%d")
    t6["peak_date"] = t6["peak_date"].dt.strftime("%Y-%m-%d")
    t6.to_csv(TAB_DIR / "T6_first_record_per_district_2021.csv", index=False)

    # =========================================================================
    # TABLE 7: Data Quality & Completeness Degradation by Year
    # =========================================================================
    df["year_grp"] = df["year"].fillna(-1).astype(int)
    t7 = (
        df.groupby("year_grp")
        .agg(
            n=("record_id", "count"),
            place_recorded_pct=("place_original_clean", lambda s: round(s.fillna("").str.strip().ne("").mean() * 100, 1)),
            locality_geocoded_pct=("coord_precision", lambda s: round((s == "locality").mean() * 100, 1)),
            species_level_id_pct=("identification_level", lambda s: round((s == "species").mean() * 100, 1)),
            taxon_recorded_pct=("taxon_group", lambda s: round((s != "Unknown").mean() * 100, 1)),
            mean_completeness=("record_completeness", lambda s: round(float(s.mean()), 2)),
        )
        .reset_index()
        .rename(columns={"year_grp": "year"})
    )
    t7.to_csv(TAB_DIR / "T7_data_quality_by_year.csv", index=False)

    # =========================================================================
    # TABLE 8: Monthly Multi-Year Series (2021-2026)
    # =========================================================================
    t8 = pd.crosstab(dated["ym"], dated["taxon_group"])
    for col in ["Cetacean", "Sea turtle", "Sirenian", "Unknown"]:
        if col not in t8.columns:
            t8[col] = 0
    t8["Total"] = t8.sum(axis=1)
    t8.index.name = "year_month"
    t8.to_csv(TAB_DIR / "T8_monthly_series_2021_2026.csv")

    # =========================================================================
    # STATISTICAL TESTS
    # =========================================================================
    # 1) Province x Taxon (2021 Sea turtle vs Cetacean)
    ct_prov = pd.crosstab(d2021["province"], d2021["taxon_group"])[["Cetacean", "Sea turtle"]]
    chi2_p, p_val_p, dof_p, exp_p = stats.chi2_contingency(ct_prov.values)
    cramers_v_p = math.sqrt(chi2_p / (ct_prov.values.sum() * (min(ct_prov.shape) - 1)))
    mc_p = monte_carlo_chi2(ct_prov.values)

    # 2) Monsoonal Seasonality Chi-Square Goodness-of-Fit (proportional to months: 5, 2, 3, 2)
    season_order = [
        ("SW monsoon (May-Sep)", 5),
        ("Second inter-monsoon (Oct-Nov)", 2),
        ("NE monsoon (Dec-Feb)", 3),
        ("First inter-monsoon (Mar-Apr)", 2),
    ]
    obs_seasons = np.array([int((dated["season"] == s).sum()) for s, _ in season_order], dtype=float)
    exp_seasons = np.array([m / 12.0 * obs_seasons.sum() for _, m in season_order], dtype=float)
    chi2_seas, p_seas = stats.chisquare(obs_seasons, f_exp=exp_seasons)

    # Non-2021 seasonality test (to test if SW monsoon dominance persists beyond X-Press Pearl!)
    post21 = dated[dated["year_int"] > 2021]
    obs_post21 = np.array([int((post21["season"] == s).sum()) for s, _ in season_order], dtype=float)
    exp_post21 = np.array([m / 12.0 * obs_post21.sum() for _, m in season_order], dtype=float)
    chi2_p21, p_p21 = stats.chisquare(obs_post21, f_exp=exp_post21)

    # 3) Completeness degradation test: 2021 vs 2022-2026 (Mann-Whitney U)
    c_2021 = df[df["year"] == 2021]["record_completeness"].values
    c_post = df[df["year"] > 2021]["record_completeness"].values
    u_stat, p_u_comp = stats.mannwhitneyu(c_2021, c_post, alternative="greater")

    # Core summary metrics
    within_90d = int(((dated["days_since_xpp_sinking"] >= -13) & (dated["days_since_xpp_sinking"] <= 90)).sum())
    turtles_id = df[(df["taxon_group"] == "Sea turtle") & (df["identification_level"] == "species")]
    or_share = round((turtles_id["scientific_name"] == "Lepidochelys olivacea").mean() * 100, 1)

    # =========================================================================
    # FIGURES F1-F8 (300 DPI Publication Grade)
    # =========================================================================

    # F1: Weekly 2021 Surge + Exponential Decay Curve
    fig, ax = plt.subplots(figsize=(10, 4.8))
    x_dates = t5.index
    ax.bar(x_dates, t5["Sea turtle"], width=5.2, color=PALETTE["Sea turtle"], label="Sea turtles (n=387)", alpha=0.9)
    ax.bar(x_dates, t5["Cetacean"], width=5.2, bottom=t5["Sea turtle"], color=PALETTE["Cetacean"], label="Cetaceans (n=55)", alpha=0.9)
    ax.plot(post_peak.index, decay_fit["fitted_counts"], color="#DC2626", lw=2.2, ls="--",
            label=f"Poisson decay fit ($t_{{1/2}}$ = {decay_fit['half_life_weeks']} wk, 95% CI {decay_fit['half_life_95ci_weeks'][0]}–{decay_fit['half_life_95ci_weeks'][1]})")
    ax.axvline(XPP_FIRE, color="#F59E0B", ls=":", lw=1.6)
    ax.axvline(XPP_SINK, color="#991B1B", ls="-.", lw=1.6)
    ax.text(XPP_FIRE, peak_week_n * 0.96, " Fire\n 20 May", color="#B45309", fontsize=8.5, va="top", fontweight="bold")
    ax.text(XPP_SINK, peak_week_n * 0.85, " Sinking\n 2 Jun", color="#991B1B", fontsize=8.5, va="top", fontweight="bold")
    ax.set_title("Weekly Marine Wildlife Mortality Following MV X-Press Pearl Disaster (2021, n = 442)")
    ax.set_ylabel("Recorded carcasses / week")
    ax.set_xlabel("Week starting (2021)")
    ax.xaxis.set_major_formatter(mdates.DateFormatter("%b %d"))
    ax.legend(frameon=False, fontsize=8.5, loc="upper right")
    ax.grid(axis="y", alpha=0.25)
    fig.savefig(FIG_DIR / "F1_weekly_2021_xpress_pearl.png")
    plt.close(fig)

    # F2: Multi-year Monthly Timeline (2021-2026) showing 2024 institutional gap
    fig, (ax1, ax2) = plt.subplots(2, 1, figsize=(10.5, 5.6), gridspec_kw={"height_ratios": [1.3, 1]}, sharex=False)
    all_months = pd.period_range("2021-05", "2026-06", freq="M").astype(str)
    m_series = t8.reindex(all_months, fill_value=0)
    x_idx = np.arange(len(all_months))
    ax1.bar(x_idx, m_series["Sea turtle"], color=PALETTE["Sea turtle"], label="Sea turtle")
    ax1.bar(x_idx, m_series["Cetacean"], bottom=m_series["Sea turtle"], color=PALETTE["Cetacean"], label="Cetacean")
    ax1.bar(x_idx, m_series["Sirenian"] + m_series["Unknown"], bottom=m_series["Sea turtle"] + m_series["Cetacean"], color=PALETTE["Unknown"], label="Sirenian / Unknown")
    # Highlight 2024 gap
    gap_start = list(all_months).index("2024-01")
    gap_end = list(all_months).index("2024-12")
    ax1.axvspan(gap_start - 0.5, gap_end + 0.5, color="#FEE2E2", alpha=0.7, zorder=0)
    ax1.text((gap_start + gap_end) / 2, m_series["Total"].max() * 0.5, "2024\nZero Records\n(Reporting Gap)", ha="center", va="center", color="#991B1B", fontsize=9, fontweight="bold")
    ax1.set_title("Multi-Year Monthly Stranding Trajectory (May 2021 – June 2026, n = 515 dated)")
    ax1.set_ylabel("Monthly records")
    ax1.set_xticks(x_idx[::6])
    ax1.set_xticklabels(all_months[::6], rotation=35, ha="right", fontsize=8)
    ax1.legend(frameon=False, ncol=3, fontsize=8.5)
    ax1.grid(axis="y", alpha=0.25)

    # Zoomed panel: Post-2021 baseline (2022-2026)
    post_months = [m for m in all_months if m >= "2022-01"]
    m_post = m_series.loc[post_months]
    xp = np.arange(len(post_months))
    ax2.bar(xp, m_post["Sea turtle"], color=PALETTE["Sea turtle"])
    ax2.bar(xp, m_post["Cetacean"], bottom=m_post["Sea turtle"], color=PALETTE["Cetacean"])
    ax2.bar(xp, m_post["Sirenian"] + m_post["Unknown"], bottom=m_post["Sea turtle"] + m_post["Cetacean"], color=PALETTE["Unknown"])
    g2_s = post_months.index("2024-01")
    g2_e = post_months.index("2024-12")
    ax2.axvspan(g2_s - 0.5, g2_e + 0.5, color="#FEE2E2", alpha=0.7, zorder=0)
    ax2.set_title("Post-Disaster Baseline Detail (2022–2026, n = 73 dated; SW monsoon peaks persist)")
    ax2.set_ylabel("Monthly records")
    ax2.set_xticks(xp[::4])
    ax2.set_xticklabels(post_months[::4], rotation=35, ha="right", fontsize=8)
    ax2.grid(axis="y", alpha=0.25)
    plt.tight_layout()
    fig.savefig(FIG_DIR / "F2_monthly_timeline.png")
    plt.close(fig)

    # F3: Species Composition & IUCN Threat Breakdown
    fig, ax = plt.subplots(figsize=(9.5, 5.5))
    top_sp = sp_grp[sp_grp["scientific_name"] != "Unidentified marine fauna"].head(16).iloc[::-1]
    colors_sp = [PALETTE.get(t, "#64748B") for t in top_sp["taxon_group"]]
    labels_sp = [f"{r['common_name']} ({r['scientific_name']}) [{r['iucn_global_status'] or 'NE'}]" for _, r in top_sp.iterrows()]
    bars = ax.barh(labels_sp, top_sp["n"], color=colors_sp, alpha=0.9)
    for bar, val in zip(bars, top_sp["n"]):
        ax.text(val + 3, bar.get_y() + bar.get_height() / 2, f"{val} ({val/len(df)*100:.1f}%)", va="center", fontsize=8.5)
    ax.set_xlim(0, top_sp["n"].max() * 1.18)
    ax.set_xlabel("Number of recorded individuals (2021–2026)")
    ax.set_title("Taxonomic Composition & IUCN Red List Status (Top 16 Taxa; n = 516 total)")
    ax.grid(axis="x", alpha=0.25)
    fig.savefig(FIG_DIR / "F3_species_composition.png")
    plt.close(fig)

    # F4: District Distribution by Taxon + Coastal Density
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(11.5, 5.0))
    t3_plot = t3.iloc[::-1]
    ax1.barh(t3_plot["district"], t3_plot["Sea turtle"], color=PALETTE["Sea turtle"], label="Sea turtle")
    ax1.barh(t3_plot["district"], t3_plot["Cetacean"], left=t3_plot["Sea turtle"], color=PALETTE["Cetacean"], label="Cetacean")
    ax1.barh(t3_plot["district"], t3_plot["Sirenian"] + t3_plot["Unknown"],
             left=t3_plot["Sea turtle"] + t3_plot["Cetacean"], color=PALETTE["Unknown"], label="Sirenian / Unknown")
    for idx_b, (_, r) in enumerate(t3_plot.iterrows()):
        ax1.text(r["Total"] + 1.5, idx_b, str(int(r["Total"])), va="center", fontsize=8.5, fontweight="bold")
    ax1.set_xlim(0, t3["Total"].max() * 1.15)
    ax1.set_title("Total Stranding Records by Coastal District")
    ax1.set_xlabel("Recorded individuals")
    ax1.legend(frameon=False, fontsize=8.5, loc="lower right")
    ax1.grid(axis="x", alpha=0.25)

    t3_dens = t3.dropna(subset=["records_per_100km_coast"]).sort_values("records_per_100km_coast")
    ax2.barh(t3_dens["district"], t3_dens["records_per_100km_coast"], color="#0284C7", alpha=0.88)
    for idx_b, (_, r) in enumerate(t3_dens.iterrows()):
        ax2.text(r["records_per_100km_coast"] + 3, idx_b, f"{r['records_per_100km_coast']:.1f}", va="center", fontsize=8.5)
    ax2.set_xlim(0, t3_dens["records_per_100km_coast"].max() * 1.18)
    ax2.set_title("Coastline-Normalised Stranding Density (per 100 km)")
    ax2.set_xlabel("Records per 100 km coastline")
    ax2.grid(axis="x", alpha=0.25)
    plt.tight_layout()
    fig.savefig(FIG_DIR / "F4_district_taxon.png")
    plt.close(fig)

    # F5: Spatial Distribution Map of Cleaned Georeferenced Strandings (Sri Lanka)
    fig, ax = plt.subplots(figsize=(6.8, 8.2))
    geo_df = df[df["latitude"].notna() & df["longitude"].notna()].copy()
    loc_agg = geo_df.groupby(["locality_std", "taxon_group", "latitude", "longitude"], dropna=False).size().reset_index(name="n")
    for tg in ["Sea turtle", "Cetacean", "Sirenian", "Unknown"]:
        sub = loc_agg[loc_agg["taxon_group"] == tg]
        if len(sub):
            ax.scatter(sub["longitude"], sub["latitude"], s=sub["n"] * 18 + 18,
                       color=PALETTE[tg], alpha=0.72, edgecolors="#0F172A", linewidth=0.6, label=tg)
    # Mark MV X-Press Pearl wreck site (7.068 N, 79.772 E ~ 9.5 nm NW of Colombo Port)
    ax.scatter([79.772], [7.068], marker="*", s=260, color="#DC2626", edgecolors="white", lw=0.8, zorder=10, label="MV X-Press Pearl wreck")
    ax.annotate("MV X-Press Pearl\n(7.07°N, 79.77°E)", xy=(79.772, 7.068), xytext=(78.95, 7.35),
                arrowprops=dict(arrowstyle="->", color="#DC2626", lw=1.2), fontsize=8.5, fontweight="bold", color="#991B1B")
    # Label top 6 hotspots
    for _, r in t4.head(6).iterrows():
        ax.annotate(f"{r['locality_std'].split(' (')[0]} ({int(r['n'])})", xy=(r["lon"], r["lat"]),
                    xytext=(r["lon"] + 0.14, r["lat"]), fontsize=7.5, color="#1E293B")
    ax.set_xlim(78.8, 82.2)
    ax.set_ylim(5.7, 9.95)
    ax.set_aspect("equal")
    ax.set_xlabel("Longitude (°E)")
    ax.set_ylabel("Latitude (°N)")
    ax.set_title("Spatial Distribution of Cleaned Marine Mortality Records (n = 515 geocoded)")
    ax.legend(frameon=True, facecolor="white", framealpha=0.9, fontsize=8.5, loc="upper right")
    ax.grid(alpha=0.25)
    fig.savefig(FIG_DIR / "F5_spatial_schematic.png")
    plt.close(fig)

    # F6: Space-Time Hovmoller / Latitude vs Date (2021 West & SW Coast)
    fig, ax = plt.subplots(figsize=(9.5, 4.8))
    west21 = d2021[(d2021["longitude"] < 80.7) & (d2021["latitude"].notna())].copy()
    for tg in ["Sea turtle", "Cetacean"]:
        sub = west21[west21["taxon_group"] == tg]
        ax.scatter(sub["dt"], sub["latitude"], c=PALETTE[tg], alpha=0.65, s=28, label=tg, edgecolors="none")
    ax.axhline(7.068, color="#DC2626", ls="--", lw=1.3, label="MV X-Press Pearl latitude (7.07°N)")
    ax.axvline(XPP_SINK, color="#991B1B", ls="-.", lw=1.2, label="Sinking (2 Jun 2021)")
    ax.set_title("Space-Time Dispersion of West & South Coast Strandings (2021)")
    ax.set_ylabel("Latitude (°N) — South to North Coast")
    ax.set_xlabel("Event Date (2021)")
    ax.xaxis.set_major_formatter(mdates.DateFormatter("%b %d"))
    ax.legend(frameon=False, fontsize=8.5, loc="upper right")
    ax.grid(alpha=0.25)
    fig.savefig(FIG_DIR / "F6_spacetime_westcoast_2021.png")
    plt.close(fig)

    # F7: Data Quality Audit & Post-2021 Institutional Degradation
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(11.2, 4.6))
    t7_v = t7[t7["year"] > 0].copy()
    x_y = np.arange(len(t7_v))
    w = 0.25
    ax1.bar(x_y - w, t7_v["locality_geocoded_pct"], width=w, color="#0D9488", label="Locality-level GPS")
    ax1.bar(x_y, t7_v["species_level_id_pct"], width=w, color="#2563EB", label="Species-level ID")
    ax1.bar(x_y + w, t7_v["mean_completeness"] * 100, width=w, color="#F59E0B", label="Mean completeness (%)")
    ax1.set_xticks(x_y)
    ax1.set_xticklabels([f"{int(r['year'])}\n(n={int(r['n'])})" for _, r in t7_v.iterrows()])
    ax1.set_ylim(0, 112)
    ax1.set_ylabel("Percentage (%)")
    ax1.set_title("Data Completeness Degradation Across Years (2021–2026)")
    ax1.legend(frameon=False, fontsize=8.2, loc="lower left")
    ax1.grid(axis="y", alpha=0.25)

    # Panel 2: Audit error breakdown proving why MIIS mobile GPS/AI is required
    err_labels = [
        "Excel DD/MM date swaps",
        "Province case/format",
        "Missing species ID",
        "Missing locality text",
        "District spelling typo",
        "District-place conflict",
        "Province-district mismatch",
        "Missing taxon entirely",
    ]
    err_vals = [
        qa["dates"]["day_month_swapped_and_fixed"],
        qa["change_log_by_rule"].get("R10_PROVINCE_SPELLING", 0),
        qa["taxonomy"]["species_not_identified"],
        qa["location"]["place_missing"] + qa["location"]["no_location_at_all"],
        qa["location"]["district_spelling_standardised"],
        qa["location"]["district_corrected_from_place"],
        qa["location"]["province_district_mismatch_corrected"],
        qa["taxonomy"]["taxon_missing"],
    ]
    y_e = np.arange(len(err_labels))[::-1]
    ax2.barh(y_e, err_vals, color="#DC2626", alpha=0.82)
    ax2.set_yticks(y_e)
    ax2.set_yticklabels(err_labels, fontsize=8.5)
    for yv, val in zip(y_e, err_vals):
        ax2.text(val + 2, yv, str(val), va="center", fontsize=8.5, fontweight="bold")
    ax2.set_xlim(0, max(err_vals) * 1.18)
    ax2.set_xlabel("Affected records (out of 516)")
    ax2.set_title("Forensic Data Quality Defects in Raw Ministry Register")
    ax2.grid(axis="x", alpha=0.25)
    plt.tight_layout()
    fig.savefig(FIG_DIR / "F7_data_quality_by_year.png")
    plt.close(fig)

    # F8: Year x Month Seasonality Heatmap (showing SW Monsoon Concentration)
    fig, ax = plt.subplots(figsize=(9.5, 4.2))
    years_all = [2021, 2022, 2023, 2024, 2025, 2026]
    mat = np.zeros((len(years_all), 12), dtype=int)
    for yi, yr in enumerate(years_all):
        sub = dated[dated["year_int"] == yr]
        for mo in range(1, 13):
            mat[yi, mo - 1] = int((sub["month"] == mo).sum())
    im = ax.imshow(np.log1p(mat), cmap="YlGnBu", aspect="auto")
    for yi in range(len(years_all)):
        for mi in range(12):
            v = mat[yi, mi]
            txt_col = "white" if np.log1p(v) > 2.8 else "#0F172A"
            ax.text(mi, yi, str(v) if v > 0 else "·", ha="center", va="center", color=txt_col, fontsize=9, fontweight="bold" if v > 0 else "normal")
    ax.set_xticks(range(12))
    ax.set_xticklabels(["Jan", "Feb", "Mar", "Apr", "May*", "Jun*", "Jul*", "Aug*", "Sep*", "Oct", "Nov", "Dec"])
    ax.set_yticks(range(len(years_all)))
    ax.set_yticklabels([str(y) for y in years_all])
    ax.set_title("Year × Month Stranding Intensity Heatmap (* = SW Monsoon Months May–Sep)")
    plt.colorbar(im, ax=ax, label="log(1 + count)", shrink=0.85)
    fig.savefig(FIG_DIR / "F8_year_month_heatmap.png")
    plt.close(fig)

    # =========================================================================
    # EXPORT MACHINE-READABLE TREND SUMMARY JSON (Analysis + Web Dashboard)
    # =========================================================================
    season_counts = {s: int((dated["season"] == s).sum()) for s, _ in season_order}
    season_counts_post21 = {s: int((post21["season"] == s).sum()) for s, _ in season_order}

    trend_summary = {
        "n_records": int(len(df)),
        "n_dated": int(len(dated)),
        "n_undated": int(len(df) - len(dated)),
        "records_by_year": {str(y): int((dated["year_int"] == y).sum()) for y in [2021, 2022, 2023, 2024, 2025, 2026]},
        "monthly_series": [
            {
                "year_month": ym,
                "sea_turtle": int(row["Sea turtle"]),
                "cetacean": int(row["Cetacean"]),
                "sirenian": int(row["Sirenian"]),
                "unknown": int(row["Unknown"]),
                "total": int(row["Total"]),
            }
            for ym, row in t8.iterrows()
        ],
        "weekly_2021": [
            {
                "week_start": ws.strftime("%Y-%m-%d"),
                "sea_turtle": int(row["Sea turtle"]),
                "cetacean": int(row["Cetacean"]),
                "total": int(row["Total"]),
            }
            for ws, row in t5.iterrows()
        ],
        "district_summary": t3.fillna(0).to_dict(orient="records"),
        "unreported_coastal_districts": unreported_coastal_districts,
        "species_summary": sp_grp.fillna("").to_dict(orient="records"),
        "top_localities": t4.head(15).to_dict(orient="records"),
        "share_2021_pct": round(len(d2021) / len(dated) * 100, 1),
        "records_within_90d_of_sinking": within_90d,
        "share_within_90d_pct": round(within_90d / len(dated) * 100, 1),
        "turtle_share_2021_pct": round((d2021["taxon_group"] == "Sea turtle").mean() * 100, 1),
        "olive_ridley_share_of_identified_turtles_pct": or_share,
        "peak_week_start": peak_week_ts.strftime("%Y-%m-%d"),
        "peak_week_records": peak_week_n,
        "decay_fit": decay_fit,
        "province_composition_test_2021": {
            "table": ct_prov.to_dict(),
            "chi2": round(float(chi2_p), 2),
            "dof": int(dof_p),
            "p_value": round(float(p_val_p), 4),
            "monte_carlo_p": round(float(mc_p), 4),
            "cramers_v": round(float(cramers_v_p), 3),
            "min_expected": round(float(exp_p.min()), 2),
        },
        "seasonality_test": {
            "all_years_counts": season_counts,
            "all_years_chi2": round(float(chi2_seas), 2),
            "all_years_p": float(f"{p_seas:.3e}"),
            "post_2021_counts": season_counts_post21,
            "post_2021_chi2": round(float(chi2_p21), 2),
            "post_2021_p": float(f"{p_p21:.3e}"),
        },
        "completeness_degradation_test": {
            "mean_2021": round(float(c_2021.mean()), 3),
            "mean_2022_2026": round(float(c_post.mean()), 3),
            "mann_whitney_u": float(u_stat),
            "p_value": float(f"{p_u_comp:.3e}"),
        },
        "data_quality_by_year": t7.to_dict(orient="records"),
        "qa_highlights": {
            "date_swaps_fixed": qa["dates"]["day_month_swapped_and_fixed"],
            "chronology_violations_before": qa["dates"]["chronology_violations_if_stored_value_used"],
            "chronology_violations_after": qa["dates"]["chronology_violations_after_swap_fix"],
            "district_corrections": qa["location"]["district_corrected_from_place"],
            "province_corrections": qa["location"]["province_district_mismatch_corrected"] + qa["location"]["province_contains_place_name"],
            "locality_geocoded_pct": round(qa["location"]["coord_precision_counts"]["locality"] / qa["records_retained"] * 100, 1),
            "same_day_cluster_records": qa["duplicates"]["records_in_same_day_site_species_groups"],
            "same_day_cluster_groups": qa["duplicates"]["review_groups"],
            "total_audit_log_edits": qa["change_log_entries"],
        },
    }

    with open(OUT_BASE / "trend_summary.json", "w", encoding="utf-8") as f:
        json.dump(trend_summary, f, indent=2, ensure_ascii=False)

    with open(WEB_DATA_DIR / "ministry_trends_summary.json", "w", encoding="utf-8") as f:
        json.dump(trend_summary, f, ensure_ascii=False)

    print("[MIIS TRENDS] Generated T1-T8 tables, F1-F8 300-DPI figures, and trend_summary.json.")
    print(f"[MIIS TRENDS] Peak week: {peak_week_ts.strftime('%Y-%m-%d')} ({peak_week_n} carcasses) | Decay half-life: {decay_fit['half_life_weeks']} wk (95% CI {decay_fit['half_life_95ci_weeks']})")
    print(f"[MIIS TRENDS] SW Monsoon share: {season_counts['SW monsoon (May-Sep)']}/{len(dated)} ({season_counts['SW monsoon (May-Sep)']/len(dated)*100:.1f}%) | Post-2021 SW Monsoon: {season_counts_post21['SW monsoon (May-Sep)']}/{len(post21)} ({season_counts_post21['SW monsoon (May-Sep)']/len(post21)*100:.1f}%, p={p_p21:.2e})")
    print(f"[MIIS TRENDS] Unreported coastal districts (0 records): {unreported_coastal_districts}")


if __name__ == "__main__":
    main()
