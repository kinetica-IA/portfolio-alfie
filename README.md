# kineticaai.com — Portfolio Alfonso Navarro

**Alfonso Navarro** — Biomechanist, Osteopath, Clinical AI maker

Live portfolio at **[kineticaai.com](https://kineticaai.com)** — a biodynamic living document that updates automatically with real physiological data.

---

## What makes this portfolio "living"

| Layer | What it does |
|-------|-------------|
| **Polar AccessLink API** | Nightly GitHub Action fetches yesterday's HRV, ANS charge, sleep fragmentation from Polar Grit X2 |
| **DSQ Diary** | Daily symptom log via web form at `/diary` — writes directly to `data/diary_live.csv` via GitHub API |
| **Auto-retrain** | Every diary commit triggers `polar-retrain.yml` → reruns the LOO-CV Logistic Regression predictor → updates `polar_live.json` |
| **Biometrics section** | Portfolio fetches `public/data/polar_live.json` at page load and renders live metrics + sparkline |

---

## Key finding

> **Autonomic dysfunction predicted from nocturnal HRV**
> AUC 0.83 · CI95 [0.72, 0.94] · N = 55 paired days · LOO-CV · Bootstrap 1000×
> Features: hrv_rmssd_night_t0 · recovery_sublevel_t3

> Numbers update on every pipeline run. Current canonical values live in
> `public/data/polar_live.json` (read by portfolio runtime).

This is an N=1 longitudinal study, self-funded, reproducible. Full dataset and methodology:
→ [github.com/kinetica-IA/polar-lyme-predictor](https://github.com/kinetica-IA/polar-lyme-predictor)

---

## Repo structure

```
portfolio-alfie/
├── .github/
│   └── workflows/
│       ├── deploy.yml              # Astro build → GitHub Pages
│       ├── polar-biometrics.yml    # Nightly: fetch Polar API → polar_live.json
│       └── polar-retrain.yml       # On diary push: retrain predictor
│
├── data/
│   └── diary_live.csv              # 61+ DSQ-PEM symptom entries (appends daily)
│
├── public/
│   ├── data/
│   │   └── polar_live.json         # 243-day biometric series + v3 multi-target predictor
│   └── diary.html                  # Standalone DSQ web form (no server needed)
│
├── scripts/
│   ├── fetch_polar_live.py         # Polar AccessLink v3 → polar_live.json
│   ├── polar_seed.py               # One-time seed from CSV export
│   ├── retrain_predictor.py        # LOO-CV LogReg, writes to polar_live.json
│   └── log_diary.py                # CLI diary entry (--push, --history flags)
│
└── src/
    └── components/sections/
        ├── Biometrics.astro         # Live HRV / ANS / Sleep fragmentation cards
        └── Projects.astro           # Research & engineering cards
```

---

## DSQ Diary web form

Navigate to `kineticaai.com/diary` from any device (phone, tablet).

- Enter your GitHub Personal Access Token once (stored in browser, `repo` scope)
- Score fatigue, PEM, brain fog, autonomic dysfunction, pain (0–10 sliders)
- Toggle zolpidem use
- Hit **Save** → form reads `diary_live.csv`, upserts today's row, writes back → retrain fires in ~1 min

Token setup: [github.com/settings/tokens/new?scopes=repo](https://github.com/settings/tokens/new?scopes=repo&description=DSQ-Diary)

---

## GitHub Actions

### `polar-biometrics.yml` — daily at 06:00 UTC
```
Runs: scripts/fetch_polar_live.py
Env:  POLAR_ACCESS_TOKEN (GitHub Secret), POLAR_USER_ID=63255666
Writes: public/data/polar_live.json  →  git push
```

### `polar-retrain.yml` — on push to `data/diary_live.csv`
```
Runs: scripts/retrain_predictor.py
Deps: numpy scikit-learn scipy
Writes: polar_live.json["predictor"] (multi-target v3)  →  git push
```

---

## Data schema

### `polar_live.json`
```json
{
  "updated_at": "2026-03-23T06:00:00Z",
  "latest": {
    "date": "2026-03-22",
    "hrv_rmssd_night": 39.0,
    "hrv_rri_mean_ms": 904.0,
    "ans_charge": 52,
    "sleep_wake_min": 28.0,
    "sleep_interruptions": 18,
    "steps": 2686
  },
  "series": [ /* 243+ days */ ],
  "predictor": {
    "model_version": "v3",
    "auc": 0.829,
    "n_training": 55,
    "targets": {
      "disfuncion_autonomica": {
        "best_auc": 0.8288,
        "best_auc_ci95": [0.7151, 0.9365],
        "selected_features": ["hrv_rmssd_night_t0", "recovery_sublevel_t3"],
        "n_training": 55
      }
      /* + fatiga, niebla_mental, pem, severity */
    }
  }
}
```

### `diary_live.csv` columns
`date · schema_version · severidad_global · fatiga · pem · niebla_mental · disfuncion_autonomica · dolor · zolpidem · nota`

---

## Stack

- **Astro** static site → GitHub Pages (Node 20, deploy on push to `main`)
- **Python 3.11** · httpx · scikit-learn · scipy · numpy
- **Polar Grit X2** wearable (HRV, sleep, activity via AccessLink v3)
- **GitHub Contents API** (diary form reads/writes CSV without a backend)

---

## Local seed (first-time setup)

```bash
# After cloning:
python scripts/polar_seed.py          # reads polar_daily_6m.csv → polar_live.json
python scripts/retrain_predictor.py   # builds predictor block in polar_live.json
git add public/data/polar_live.json
git commit -m "feat: seed biometrics history"
git push
```

---

## Links

- Portfolio: [kineticaai.com](https://kineticaai.com)
- Predictor repo: [kinetica-IA/polar-lyme-predictor](https://github.com/kinetica-IA/polar-lyme-predictor)
- LinkedIn: [navarro-kinetica-ai](https://www.linkedin.com/in/navarro-kinetica-ai)
