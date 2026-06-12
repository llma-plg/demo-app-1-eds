// Sample data for standalone EDS preview (no bridge).
// In production, data comes dynamically from bridge.toolResult.
const SAMPLE_DATA = [
  { name: 'Boots', type: 'online', url: 'https://www.boots.com/gum' },
  { name: 'Superdrug', type: 'online', url: 'https://www.superdrug.com/gum' },
  { name: 'Amazon UK', type: 'online', url: 'https://www.amazon.co.uk/gum' },
  { name: 'Tesco', type: 'in-store', url: 'https://www.tesco.com/stores' },
  { name: 'Sainsbury\'s', type: 'in-store', url: 'https://www.sainsburys.co.uk/stores' },
];

// Header banner image from samplePayload
const HEADER_IMAGE = 'https://www.sunstargum.com/adobe/dynamicmedia/deliver/dm-aid--fc5105f3-ba84-474b-a039-666d91c1f020/4100mwh-4100mbk-gum-sonic-daily-toothbrush-n5-p1.jpg?preferwebp=true&quality=85';

// Brand palette from BuildWidgetRequest
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
  // Header banner
  const header = document.createElement('div');
  header.className = 'retailer-header';
  const headerImg = document.createElement('img');
  headerImg.src = HEADER_IMAGE;
  headerImg.alt = 'GUM Products';
  headerImg.style.cssText = 'width:100%;height:100%;object-fit:cover;display:block;opacity:0.3;';
  header.appendChild(headerImg);
  block.appendChild(header);

  if (!retailers || retailers.length === 0) {
    // Empty state
    const emptyCard = document.createElement('div');
    emptyCard.className = 'empty-state';
    emptyCard.style.cssText = `background:${theme?.bg ?? '#1a3a5c'};color:${theme?.fg ?? '#fff'}`;

    const icon = document.createElement('div');
    icon.className = 'pin-icon';
    icon.innerHTML = '📍';
    icon.style.cssText = `opacity:0.7;color:${theme?.fg ?? '#fff'};font-size:32px;margin-bottom:12px;`;
    emptyCard.appendChild(icon);

    const heading = document.createElement('h3');
    heading.textContent = 'Find a retailer near you';
    heading.style.cssText = `font-size:15px;font-weight:600;margin:0 0 16px;color:${theme?.fg ?? '#fff'}`;
    emptyCard.appendChild(heading);

    const btn = document.createElement('button');
    btn.className = 'cta-btn';
    btn.textContent = 'View All Retailers';
    if (bridge) {
      btn.addEventListener('click', () => {
        bridge.sendMessage('Show me all GUM retailers');
      });
    }
    emptyCard.appendChild(btn);

    block.appendChild(emptyCard);
    return;
  }

  // Group by type
  const online = retailers.filter(r => r.type === 'online');
  const inStore = retailers.filter(r => r.type === 'in-store');

  if (online.length > 0) {
    const section = createSection('Online Retailers', online, bridge);
    block.appendChild(section);
  }

  if (inStore.length > 0) {
    const section = createSection('In-Store Retailers', inStore, bridge);
    block.appendChild(section);
  }
}

function createSection(title, retailers, bridge) {
  const section = document.createElement('div');
  section.className = 'retailer-section';

  const heading = document.createElement('h3');
  heading.className = 'section-title';
  heading.textContent = title;
  section.appendChild(heading);

  const grid = document.createElement('div');
  grid.className = 'retailer-grid';

  // Show max 2 cards per row as per design guidance
  const maxCards = Math.min(retailers.length, 4);
  for (let i = 0; i < maxCards; i++) {
    const retailer = retailers[i];
    const card = document.createElement('div');
    card.className = 'retailer-card';
    card.style.cssText = `background:${theme?.bg ?? '#1a3a5c'};color:${theme?.fg ?? '#fff'}`;

    const pinCircle = document.createElement('div');
    pinCircle.className = 'pin-circle';
    pinCircle.innerHTML = '📍';
    card.appendChild(pinCircle);

    const name = document.createElement('div');
    name.className = 'retailer-name';
    name.textContent = retailer.name;
    name.style.cssText = `color:${theme?.fg ?? '#fff'}`;
    card.appendChild(name);

    const btn = document.createElement('button');
    btn.className = 'shop-btn';
    btn.textContent = 'Shop Now';
    if (bridge && retailer.url) {
      btn.addEventListener('click', () => {
        bridge.openLink(retailer.url);
      });
    } else if (retailer.url) {
      btn.addEventListener('click', () => {
        window.open(retailer.url, '_blank');
      });
    }
    card.appendChild(btn);

    grid.appendChild(card);
  }

  section.appendChild(grid);
  return section;
}
