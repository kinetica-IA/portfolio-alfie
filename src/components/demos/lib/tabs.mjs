// ARIA tabs: pure key handling plus a small progressive enhancement.
// Without JS every panel stays visible with an index of anchor links.

/** New index for a key press, or null when the key is not handled. */
export function nextTabIndex(key, current, count) {
  if (count <= 0) return null
  switch (key) {
    case 'ArrowRight':
    case 'ArrowDown':
      return (current + 1) % count
    case 'ArrowLeft':
    case 'ArrowUp':
      return (current - 1 + count) % count
    case 'Home':
      return 0
    case 'End':
      return count - 1
    default:
      return null
  }
}

/**
 * Upgrades a root that contains:
 *   [data-tabs-index]  anchor index shown without JS (hidden once enhanced)
 *   [data-tablist]     element rendered with `hidden`, containing [role=tab] buttons
 *   [data-tabpanel]    panels, in the same order as the tabs
 * Idempotent: safe to call on every astro:page-load.
 */
export function enhanceTabs(root, { initial = 0, onChange } = {}) {
  if (!root || root.dataset.tabsEnhanced === 'true') return null
  const tablist = root.querySelector('[data-tablist]')
  const tabs = Array.from(root.querySelectorAll('[data-tablist] [role="tab"]'))
  const panels = Array.from(root.querySelectorAll('[data-tabpanel]'))
  if (!tablist || tabs.length === 0 || tabs.length !== panels.length) return null
  root.dataset.tabsEnhanced = 'true'

  const index = root.querySelector('[data-tabs-index]')
  if (index) index.hidden = true
  tablist.hidden = false

  panels.forEach((panel, i) => {
    panel.setAttribute('role', 'tabpanel')
    panel.setAttribute('aria-labelledby', tabs[i].id)
    panel.setAttribute('tabindex', '0')
  })

  const select = (i, focus) => {
    tabs.forEach((tab, j) => {
      const on = i === j
      tab.setAttribute('aria-selected', on ? 'true' : 'false')
      tab.tabIndex = on ? 0 : -1
      panels[j].hidden = !on
    })
    if (focus) tabs[i].focus()
    if (onChange) onChange(i)
  }

  tabs.forEach((tab, i) => {
    tab.addEventListener('click', () => select(i, false))
    tab.addEventListener('keydown', (event) => {
      const next = nextTabIndex(event.key, i, tabs.length)
      if (next === null) return
      event.preventDefault()
      select(next, true)
    })
  })

  select(Math.min(Math.max(initial, 0), tabs.length - 1), false)
  return { select, tabs, panels }
}
