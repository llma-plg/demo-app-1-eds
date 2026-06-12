// Sample data for standalone EDS preview (no bridge).
// In production, data comes dynamically from bridge.toolResult.
const SAMPLE_DATA = [
  { name: 'Boots', url: 'https://www.boots.com/gum-products', type: 'online' },
  { name: 'Superdrug', url: 'https://www.superdrug.com/gum-oral-care', type: 'online' },
  { name: 'Amazon UK', url: 'https://www.amazon.co.uk/gum', type: 'online' },
  { name: 'Tesco', url: 'https://www.tesco.com/groceries/gum', type: 'in-store' },
];

const PALETTE = [];

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
  return { bg:`#${dr.toString(16).padStart(2,'0')}${dg.toString(16).padStart(2,'0')}${db.toString(16).padStart(2,'0')}`, fg:'#ffffff' };
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
    icon.innerHTML = '📍';
    icon.style.cssText = `opacity:0.7;color:${theme?.fg ?? '#fff'}`;
    emptyCard.appendChild(icon);

    const heading = document.createElement('h2');
    heading.textContent = 'Where to Buy GUM Products';
    heading.style.cssText = `color:${theme?.fg ?? '#fff'}`;
    emptyCard.appendChild(heading);

    const description = document.createElement('p');
    description.textContent = 'Find GUM oral care products at leading retailers across the UK.';
    description.style.cssText = `color:${theme?.fg ?? '#fff'};opacity:0.85`;
    emptyCard.appendChild(description);

    const ctaBtn = document.createElement('a');
    ctaBtn.href = 'https://www.sunstargum.com/uk/where-to-buy.html';
    ctaBtn.target = '_blank';
    ctaBtn.rel = 'noopener noreferrer';
    ctaBtn.className = 'cta-button';
    ctaBtn.textContent = 'View All Retailers';
    emptyCard.appendChild(ctaBtn);

    container.appendChild(emptyCard);
  } else {
    // With results - show heading and retailer cards
    const heading = document.createElement('h2');
    heading.textContent = 'Where to Buy GUM Products';
    heading.className = 'retailers-heading';
    container.appendChild(heading);

    const cardsWrapper = document.createElement('div');
    cardsWrapper.className = 'retailers-grid';

    retailers.slice(0, 6).forEach((retailer, index) => {
      const card = document.createElement('div');
      card.className = 'retailer-card';
      card.style.cssText = `background:${theme?.bg ?? '#1a3a5c'};color:${theme?.fg ?? '#fff'}`;

      const pinCircle = document.createElement('div');
      pinCircle.className = 'pin-circle';
      pinCircle.innerHTML = '📍';
      card.appendChild(pinCircle);

      const cardContent = document.createElement('div');
      cardContent.className = 'card-content';

      const name = document.createElement('h3');
      name.textContent = retailer.name;
      name.style.cssText = `color:${theme?.fg ?? '#fff'}`;
      cardContent.appendChild(name);

      if (retailer.type) {
        const type = document.createElement('p');
        type.className = 'retailer-type';
        type.textContent = retailer.type === 'online' ? 'Online Store' : 'In-Store';
        type.style.cssText = `color:${theme?.fg ?? '#fff'};opacity:0.65`;
        cardContent.appendChild(type);
      }

      card.appendChild(cardContent);

      const shopBtn = document.createElement('a');
      shopBtn.href = retailer.url || '#';
      shopBtn.target = '_blank';
      shopBtn.rel = 'noopener noreferrer';
      shopBtn.className = 'shop-button';
      shopBtn.textContent = 'Shop Now';
      if (bridge && !retailer.url) {
        shopBtn.addEventListener('click', (e) => {
          e.preventDefault();
          bridge.sendMessage(`Tell me more about buying GUM products at ${retailer.name}`);
        });
      }
      card.appendChild(shopBtn);

      cardsWrapper.appendChild(card);
    });

    container.appendChild(cardsWrapper);
  }

  block.appendChild(container);
}
