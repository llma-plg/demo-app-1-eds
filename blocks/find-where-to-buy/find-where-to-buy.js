// Sample data for standalone/preview mode.
// In production, data comes dynamically from bridge.toolResult.
const SAMPLE_DATA = [
  { retailer_name: 'Amazon', url: 'https://www.amazon.com/s?k=GUM+oral+care', type: 'online' },
  { retailer_name: 'Walmart', url: 'https://www.walmart.com/search?q=GUM+oral+care', type: 'online' },
  { retailer_name: 'Walgreens', url: 'https://www.walgreens.com/q/gum+oral+care', type: 'in-store' },
  { retailer_name: 'CVS Pharmacy', url: 'https://www.cvs.com/search?searchTerm=GUM', type: 'in-store' },
];

// Brand palette from BuildWidgetRequest.
const PALETTE = ['#00a3e0', '#0072ce', '#ffffff'];

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
  return { bg: `#${dr.toString(16).padStart(2, '0')}${dg.toString(16).padStart(2, '0')}${db.toString(16).padStart(2, '0')}`, fg: '#ffffff' };
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
  const container = document.createElement('div');
  container.className = 'retailers-container';

  if (!retailers || retailers.length === 0) {
    // Empty state
    const emptyCard = document.createElement('div');
    emptyCard.className = 'empty-state-card';
    emptyCard.style.cssText = `background:${theme?.bg ?? '#1a3a5c'};color:${theme?.fg ?? '#fff'}`;

    const icon = document.createElement('div');
    icon.className = 'pin-icon';
    icon.innerHTML = '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>';
    emptyCard.appendChild(icon);

    const heading = document.createElement('h3');
    heading.textContent = 'Find Where to Buy';
    emptyCard.appendChild(heading);

    const desc = document.createElement('p');
    desc.textContent = 'Check major retailers like Amazon, Walmart, Walgreens, and CVS for GUM oral care products.';
    emptyCard.appendChild(desc);

    container.appendChild(emptyCard);
  } else {
    // Retailer grid
    const grid = document.createElement('div');
    grid.className = 'retailers-grid';

    retailers.slice(0, 4).forEach((retailer, index) => {
      const card = document.createElement('div');
      card.className = 'retailer-card';
      card.style.cssText = `background:${theme?.bg ?? '#1a3a5c'};color:${theme?.fg ?? '#fff'}`;

      const pinCircle = document.createElement('div');
      pinCircle.className = 'pin-circle';
      pinCircle.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>';
      card.appendChild(pinCircle);

      const name = document.createElement('div');
      name.className = 'retailer-name';
      name.textContent = retailer.retailer_name || retailer.name || 'Retailer';
      card.appendChild(name);

      if (retailer.type) {
        const typeLabel = document.createElement('div');
        typeLabel.className = 'retailer-type';
        typeLabel.textContent = retailer.type;
        card.appendChild(typeLabel);
      }

      const button = document.createElement('a');
      button.className = 'shop-button';
      button.href = retailer.url || '#';
      button.target = '_blank';
      button.rel = 'noopener noreferrer';
      button.textContent = 'Shop Now';
      if (bridge) {
        button.addEventListener('click', (e) => {
          e.preventDefault();
          bridge.openLink(retailer.url);
        });
      }
      card.appendChild(button);

      grid.appendChild(card);
    });

    container.appendChild(grid);
  }

  block.appendChild(container);
}