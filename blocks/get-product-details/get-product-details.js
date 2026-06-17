// Sample data for standalone EDS preview (no bridge).
// In production, data comes dynamically from bridge.toolResult.
const SAMPLE_DATA = {
  name: "GUM Crayola Timer Light Toothbrush",
  description: "Fun light-up toothbrush designed for kids that blinks for 60 seconds to encourage proper brushing time. Features soft bristles and an easy-grip handle in vibrant colors.",
  features: [
    "60-second built-in timer light",
    "Soft, gentle bristles for young teeth and gums",
    "Ergonomic handle designed for small hands",
    "No batteries required",
    "Fun Crayola-themed design"
  ],
  category: "Kids Oral Care",
  sku: "GUM-219-CR",
  image_url: "https://picsum.photos/400/400?random=1"
};

// Brand palette from BuildWidgetRequest (empty palette uses fallbacks).
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
  for (let i=0; i<20; i++) { const m=(lo+hi)/2; if (relLum(Math.round(r*m),Math.round(g*m),Math.round(b*m)) > 0.12) hi=m; else lo=m; }
  const dr=Math.round(r*lo), dg=Math.round(g*lo), db=Math.round(b*lo);
  return { bg:`#${dr.toString(16).padStart(2,'0')}${dg.toString(16).padStart(2,'0')}${db.toString(16).padStart(2,'0')}`, fg:'#ffffff' };
}
const theme = getThemedCardBg(PALETTE);

const CARD_COLORS = ['#378ef0','#9256d9','#0fb5ae','#e68619','#d83790','#2dca72','#4046ca','#72b340'];

export default async function decorate(block, bridge) {
  let product;

  if (bridge) {
    bridge.applyHostStyles();
    const isPreview = bridge.hostContext?.preview === true;
    if (isPreview) {
      product = SAMPLE_DATA;
    } else {
      // For single-object schema, structuredContent IS the product directly
      const _result = await bridge.toolResult;
      const structuredContent = _result?.structuredContent || _result;
      product = structuredContent || {};
    }
  } else {
    product = SAMPLE_DATA;
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
  card.className = 'product-detail-card';

  // Left side: Image with CTA overlay
  const imageSection = document.createElement('div');
  imageSection.className = 'product-image-section';

  const imageContainer = document.createElement('div');
  imageContainer.className = 'image-container';

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
    img.style.cssText = 'width:100%;height:100%;object-fit:cover;display:block;';
    img.onerror = () => img.parentNode.replaceChild(colorDiv(), img);
    imageContainer.appendChild(img);
  } else {
    imageContainer.appendChild(colorDiv());
  }

  imageSection.appendChild(imageContainer);

  // CTA button on image
  const ctaBtn = document.createElement('button');
  ctaBtn.className = 'cta-overlay-btn';
  ctaBtn.textContent = 'Where to Buy';
  ctaBtn.setAttribute('aria-label', 'Find where to buy this product');
  if (bridge) {
    ctaBtn.addEventListener('click', () => {
      bridge.sendMessage(`Where can I buy ${product.name || 'this product'}?`);
    });
  }
  imageSection.appendChild(ctaBtn);

  card.appendChild(imageSection);

  // Right side: Product details
  const detailsSection = document.createElement('div');
  detailsSection.className = 'product-details-section';
  detailsSection.style.cssText = `background:${theme?.bg ?? '#1a1a1a'};color:${theme?.fg ?? '#fff'}`;

  // Product name
  if (product.name) {
    const name = document.createElement('h2');
    name.className = 'product-name';
    name.textContent = product.name;
    detailsSection.appendChild(name);
  }

  // Category badge
  if (product.category) {
    const categoryBadge = document.createElement('span');
    categoryBadge.className = 'category-badge';
    categoryBadge.textContent = product.category;
    detailsSection.appendChild(categoryBadge);
  }

  // Description
  if (product.description) {
    const desc = document.createElement('p');
    desc.className = 'product-description';
    desc.textContent = product.description;
    detailsSection.appendChild(desc);
  }

  // Features list
  if (product.features && product.features.length > 0) {
    const featuresTitle = document.createElement('div');
    featuresTitle.className = 'features-title';
    featuresTitle.textContent = 'Key Features';
    detailsSection.appendChild(featuresTitle);

    const featuresList = document.createElement('ul');
    featuresList.className = 'features-list';
    product.features.forEach(feature => {
      const li = document.createElement('li');
      li.textContent = feature;
      featuresList.appendChild(li);
    });
    detailsSection.appendChild(featuresList);
  }

  // SKU
  if (product.sku) {
    const sku = document.createElement('div');
    sku.className = 'product-sku';
    sku.textContent = `SKU: ${product.sku}`;
    detailsSection.appendChild(sku);
  }

  card.appendChild(detailsSection);
  block.appendChild(card);
}
