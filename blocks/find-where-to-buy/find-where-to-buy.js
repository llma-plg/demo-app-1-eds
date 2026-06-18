// Sample data for standalone/preview mode.
// In production, data comes dynamically from bridge.toolResult.
const SAMPLE_DATA = [
  { name: 'Amazon', type: 'Online', url: 'https://www.amazon.com/stores/page/GUM' },
  { name: 'Walmart', type: 'Online & In-Store', url: 'https://www.walmart.com/browse/gum-products' },
  { name: 'CVS Pharmacy', type: 'Online & In-Store', url: 'https://www.cvs.com/shop/gum-oral-care' },
  { name: 'Walgreens', type: 'Online & In-Store', url: 'https://www.walgreens.com/q/gum+products' },
  { name: 'Target', type: 'Online & In-Store', url: 'https://www.target.com/s?searchTerm=gum+oral+care' },
  { name: 'Rite Aid', type: 'Online & In-Store', url: 'https://www.riteaid.com/shop/gum-oral-care' },
];

// Brand palette from BuildWidgetRequest — used to derive card background.
const PALETTE = ['#231f20', '#464c4e', '#009257', '#2cb573', '#64656a'];

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
    const m = (lo + hi) / 2;
    if (relLum(Math.round(r * m), Math.round(g * m), Math.round(b * m)) > 0.12) hi = m; else lo = m;
  }
  const dr = Math.round(r * lo), dg = Math.round(g * lo), db = Math.round(b * lo);
  return {
    bg: `#${dr.toString(16).padStart(2, '0')}${dg.toString(16).padStart(2, '0')}${db.toString(16).padStart(2, '0')}`,
    fg: '#ffffff'
  };
}

const theme = getThemedCardBg(PALETTE);

export default async function decorate(block, bridge) {
  let retailers;

  if (bridge) {
    bridge.applyHostStyles();
    const isPreview = bridge.hostContext?.preview === true;
    if (isPreview) {
      retailers = SAMPLE_DATA;
    } else {
      const _result = await bridge.toolResult;
      const structuredContent = _result?.structuredContent || _result;
      // structuredContent.retailers — bare array outputSchema; key derived from actionName "find_where_to_buy"
      retailers = structuredContent?.retailers || [];
    }
  } else {
    retailers = SAMPLE_DATA;
  }

  block.textContent = '';
  renderRetailers(block, retailers, bridge);

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

function renderRetailers(block, retailers, bridge) {
  if (!retailers || retailers.length === 0) {
    const emptyState = document.createElement('div');
    emptyState.className = 'empty-state';
    emptyState.style.cssText = `background:${theme?.bg ?? '#1a3a5c'};color:${theme?.fg ?? '#fff'}`;

    const icon = document.createElement('div');
    icon.className = 'pin-icon';
    icon.innerHTML = '📍';
    icon.style.cssText = `font-size:32px;opacity:0.7;color:${theme?.fg ?? '#fff'}`;
    emptyState.appendChild(icon);

    const heading = document.createElement('h2');
    heading.textContent = 'Find where to buy GUM products';
    heading.style.cssText = `font-size:15px;font-weight:600;margin:12px 0 8px;color:${theme?.fg ?? '#fff'}`;
    emptyState.appendChild(heading);

    const desc = document.createElement('p');
    desc.textContent = 'Discover online and in-store retailers carrying GUM oral care products.';
    desc.style.cssText = `font-size:13px;opacity:0.78;margin:0;color:${theme?.fg ?? '#fff'}`;
    emptyState.appendChild(desc);

    block.appendChild(emptyState);
    return;
  }

  const grid = document.createElement('div');
  grid.className = 'retailers-grid';

  retailers.forEach((retailer) => {
    const card = document.createElement('div');
    card.className = 'retailer-card';
    card.style.cssText = `background:${theme?.bg ?? '#1a3a5c'};`;

    const pinCircle = document.createElement('div');
    pinCircle.className = 'pin-circle';
    pinCircle.innerHTML = '📍';
    card.appendChild(pinCircle);

    const name = document.createElement('div');
    name.className = 'retailer-name';
    name.textContent = retailer.name || '';
    name.style.cssText = `color:${theme?.fg ?? '#fff'}`;
    card.appendChild(name);

    if (retailer.type) {
      const type = document.createElement('div');
      type.className = 'retailer-type';
      type.textContent = retailer.type;
      type.style.cssText = `color:${theme?.fg ?? '#fff'}`;
      card.appendChild(type);
    }

    const btn = document.createElement('button');
    btn.className = 'shop-btn';
    btn.textContent = 'Shop Now';
    btn.style.background = PALETTE[2] || '#009257';

    if (bridge && retailer.url) {
      btn.addEventListener('click', () => {
        bridge.openLink(retailer.url);
      });
    } else if (retailer.url) {
      btn.addEventListener('click', () => {
        window.open(retailer.url, '_blank', 'noopener,noreferrer');
      });
    }

    card.appendChild(btn);
    grid.appendChild(card);
  });

  block.appendChild(grid);
}
