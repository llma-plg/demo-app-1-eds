// Sample data for standalone/preview mode.
// In production, data comes dynamically from bridge.toolResult.
const SAMPLE_DATA = [
  { name: 'Amazon', url: 'https://www.amazon.com/stores/page/GUM', type: 'Online' },
  { name: 'Walmart', url: 'https://www.walmart.com/browse/gum-oral-care', type: 'Online & In-Store' },
  { name: 'Target', url: 'https://www.target.com/s?searchTerm=gum+oral+care', type: 'Online & In-Store' },
  { name: 'CVS Pharmacy', url: 'https://www.cvs.com/shop/gum-oral-care', type: 'Online & In-Store' },
  { name: 'Walgreens', url: 'https://www.walgreens.com/q/gum+oral+care', type: 'Online & In-Store' },
  { name: 'Rite Aid', url: 'https://www.riteaid.com/shop/gum-products', type: 'In-Store' }
];

// Brand palette from BuildWidgetRequest — used to derive card background.
const PALETTE = ['#009257', '#2cb573'];

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
  let retailers;

  if (bridge) {
    bridge.applyHostStyles();
    const isPreview = bridge.hostContext?.preview === true;
    if (isPreview) {
      retailers = SAMPLE_DATA;
    } else {
      const _result = await bridge.toolResult;
      const structuredContent = _result?.structuredContent || _result;
      // structuredContent.retailers — bare array outputSchema; key derived from actionName "find_retailer"
      retailers = structuredContent?.retailers || [];
    }
  } else {
    retailers = SAMPLE_DATA;
  }

  block.textContent = '';
  
  if (!retailers || retailers.length === 0) {
    renderEmptyState(block, bridge);
  } else {
    renderRetailers(block, retailers, bridge);
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

function renderEmptyState(block, bridge) {
  const card = document.createElement('div');
  card.className = 'search-card';
  card.style.cssText = `background: ${theme?.bg ?? '#1a3a5c'}; color: ${theme?.fg ?? '#fff'}`;

  const pinIcon = document.createElement('div');
  pinIcon.className = 'pin-icon';
  pinIcon.textContent = '📍';
  pinIcon.style.color = theme?.fg ?? '#fff';
  card.appendChild(pinIcon);

  const heading = document.createElement('h2');
  heading.textContent = 'Find Where to Buy';
  heading.style.color = theme?.fg ?? '#fff';
  card.appendChild(heading);

  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'search-input';
  input.placeholder = 'Enter ZIP code...';
  card.appendChild(input);

  const button = document.createElement('button');
  button.className = 'search-btn';
  button.textContent = 'Search';
  if (bridge) {
    button.addEventListener('click', () => {
      const zip = input.value.trim();
      if (zip) {
        bridge.sendMessage(`Find GUM retailers near ${zip}`);
      }
    });
  }
  card.appendChild(button);

  block.appendChild(card);
}

function renderRetailers(block, retailers, bridge) {
  const container = document.createElement('div');
  container.className = 'retailers-container';

  // Show up to 6 retailers, max 2 per row
  const displayRetailers = retailers.slice(0, 6);

  displayRetailers.forEach((retailer) => {
    const card = document.createElement('div');
    card.className = 'retailer-card';
    card.style.cssText = `background: ${theme?.bg ?? '#1a3a5c'}; color: ${theme?.fg ?? '#fff'}`;

    const pinCircle = document.createElement('div');
    pinCircle.className = 'pin-circle';
    pinCircle.textContent = '📍';
    card.appendChild(pinCircle);

    const name = document.createElement('h3');
    name.className = 'retailer-name';
    name.textContent = retailer.name || 'Retailer';
    name.style.color = theme?.fg ?? '#fff';
    card.appendChild(name);

    if (retailer.type) {
      const type = document.createElement('p');
      type.className = 'retailer-type';
      type.textContent = retailer.type;
      type.style.color = theme?.fg ?? '#fff';
      card.appendChild(type);
    }

    if (retailer.url) {
      const link = document.createElement('a');
      link.className = 'retailer-link';
      link.href = retailer.url;
      link.textContent = 'Visit Store';
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      card.appendChild(link);
    }

    const shopBtn = document.createElement('button');
    shopBtn.className = 'shop-btn';
    shopBtn.textContent = 'Shop Now';
    if (bridge && retailer.url) {
      shopBtn.addEventListener('click', () => {
        bridge.openLink(retailer.url);
      });
    } else if (retailer.url) {
      shopBtn.addEventListener('click', () => {
        window.open(retailer.url, '_blank', 'noopener,noreferrer');
      });
    }
    card.appendChild(shopBtn);

    container.appendChild(card);
  });

  block.appendChild(container);
}