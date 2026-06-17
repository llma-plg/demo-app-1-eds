// Sample data for standalone/preview mode.
// In production, data comes dynamically from bridge.toolResult.
const SAMPLE_DATA = [
  {
    name: 'CTS Dental',
    address: 'https://www.cts-dental.com',
    phone: '',
    hours: 'Online'
  },
  {
    name: 'Amazon UK',
    address: 'https://www.amazon.co.uk/stores/GUM',
    phone: '',
    hours: 'Online'
  }
];

const PALETTE = ['#2bb573','#005dab','#06754a','#231f20','#057065'];

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
      // structuredContent.retailers — derived from action name "find_retailer" (bare array outputSchema rule)
      retailers = structuredContent?.retailers || [];
    }
    bridge.reportSize(block.offsetWidth, block.offsetHeight);
    let resizeTimer;
    const ro = new ResizeObserver(() => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => bridge.reportSize(block.offsetWidth, block.offsetHeight), 150);
    });
    ro.observe(block);
  } else {
    retailers = SAMPLE_DATA;
  }

  block.textContent = '';
  renderRetailers(block, retailers, bridge);
}

function renderRetailers(block, retailers, bridge) {
  const container = document.createElement('div');
  container.className = 'retailers-container';

  if (!retailers || retailers.length === 0) {
    const emptyCard = document.createElement('div');
    emptyCard.className = 'empty-state';
    emptyCard.style.cssText = `background:${theme?.bg ?? '#1a3a5c'};color:${theme?.fg ?? '#fff'}`;

    const icon = document.createElement('div');
    icon.className = 'pin-icon';
    icon.innerHTML = '&#x1F4CD;';
    emptyCard.appendChild(icon);

    const heading = document.createElement('h3');
    heading.textContent = 'Find a store near you';
    emptyCard.appendChild(heading);

    const inputWrapper = document.createElement('div');
    inputWrapper.className = 'input-wrapper';

    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = 'Enter ZIP code...';
    input.className = 'zip-input';
    inputWrapper.appendChild(input);

    const searchBtn = document.createElement('button');
    searchBtn.className = 'search-btn';
    searchBtn.textContent = 'Find Retailers';
    searchBtn.style.background = PALETTE[0];
    if (bridge) {
      searchBtn.addEventListener('click', () => {
        const zip = input.value.trim();
        if (zip) {
          bridge.sendMessage(`Find retailers near ${zip}`);
        }
      });
    }
    inputWrapper.appendChild(searchBtn);

    emptyCard.appendChild(inputWrapper);
    container.appendChild(emptyCard);
  } else {
    const grid = document.createElement('div');
    grid.className = 'retailers-grid';

    retailers.slice(0, 2).forEach((retailer, idx) => {
      const card = document.createElement('div');
      card.className = 'retailer-card';
      card.style.cssText = `background:${theme?.bg ?? '#1a3a5c'};color:${theme?.fg ?? '#fff'}`;

      const pinCircle = document.createElement('div');
      pinCircle.className = 'pin-circle';
      pinCircle.innerHTML = '&#x1F4CD;';
      card.appendChild(pinCircle);

      const name = document.createElement('div');
      name.className = 'retailer-name';
      name.textContent = retailer.name || '';
      card.appendChild(name);

      const addressUrl = retailer.url || retailer.address || '';
      if (addressUrl) {
        const addressLink = document.createElement('a');
        addressLink.className = 'retailer-address';
        addressLink.href = addressUrl;
        addressLink.textContent = addressUrl;
        addressLink.target = '_blank';
        addressLink.rel = 'noopener noreferrer';
        addressLink.style.color = PALETTE[0];
        card.appendChild(addressLink);
      }

      if (retailer.phone) {
        const phone = document.createElement('div');
        phone.className = 'retailer-phone';
        phone.textContent = retailer.phone;
        phone.style.color = PALETTE[0];
        card.appendChild(phone);
      }

      if (retailer.hours) {
        const hours = document.createElement('div');
        hours.className = 'retailer-hours';
        hours.textContent = retailer.hours;
        card.appendChild(hours);
      }

      grid.appendChild(card);
    });

    container.appendChild(grid);
  }

  block.appendChild(container);
}