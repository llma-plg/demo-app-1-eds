// Sample data for standalone/preview mode.
// In production, data comes dynamically from bridge.toolResult.
const SAMPLE_DATA = [
  { name: 'Amazon', url: 'https://www.amazon.com/stores/GUM/page/12345', type: 'online' },
  { name: 'Walmart', url: 'https://www.walmart.com/browse/gum-oral-care', type: 'grocery' },
  { name: 'CVS Pharmacy', url: 'https://www.cvs.com/shop/gum', type: 'pharmacy' },
  { name: 'Walgreens', url: 'https://www.walgreens.com/store/c/gum', type: 'pharmacy' },
  { name: 'Kroger', url: 'https://www.kroger.com/search?query=gum', type: 'grocery' },
];

// Brand palette from BuildWidgetRequest — used to derive card background.
const PALETTE = ['#231f20','#464c4e','#009257','#2cb573','#64656a'];

function getThemedCardBg(palette) {
  if (!palette || !palette[0]) return null;
  let hex = palette[0].replace('#', '');
  if (hex.length === 3) hex = hex[0]+hex[0]+hex[1]+hex[1]+hex[2]+hex[2];
  if (hex.length !== 6) return null;
  let [r, g, b] = [parseInt(hex.slice(0,2),16), parseInt(hex.slice(2,4),16), parseInt(hex.slice(4,6),16)];
  if (isNaN(r) || isNaN(g) || isNaN(b)) return null;
  const lum = (c) => { const s=c/255; return s<=0.03928?s/12.92:Math.pow((s+0.055)/1.055,2.4); };
  const relLum = (r,g,b) => 0.2126*lum(r)+0.7152*lum(g)+0.0722*lum(b);
  if (relLum(r,g,b) <= 0.12) return { bg: `#${hex}`, fg: '#ffffff' };
  let lo=0, hi=1;
  for (let i=0; i<20; i++) {
    const m=(lo+hi)/2;
    if (relLum(Math.round(r*m),Math.round(g*m),Math.round(b*m)) > 0.12) hi=m; else lo=m;
  }
  const dr=Math.round(r*lo), dg=Math.round(g*lo), db=Math.round(b*lo);
  return {
    bg:`#${dr.toString(16).padStart(2,'0')}${dg.toString(16).padStart(2,'0')}${db.toString(16).padStart(2,'0')}`,
    fg:'#ffffff'
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

  // Heading
  const heading = document.createElement('h2');
  heading.className = 'retailers-heading';
  heading.textContent = 'Where to Buy GUM® Products';
  container.appendChild(heading);

  // Grid of retailer cards
  const grid = document.createElement('div');
  grid.className = 'retailers-grid';

  retailers.forEach((retailer) => {
    const card = document.createElement('div');
    card.className = 'retailer-card';
    card.style.cssText = `background:${theme?.bg ?? '#1a3a5c'};color:${theme?.fg ?? '#fff'}`;

    // Pin icon container
    const pinIcon = document.createElement('div');
    pinIcon.className = 'pin-icon';
    pinIcon.setAttribute('aria-hidden', 'true');
    pinIcon.style.cssText = `background:rgba(255,255,255,0.2);color:${theme?.fg ?? '#fff'}`;
    pinIcon.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
        <circle cx="12" cy="10" r="3"></circle>
      </svg>
    `;
    card.appendChild(pinIcon);

    // Retailer name
    const name = document.createElement('div');
    name.className = 'retailer-name';
    name.textContent = retailer.name;
    card.appendChild(name);

    // Type badge
    if (retailer.type) {
      const badge = document.createElement('div');
      badge.className = 'retailer-type';
      badge.textContent = retailer.type;
      card.appendChild(badge);
    }

    // CTA button
    const btn = document.createElement('button');
    btn.className = 'shop-btn';
    btn.textContent = 'Shop Now';
    btn.setAttribute('aria-label', `Shop ${retailer.name}`);

    if (bridge) {
      btn.addEventListener('click', () => {
        if (retailer.url) {
          bridge.openLink(retailer.url);
        } else {
          bridge.sendMessage(`Show me GUM products at ${retailer.name}`);
        }
      });
    } else if (retailer.url) {
      btn.addEventListener('click', () => {
        window.open(retailer.url, '_blank', 'noopener,noreferrer');
      });
    }

    card.appendChild(btn);
    grid.appendChild(card);
  });

  container.appendChild(grid);
  block.appendChild(container);
}
