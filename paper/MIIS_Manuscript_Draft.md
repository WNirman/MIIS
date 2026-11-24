# From Fragmented Registers to Marine Incident Intelligence: Forensic Analysis of Sri Lanka’s National Marine Wildlife Mortality Data (2021–2026) and an Offline-First Citizen-Science Framework for Coastal Fishers

**Authors:** Wanith Nirman$^{1,*}$ *[Add Academic Supervisor & Institutional Collaborators, e.g., Department of Computer Science, University of Jaffna; Marine Wildlife / Conservation Specialists]*

**Affiliations:**  
$^{1}$ Department of Computer Science, Faculty of Science, University of Jaffna, Sri Lanka  
$^{*}$ Corresponding author: Wanith Nirman (ORCID: *[add ORCID]*; LinkedIn: https://www.linkedin.com/in/wanith-nirman-099a17146/)

**Target Journals:** *Ocean & Coastal Management* (Elsevier) or *Marine Policy* (Elsevier)  
**Article Type:** Full-Length Research Article (Interdisciplinary Conservation Informatics & Coastal Governance)  
**Keywords:** Marine stranding; Citizen science; MV X-Press Pearl; Sea turtles; Cetaceans; Offline-first GNSS; Data quality; Sri Lanka; Conservation informatics

---

## Highlights (for Journal Submission)
- Forensic QA of Sri Lanka’s 2021–2026 national marine mortality register (`n = 516`) logged 669 audited repairs, including 167 Excel DD/MM↔MM/DD date-swap corruptions.
- Weekly mortality following the MV *X-Press Pearl* sinking peaked at 75 carcasses/week (14 June 2021) and decayed exponentially with a half-life of 3.96 weeks (95% CI: 3.52–4.49; deviance $R^2 = 85.9\%$).
- Southwest Monsoon dominance (90.5% overall) persists independently in the 2022–2026 post-disaster baseline (65.8%, $\chi^2 = 18.91$, $p = 2.85 \times 10^{-4}$).
- Record completeness collapsed after 2021 ($98.8\% \rightarrow 80.8\%$, Mann–Whitney $p = 2.60 \times 10^{-39}$), with a complete 12-month reporting gap in 2024 and zero 5-year records in Trincomalee and Mullaitivu.
- The Marine Incident Intelligence System (MIIS) introduces an offline-first PWA/Android fisher architecture separating `<500 B` satellite GNSS beacons (+ `<130`-char 2G SMS fallback) from deferred harbour photo uploads with EXIF anti-drift verification.

---

## Abstract

Island nations in the Indian Ocean face acute and chronic pressures on marine megafauna from maritime chemical and plastic disasters, artisanal fisheries bycatch, abandoned ghost gear, and coastal pollution. Yet national marine mortality surveillance in developing coastal states frequently relies on fragmented spreadsheets lacking standardized schemas, georeferenced coordinates, and sustained operational coverage. Here, we conduct a reproducible forensic audit and spatio-temporal trend analysis of Sri Lanka’s national ministry marine wildlife mortality register spanning May 2021 to June 2026 (`n = 516` retained records after removing 25 blank workbook rows), and translate its empirical failure modes into the architecture of the Marine Incident Intelligence System (MIIS)—an offline-first citizen-science platform engineered for coastal fishers. Forensic validation documented 669 auditable defects across 12 rule classes, most critically 167 US-locale Excel day–month date transpositions (`DD/MM/YYYY` stored as `YYYY-DD-MM` for days $\le 12$), which otherwise introduced 24 severe chronological jumps; 13 district-boundary misclassifications (including a coastal stranding assigned to landlocked Monaragala District); 12 province errors or column shifts; and 89 records occurring in 37 same-day, same-locality, same-species clusters lacking carcass identifiers or GPS coordinates. Following forensic repair and 100% locality-level geocoding of named sites (484/516 records; 93.8% overall across 164 verified coastal localities), temporal analysis revealed that 85.8% (`442/515`) of dated mortalities occurred in 2021 following the MV *X-Press Pearl* disaster, peaking at 75 carcasses during the week of 14 June 2021 and declining exponentially with a Poisson MLE half-life of 3.96 weeks (95% CI: 3.52–4.49 weeks; deviance explained = 85.9%). Sea turtles comprised 84.9% (`438/516`) of all records—dominated by *Lepidochelys olivacea* (`84.8%` of identified turtles)—alongside 70 cetaceans spanning at least 13 species and one Vulnerable/nationally Critically Endangered *Dugong dugon* (May 2026). Crucially, Southwest Monsoon (May–September) concentration persisted even when excluding 2021 entirely (65.8% of 2022–2026 records; $\chi^2 = 18.91$, $p = 2.85 \times 10^{-4}$). Coastline-normalized stranding density peaked along the urbanized Western corridor (Colombo: 262.5; Gampaha: 197.8; Kalutara: 150.0 records per 100 km), whereas Trincomalee (210 km) and Mullaitivu (72 km) logged zero records over five years, alongside a complete 12-month national reporting gap in 2024 and a steep decline in mean record completeness from 98.8% (2021) to 80.8% (2022–2026; Mann–Whitney $U = 25235.5$, $p = 2.60 \times 10^{-39}$). To eliminate these systemic barriers at the point of capture, we engineered and verified a decoupled two-phase offshore reporting architecture combining multi-sample hardware GNSS fusion (operating without cellular signal), offline Sri Lanka EEZ geofencing with authoritative district/province derivation, client-side JPEG EXIF GPS anti-drift detection, idempotent `<500`-byte 2G geo-beacons, `<130`-character 2G GSM SMS fallback packets, and harbour-deferred photo synchronization. Together, these findings establish both a cleaned national mortality baseline for Sri Lanka and an operational digital blueprint for scientifically rigorous marine citizen science across low-connectivity coastal fisheries.

---

## 1. Introduction

Sri Lanka’s coastal and marine ecosystems underpin vital national economic sectors—including artisanal and multi-day commercial fisheries, coastal tourism, and biodiversity conservation—supporting millions of coastal livelihoods across approximately 1,787 km of coastline spanning 14 administrative coastal districts. Situated astride major East–West Indian Ocean shipping lanes and dynamic monsoon-driven boundary currents, these waters host five of the world’s seven marine turtle species (*Lepidochelys olivacea*, *Chelonia mydas*, *Eretmochelys imbricata*, *Caretta caretta*, and *Dermochelys coriacea*), over 25 cetacean species including a unique non-migratory Northern Indian Ocean population of Blue whales (*Balaenoptera musculus*), and a critically depleted Gulf of Mannar population of Dugongs (*Dugong dugon*).

Despite this exceptional biodiversity, Sri Lanka’s marine megafauna faces intensifying anthropogenic threats: gillnet and longline bycatch, abandoned, lost, or otherwise discarded fishing gear (ALDFG / ghost nets), vessel strikes, chronic coastal plastic contamination, and acute maritime chemical disasters. The catastrophic fire and subsequent sinking of the Singapore-flagged container vessel MV *X-Press Pearl* off Colombo (7.068°N, 79.772°E; fire ignited 20 May 2021, vessel sank 2 June 2021) released an estimated 1,680 tonnes of plastic pellets (nurdles), burnt pyroplastics, nitric acid, and hazardous chemical cargo into the Laccadive Sea, creating the worst maritime ecological disaster in Sri Lanka’s history (Partow et al., 2021; de Vos et al., 2022; Sewwandi et al., 2022a, 2022b; Perera et al., 2022). In the weeks immediately following the casualty, hundreds of dead sea turtles, dolphins, and whales washed ashore along Sri Lanka’s western, southern, northern, and eastern beaches.

Documenting such acute mass-mortality pulses—and distinguishing them from chronic background stranding rates driven by monsoonal oceanography and fisheries mortality—requires continuous, standardized, georeferenced national surveillance. However, in many developing maritime nations, incident reporting remains fragmented across manual agency spreadsheets, ad-hoc paper logs, local press articles, and unstructured social media posts. Unvalidated spreadsheet workflows frequently accumulate silent structural errors (e.g., locale-induced date corruption, free-text locality typos, administrative mismatches, and ambiguous duplicate entries) that can severely bias epidemiological trend estimates if analyzed uncritically.

Structured citizen science—particularly when co-designed with coastal fishers who spend thousands of person-hours at sea daily—offers a scalable mechanism to close spatio-temporal surveillance gaps across remote coastlines. As demonstrated in global reviews, citizen-generated ecological records can achieve scientific reliability comparable to professional surveys when paired with standardized field protocols, automated quality-control screening, and structured expert verification (Kosmala et al., 2016; Figuerola-Ferrando et al., 2024). Yet deploying mobile citizen-science software in artisanal marine fisheries presents a distinct engineering challenge rarely solved by terrestrial apps: cellular data connectivity drops rapidly beyond 5–15 km from shore, tempting observers to submit reports hours later back at the fishing harbour (causing severe **harbour location drift**), or causing heavy smartphone photo uploads to stall and drop vital GPS coordinates over weak 2G/GPRS links.

To bridge these scientific and technological gaps, this study addresses three linked objectives:
1. **Forensic Data Quality Audit:** Conduct a fully reproducible, rule-logged audit and taxonomic/spatial standardization of Sri Lanka’s 2021–2026 national ministry marine wildlife mortality register (`n = 516`), quantifying error rates and post-disaster institutional reporting decay.
2. **National Spatio-Temporal & Conservation Trend Analysis:** Quantify the post–MV *X-Press Pearl* mortality wave and exponential decay kinetics, test whether Southwest Monsoon dominance persists independently in post-2021 baseline years, evaluate taxonomic and IUCN Red List threat structure, and map coastline-normalized stranding density versus unreported geographic blind spots.
3. **Offline-First Maritime Citizen-Science System Design (MIIS):** Architect, implement, and bench-verify an offline-first Progressive Web App / Android-ready fisher reporting framework featuring hardware GNSS multi-sample fusion, offline Sri Lanka EEZ geofencing, client-side EXIF GPS anti-drift verification, decoupled `<500`-byte geo-beacons vs. deferred harbour photo synchronization, and `<130`-character 2G GSM SMS fallback ingestion.

---

## 2. Materials and Methods

### 2.1 Source Dataset & Forensic Quality-Assurance Pipeline

The primary empirical dataset comprises the official Sri Lanka Ministry marine wildlife mortality workbook (`data/raw/Wildlife_mortality_raw.xlsx`), containing six raw fields: `Date of finding the animal`, `Province`, `District`, `Place of Detection`, `Species (whale/ dolphin/ turtle/ sea snake/ other)`, and `Scientifc name` (sic). The workbook contained 541 rows beneath the header, of which 25 were entirely blank trailing rows and excluded, leaving **`n = 516` individual mortality records** (`515` dated, `1` undated).

We developed a deterministic Python cleaning and audit pipeline (`analysis/clean_wildlife_mortality.py`, pipeline version `MIIS-QA-v2.0`) backed by three external, version-controlled reference tables in `analysis/reference/`:
- `sl_districts.csv`: Sri Lanka’s 14 official coastal districts with Survey Department province mappings, coastline lengths (km), coastal sectors, and fallback district centroids (plus non-coastal reference entries such as landlocked Monaragala District in Uva Province).
- `sl_coastal_gazetteer.csv`: 164 verified coastal localities spanning all 12 reporting coastal districts, mapping 320+ raw spelling variants, hotel landmarks, and multiline descriptions to canonical locality names, decimal degrees (`WGS84`), spatial precision classes (`locality`, `town`, `district`, `none`), and horizontal uncertainty radii ($\pm 1$ to $\pm 25\text{ km}$).
- `species_reference.csv`: Standardized nomenclature aligned with the World Register of Marine Species (WoRMS) and IUCN Global Red List statuses updated through October 2025 (including the October 2025 global reassessment of *Chelonia mydas* from Endangered to Least Concern, while explicitly retaining its Endangered status under the Sri Lanka National Red List).

Every automated transformation was logged non-destructively to `data/processed/change_log.csv` (`record_no`, `field`, `old_value`, `new_value`, `rule`, `reason`) while preserving all raw columns verbatim alongside cleaned fields. Twelve explicit QA rules (`R1`–`R12`) were applied:

1. **Temporal Forensic Repair (`R1`, `R2`):** Inspection of raw Excel cells revealed mixed storage types: `187` native Excel `datetime` serial cells and `328` literal `DD/MM/YYYY` text strings (plus `1` missing date). Every native Excel datetime serial corresponded to dates where the true day of the month was $\le 12$, whereas days 13–31 remained unparsed literal text—the diagnostic signature of `DD/MM/YYYY` entries ingested under a US (`MM/DD/YYYY`) Excel locale, causing silent day–month transposition (`01/06/2021` stored as `2021-01-06`). Transposing day and month for all Excel datetime cells where $\text{month} \neq \text{day}$ (`167` records; `20` records with $\text{month} = \text{day}$ were mathematically unambiguous) reduced sequential chronological inversions across the register from **24 large multi-month jumps to 1 single 1-day entry inversion** (`MIN-WM-0486`: `2023-01-08` logged one row before `MIN-WM-0487`: `2023-01-07`), which was preserved transparently and flagged as `minor_log_order_inversion`.
2. **Spatial & Administrative Reconciliation (`R3`–`R10`):** Place names erroneously entered into the `Province` column (`R8`, `n = 2`) and column-shifted rows (`R3`, `n = 1`) were isolated; district (`R4`, `n = 13`) and province (`R10`, `n = 122`) spellings were standardized; locality strings were matched against the verified coastal gazetteer to impute missing districts (`R5`, `n = 2`), reconcile administrative boundary conflicts (`R6`, `n = 13`), fill missing provinces (`R7`, `n = 3`), and repair province–district mismatches (`R9`, `n = 10`). Crucially, missing localities (`n = 29`) and wholly unlocated rows (`n = 1`, Western Province only) were **never fabricated**; they retained district-centroid or null coordinates with explicit precision metadata.
3. **Taxonomic Standardization (`R11`, `R12`):** Spelling/capitalization errors (`Neophocena phocaenoides`, `delphinus delphis`, multiline `\nDugong`, `Sousa spp`) were standardized (`n = 7`); placeholder dashes (`-`, `n = 1`) were converted to indeterminate; life stage (`Whale fetus`) was extracted into a dedicated `life_stage` attribute; and unresolved candidate pairs (`Balaenoptera edeni/Balaenoptera musculus`) were conservatively retained at genus level (`Balaenoptera sp.`) without assuming species identity.
4. **Same-Day Cluster Flagging Policy:** Records sharing identical `event_date`, `district`, standardized `locality`, and `scientific_name` (`89` records across `37` review groups, `DG-001` to `DG-037`, largest group `n = 6`) were **flagged rather than deleted**, because each workbook row represents an individual carcass (including verified multi-individual events such as four Short-finned pilot whales at Kudawa, Kalpitiya on 11–12 February 2023).
5. **Completeness Index:** Each record received a 5-point scientific completeness score (`0.0–1.0`, equal weights of `0.2` each) across: valid date, valid district, locality-level precision, non-unknown taxon group, and species/genus taxonomic resolution.

### 2.2 Statistical Trend Analysis

All statistical analyses and 300-DPI publication figures (`F1`–`F8`) were generated reproducibly via `analysis/trend_analysis.py` using Python (`pandas`, `numpy`, `scipy`, `matplotlib`):
- **Post-Disaster Exponential Decay:** Weekly 2021 counts from the peak stranding week (`2021-06-14`) across the subsequent 26 weeks were modeled via Maximum Likelihood Estimation (MLE) under a Poisson log-linear exponential decay function, $\lambda(t) = \exp(a - kt)$, with mortality half-life $t_{1/2} = \ln(2)/k$. Uncertainty bounds (95% CI) were computed via 2,000 parametric Poisson bootstrap replicates, and goodness-of-fit was quantified using McFadden deviance explained ($R^2_{\text{dev}}$).
- **Monsoonal Seasonality:** Sri Lanka’s four climatological seasons—Southwest (SW) Monsoon (May–Sep; 5 months), Second Inter-monsoon (Oct–Nov; 2 months), Northeast (NE) Monsoon (Dec–Feb; 3 months), and First Inter-monsoon (Mar–Apr; 2 months)—were tested against expected uniform monthly proportions (`5/12, 2/12, 3/12, 2/12`) using Pearson’s $\chi^2$ goodness-of-fit test, evaluated both across the full dataset (`n = 515`) and strictly across post-2021 baseline years (`2022–2026`, `n = 73`).
- **Spatial & Taxonomic Comparisons:** Inter-provincial variation in 2021 sea turtle versus cetacean proportions was evaluated using contingency $\chi^2$, Cramér’s $V$, and a 10,000-iteration Monte Carlo exact test (accounting for minimum expected cell count $3.48 < 5$). Post-crisis completeness degradation (`2021` vs. `2022–2026`) was evaluated via a one-sided Mann–Whitney $U$ test. Coastline-normalized stranding intensity was calculated as total district records per 100 km of coastline.

### 2.3 Engineering the Offline-First Maritime Citizen-Science Platform (MIIS)

To prevent the observed spreadsheet defects at the moment of field capture—and specifically to enable reliable offshore reporting by artisanal and multi-day fishers under weak 2G or zero mobile data coverage—we engineered MIIS as an installable Progressive Web App (PWA) with Capacitor Android APK readiness (`capacitor.config.json`, `src/utils/nativeMaritimeBridge.js`) and an Express/SQLite backend (`server/server.js`, `server/sms_gateway.js`). The maritime telemetry stack implements five core technical mechanisms:

1. **Multi-Sample Hardware GNSS Fusion (`src/utils/maritimeGeo.js`):** Invokes passive hardware satellite receivers (GPS/GLONASS/Galileo via `enableHighAccuracy: true, maximumAge: 0`), which operate with zero cellular connectivity. The acquisition routine rejects stale OS cached fixes (`age > 30 s`), collects up to 5 satellite epochs over 8.5 seconds, computes an inverse-variance weighted centroid ($w_i = 1/\max(\sigma_i, 3)^2$), and classifies fix quality (`EXCELLENT_GNSS` $\le 15\text{ m}$, `GOOD_GNSS` $\le 50\text{ m}$, `DEGRADED_FIX` $\le 250\text{ m}$, or `CELL_TOWER_REJECTED` $> 250\text{ m}$).
2. **Offline Sri Lanka EEZ Geofencing & Administrative Lock:** Validates coordinates client- and server-side against Sri Lanka’s maritime envelope (`4.5°N–10.6°N, 78.2°E–83.4°E`), calculates Haversine distance (km and NM) and compass bearing from 44 coastal reference anchors across all 14 coastal districts, classifies maritime zone (`Coastal/Shoreline`, `Nearshore 0–12 NM`, `Offshore EEZ >12 NM`), and deterministically derives authoritative `District` and `Province`.
3. **Client-Side JPEG EXIF Anti-Drift Safeguard:** A zero-dependency binary `DataView` parser reads JPEG `APP1` TIFF and GPS sub-IFD tags *prior* to client-side canvas compression (~150 KB). When photo EXIF GPS differs from device coordinates by $> 0.5\text{ km}$ (diagnostic of harbour-delayed reporting), the UI alerts the fisher and offers one-tap restoration of the original offshore capture coordinates; server-side ingestion independently computes and archives `exif_drift_km`.
4. **Decoupled Two-Phase IndexedDB Synchronization (`src/utils/offlineSyncQueue.js`):** Every report is persisted first to on-device IndexedDB under a unique `client_uuid`.
   - *Phase 1 (Geo-Beacon, `POST /api/reports/beacon`, ~420 bytes):* Transmits immediately over weak 2G/GPRS/EDGE sea links with strict `client_uuid` idempotency (preventing duplicate incidents on flaky retries) and distinct `observed_at`, `gps_locked_at`, and `beacon_received_at` timestamps.
   - *Phase 2 (Deferred Photo Media, `POST /api/reports/:clientUuid/media`, ~150 KB):* Automatically held on-device while `NetworkInformation.effectiveType` indicates `slow-2g`/`2g`/offline, and flushed automatically when the boat returns to harbour 4G/Wi-Fi.
5. **Zero-Data 2G GSM SMS Fallback (`server/sms_gateway.js`):** Encodes complete observation telemetry (`uuid`, 5-decimal latitude/longitude $\approx 1.1\text{ m}$ precision, accuracy, UTC timestamp, event/taxon/condition codes, quantity, hazard flags) into a single `<130`-character GSM 7-bit SMS packet (`MIIS1|<id>|<lat>,<lon>|A<acc>|<ts>Z|<evt>|<tax>|<cond>|Q<qty>|F<flags>`), supported by three ingestion adapters: cloud webhooks (Twilio/Dialog/Mobitel), a zero-cost Android SMS Forwarder harbour bridge, and a local Raspberry Pi + SIM800L GSM serial daemon (`server/sim800l_serial_bridge.py`).

---

## 3. Results

### 3.1 Forensic Audit Findings & Post-Crisis Institutional Data Decay

Across the `516` retained ministry records, **`231` records (44.8%) required at least one substantive QA repair or flag**, generating **`669` auditable change-log entries** (Table `T7`, Figure `F7`):
- **Temporal repairs:** `167` day–month swapped Excel serial dates (`32.4%` of all records) were recovered alongside `328` text-date parses, eliminating 23 of 24 chronological ordering violations.
- **Spatial & administrative repairs:** `13` district–locality conflicts were corrected against official Divisional Secretariat boundaries—notably *Palatupana* misassigned to landlocked `Monaragala` ($\rightarrow$ `Hambantota`), *Midigama/Gurubebila* (`n = 2`) in `Galle` ($\rightarrow$ `Matara`), *Kudawella* in `Matara` ($\rightarrow$ `Hambantota`), *Delft Island* in `Kilinochchi` ($\rightarrow$ `Jaffna`), *Weligama* in `Galle` ($\rightarrow$ `Matara`), *Rekawa* in `Matara` ($\rightarrow$ `Hambantota`), *Aluthgama/Moragalla* in `Galle` ($\rightarrow$ `Kalutara`), *Wadduwa/Panadura* (`n = 3`) in `Colombo` ($\rightarrow$ `Kalutara`), *Egoda Uyana* in `Kalutara` ($\rightarrow$ `Colombo`), and *Kepungoda* in `Colombo` ($\rightarrow$ `Gampaha`). Ten province–district mismatches (`Kalutara` listed as `Southern`, `Galle` as `Western`), two place-in-province entries (`Galleface beach`), one column shift, and 13 spelling typos (`Baticaloa`) were corrected. Geocoding achieved **100% coverage of all named localities** (`484/516` at locality precision, `93.8%`; `2` town-level; `29` district-centroid where locality was blank; `1` Western Province only with no district/place), including correcting *Preethipura Beach* by ~26 km from north Negombo to Wattala (`6.999°N, 79.867°E`).
- **Post-2021 Completeness Collapse:** Mean scientific completeness dropped significantly from **`0.988`** (`99.1%` locality geocoded, `93.7%` species-level ID) in 2021 (`n = 442`) to **`0.808`** in 2022–2026 (`n = 73`, Mann–Whitney $U = 25235.5$, $p = 2.60 \times 10^{-39}$), reaching a nadir of **`0.76`** completeness and **`27.9%`** species-level identification in 2022 (`n = 43`; Table 1).

**Table 1.** Annual record counts and data-quality metrics across the cleaned Sri Lanka marine wildlife mortality register (2021–2026; `T1` & `T7`).

| Year | Sea Turtles | Cetaceans | Sirenians | Unknown | Total (`n`) | Locality Geocoded (%) | Species-Level ID (%) | Mean Completeness |
| :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **2021** | 387 | 55 | 0 | 0 | **442** | 99.1% | 93.7% | 0.99 |
| **2022** | 32 | 8 | 0 | 3 | **43** | 60.5% | 27.9% | 0.76 |
| **2023** | 6 | 5 | 0 | 0 | **11** | 63.6% | 100.0% | 0.93 |
| **2024** | 0 | 0 | 0 | 0 | **0** | — | — | — |
| **2025** | 13 | 0 | 0 | 4 | **17** | 76.5% | 76.5% | 0.85 |
| **2026** | 0 | 1 | 1 | 0 | **2** | 0.0% | 100.0% | 0.80 |
| **Undated** | 0 | 1 | 0 | 0 | **1** | 0.0% | 0.0% | 0.40 |
| **Total** | **438** | **70** | **1** | **7** | **516** | **93.8%** | **87.4%** | **0.96** |

### 3.2 Temporal Dynamics: MV *X-Press Pearl* Surge, Decay Kinetics & Seasonality

Mortality was heavily concentrated in 2021 (`442/515` dated records; **85.8%**), with **`375` records (72.8%)** occurring within 90 days of the MV *X-Press Pearl* sinking on 2 June 2021 (Figures `F1`, `F2`). Weekly mortalities rose sharply from 2 carcasses in late May to a peak of **75 carcasses during the week beginning 14 June 2021** (12–18 days post-sinking), comprising 64 sea turtles and 11 cetaceans. Across the 26 post-peak weeks through December 2021, the Poisson exponential decay model yielded an instantaneous decay rate of $k = 0.1749\text{ week}^{-1}$ (**half-life $t_{1/2} = 3.96\text{ weeks}$**, bootstrap 95% CI: **3.52–4.49 weeks**), explaining **85.9% of weekly deviance** (`F1`).

Multi-year time series revealed an abrupt reporting halt after March 2023, a **complete 12-month absence of records throughout 2024**, and intermittent Western/North Western entries in June–August 2025 (`n = 17`) and May–June 2026 (`n = 2`; `F2`, `F8`). Across all dated records, **90.5% (`466/515`)** occurred during the **Southwest Monsoon (May–September)** ($\chi^2 = 510.42$, $df = 3$, $p = 2.64 \times 10^{-110}$). Critically, restricting the test strictly to post-disaster years (`2022–2026`, `n = 73`) confirmed that SW Monsoon concentration remained strongly significant (**65.8%**, `48/73` vs. `41.7%` expected under uniform seasonality; $\chi^2 = 18.91$, $df = 3$, $p = 2.85 \times 10^{-4}$).

### 3.3 Taxonomic Composition & Conservation Threat Structure

Identified mortalities encompassed **20 taxonomic categories** across three megafauna groups (Table `T2`, Figure `F3`):
- **Sea Turtles (`n = 438`, 84.9%):** All five Sri Lankan species were documented: Olive ridley (*Lepidochelys olivacea*, IUCN **VU**, `n = 346`, `67.1%` of all records and `84.8%` of identified turtles), Green (*Chelonia mydas*, `n = 41`, `7.9%`; IUCN Global **LC** as of Oct 2025 / Sri Lanka National **EN**), Hawksbill (*Eretmochelys imbricata*, **CR**, `n = 16`, `3.1%`), Loggerhead (*Caretta caretta*, **VU**, `n = 3`, `0.6%`), Leatherback (*Dermochelys coriacea*, **VU**, `n = 2`, `0.4%`), and unidentified sea turtles (`n = 30`).
- **Cetaceans (`n = 70`, 13.6%):** Dominated by Spinner dolphins (*Stenella longirostris*, **LC**, `n = 15`), Striped dolphins (*Stenella coeruleoalba*, **LC**, `n = 12`), Short-finned pilot whales (*Globicephala macrorhynchus*, **LC**, `n = 4` — all from the Feb 2023 Kudawa stranding), Dwarf sperm whales (*Kogia sima*, **LC**, `n = 3`), Humpback dolphins (*Sousa sp.*, regional *S. plumbea* **EN**, `n = 3`), Common dolphins (*Delphinus delphis*, **LC**, `n = 2`), plus single records of **Blue whale** (*Balaenoptera musculus*, **EN**), unresolved rorqual (*B. edeni/B. musculus*), **Indo-Pacific finless porpoise** (*Neophocaena phocaenoides*, **VU**), False killer whale (*Pseudorca crassidens*, **NT**), Pygmy killer whale (*Feresa attenuata*, **LC**), Risso’s dolphin (*Grampus griseus*, **LC**), Fraser’s dolphin (*Lagenodelphis hosei*, **LC**), Bottlenose dolphin (*Tursiops truncatus*, **LC**), and 22 unidentified cetaceans (including one whale fetus).
- **Sirenians (`n = 1`, 0.2%):** One Dugong (*Dugong dugon*, IUCN **VU** globally / **CR** locally) recorded in Puttalam (`2026-05-08`).
- **Provincial Homogeneity:** In 2021, the relative ratio of cetaceans to sea turtles did not differ significantly across the five coastal provinces ($\chi^2 = 7.63$, $df = 4$, $p = 0.106$, Monte Carlo exact $p = 0.103$, Cramér’s $V = 0.131$).

### 3.4 Spatial Hotspots, Coastline-Normalized Density & Surveillance Blind Spots

Mortalities were recorded across 12 of Sri Lanka’s 14 coastal districts (`515` district-resolved records; Table 2, Figures `F4`–`F6`). While **Puttalam** recorded the highest absolute count (`n = 122`, `23.7%`), coastline normalization demonstrated intense stranding density along the Western Province shoreline closest to the wreck: **Colombo (`262.5 / 100 km`)**, **Gampaha (`197.8 / 100 km`)**, and **Kalutara (`150.0 / 100 km`)**, followed by **Galle (`74.0 / 100 km`)**. Top locality hotspots (`T4`) were Galle Face (`n = 23`), Kepungoda (`n = 19`), Mount Lavinia (`n = 17`), Wellawatte (`n = 17`), Suduwella/Chilaw (`n = 12`), Pamunugama (`n = 11`), and Poruthota/Negombo (`n = 11`).

**Table 2.** District-level marine wildlife mortality totals, coastline-normalized density, and 2021 first-detection timing relative to the MV *X-Press Pearl* casualty (`T3` & `T6`).

| Province | District | Sea Turtles | Cetaceans | Sirenians | Unknown | Total | Coastline (km) | Density (/100 km) | 2021 First Detection (Days Post-Fire) |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **North Western** | Puttalam | 93 | 28 | 1 | 0 | **122** | 295 | 41.4 | 2021-06-03 (+14 d) |
| **Western** | Colombo | 91 | 8 | 0 | 6 | **105** | 40 | **262.5** | 2021-05-28 (+8 d) |
| **Western** | Gampaha | 80 | 8 | 0 | 1 | **89** | 45 | **197.8** | 2021-05-27 (+7 d) |
| **Western** | Kalutara | 57 | 6 | 0 | 0 | **63** | 42 | **150.0** | 2021-06-05 (+16 d) |
| **Southern** | Galle | 50 | 4 | 0 | 0 | **54** | 73 | 74.0 | 2021-06-02 (+13 d) |
| **Northern** | Mannar | 18 | 3 | 0 | 0 | **21** | 196 | 10.7 | 2021-06-13 (+24 d) |
| **Eastern** | Ampara | 16 | 3 | 0 | 0 | **19** | 140 | 13.6 | 2021-06-19 (+30 d) |
| **Southern** | Matara | 11 | 3 | 0 | 0 | **14** | 55 | 25.5 | 2021-06-07 (+18 d) |
| **Eastern** | Batticaloa | 10 | 3 | 0 | 0 | **13** | 145 | 9.0 | 2021-06-19 (+30 d) |
| **Southern** | Hambantota | 7 | 1 | 0 | 0 | **8** | 145 | 5.5 | 2021-06-01 (+12 d) |
| **Northern** | Jaffna | 3 | 3 | 0 | 0 | **6** | 295 | 2.0 | 2021-06-15 (+26 d) |
| **Northern** | Kilinochchi | 1 | 0 | 0 | 0 | **1** | 104 | 1.0 | 2021-06-12 (+23 d) |
| **Eastern** | **Trincomalee** | 0 | 0 | 0 | 0 | **0** | **210** | **0.0** | *No records (5-yr blind spot)* |
| **Northern** | **Mullaitivu** | 0 | 0 | 0 | 0 | **0** | **72** | **0.0** | *No records (5-yr blind spot)* |

First-detection chronology in 2021 (`T6`, `F6`) traced coherent outward oceanographic propagation from the wreck epicenter: Gampaha/Colombo (`+7–8 d` post-fire) $\rightarrow$ Southwest/Northwest coasts (`+12–18 d`) $\rightarrow$ Gulf of Mannar/Northern Peninsula (`+23–26 d`) $\rightarrow$ East Coast (`Ampara` & `Batticaloa`, simultaneously on `19 June 2021`, `+30 d` post-fire / `+17 d` post-sinking). Notably, **Trincomalee** (`210 km`) and **Mullaitivu** (`72 km`) logged **zero records across five years**, representing a critical northeast surveillance gap.

### 3.5 Verification of the MIIS Offline Maritime Reporting Architecture

End-to-end automated bench verification confirmed every reliability requirement of the MIIS fisher reporting architecture:
- **Phase-1 Geo-Beacon Payload & Idempotency:** Transmitted complete georeferenced telemetry (`client_uuid`, WGS84 lat/lon, GNSS accuracy, maritime zone, auto-resolved district/province, incident/taxon codes) in `<500 bytes` to `POST /api/reports/beacon`; duplicate sea-signal retry returned `deduplicated: true` with zero duplicate rows created.
- **Phase-2 Deferred Photo Attachment & EXIF Anti-Drift:** Uploading a compressed harbour photo (`142 KB`) linked to an existing offshore beacon (`POST /api/reports/:uuid/media`) successfully detected an injected `5.12 km` EXIF-vs-beacon spatial discrepancy (`drift_warning: true`) and flagged it for expert validation.
- **2G GSM SMS Fallback:** A `66-byte` single-SMS packet (`MIIS1|SMSTST01|7.12050,79.80120|A12|2611240815Z|ENT|TRT|E|Q1|FN`) parsed deterministically via `POST /api/reports/sms-ingest`, auto-resolved to Gampaha District (Western Province), and generated a georeferenced map record without mobile data.
- **Maritime Geofence Rejection:** Out-of-bounds (`0, 0`) and non-Sri Lankan coordinates were deterministically rejected prior to database insertion (`HTTP 400`).

---

## 4. Discussion

### 4.1 Why Forensic Data Cleaning Is Mandatory Before Ecological Inference

Our forensic audit demonstrates a cautionary lesson for marine conservation science: analyzing raw administrative stranding spreadsheets without systematic QA can silently invalidate epidemiological conclusions. Nearly one-third (`32.4%`, `167/516`) of records suffered US-locale Excel day–month transposition, which would have falsely scattered June–July 2021 *X-Press Pearl* mortalities across January–December 2021 and completely obscured the 3.96-week exponential decay curve. Similarly, failing to reconcile Survey Department boundaries would have placed a marine turtle stranding inside landlocked Monaragala District, misallocated border beaches across Galle/Matara/Hambantota/Kalutara/Colombo/Gampaha, and misplaced Preethipura Beach by 26 km. Publishing transparent, rule-indexed audit logs (`change_log.csv`) alongside unedited raw fields follows FAIR data stewardship principles and should become standard practice for national marine stranding analyses.

### 4.2 Ecological & Governance Drivers of Sri Lanka’s Mortality Trends

Three ecological and governance patterns carry direct policy relevance:
1. **Acute Disaster Surge vs. Chronic Monsoonal Risk:** While the MV *X-Press Pearl* casualty generated an extraordinary acute spike (`442` records in 2021; `t1/2 = 3.96 weeks`), the persistence of strong **Southwest Monsoon seasonality during 2022–2026 (`65.8%`, $p = 2.85 \times 10^{-4}$)** demonstrates that west and southwest coast stranding risk recurs annually. During May–September, strong onshore SW winds and coastal Ekman transport accelerate onshore carcass drift from nearshore gillnet and trawl grounds—precisely where vulnerable Olive ridley turtles (*L. olivacea*) and coastal delphinids overlap with artisanal fishing effort.
2. **Institutional Attention Fatigue & Spatial Bias:** The collapse in record completeness after 2021 ($98.8\% \rightarrow 80.8\%$), the complete absence of entries in 2024, and the total absence of 5-year records in **Trincomalee** (one of the Indian Ocean’s premier cetacean canyon habitats) and **Mullaitivu** reflect reactive crisis-driven logging rather than true ecological absence. High densities in Colombo (`262.5 / 100 km`) and Gampaha (`197.8 / 100 km`) simultaneously reflect proximity to the 2021 wreck *and* superior urban observer density and agency accessibility.
3. **Conservation Vulnerability:** The dominance of IUCN **VU** (*L. olivacea*, *C. caretta*, *D. coriacea*, *N. phocaenoides*, *D. dugon*), **EN** (*B. musculus*, regional *Sousa plumbea*, and nationally *C. mydas*), and **CR** (*E. imbricata*) species underscores the urgency of shifting from reactive post-disaster tallies to continuous, spatially unbiased national monitoring.

### 4.3 Co-Designing Offline-First Citizen Science for Artisanal Fisheries

Existing citizen-science platforms frequently assume continuous 4G broadband and terrestrial map context, failing fishers operating 5–50 km offshore. By decoupling **tiny satellite GNSS Geo-Beacons (`<500 B`)** and **1-SMS 2G fallbacks (`<130 chars`)** from **harbour-deferred photo uploads**, MIIS resolves the classic trade-off between spatial accuracy and media richness. Equally important, enforcing **capture-time GNSS locking**, **EXIF GPS drift verification**, and **offline EEZ/District geofencing** structurally eliminates every major defect uncovered in the 2021–2026 ministry spreadsheet at the point of collection—turning coastal fishers into first-tier scientific observers whose reports flow seamlessly into DWC/NARA expert validation (Levels 1–4) while blurring sensitive turtle nesting and dugong coordinates on public maps.

### 4.4 Limitations

1. **Detection & Effort Bias:** Because the ministry register records presence-only stranding discoveries without standardized beach-survey effort metrics (observer-km surveyed), raw spatial differences combine true ecological mortality with uneven patrol intensity and public reporting visibility.
2. **Unresolved Cause of Death & Carcass IDs:** The ministry spreadsheet lacks necropsy findings, decomposition codes, and individual carcass identifiers; therefore, the 2021 surge cannot separate chemical toxicity, thermal trauma, acoustic/blast injury, and concurrent fisheries bycatch at the individual carcass level, and the 37 same-day clusters remain flagged for sensitivity review.
3. **Field Trial Progression:** While MIIS’s offline GNSS fusion, EXIF drift detector, and two-phase beacon/SMS/media pipelines are engineered and bench-verified, longitudinal multi-harbour field trials with Sri Lankan fishers (Phases 1–5 of the MIIS operational plan) are required to quantify real-world fisher adoption rates, 2G SMS delivery latency across offshore distances, and inter-observer taxonomic agreement.

---

## 5. Conclusions

Forensic rehabilitation of Sri Lanka’s 2021–2026 national marine wildlife mortality register reveals both the catastrophic multi-taxa footprint of the MV *X-Press Pearl* disaster (`442` records in 2021; `3.96`-week exponential decay half-life) and two enduring structural realities: persistent Southwest Monsoon stranding risk (`65.8%` in post-disaster years) and severe institutional surveillance gaps (post-2021 completeness collapse, a 2024 data blackout, and zero 5-year records in Trincomalee and Mullaitivu). Addressing these gaps demands moving beyond manual spreadsheets to purpose-built maritime citizen-science infrastructure. By pairing offline hardware GNSS fusion, EXIF anti-drift safeguards, `<500`-byte 2G beacons, 1-SMS zero-data fallbacks, and deferred harbour photo synchronization with expert validation, MIIS provides an immediately deployable, open-science operational foundation for nationwide marine wildlife conservation and evidence-based coastal governance in Sri Lanka.

---

## Data Availability & Reproducibility Statement
All cleaning pipelines (`analysis/clean_wildlife_mortality.py`), statistical analysis code (`analysis/trend_analysis.py`), geographic and taxonomic reference tables (`analysis/reference/*.csv`), cleaned datasets (`data/processed/wildlife_mortality_clean.csv`, `.xlsx`, `.geojson`), full 669-entry edit log (`data/processed/change_log.csv`), and MIIS web/mobile/backend source code are archived in the project repository for transparent peer review.

## Ethics & Wildlife Safety Statement
No live animals were handled or disturbed during this study. The MIIS citizen-reporting interface enforces a mandatory pre-submission safety and ethics protocol instructing observers to maintain a $\ge 15\text{ m}$ distance from live marine megafauna, refrain from dragging stranded cetaceans by flukes/fins, avoid direct contact with chemical/oil residues, and blurs sensitive sea turtle and dugong coordinates (`1–5 km`) on public-facing portals.

---

## References

- de Vos, A., Aluwihare, L., Youngs, S., DiBenedetto, M. H., Ward, C. P., Michel, A. P. M., Colson, B. C., Mazzotta, M. G., Walsh, A. N., Nelson, R. K., Reddy, C. M., & James, B. D. (2022). The M/V *X-Press Pearl* nurdle spill: Contamination of burnt plastic and unburnt nurdles along Sri Lanka’s beaches. *ACS Environmental Au*, 2(2), 128–135. https://doi.org/10.1021/acsenvironau.1c00031
- Figuerola-Ferrando, L., Linares, C., Zentner, Y., López-Sendino, P., & Garrabou, J. (2024). Marine citizen science and the conservation of Mediterranean corals: The relevance of training, expert validation, and robust sampling protocols. *Environmental Management*, 73, 646–656. https://doi.org/10.1007/s00267-023-01913-x
- IUCN. (2025). *The IUCN Red List of Threatened Species*. Version 2025-2 (including October 2025 global reassessment of *Chelonia mydas*). International Union for Conservation of Nature. https://www.iucnredlist.org
- Kosmala, M., Wiggins, A., Swanson, A., & Simmons, B. (2016). Assessing data quality in citizen science. *Frontiers in Ecology and the Environment*, 14(10), 551–560. https://doi.org/10.1002/fee.1436
- Partow, H., Lacroix, C., Le Floch, S., & Alcaro, L. (2021). *X-Press Pearl Maritime Disaster: Sri Lanka — Report of the UN Environmental Advisory Mission*. UNEP/OCHA Joint Environment Unit, Geneva.
- Perera, U. L. H. P., Subasinghe, H. C. S., Ratnayake, A. S., Weerasingha, W. A. D. B., & Wijewardhana, T. D. U. (2022). Maritime pollution in the Indian Ocean after the MV *X-Press Pearl* accident. *Marine Pollution Bulletin*, 185, 114301. https://doi.org/10.1016/j.marpolbul.2022.114301
- Sewwandi, M., Hettithanthri, O., Egodage, S. M., Amarathunga, A. A. D., & Vithanage, M. (2022a). Unprecedented marine microplastic contamination from the *X-Press Pearl* container vessel disaster. *Science of the Total Environment*, 828, 154374. https://doi.org/10.1016/j.scitotenv.2022.154374
- Sewwandi, M., Amarathunga, A. A. D., Wijesekara, H., Mahatantila, K., & Vithanage, M. (2022b). Contamination and distribution of buried microplastics in Sarakkuwa Beach ensuing the MV *X-Press Pearl* maritime disaster in Sri Lankan sea. *Marine Pollution Bulletin*, 184, 114074. https://doi.org/10.1016/j.marpolbul.2022.114074
