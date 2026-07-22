// Sample data for standalone EDS preview (no bridge).
// In production, data comes dynamically from bridge.toolResult.
const SAMPLE_DATA = {
  query: 'sensitive teeth routine',
  result: 'Your personalized GUM sensitive teeth routine\nUltra-soft toothbrush for gentle yet effective plaque removal\nSensitivity toothpaste to help relieve discomfort and strengthen enamel\nAlcohol-free mouthwash to soothe and protect sensitive teeth and gums\nInterdental cleaners for a more complete clean where toothbrushes can’t reach',
};

// Same hero image is used for every result — a static asset, not per-result data.
const HERO_IMAGE = new URL('./assets/hero.webp', import.meta.url).href;

// Brand palette from BuildWidgetRequest — used to derive card background.
const PALETTE = ['#009257', '#2cb573'];

// Darkens palette[0] to luminance ≤ 0.12 so white text has WCAG AA contrast.
function getThemedCardBg(palette) {
  if (!palette || !palette[0]) return null;
  let hex = palette[0].replace('#', '');
  if (hex.length === 3) hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
  if (hex.length !== 6) return null;
  const [r, g, b] = [parseInt(hex.slice(0, 2), 16), parseInt(hex.slice(2, 4), 16), parseInt(hex.slice(4, 6), 16)];
  if (isNaN(r) || isNaN(g) || isNaN(b)) return null;
  const lum = (c) => { const s = c / 255; return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4; };
  const relLum = (r, g, b) => 0.2126 * lum(r) + 0.7152 * lum(g) + 0.0722 * lum(b);
  if (relLum(r, g, b) <= 0.12) return { bg: `#${hex}`, fg: '#ffffff' };
  let lo = 0; let
    hi = 1;
  for (let i = 0; i < 20; i++) {
    const mid = (lo + hi) / 2;
    if (relLum(Math.round(r * mid), Math.round(g * mid), Math.round(b * mid)) > 0.12) hi = mid; else lo = mid;
  }
  const dr = Math.round(r * lo); const dg = Math.round(g * lo); const
    db = Math.round(b * lo);
  return {
    bg: `#${dr.toString(16).padStart(2, '0')}${dg.toString(16).padStart(2, '0')}${db.toString(16).padStart(2, '0')}`,
    fg: '#ffffff',
  };
}

const theme = getThemedCardBg(PALETTE);

// Splits a gensearch answer into a lead-in title and bullet items. Gensearch
// returns free-form text (often "title line" followed by itemized points on
// their own lines); this has no guaranteed structure, so a single-line/single-
// paragraph answer (no itemized points) falls back to plain prose instead of
// being misread as one bullet.
function parseAnswer(text) {
  if (!text) return { title: '', bullets: [] };
  const lines = text
    .split('\n')
    .map((l) => l.replace(/^[-*•]\s*/, '').trim())
    .filter(Boolean);

  if (lines.length <= 1) {
    return { title: '', bullets: [] };
  }

  const [first, ...rest] = lines;
  return { title: first, bullets: rest };
}

export default async function decorate(block, bridge) {
  let data;

  if (bridge) {
    bridge.applyHostStyles();
    const isPreview = bridge.hostContext?.preview === true;
    if (isPreview) {
      data = SAMPLE_DATA;
    } else {
      const _result = await bridge.toolResult;
      const structuredContent = _result?.structuredContent || _result;
      data = structuredContent;
    }
  } else {
    data = SAMPLE_DATA;
  }

  block.textContent = '';

  if (!data || !data.result) {
    renderEmptyState(block);
  } else {
    renderAnswer(block, data, bridge);
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

function renderHero(card) {
  const heroContainer = document.createElement('div');
  heroContainer.className = 'search-results-hero';

  const img = document.createElement('img');
  img.src = HERO_IMAGE;
  img.alt = '';
  heroContainer.appendChild(img);

  card.appendChild(heroContainer);
}

function renderEmptyState(block) {
  const card = document.createElement('div');
  card.className = 'search-results-card';

  renderHero(card);

  const content = document.createElement('div');
  content.className = 'search-results-content';

  const icon = document.createElement('div');
  icon.className = 'search-icon';
  icon.innerHTML = '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>';
  content.appendChild(icon);

  const heading = document.createElement('h2');
  heading.textContent = 'No results found';
  content.appendChild(heading);

  card.appendChild(content);
  block.appendChild(card);
}

function renderAnswer(block, data, bridge) {
  const { result: resultText, query } = data;
  const { title, bullets } = parseAnswer(resultText);

  const card = document.createElement('div');
  card.className = 'search-results-card';
  card.style.setProperty('--card-bg', theme?.bg ?? '#1a3a5c');
  card.style.setProperty('--card-fg', theme?.fg ?? '#fff');

  renderHero(card);

  const content = document.createElement('div');
  content.className = 'search-results-content';

  const heading = document.createElement('h2');
  heading.className = 'search-results-title';
  heading.textContent = title || 'Search results';
  content.appendChild(heading);

  if (bullets.length > 0) {
    const list = document.createElement('ul');
    list.className = 'search-results-answer-list';

    bullets.forEach((line) => {
      const item = document.createElement('li');

      const icon = document.createElement('span');
      icon.className = 'answer-item-icon';
      icon.innerHTML = '<svg width="16" height="16" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="9" stroke="currentColor" stroke-width="1.5"/><path d="M6 10l2.5 2.5L14 7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
      item.appendChild(icon);

      const text = document.createElement('span');
      text.className = 'answer-item-text';
      text.textContent = line;
      item.appendChild(text);

      list.appendChild(item);
    });

    content.appendChild(list);
  } else if (!title) {
    const paragraph = document.createElement('p');
    paragraph.className = 'search-results-answer-text';
    paragraph.textContent = resultText;
    content.appendChild(paragraph);
  }

  // "Continue on the website" — only shown inside a host bridge (a standalone
  // EDS preview has no host to open an external link through). Mirrors the
  // "Open in Audience Of 1" button on get-product-details: same destination,
  // same ?q= intent param, no token/redeem — the intent travels in the URL.
  if (bridge) {
    const intent = query || title || 'search results';

    const openExternalUrl = async (url) => {
      // eslint-disable-next-line no-console
      console.log('[of1] opening', url);
      if (typeof window !== 'undefined' && typeof window.openai?.openExternal === 'function') {
        window.openai.openExternal({ href: url });
      } else if (typeof bridge.openLink === 'function') {
        await bridge.openLink(url);
      } else {
        window.open(url, '_blank', 'noopener');
      }
    };

    const continueBtn = document.createElement('button');
    continueBtn.className = 'continue-btn';
    continueBtn.textContent = 'Continue on the website';
    continueBtn.setAttribute('aria-label', 'Continue this search on the website');
    continueBtn.addEventListener('click', async () => {
      continueBtn.disabled = true;
      const original = continueBtn.textContent;
      continueBtn.textContent = 'Opening…';
      try {
        const base = 'https://main--of1-acc28ccf--of1-labs.aem.page/of1';
        await openExternalUrl(`${base}?q=${encodeURIComponent(intent)}`);
        continueBtn.textContent = 'Opening…';
        setTimeout(() => { continueBtn.textContent = original; }, 1500);
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error('[of1] failed:', e);
        continueBtn.textContent = original;
      } finally {
        continueBtn.disabled = false;
      }
    });
    content.appendChild(continueBtn);
  }

  card.appendChild(content);
  block.appendChild(card);
}
