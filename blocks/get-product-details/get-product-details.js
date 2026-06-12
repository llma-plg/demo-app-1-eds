// Sample data for standalone/preview mode.
// In production, data comes dynamically from bridge.toolResult as a single object.
const SAMPLE_DATA = [
  {
    "name": "Virtual Wallet",
    "description": "Checking account with Spend, Reserve, and Growth accounts plus Low Cash Mode and budgeting tools.",
    "price": "$7/mo or $0",
    "category": "Checking"
  },
  {
    "name": "Virtual Wallet with Performance Select",
    "description": "Premium checking with highest interest rates on Growth savings, most ATM fee reimbursements, and all Virtual Wallet features.",
    "price": "$25/mo or $0",
    "category": "Checking"
  },
  {
    "name": "PNC Simple Checking",
    "description": "Hassle-free basic checking with no overdraft fees and mobile banking access.",
    "price": "$5/mo or $0",
    "category": "Checking"
  },
  {
    "name": "PNC Cash Rewards Visa",
    "description": "Earn 4% on gas, 3% on restaurants, 2% on groceries, and 1% on everything else with no annual fee.",
    "price": "$0 annual fee",
    "category": "Credit Card",
    "image_url": "https://www.pnc.com/en/personal-banking/banking/credit-cards/_jcr_content/main/pageBody/containergrid_copy_c_283020490/embeddedGrid/containergrid_copy_c_215278159/embeddedGrid/containergrid/embeddedGrid/image.coreimg.png/1778094519173/creditcard-cash-rewards-200-bonus-ribbon.png"
  },
  {
    "name": "PNC Cash Unlimited Visa",
    "description": "Earn unlimited 2% cash back on all purchases with no caps, no expiration, and no foreign transaction fees.",
    "price": "$0 annual fee",
    "category": "Credit Card",
    "image_url": "https://www.pnc.com/en/personal-banking/banking/credit-cards/_jcr_content/main/pageBody/containergrid_197409_2030261130/embeddedGrid/containergrid_copy/embeddedGrid/containergrid/embeddedGrid/image.coreimg.png/1769797295149/pnc-cash-unlimited-signature.png"
  },
  {
    "name": "Standard Savings",
    "description": "$0 minimum deposit to open online, earn interest across all balance tiers with unlimited deposits.",
    "price": "$0 minimum",
    "category": "Savings"
  },
  {
    "name": "Premiere Money Market",
    "description": "Higher interest earning potential with unlimited deposits and transfers, FDIC insured.",
    "price": "Tiered rates",
    "category": "Savings"
  }
];

// Brand palette - used to derive darkened card content background
const PALETTE = ['#004c97','#555555','#0069aa','#484848','#2d3943'];

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
  let item;

  if (bridge) {
    bridge.applyHostStyles();
    const isPreview = bridge.hostContext?.preview === true;
    if (isPreview) {
      item = SAMPLE_DATA[0];
    } else {
      const _result = await bridge.toolResult;
      const structuredContent = _result?.structuredContent || _result;
      item = structuredContent;
    }
  } else {
    item = SAMPLE_DATA[0];
  }

  block.textContent = '';
  renderDetail(block, item, bridge);

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

function renderDetail(block, item, bridge) {
  if (!item) return;

  const card = document.createElement('div');
  card.className = 'detail-card';

  // Image container (left side)
  const imageContainer = document.createElement('div');
  imageContainer.className = 'detail-image';

  const CARD_COLORS = ['#378ef0','#9256d9','#0fb5ae','#e68619','#d83790','#2dca72','#4046ca','#72b340'];
  const fallbackColor = CARD_COLORS[0];

  const colorDiv = () => {
    const d = document.createElement('div');
    d.style.cssText = `width:100%;height:100%;background-color:${fallbackColor};`;
    return d;
  };

  if (item.image_url) {
    const img = document.createElement('img');
    img.src = item.image_url;
    img.alt = item.name || '';
    img.style.cssText = 'width:100%;height:100%;object-fit:cover;display:block;';
    img.onerror = () => {
      if (img.parentNode) {
        img.parentNode.replaceChild(colorDiv(), img);
      }
    };
    imageContainer.appendChild(img);

    // CTA button on image
    const ctaBtn = document.createElement('button');
    ctaBtn.className = 'image-cta';
    ctaBtn.textContent = 'Learn More';
    if (bridge) {
      ctaBtn.addEventListener('click', () => {
        bridge.sendMessage(`Tell me more about ${item.name}`);
      });
    }
    imageContainer.appendChild(ctaBtn);
  } else {
    imageContainer.appendChild(colorDiv());
  }

  card.appendChild(imageContainer);

  // Content container (right side)
  const content = document.createElement('div');
  content.className = 'detail-content';
  content.style.cssText = `background:${theme?.bg ?? '#1a1a1a'};color:${theme?.fg ?? '#fff'}`;

  const name = document.createElement('h2');
  name.className = 'detail-name';
  name.textContent = item.name || '';
  content.appendChild(name);

  if (item.category) {
    const badge = document.createElement('span');
    badge.className = 'detail-badge';
    badge.textContent = item.category;
    content.appendChild(badge);
  }

  if (item.description) {
    const desc = document.createElement('p');
    desc.className = 'detail-description';
    desc.textContent = item.description;
    content.appendChild(desc);
  }

  if (item.price) {
    const price = document.createElement('div');
    price.className = 'detail-price';
    price.textContent = item.price;
    content.appendChild(price);
  }

  card.appendChild(content);
  block.appendChild(card);
}
