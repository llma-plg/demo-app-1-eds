// Sample data for standalone EDS preview (no bridge).
// In production, data comes dynamically from bridge.toolResult.
const SAMPLE_DATA = [
  {
    "name": "Amazon",
    "url": "https://www.amazon.com/gum-oral-care",
    "type": "online"
  },
  {
    "name": "Walmart",
    "url": "https://www.walmart.com/gum",
    "type": "both"
  },
  {
    "name": "Walgreens",
    "url": "https://www.walgreens.com/gum",
    "type": "both"
  },
  {
    "name": "CVS Pharmacy",
    "url": "https://www.cvs.com/gum",
    "type": "both"
  },
  {
    "name": "Target",
    "url": "https://www.target.com/gum",
    "type": "both"
  }
];

// Brand palette from BuildWidgetRequest — empty array, uses fallback colors.
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
    const mid=(lo+hi)/2;
    if (relLum(Math.round(r*mid),Math.round(g*mid),Math.round(b*mid)) > 0.12) hi=mid; else lo=mid;
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

  if (!retailers || retailers.length === 0) {
    // Empty state: search card
    const searchCard = document.createElement('div');
    searchCard.className = 'search-card';
    searchCard.style.cssText = `background:${theme?.bg ?? '#1a3a5c'};color:${theme?.fg ?? '#fff'}`;

    const pinIcon = document.createElement('div');
    pinIcon.className = 'pin-icon';
    pinIcon.innerHTML = `<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>`;
    searchCard.appendChild(pinIcon);

    const heading = document.createElement('h3');
    heading.textContent = 'Find a retailer near you';
    searchCard.appendChild(heading);

    const inputWrapper = document.createElement('div');
    inputWrapper.className = 'input-wrapper';

    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = 'Enter ZIP code...';
    input.className = 'zip-input';
    inputWrapper.appendChild(input);

    const searchBtn = document.createElement('button');
    searchBtn.className = 'search-btn';
    searchBtn.textContent = 'Search';
    if (bridge) {
      searchBtn.addEventListener('click', () => {
        const zip = input.value.trim();
        if (zip) {
          bridge.sendMessage(`Find GUM retailers near ${zip}`);
        }
      });
      input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          const zip = input.value.trim();
          if (zip) {
            bridge.sendMessage(`Find GUM retailers near ${zip}`);
          }
        }
      });
    }
    inputWrapper.appendChild(searchBtn);

    searchCard.appendChild(inputWrapper);
    container.appendChild(searchCard);
  } else {
    // Results: flex row of retailer cards
    const resultsRow = document.createElement('div');
    resultsRow.className = 'retailers-row';

    retailers.slice(0, 2).forEach((retailer) => {
      const card = document.createElement('div');
      card.className = 'retailer-card';
      card.style.cssText = `background:${theme?.bg ?? '#1a3a5c'};color:${theme?.fg ?? '#fff'}`;

      const pinCircle = document.createElement('div');
      pinCircle.className = 'pin-circle';
      pinCircle.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>`;
      card.appendChild(pinCircle);

      const name = document.createElement('div');
      name.className = 'retailer-name';
      name.textContent = retailer.name;
      card.appendChild(name);

      if (retailer.type) {
        const typeBadge = document.createElement('div');
        typeBadge.className = 'retailer-type';
        typeBadge.textContent = retailer.type;
        card.appendChild(typeBadge);
      }

      const shopBtn = document.createElement('button');
      shopBtn.className = 'shop-btn';
      shopBtn.textContent = 'Shop Now';
      if (bridge) {
        shopBtn.addEventListener('click', () => {
          if (retailer.url) {
            bridge.openLink(retailer.url);
          }
        });
      } else if (retailer.url) {
        shopBtn.addEventListener('click', () => {
          window.open(retailer.url, '_blank');
        });
      }
      card.appendChild(shopBtn);

      resultsRow.appendChild(card);
    });

    container.appendChild(resultsRow);
  }

  block.appendChild(container);
}
