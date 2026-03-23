#!/usr/bin/env python3
"""
log_diary.py — Diario DSQ-PEM diario + predicción 48h
======================================================
Herramienta de registro diario de síntomas para el portfolio vivo.

Uso:
    cd /Users/alfonsonavarro/portfolio-alfie
    python scripts/log_diary.py

    # Para una fecha específica:
    python scripts/log_diary.py --date 2026-03-22

    # Para ver el historial sin registrar:
    python scripts/log_diary.py --history

    # Para registrar y hacer push automático:
    python scripts/log_diary.py --push

Flujo tras registrar:
    1. Guarda en data/diary_live.csv
    2. Muestra predicción 48h basada en Polar actual
    3. Opcionalmente: git commit + push → GitHub Action retrain → portfolio actualizado
"""

import argparse
import csv
import json
import os
import subprocess
import sys
from datetime import date, datetime, timedelta
from pathlib import Path

# ── Paths ─────────────────────────────────────────────────────────────────────
PORTFOLIO_DIR = Path(__file__).parent.parent
DIARY_CSV     = PORTFOLIO_DIR / "data" / "diary_live.csv"
POLAR_JSON    = PORTFOLIO_DIR / "public" / "data" / "polar_live.json"

DIARY_COLS = ["date", "schema_version", "severidad_global", "fatiga", "pem",
              "niebla_mental", "disfuncion_autonomica", "dolor", "zolpidem", "nota"]

# ── Logistic model coefficients (from last LOO-CV run) ───────────────────────
# Updated by retrain_predictor.py — these are the current published values
MODEL_COEFS = {
    "intercept":  -0.15,    # approximate
    "ans_t2":     +0.598,
    "hrv_t2":     -0.109,
    "rec_t1":     +0.539,
    "zlp":        +0.268,
}
MODEL_AUC         = 0.656
MODEL_SENSITIVITY = 0.812
MODEL_N           = 39


# ── Helpers ───────────────────────────────────────────────────────────────────

def clr(code, text):
    """ANSI color helper."""
    return f"\033[{code}m{text}\033[0m"

def cyan(t):  return clr("96", t)
def green(t): return clr("92", t)
def yellow(t): return clr("93", t)
def red(t):   return clr("91", t)
def dim(t):   return clr("2", t)
def bold(t):  return clr("1", t)


def score_input(label: str, required: bool = True) -> float | None:
    """Ask for a 0–10 score. Returns None if blank and not required."""
    while True:
        hint = "(0-10)" if required else "(0-10, Enter para omitir)"
        raw = input(f"  {label} {hint}: ").strip()
        if raw == "" and not required:
            return None
        if raw == "" and required:
            print(red("  ⚠  Este campo es obligatorio."))
            continue
        try:
            v = float(raw.replace(",", "."))
            if 0 <= v <= 10:
                return round(v, 1)
            print(red("  ⚠  Valor fuera de rango 0-10."))
        except ValueError:
            print(red("  ⚠  Introduce un número entre 0 y 10."))


def yes_no(prompt: str) -> bool:
    raw = input(f"  {prompt} [s/n]: ").strip().lower()
    return raw in ("s", "si", "sí", "y", "yes", "1")


def load_diary() -> dict:
    """Load diary as {date: row}."""
    rows = {}
    if DIARY_CSV.exists():
        with open(DIARY_CSV, newline="") as f:
            for r in csv.DictReader(f):
                rows[r["date"]] = r
    return rows


def save_diary(rows: dict):
    """Write diary CSV sorted by date."""
    DIARY_CSV.parent.mkdir(parents=True, exist_ok=True)
    with open(DIARY_CSV, "w", newline="") as f:
        w = csv.DictWriter(f, fieldnames=DIARY_COLS, extrasaction="ignore")
        w.writeheader()
        for d in sorted(rows.keys()):
            w.writerow(rows[d])


def load_polar_series() -> dict:
    """Load polar_live.json series as {date: row}."""
    if not POLAR_JSON.exists():
        return {}
    try:
        data = json.loads(POLAR_JSON.read_text())
        return {r["date"]: r for r in data.get("series", [])}
    except Exception:
        return {}


def sigmoid(x: float) -> float:
    import math
    return 1.0 / (1.0 + math.exp(-x))


def predict_48h(polar_series: dict, target_date: str) -> dict | None:
    """
    Compute 48h-ahead risk using published LogisticRegression coefficients.
    target_date = symptom date
    ans/hrv from lag-2, rec from lag-1.
    """
    from datetime import datetime, timedelta
    dt = datetime.strptime(target_date, "%Y-%m-%d")
    d2 = (dt - timedelta(days=2)).strftime("%Y-%m-%d")
    d1 = (dt - timedelta(days=1)).strftime("%Y-%m-%d")

    p2 = polar_series.get(d2, {})
    p1 = polar_series.get(d1, {})

    ans2 = p2.get("ans_status")
    hrv2 = p2.get("hrv_rmssd_night")
    rec1 = p1.get("recovery_indicator") or p1.get("ans_score") or 3.0

    if ans2 is None or hrv2 is None:
        return None

    # Rough standardization (from training set stats)
    ans_mean, ans_std = 2.0, 5.5
    hrv_mean, hrv_std = 35.0, 12.0
    rec_mean, rec_std = 3.0, 1.5

    ans_s = (ans2 - ans_mean) / ans_std
    hrv_s = (hrv2 - hrv_mean) / hrv_std
    rec_s = (rec1 - rec_mean) / rec_std

    logit = (MODEL_COEFS["intercept"]
             + MODEL_COEFS["ans_t2"] * ans_s
             + MODEL_COEFS["hrv_t2"] * hrv_s
             + MODEL_COEFS["rec_t1"] * rec_s)
    prob = sigmoid(logit)

    return {
        "prob_bad_day": round(prob, 3),
        "ans_t2": ans2,
        "hrv_t2": hrv2,
        "rec_t1": rec1,
        "date_polar_lag2": d2,
    }


def show_history(rows: dict, n: int = 14):
    """Print last n diary entries."""
    recent = sorted(rows.items(), key=lambda x: x[0], reverse=True)[:n]
    print(f"\n{bold('Últimas entradas del diario:')}")
    print(f"  {'Fecha':<12} {'Sev':>4} {'Fati':>4} {'PEM':>4} {'Nieb':>4} {'Auto':>4} {'Dol':>4} {'Zlp':>4}")
    print("  " + "─" * 52)
    for d, r in reversed(recent):
        sev = r.get("severidad_global","")
        fat = r.get("fatiga","")
        pem = r.get("pem","")
        nie = r.get("niebla_mental","")
        aut = r.get("disfuncion_autonomica","")
        dol = r.get("dolor","")
        zlp = r.get("zolpidem","")
        sev_f = float(sev) if sev != "" else None
        color = red if sev_f and sev_f >= 7 else (yellow if sev_f and sev_f >= 4 else green)
        sev_s = color(f"{float(sev):4.1f}") if sev != "" else "   —"
        print(f"  {d:<12} {sev_s}  {float(fat):4.1f}  {float(pem) if pem else '—':>4}  "
              f"{float(nie) if nie else '—':>4}  {float(aut) if aut else '—':>4}  "
              f"{float(dol) if dol else '—':>4}  {zlp or '—':>4}"
              if all([fat, pem]) else
              f"  {d:<12} {sev_s}  (datos parciales)")


def git_push(entry_date: str):
    """Stage diary, commit and push."""
    try:
        os.chdir(PORTFOLIO_DIR)
        subprocess.run(["git", "add", "data/diary_live.csv"], check=True)
        result = subprocess.run(
            ["git", "diff", "--cached", "--quiet"], capture_output=True
        )
        if result.returncode == 0:
            print(yellow("  Sin cambios que commitear."))
            return
        subprocess.run(
            ["git", "commit", "-m", f"diary: síntomas {entry_date}"],
            check=True
        )
        subprocess.run(["git", "push"], check=True)
        print(green("  ✓ Push completado → GitHub Action reentrenará el predictor."))
    except subprocess.CalledProcessError as e:
        print(red(f"  ✗ Git error: {e}"))


# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="Diario DSQ-PEM diario")
    parser.add_argument("--date",    default=None, help="Fecha YYYY-MM-DD (default: hoy)")
    parser.add_argument("--history", action="store_true", help="Mostrar historial y salir")
    parser.add_argument("--push",    action="store_true", help="Git push automático tras guardar")
    args = parser.parse_args()

    print(f"\n{bold(cyan('═══ Diario DSQ-PEM · Kinetica AI ═══'))}")

    rows = load_diary()

    if args.history:
        show_history(rows, n=20)
        print()
        return

    entry_date = args.date or date.today().isoformat()
    print(f"\n  Fecha: {bold(entry_date)}")

    if entry_date in rows:
        print(yellow(f"\n  ⚠  Ya existe entrada para {entry_date}:"))
        r = rows[entry_date]
        print(f"     Severidad={r.get('severidad_global')}  Fatiga={r.get('fatiga')}  PEM={r.get('pem')}")
        if not yes_no("¿Sobrescribir?"):
            print(dim("  Cancelado."))
            return

    print(f"\n{bold('Síntomas — escala 0 (ninguno) a 10 (máximo)')}")
    print(dim("  Referencia: 0-2 leve · 3-5 moderado · 6-8 severo · 9-10 incapacitante\n"))

    fatiga  = score_input("Fatiga / cansancio extremo")
    pem     = score_input("Malestar post-esfuerzo (PEM)")
    niebla  = score_input("Niebla mental / disfunción cognitiva")
    auto    = score_input("Disfunción autonómica (taquicardia, mareos, sudoración)", required=False)
    dolor   = score_input("Dolor (muscular, articular, cefalea)", required=False)

    sev_components = [fatiga, pem, niebla] + ([auto] if auto is not None else []) + ([dolor] if dolor is not None else [])
    sev_global = round(sum(sev_components) / len(sev_components), 1)
    print(f"\n  {bold('Severidad global calculada:')} {(red if sev_global>=7 else yellow if sev_global>=4 else green)(str(sev_global))} / 10")

    zlp = 0.0
    if yes_no("\n¿Tomaste Zolpidem la noche anterior?"):
        zlp = 1.0

    nota = input("\n  Nota breve (opcional, Enter para omitir): ").strip()

    row = {
        "date":               entry_date,
        "schema_version":     "DIARY_v3",
        "severidad_global":   sev_global,
        "fatiga":             fatiga,
        "pem":                pem,
        "niebla_mental":      niebla,
        "disfuncion_autonomica": auto if auto is not None else "",
        "dolor":              dolor if dolor is not None else "",
        "zolpidem":           zlp,
        "nota":               nota,
    }

    rows[entry_date] = row
    save_diary(rows)
    print(green(f"\n  ✓ Entrada guardada: {DIARY_CSV.name}"))

    # ── 48h prediction ────────────────────────────────────────────────────────
    polar_s = load_polar_series()
    tomorrow = (datetime.strptime(entry_date, "%Y-%m-%d") + timedelta(days=1)).strftime("%Y-%m-%d")
    day_after = (datetime.strptime(entry_date, "%Y-%m-%d") + timedelta(days=2)).strftime("%Y-%m-%d")

    print(f"\n{bold('─── Predicción 48h ───────────────────────────────')}")
    pred = predict_48h(polar_s, day_after)
    if pred:
        prob = pred["prob_bad_day"]
        risk_label = red("ALTO ▲") if prob >= 0.55 else (yellow("MODERADO") if prob >= 0.4 else green("BAJO ▼"))
        print(f"  Datos Polar usados: ANS(t-2)={pred['ans_t2']}  HRV(t-2)={pred['hrv_t2']}ms  Rec(t-1)={pred['rec_t1']}")
        print(f"  Probabilidad día malo (sev≥7) en {day_after}: {bold(str(round(prob*100,1))+'%')}  →  Riesgo {risk_label}")
        print(dim(f"  Modelo: LogReg LOO-CV · AUC={MODEL_AUC} · Sens={MODEL_SENSITIVITY} · n={MODEL_N}"))
        print(dim(f"  ⚠  Predicción N=1 idiográfica. No sustituye criterio clínico."))
    else:
        print(dim(f"  Sin datos Polar para lag-2 ({tomorrow}). Predicción no disponible."))
        print(dim(f"  Polar data actual hasta: {max(polar_s.keys()) if polar_s else 'sin datos'}"))

    # ── History summary ───────────────────────────────────────────────────────
    recent = sorted([r for r in rows.values()], key=lambda r: r["date"])[-7:]
    n_bad  = sum(1 for r in recent if r.get("severidad_global") and float(r["severidad_global"]) >= 7)
    print(f"\n{bold('─── Últimos 7 días ───────────────────────────────')}")
    print(f"  Días malos (sev≥7): {(red if n_bad >= 3 else yellow if n_bad >= 1 else green)(str(n_bad))}/7")
    for r in recent:
        sev_v = float(r.get("severidad_global","0") or 0)
        bar   = "█" * int(sev_v) + "░" * (10 - int(sev_v))
        col   = red if sev_v >= 7 else yellow if sev_v >= 4 else green
        print(f"  {r['date']}  {col(bar)}  {sev_v:.1f}")

    # ── Git push ──────────────────────────────────────────────────────────────
    if args.push:
        print(f"\n{bold('─── Git push ─────────────────────────────────────')}")
        git_push(entry_date)
    else:
        print(f"\n{dim('  Para publicar: python scripts/log_diary.py --push')}")
        print(f"{dim('  O manualmente: git add data/diary_live.csv && git commit -m \"diary: síntomas {entry_date}\" && git push')}")

    print()


if __name__ == "__main__":
    main()
