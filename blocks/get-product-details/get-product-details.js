// Sample data for standalone EDS preview (no bridge).
// In production, data comes dynamically from bridge.toolResult.
const SAMPLE_DATA = [
  {
    name: "Men's Better Sweater™ Fleece Jacket",
    description: "Warm 100% recycled polyester full-zip jacket with sweater-knit aesthetic and Fair Trade Certified construction.",
    image_url: "https://cdn-yotpo-images-production.yotpo.com/Product/144677342/378852305/square.jpg?1738193748",
    price: "£130",
    category: "Fleece"
  },
  {
    name: "Black Hole® Duffel 55L",
    description: "Legendary 55-liter duffel with weather-resistant 100% recycled polyester and recycled TPU-film laminate.",
    image_url: "https://cdn-yotpo-images-production.yotpo.com/Product/618464627/518622744/square.jpg?1738281241",
    price: "£160",
    category: "Packs & Gear"
  },
  {
    name: "Men's Baggies™ Shorts - 5\"",
    description: "Quick-drying multifunctional shorts made from NetPlus® recycled fishing nets with mesh liner.",
    image_url: "https://cdn-yotpo-images-production.yotpo.com/Product/371389495/380033939/square.jpg?1746695975",
    price: "£60",
    category: "Shorts"
  }
];

// Brand palette from BuildWidgetRequest
const PALETTE = ['#1a1a2e', '#2d5f8a', '#4a7c59'];

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
      // structuredContent IS the product object (outputSchema is single object, not array)
      const _result = await bridge.toolResult;
      const structuredContent = _result?.structuredContent || _result;
      product = structuredContent;
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
  if (!product) {
    block.textContent = 'No product data available';
    return;
  }

  const card = document.createElement('div');
  card.className = 'product-detail-card';

  // Left: Image container
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
    img.style.cssText = 'width:100%;height:100%;object-fit:cover;display:block;';
    img.onerror = () => img.parentNode.replaceChild(colorDiv(), img);
    imageContainer.appendChild(img);
  } else {
    imageContainer.appendChild(colorDiv());
  }

  // CTA button on image
  const ctaBtn = document.createElement('button');
  ctaBtn.className = 'cta-on-image';
  ctaBtn.textContent = 'Shop Now';
  if (bridge) {
    ctaBtn.addEventListener('click', () => {
      bridge.sendMessage(`I want to shop for ${product.name}`);
    });
  }
  imageContainer.appendChild(ctaBtn);

  card.appendChild(imageContainer);

  // Right: Product info
  const info = document.createElement('div');
  info.className = 'product-info';
  info.style.cssText = `background:${theme?.bg ?? '#1a1a1a'};color:${theme?.fg ?? '#fff'}`;

  const name = document.createElement('h2');
  name.className = 'product-name';
  name.textContent = product.name || '';
  info.appendChild(name);

  const description = document.createElement('p');
  description.className = 'product-description';
  description.textContent = product.description || '';
  info.appendChild(description);

  const priceRow = document.createElement('div');
  priceRow.className = 'price-row';

  const price = document.createElement('span');
  price.className = 'product-price';
  price.textContent = product.price || '';
  priceRow.appendChild(price);

  if (product.category) {
    const category = document.createElement('span');
    category.className = 'product-category';
    category.textContent = product.category;
    priceRow.appendChild(category);
  }

  info.appendChild(priceRow);

  card.appendChild(info);
  block.appendChild(card);
}