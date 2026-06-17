// Sample data for standalone/preview mode.
// In production, data comes dynamically from bridge.toolResult.
const SAMPLE_DATA = [
  { name: 'Boots UK', address: 'https://www.boots.com', type: 'online' },
  { name: 'Superdrug', address: 'https://www.superdrug.com', type: 'online' },
  { name: 'Tesco Pharmacy', address: 'https://www.tesco.com/pharmacy', type: 'online' },
  { name: 'Lloyds Pharmacy', address: '123 High Street, London', type: 'in_store' },
  { name: 'Well Pharmacy', address: '456 Main Road, Manchester', type: 'in_store' },
];

// Brand palette from BuildWidgetRequest — used to derive card background.
const PALETTE = ['#e30613', '#00a0af', '#ffffff'];

function getThemedCardBg(palette) {
  if (!palette || !palette[0]) return null;
  let hex = palette[0].replace('#', '');
  if (hex.length === 3) hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
  if (hex.length !== 6) return null;
  const [r, g, b] = [parseInt(hex.slice(0, 2), 16), parseInt(hex.slice(2, 4), 16), parseInt(hex.slice(4, 6), 16)];
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
  card.className = 'empty-state-card';
  card.style.cssText = `background:${theme?.bg ?? '#1a3a5c'};color:${theme?.fg ?? '#fff'}`;

  const icon = document.createElement('div');
  icon.className = 'pin-icon';
  icon.innerHTML = `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
    <circle cx="12" cy="10" r="3"></circle>
  </svg>`;
  card.appendChild(icon);

  const heading = document.createElement('h2');
  heading.textContent = 'Find a store near you';
  card.appendChild(heading);

  const input = document.createElement('input');
  input.type = 'text';
  input.placeholder = 'Enter ZIP code...';
  input.className = 'zip-input';
  card.appendChild(input);

  const btn = document.createElement('button');
  btn.className = 'search-btn';
  btn.textContent = 'Search';
  if (bridge) {
    btn.addEventListener('click', () => {
      const zip = input.value.trim();
      if (zip) {
        bridge.sendMessage(`Find retailers near ${zip}`);
      }
    });
    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        const zip = input.value.trim();
        if (zip) {
          bridge.sendMessage(`Find retailers near ${zip}`);
        }
      }
    });
  }
  card.appendChild(btn);

  block.appendChild(card);
}

function renderRetailers(block, retailers, bridge) {
  // Group by type: online first, then in-store
  const online = retailers.filter(r => r.type === 'online');
  const inStore = retailers.filter(r => r.type === 'in_store');
  const sorted = [...online, ...inStore];

  const container = document.createElement('div');
  container.className = 'retailers-container';

  // Show up to 2 cards in the row
  sorted.slice(0, 2).forEach((retailer) => {
    const card = document.createElement('div');
    card.className = 'retailer-card';
    card.style.cssText = `background:${theme?.bg ?? '#1a3a5c'};color:${theme?.fg ?? '#fff'}`;

    const pinCircle = document.createElement('div');
    pinCircle.className = 'pin-circle';
    pinCircle.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
      <circle cx="12" cy="10" r="3"></circle>
    </svg>`;
    card.appendChild(pinCircle);

    const name = document.createElement('div');
    name.className = 'retailer-name';
    name.textContent = retailer.name;
    card.appendChild(name);

    const address = document.createElement('div');
    address.className = 'retailer-address';
    address.textContent = retailer.address;
    card.appendChild(address);

    if (retailer.type === 'online') {
      const btn = document.createElement('button');
      btn.className = 'shop-btn';
      btn.textContent = 'Shop Now';
      if (bridge) {
        btn.addEventListener('click', () => {
          if (retailer.address.startsWith('http')) {
            bridge.openLink(retailer.address);
          } else {
            bridge.sendMessage(`I'd like to visit ${retailer.name}`);
          }
        });
      } else {
        btn.addEventListener('click', () => {
          if (retailer.address.startsWith('http')) {
            window.open(retailer.address, '_blank');
          }
        });
      }
      card.appendChild(btn);
    }

    container.appendChild(card);
  });

  block.appendChild(container);
}
