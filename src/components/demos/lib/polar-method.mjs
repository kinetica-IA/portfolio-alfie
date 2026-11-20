// Pure functions for the Polar method view (LOCAL, synthetic data).
// They only decide which synthetic days count as training, evaluated or unused.
// No model is trained, fitted or evaluated here.

/** Valid evaluated days (1-based) for an expanding history with `minTrain` observations. */
export function evalRange(nDays, minTrain, lag) {
  // lag 0 pairs label(d) with signal(d), d = 1..n; lag 1 pairs label(d) with signal(d-1), d = 2..n.
  return { min: minTrain + 1 + lag, max: nDays }
}

export function clampEvalDay(day, range) {
  const d = Math.round(Number(day))
  if (!Number.isFinite(d)) return range.min
  return Math.min(range.max, Math.max(range.min, d))
}

/**
 * Role of every signal cell and every label cell when `evalDay` is evaluated.
 * Roles: 'train' (in the training history), 'eval' (the one evaluated observation),
 * 'unused' (never used for this evaluation: later days and, with lag 1, the same-day signal),
 * 'unpaired' (label with no signal before it).
 */
export function cellRoles(nDays, lag, evalDay) {
  const signal = []
  const label = []
  for (let d = 1; d <= nDays; d++) {
    if (lag === 0) {
      const r = d < evalDay ? 'train' : d === evalDay ? 'eval' : 'unused'
      signal.push(r)
      label.push(r)
    } else {
      label.push(d === 1 ? 'unpaired' : d < evalDay ? 'train' : d === evalDay ? 'eval' : 'unused')
      signal.push(d <= evalDay - 2 ? 'train' : d === evalDay - 1 ? 'eval' : 'unused')
    }
  }
  return { signal, label }
}

/** Training observations and class counts before `evalDay`. `days` = [{day, signal, label}]. */
export function trainingStats(days, lag, evalDay) {
  const roles = cellRoles(days.length, lag, evalDay).label
  let positive = 0
  let negative = 0
  roles.forEach((r, i) => {
    if (r !== 'train') return
    if (days[i].label === 1) positive++
    else negative++
  })
  return { observations: positive + negative, positive, negative }
}

/** True when the fold would be skipped because a class has fewer than `minClass` examples. */
export function foldSkipped(stats, minClass) {
  return stats.positive < minClass || stats.negative < minClass
}

/** Text for aria-valuetext and the visible status line. */
export function valueText(evalDay, lag, stats) {
  const src = lag === 1 ? ` (signal from day ${evalDay - 1})` : ''
  return `Day ${evalDay}${src}: ${stats.observations} training observations`
}

const ROLE_TEXT = { train: 'training', eval: 'evaluated', unused: 'not used', unpaired: 'not paired' }
export function roleText(role) {
  return ROLE_TEXT[role] ?? role
}
