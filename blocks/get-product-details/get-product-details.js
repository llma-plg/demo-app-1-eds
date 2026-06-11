// Sample data for standalone/preview mode.
// In production, data comes dynamically from bridge.toolResult.
const SAMPLE_DATA = {
  name: "Men's Nano Puff Jacket",
  description: "Our lightest, most compressible insulation keeps you warm without adding bulk. Made with 60-g PrimaLoft Gold Insulation Eco and a 100% recycled polyester shell and lining. Fair Trade Certified sewn.",
  price: 199,
  category: "Jackets",
  colors: ["Black", "Navy Blue", "Forge Grey"],
  image_url: "https://picsum.photos/520/560?product",
  sport: "Climbing"
};

// Brand palette from BuildWidgetRequest — used to derive card background.
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
  return {
    bg:`#${dr.toString(16).padStart(2,'0')}${dg.toString(16).padStart(2,'0')}${db.toString(16).padStart(2,'0')}`,
    fg:'#ffffff'
  };
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
      // Production — data comes from the MCP tool result
      const _result = await bridge.toolResult;
      const structuredContent = _result?.structuredContent || _result;
      product = structuredContent;
    }
  } else {
    // Standalone EDS preview
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
  if (!product) {
    const empty = document.createElement('p');
    empty.textContent = 'No product data available';
    empty.style.cssText = 'text-align:center;padding:2rem;color:#666;';
    block.appendChild(empty);
    return;
  }

  const card = document.createElement('div');
  card.className = 'detail-card';

  // Left side - Image with CTA
  const imageSection = document.createElement('div');
  imageSection.className = 'image-section';

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
  ctaBtn.className = 'cta-button';
  ctaBtn.textContent = 'Shop Now';
  if (bridge) {
    ctaBtn.addEventListener('click', () => {
      bridge.sendMessage(`I want to buy the ${product.name}`);
    });
  }
  imageSection.appendChild(ctaBtn);

  card.appendChild(imageSection);

  // Right side - Content
  const contentSection = document.createElement('div');
  contentSection.className = 'content-section';
  contentSection.style.cssText = `background:${theme?.bg ?? '#1a1a1a'};color:${theme?.fg ?? '#fff'}`;

  const name = document.createElement('h2');
  name.className = 'product-name';
  name.textContent = product.name || 'Untitled Product';
  contentSection.appendChild(name);

  if (product.category) {
    const categoryBadge = document.createElement('span');
    categoryBadge.className = 'category-badge';
    categoryBadge.textContent = product.category;
    contentSection.appendChild(categoryBadge);
  }

  if (product.description) {
    const desc = document.createElement('p');
    desc.className = 'product-description';
    desc.textContent = product.description;
    contentSection.appendChild(desc);
  }

  if (product.price) {
    const priceLabel = document.createElement('div');
    priceLabel.className = 'price-label';
    const priceValue = document.createElement('span');
    priceValue.className = 'price-value';
    priceValue.textContent = `£${product.price}`;
    priceLabel.appendChild(priceValue);
    contentSection.appendChild(priceLabel);
  }

  if (product.colors && product.colors.length > 0) {
    const colorsLabel = document.createElement('div');
    colorsLabel.className = 'colors-label';
    const label = document.createElement('span');
    label.textContent = 'Available colors: ';
    label.style.cssText = 'opacity:0.78;font-size:12px;';
    colorsLabel.appendChild(label);
    const colorsList = document.createElement('span');
    colorsList.textContent = product.colors.join(', ');
    colorsList.style.cssText = 'font-size:12px;';
    colorsLabel.appendChild(colorsList);
    contentSection.appendChild(colorsLabel);
  }

  if (product.sport) {
    const sportLabel = document.createElement('div');
    sportLabel.className = 'sport-label';
    sportLabel.textContent = `Sport: ${product.sport}`;
    sportLabel.style.cssText = 'opacity:0.65;font-size:11px;margin-top:4px;';
    contentSection.appendChild(sportLabel);
  }

  card.appendChild(contentSection);
  block.appendChild(card);
}