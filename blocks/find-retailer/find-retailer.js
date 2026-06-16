// Sample data for standalone/preview mode.
const SAMPLE_DATA = [
  { name: 'Boots', channel: 'online', url: 'https://www.boots.com' },
  { name: 'Superdrug', channel: 'online', url: 'https://www.superdrug.com' },
  { name: 'Tesco', channel: 'in_store', url: 'https://www.tesco.com' },
  { name: 'Sainsbury\'s', channel: 'in_store', url: 'https://www.sainsburys.co.uk' }
];

// Brand palette from BuildWidgetRequest
const PALETTE = ['#00a651', '#005c2f', '#ffffff'];

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
  container.className = 'retailer-container';
  container.style.cssText = `background:${theme?.bg ?? '#1a3a5c'};color:${theme?.fg ?? '#fff'}`;

  // Heading
  const heading = document.createElement('h2');
  heading.className = 'retailer-heading';
  heading.textContent = 'Where to Buy GUM Products';
  container.appendChild(heading);

  if (!retailers || retailers.length === 0) {
    // Empty state
    const emptyMsg = document.createElement('p');
    emptyMsg.className = 'empty-message';
    emptyMsg.textContent = 'Find GUM oral care products at these trusted retailers.';
    container.appendChild(emptyMsg);
    block.appendChild(container);
    return;
  }

  // Group by channel
  const online = retailers.filter(r => r.channel === 'online');
  const inStore = retailers.filter(r => r.channel === 'in_store');

  if (online.length > 0) {
    const section = createRetailerSection('Online Retailers', online, bridge);
    container.appendChild(section);
  }

  if (inStore.length > 0) {
    const section = createRetailerSection('In-Store Retailers', inStore, bridge);
    container.appendChild(section);
  }

  block.appendChild(container);
}

function createRetailerSection(title, retailers, bridge) {
  const section = document.createElement('div');
  section.className = 'retailer-section';

  const sectionTitle = document.createElement('h3');
  sectionTitle.className = 'section-title';
  sectionTitle.textContent = title;
  section.appendChild(sectionTitle);

  const grid = document.createElement('div');
  grid.className = 'retailer-grid';

  retailers.forEach(retailer => {
    const card = document.createElement('div');
    card.className = 'retailer-card';

    // Pin icon
    const pinIcon = document.createElement('div');
    pinIcon.className = 'pin-icon';
    pinIcon.innerHTML = `
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="currentColor" opacity="0.7"/>
      </svg>
    `;
    card.appendChild(pinIcon);

    // Retailer name
    const name = document.createElement('div');
    name.className = 'retailer-name';
    name.textContent = retailer.name;
    card.appendChild(name);

    // CTA button
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
  });

  section.appendChild(grid);
  return section;
}
