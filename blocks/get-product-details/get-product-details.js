// Sample data for standalone EDS preview (no bridge).
// In production, data comes dynamically from bridge.toolResult.
const SAMPLE_DATA = [
  {
    "name": "GUM Technique Plus Toothbrush",
    "description": "Multi-level bristle toothbrush designed to reach every part of the mouth for advanced cleaning.",
    "image_url": "https://www.sunstargum.com/adobe/dynamicmedia/deliver/dm-aid--9b34efe3-0f17-44ed-9b43-072f07f418a3/491btm-gum-technique-plus-toothbrush-n5-p1.jpg?width=800&preferwebp=true&quality=85",
    "category": "Toothbrushes",
    "features": ["Multi-level bristles", "Advanced cleaning", "Ergonomic handle"]
  },
  {
    "name": "GUM Expanding Floss",
    "description": "Dental floss that expands to reach more tooth surfaces and clean below the gumline.",
    "image_url": "https://www.sunstargum.com/adobe/dynamicmedia/deliver/dm-aid--2e651277-05fa-4fc3-9959-0a18277c8d16/2030-gum-expanding-interdentals-30m-n6.jpg?width=800&preferwebp=true&quality=85",
    "category": "Floss",
    "features": ["Expands during use", "Reaches below gumline", "Gentle on teeth"]
  }
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
  let product;

  if (bridge) {
    bridge.applyHostStyles();
    const isPreview = bridge.hostContext?.preview === true;
    if (isPreview) {
      product = SAMPLE_DATA[0];
    } else {
      // outputSchema is a single object, not an array wrapper
      const _result = await bridge.toolResult;
      const structuredContent = _result?.structuredContent || _result;
      product = structuredContent || SAMPLE_DATA[0];
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
  if (!product) return;

  const card = document.createElement('div');
  card.className = 'product-detail-card';

  // Left side: Image with CTA button
  const imageSection = document.createElement('div');
  imageSection.className = 'product-image-section';

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
    img.className = 'product-image';
    img.onerror = () => img.parentNode.replaceChild(colorDiv(), img);
    imageSection.appendChild(img);
  } else {
    imageSection.appendChild(colorDiv());
  }

  const ctaBtn = document.createElement('button');
  ctaBtn.className = 'cta-button';
  ctaBtn.textContent = 'Where to Buy';
  ctaBtn.setAttribute('aria-label', 'Find where to buy this product');
  if (bridge) {
    ctaBtn.addEventListener('click', () => {
      bridge.sendMessage(`Where can I buy ${product.name}?`);
    });
  }
  imageSection.appendChild(ctaBtn);

  card.appendChild(imageSection);

  // Right side: Product details with themed background
  const detailSection = document.createElement('div');
  detailSection.className = 'product-detail-section';
  detailSection.style.cssText = `background:${theme?.bg ?? '#004d2a'};color:${theme?.fg ?? '#fff'}`;

  const name = document.createElement('h2');
  name.className = 'product-name';
  name.textContent = product.name || '';
  detailSection.appendChild(name);

  if (product.category) {
    const categoryBadge = document.createElement('span');
    categoryBadge.className = 'category-badge';
    categoryBadge.textContent = product.category;
    detailSection.appendChild(categoryBadge);
  }

  const description = document.createElement('p');
  description.className = 'product-description';
  description.textContent = product.description || '';
  detailSection.appendChild(description);

  if (product.features && Array.isArray(product.features) && product.features.length > 0) {
    const featuresTitle = document.createElement('h3');
    featuresTitle.className = 'features-title';
    featuresTitle.textContent = 'Key Features';
    detailSection.appendChild(featuresTitle);

    const featuresList = document.createElement('ul');
    featuresList.className = 'features-list';
    product.features.forEach(feature => {
      const li = document.createElement('li');
      li.textContent = feature;
      featuresList.appendChild(li);
    });
    detailSection.appendChild(featuresList);
  }

  card.appendChild(detailSection);
  block.appendChild(card);
}