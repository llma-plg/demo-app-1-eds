// Sample data for standalone EDS preview (no bridge).
// In production, data comes dynamically from bridge.toolResult.
const SAMPLE_DATA = [
  {
    name: 'PNC Bank - Downtown Branch',
    address: '123 Main Street, Pittsburgh, PA 15222',
    phone: '(412) 555-0100',
    hours: 'Mon-Fri 9AM-5PM, Sat 9AM-1PM',
    type: 'Branch',
    services: ['ATM', 'Safe Deposit Boxes', 'Notary']
  },
  {
    name: 'PNC Bank - Oakland ATM',
    address: '456 Forbes Avenue, Pittsburgh, PA 15213',
    phone: '',
    hours: '24/7',
    type: 'ATM',
    services: ['ATM']
  }
];

// Brand palette from BuildWidgetRequest.
const PALETTE = ['#004c97', '#555555', '#0069aa', '#484848', '#2d3943'];

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
  let branches;

  if (bridge) {
    bridge.applyHostStyles();
    const isPreview = bridge.hostContext?.preview === true;
    if (isPreview) {
      branches = SAMPLE_DATA;
    } else {
      const _result = await bridge.toolResult;
      const structuredContent = _result?.structuredContent || _result;
      // structuredContent.branches — bare array outputSchema; key derived from actionName "find_branch"
      branches = structuredContent?.branches || [];
    }
  } else {
    branches = SAMPLE_DATA;
  }

  block.textContent = '';
  renderLocator(block, branches, bridge);

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

function renderLocator(block, branches, bridge) {
  const container = document.createElement('div');
  container.className = 'locator-container';

  if (!branches || branches.length === 0) {
    // Empty state: search card
    const searchCard = document.createElement('div');
    searchCard.className = 'search-card';
    searchCard.style.cssText = `background:${theme?.bg ?? '#1a3a5c'};color:${theme?.fg ?? '#fff'}`;

    const pinIcon = document.createElement('div');
    pinIcon.className = 'pin-icon';
    pinIcon.innerHTML = `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" opacity="0.7">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
      <circle cx="12" cy="10" r="3"/>
    </svg>`;
    searchCard.appendChild(pinIcon);

    const heading = document.createElement('h2');
    heading.textContent = 'Find a branch near you';
    searchCard.appendChild(heading);

    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = 'Enter ZIP code...';
    input.className = 'zip-input';
    searchCard.appendChild(input);

    const button = document.createElement('button');
    button.className = 'search-btn';
    button.textContent = 'Find Nearby';
    if (bridge) {
      button.addEventListener('click', () => {
        const zip = input.value.trim();
        if (zip) {
          bridge.sendMessage(`Find PNC branches near ${zip}`);
        }
      });
    }
    searchCard.appendChild(button);

    container.appendChild(searchCard);
  } else {
    // Results: flex row of store cards
    const resultsGrid = document.createElement('div');
    resultsGrid.className = 'results-grid';

    branches.slice(0, 2).forEach(branch => {
      const card = document.createElement('div');
      card.className = 'store-card';
      card.style.cssText = `background:${theme?.bg ?? '#1a3a5c'};color:${theme?.fg ?? '#fff'}`;

      const pinCircle = document.createElement('div');
      pinCircle.className = 'pin-circle';
      pinCircle.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
        <circle cx="12" cy="10" r="3"/>
      </svg>`;
      card.appendChild(pinCircle);

      const name = document.createElement('div');
      name.className = 'store-name';
      name.textContent = branch.name || '';
      card.appendChild(name);

      const address = document.createElement('div');
      address.className = 'store-address';
      address.textContent = branch.address || '';
      card.appendChild(address);

      if (branch.phone) {
        const phone = document.createElement('div');
        phone.className = 'store-phone';
        phone.textContent = branch.phone;
        card.appendChild(phone);
      }

      if (branch.hours) {
        const hours = document.createElement('div');
        hours.className = 'store-hours';
        hours.textContent = branch.hours;
        card.appendChild(hours);
      }

      resultsGrid.appendChild(card);
    });

    container.appendChild(resultsGrid);
  }

  block.appendChild(container);
}