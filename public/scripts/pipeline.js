/**
 * pipeline.js — runtime state loader for pipeline.html
 *
 * Fetches /data/pipeline_state.json and renders the Sankey overview
 * and per-level anatomy cards. No frameworks, no build step.
 * ES2020+ module.
 */

// ── Per-level chip/hover rgba values (hex palette → computed rgba) ─────────────
const LEVEL_RGBA = {
  L0: { chip: 'rgba(168,121,110,0.15)', hover: 'rgba(168,121,110,0.04)' },
  L1: { chip: 'rgba(196,133,90,0.15)',  hover: 'rgba(196,133,90,0.04)'  },
  L2: { chip: 'rgba(212,168,67,0.15)',  hover: 'rgba(212,168,67,0.04)'  },
  L3: { chip: 'rgba(107,138,109,0.15)', hover: 'rgba(107,138,109,0.04)' },
  L4: { chip: 'rgba(107,158,122,0.15)', hover: 'rgba(107,158,122,0.04)' },
  L5: { chip: 'rgba(93,138,130,0.15)',  hover: 'rgba(93,138,130,0.04)'  },
  L6: { chip: 'rgba(133,168,184,0.15)', hover: 'rgba(133,168,184,0.04)' },
};

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Return first metric value from a level's metrics dict. */
function primaryMetric(metrics) {
  const val = Object.values(metrics)[0];
  if (val === null || val === undefined) return '—';
  if (typeof val === 'number') return val.toLocaleString('en-GB');
  return String(val);
}

/** Return a short label for the primary metric. */
function primaryMetricLabel(level) {
  const labels = {
    L0: '1,025 files',
    L1: `${(level.metrics.rows_total ?? 0).toLocaleString('en-GB')} rows`,
    L2: `${level.metrics.nights_with_hrv ?? 0} nights`,
    L3: `${level.metrics.rows ?? 0} days`,
    L4: `${level.metrics.paired_days ?? 0} pairs`,
    L5: `AUC ${level.metrics.headline_auc ?? '—'}`,
    L6: `${level.metrics.polar_live_size_kb ?? 0} KB`,
  };
  return labels[level.level] ?? primaryMetric(level.metrics);
}

/** Format a metric value for the anatomy card. */
function formatValue(val) {
  if (val === null || val === undefined) return '—';
  if (typeof val === 'number') return val.toLocaleString('en-GB');
  return String(val);
}

/** Format a key name: snake_case → spaced words. */
function formatKey(key) {
  return key.replace(/_/g, ' ');
}

// ── Render: Sankey ─────────────────────────────────────────────────────────────

function renderSankey(levels) {
  const container = document.getElementById('sankey');
  if (!container) return;
  container.innerHTML = '';

  levels.forEach((level, i) => {
    // Node
    const node = document.createElement('div');
    node.className = 'sankey-node';
    const rgba = LEVEL_RGBA[level.level] ?? LEVEL_RGBA.L0;
    node.style.cssText = `--level-color:${level.color_hex};--chip-bg:${rgba.chip};`;

    node.innerHTML = `
      <div class="sankey-node__chip">${level.level}</div>
      <div class="sankey-node__name">${level.name}</div>
      <div class="sankey-node__metric">${primaryMetricLabel(level)}</div>
    `;

    // Hover tint via JS (CSS :hover can't do dynamic rgba from var)
    node.addEventListener('mouseenter', () => {
      node.style.background = rgba.hover;
    });
    node.addEventListener('mouseleave', () => {
      node.style.background = '';
    });

    container.appendChild(node);

    // Connector (not after last node)
    if (i < levels.length - 1) {
      const next = levels[i + 1];
      const connector = document.createElement('div');
      connector.className = 'sankey-connector';
      connector.style.background =
        `linear-gradient(90deg, ${level.color_hex}, ${next.color_hex})`;
      container.appendChild(connector);
    }
  });
}

// ── Render: Anatomy ───────────────────────────────────────────────────────────

function renderAnatomy(levels) {
  const container = document.getElementById('levels');
  if (!container) return;
  container.innerHTML = '';

  levels.forEach((level) => {
    const rgba = LEVEL_RGBA[level.level] ?? LEVEL_RGBA.L0;

    const article = document.createElement('article');
    article.className = 'level-card';
    article.style.cssText = `--level-color:${level.color_hex};--chip-bg:${rgba.chip};`;

    // Metrics list HTML
    const metricsHtml = Object.entries(level.metrics)
      .map(([k, v]) => `
        <li>
          <span class="key">${formatKey(k)}</span>
          <span class="value">${formatValue(v)}</span>
        </li>
      `)
      .join('');

    const statusClass = `level-card__status--${level.status}`;

    article.innerHTML = `
      <div class="level-card__chip">${level.level}</div>
      <h3 class="level-card__title">${level.name}</h3>
      <p class="level-card__description">${level.description}</p>
      <ul class="level-card__metrics">${metricsHtml}</ul>
      <span class="level-card__status ${statusClass}">${level.status}</span>
    `;

    // Hover tint
    article.addEventListener('mouseenter', () => {
      article.style.background = rgba.hover;
    });
    article.addEventListener('mouseleave', () => {
      article.style.background = '';
    });

    container.appendChild(article);
  });
}

// ── Main loader ───────────────────────────────────────────────────────────────

async function loadPipelineState() {
  const metaLine = document.getElementById('meta-line');

  try {
    const response = await fetch('/data/pipeline_state.json');
    if (!response.ok) {
      if (metaLine) metaLine.textContent = 'Could not load pipeline state.';
      return;
    }

    const state = await response.json();

    if (metaLine) {
      metaLine.textContent =
        `Last regenerated: ${new Date(state.generated_at).toLocaleString('en-GB')}`;
    }

    renderSankey(state.levels);
    renderAnatomy(state.levels);

  } catch (err) {
    if (metaLine) metaLine.textContent = 'Pipeline state unavailable.';
    console.warn('[pipeline.js] Failed to load pipeline_state.json:', err);
  }
}

document.addEventListener('DOMContentLoaded', loadPipelineState);
