// Sample data for standalone EDS preview (no bridge).
// In production, data comes dynamically from bridge.toolResult.
const SAMPLE_DATA = [
  { title: 'Whole body health starts with oral health.', source: 'https://www.sunstargum.com/us-en/', score: 3.356 },
  { title: 'Elevate Your Gum Health with GUM®', source: 'https://www.sunstargum.com/ca-en/', score: 3.325 },
  { title: 'Clean Between To Start Your Oral Care Routine', source: 'https://www.sunstargum.com/gb-en/', score: 3.285 }
];

// Brand palette from BuildWidgetRequest — used to derive card background.
const PALETTE = ['#009257', '#2cb573'];

// Darkens palette[0] to luminance ≤ 0.12 so white text has WCAG AA contrast.
function getThemedCardBg(palette) {
  if (!palette || !palette[0]) return null;
  let hex = palette[0].replace('#', '');
  if (hex.length === 3) hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
  if (hex.length !== 6) return null;
  let [r, g, b] = [parseInt(hex.slice(0, 2), 16), parseInt(hex.slice(2, 4), 16), parseInt(hex.slice(4, 6), 16)];
  if (isNaN(r) || isNaN(g) || isNaN(b)) return null;
  const lum = (c) => { const s = c / 255; return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4); };
  const relLum = (r, g, b) => 0.2126 * lum(r) + 0.7152 * lum(g) + 0.0722 * lum(b);
  if (relLum(r, g, b) <= 0.12) return { bg: `#${hex}`, fg: '#ffffff' };
  let lo = 0, hi = 1;
  for (let i = 0; i < 20; i++) {
    const mid = (lo + hi) / 2;
    if (relLum(Math.round(r * mid), Math.round(g * mid), Math.round(b * mid)) > 0.12) hi = mid; else lo = mid;
  }
  const dr = Math.round(r * lo), dg = Math.round(g * lo), db = Math.round(b * lo);
  return {
    bg: `#${dr.toString(16).padStart(2, '0')}${dg.toString(16).padStart(2, '0')}${db.toString(16).padStart(2, '0')}`,
    fg: '#ffffff'
  };
}

const theme = getThemedCardBg(PALETTE);

export default async function decorate(block, bridge) {
  let results;

  if (bridge) {
    bridge.applyHostStyles();
    const isPreview = bridge.hostContext?.preview === true;
    if (isPreview) {
      results = SAMPLE_DATA;
    } else {
      const _result = await bridge.toolResult;
      const structuredContent = _result?.structuredContent || _result;
      // structuredContent.results — bare array outputSchema; key derived from actionName "search"
      results = structuredContent?.results || [];
    }
  } else {
    results = SAMPLE_DATA;
  }

  block.textContent = '';

  if (!results || results.length === 0) {
    renderEmptyState(block);
  } else {
    renderResults(block, results, bridge);
  }

  if (bridge) {
    bridge.reportSize(block.offsetWidth, block.offsetHeight);
    let resizeTimer;
    const ro = new ResizeObserver(() => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => bridge.reportSize(block.offsetWidth, block.offsetHeight), 150);
    });
    ro.observe(block);
  }
}

function renderEmptyState(block) {
  const card = document.createElement('div');
  card.className = 'search-results-empty';
  card.style.cssText = `background:${theme?.bg ?? '#1a3a5c'};color:${theme?.fg ?? '#fff'}`;

  const icon = document.createElement('div');
  icon.className = 'search-icon';
  icon.innerHTML = '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>';
  card.appendChild(icon);

  const heading = document.createElement('h2');
  heading.textContent = 'No results found';
  card.appendChild(heading);

  block.appendChild(card);
}

function renderResults(block, results, bridge) {
  const container = document.createElement('div');
  container.className = 'search-results-list';

  results.slice(0, 5).forEach((result) => {
    const card = document.createElement('div');
    card.className = 'result-card';
    card.style.cssText = `background:${theme?.bg ?? '#1a3a5c'};color:${theme?.fg ?? '#fff'}`;

    const title = document.createElement('h3');
    title.className = 'result-title';
    title.textContent = result.title || result.source || 'Untitled';
    card.appendChild(title);

    if (result.source) {
      const source = document.createElement('p');
      source.className = 'result-source';
      source.textContent = result.source;
      card.appendChild(source);
    }

    if (typeof result.score === 'number') {
      const score = document.createElement('span');
      score.className = 'result-score';
      score.textContent = `Score: ${result.score.toFixed(2)}`;
      card.appendChild(score);
    }

    if (result.source) {
      const link = document.createElement('a');
      link.className = 'result-link';
      link.href = result.source;
      link.textContent = 'View page';
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      if (bridge) {
        link.addEventListener('click', (e) => {
          e.preventDefault();
          bridge.openLink(result.source);
        });
      }
      card.appendChild(link);
    }

    container.appendChild(card);
  });

  block.appendChild(container);
}
