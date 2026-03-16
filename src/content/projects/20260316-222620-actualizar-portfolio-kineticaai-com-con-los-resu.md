Tengo todos los datos necesarios. Genero el MDX:

```mdx
---
title: "ANS Predictor: HRV as a 48h Warning Signal in Post-Lyme Fatigue"
description: "Logistic regression model using Polar wearable ANS data to predict high-symptom days 48 hours before onset in chronic post-Lyme fatigue. AUC 0.656, sensitivity 81%."
pubDate: "2026-03-16"
heroImage: "/assets/polar-lyme-predictor.png"
tags: ["Healthtech", "HRV", "ANS", "ME-CFS", "ML", "LangGraph", "Wearables", "Clinical AI"]
github: "https://github.com/kinetica-IA/polar-lyme-predictor"
---

## ANS Predictor — Post-Lyme Fatigue Early Warning System

A longitudinal n=1 study demonstrating that autonomic nervous system (ANS) status, measured nightly via a consumer wearable, predicts high-symptom days **48 hours before onset** in post-infectious fatigue. Built, analyzed, and deployed end-to-end within IO — a local-first autonomous AI agent.

The clinical question was simple: *can a €400 wearable predict a crash before it happens?*  
The answer, after 185 days of data and 34 effective observation pairs: yes — with 81% sensitivity.

---

### The Problem

Post-exertional malaise (PEM) in post-Lyme / ME-CFS spectrum conditions is unpredictable by subjective awareness. Patients cannot reliably sense the crash coming. Standard clinical tools offer no early objective warning. Pacing remains intuitive and reactive.

---

### Hypothesis

ANS suppression (measured via Polar Nightly Recharge) would precede high symptom burden by 48 hours — shifting care from reactive to proactive.

---

### Dataset

| Parameter | Value |
|---|---|
| Total days registered | 185 |
| Observation periods | Sep–Oct 2025 (11 days) + Feb 2026 (28 days) |
| Wearable | Polar Grit X2 (nightly HRV, RMSSD, SDNN, ANS status, sleep score) |
| Symptom diary | DIARY_v2 — 7 clinical domains |
| Effective pairs (lag-2, complete) | n = 34 |
| Binary target distribution | 16 bad days (sev ≥ 7) / 18 good days |

---

### Model & Results

**Algorithm:** Logistic Regression · Leave-One-Out Cross-Validation (LOO-CV) · regularization C=0.5

| Metric | Value |
|---|---|
| Spearman ρ (ANS t−2 × severity) | **+0.431** |
| p-value | **0.011** |
| AUC-ROC | **0.656** |
| Sensitivity (bad days detected) | **81.2%** (13/16) |
| Specificity (good days correct) | **66.7%** (12/18) |

**Feature importance (standardized coefficients):**

| Feature | Coefficient |
|---|---|
| `ans_