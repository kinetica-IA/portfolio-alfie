// Pure helpers for the Polar results view (SAVED aggregates from the public summary).

/**
 * Badges the saved numbers support. Rules:
 * - "Worse than baseline": model Brier score is higher (worse) than the reference Brier score.
 * - "Unstable": the evaluated minority class has fewer than `minClass` observations.
 */
export function badgesFor(result, minClass = 3) {
  const badges = []
  if (result.brier > result.reference_brier) {
    badges.push({ kind: 'worse', text: 'Worse than baseline' })
  }
  const minority = Math.min(result.evaluated_positive, result.evaluated_negative)
  if (minority < minClass) {
    const cls = result.evaluated_negative <= result.evaluated_positive ? 'negative' : 'positive'
    badges.push({ kind: 'unstable', text: `Unstable: ${minority} ${cls} observation${minority === 1 ? '' : 's'}` })
  }
  return badges
}

export function fmt(x, digits = 3) {
  return Number(x).toFixed(digits)
}
