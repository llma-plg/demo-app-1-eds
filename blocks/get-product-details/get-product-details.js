// Sample data for standalone/preview mode
const SAMPLE_DATA = [
  {
    "name": "GUM PRO Toothbrush",
    "description": "Thin-tipped bristles for superior deep clean, cleans 7x deeper below the gum line.",
    "image_url": "https://www.sunstargum.com/adobe/dynamicmedia/deliver/dm-aid--b5d59fef-26ae-49cc-b97e-5abc1dbcead6/525btm-gum-pro-toothbrush-n5-p1.jpg?preferwebp=true&quality=85",
    "category": "Toothbrushes",
    "highlights": ["Thin-tipped bristles", "7x deeper cleaning", "Superior gum care"]
  },
  {
    "name": "GUM Technique+ Toothbrush",
    "description": "Dome-shaped bristles for optimal everyday care of teeth and gums with ergonomic 45-degree handle.",
    "image_url": "https://www.sunstargum.com/adobe/dynamicmedia/deliver/dm-aid--9b34efe3-0f17-44ed-9b43-072f07f418a3/491btm-gum-technique-plus-toothbrush-n5-p1.jpg?preferwebp=true&quality=85",
    "category": "Toothbrushes",
    "highlights": ["Dome-shaped bristles", "45-degree angled handle", "Optimal plaque removal"]
  },
  {
    "name": "GUM TRAV-LER Interdental Brush",
    "description": "Innovative interdental brush with triangular bristles removing up to 25% more plaque.",
    "image_url": "https://www.sunstargum.com/adobe/dynamicmedia/deliver/dm-aid--18e87415-18c9-4ba3-8365-0c8b41dced6e/p1312-gum-travler-brush-red.png?preferwebp=true&quality=85",
    "category": "Interdental Brushes",
    "highlights": ["Triangular bristles", "25% more plaque removal", "Easy to use"]
  }
];

const PALETTE = ['#e30613','#00a0af','#ffffff'];

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
  let product;

  if (bridge) {
    bridge.applyHostStyles();
    const isPreview = bridge.hostContext?.preview === true;
    if (isPreview) {
      product = SAMPLE_DATA[0];
    } else {
      const _result = await bridge.toolResult;
      const structuredContent = _result?.structuredContent || _result;
      product = structuredContent || {};
    }
  } else {
    product = SAMPLE_DATA[0];
  }

  block.textContent = '';
  renderProduct(block, product, bridge);

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

function renderProduct(block, product, bridge) {
  const card = document.createElement('div');
  card.className = 'product-card';

  const imageContainer = document.createElement('div');
  imageContainer.className = 'product-image';

  const CARD_COLORS = ['#378ef0','#9256d9','#0fb5ae','#e68619','#d83790','#2dca72','#4046ca','#72b340'];
  const fallbackColor = CARD_COLORS[0];

  const colorDiv = () => {
    const d = document.createElement('div');
    d.style.cssText = `width:100%;height:100%;background-color:${fallbackColor};`;
    return d;
  };

  if (product.image_url) {
    const img = document.createElement('img');
    img.src = product.image_url;
    img.alt = product.name || 'Product image';
    img.style.cssText = 'width:100%;height:100%;object-fit:contain;display:block;background:#fff;';
    img.onerror = () => {
      if (img.parentNode) {
        img.parentNode.replaceChild(colorDiv(), img);
      }
    };
    imageContainer.appendChild(img);

    const ctaBtn = document.createElement('button');
    ctaBtn.className = 'cta-on-image';
    ctaBtn.textContent = 'Find Retailer';
    if (bridge) {
      ctaBtn.addEventListener('click', () => {
        bridge.sendMessage(`Where can I buy ${product.name || 'this product'}?`);
      });
    }
    imageContainer.appendChild(ctaBtn);
  } else {
    imageContainer.appendChild(colorDiv());
  }

  const contentContainer = document.createElement('div');
  contentContainer.className = 'product-content';
  contentContainer.style.cssText = `background:${theme?.bg ?? '#1a1a1a'};color:${theme?.fg ?? '#fff'};`;

  if (product.category) {
    const badge = document.createElement('span');
    badge.className = 'category-badge';
    badge.textContent = product.category;
    contentContainer.appendChild(badge);
  }

  if (product.name) {
    const name = document.createElement('h3');
    name.className = 'product-name';
    name.textContent = product.name;
    contentContainer.appendChild(name);
  }

  if (product.description) {
    const desc = document.createElement('p');
    desc.className = 'product-description';
    desc.textContent = product.description;
    contentContainer.appendChild(desc);
  }

  if (product.highlights && product.highlights.length > 0) {
    const highlightsList = document.createElement('ul');
    highlightsList.className = 'product-highlights';
    product.highlights.forEach(highlight => {
      const li = document.createElement('li');
      li.textContent = highlight;
      highlightsList.appendChild(li);
    });
    contentContainer.appendChild(highlightsList);
  }

  card.appendChild(imageContainer);
  card.appendChild(contentContainer);
  block.appendChild(card);
}
