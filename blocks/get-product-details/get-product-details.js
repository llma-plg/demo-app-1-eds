// Sample data for standalone EDS preview (no bridge).
// In production, data comes dynamically from bridge.toolResult.
const SAMPLE_DATA = {
  name: "Apple MacBook Air 13 M5",
  description: "Laptop with Apple M5 10-core CPU, 13.6\" Retina Display, 16GB RAM, 512GB SSD.",
  image_url: "https://lcdn.altex.ro/media/catalog/product/m/a/macbook_air_13_in_m5_midnight_pdp_image_position_1_ce_ww_a118d620.jpg",
  price: "5.499 lei",
  category: "Laptopuri"
};

// Brand palette from BuildWidgetRequest — darkened to luminance ≤ 0.12 for card info strip.
const PALETTE = ['#bc003b', '#f5cb38'];

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
    bg: `#${dr.toString(16).padStart(2,'0')}${dg.toString(16).padStart(2,'0')}${db.toString(16).padStart(2,'0')}`,
    fg: '#ffffff'
  };
}

const theme = getThemedCardBg(PALETTE);

export default async function decorate(block, bridge) {
  let product;

  if (bridge) {
    bridge.applyHostStyles();
    const isPreview = bridge.hostContext?.preview === true;
    if (isPreview) {
      product = SAMPLE_DATA;
    } else {
      const _result = await bridge.toolResult;
      const structuredContent = _result?.structuredContent || _result;
      product = structuredContent;
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
  if (!product) return;

  const card = document.createElement('div');
  card.className = 'product-detail-card';

  // Left side: Image container with CTA
  const imageSection = document.createElement('div');
  imageSection.className = 'product-image-section';

  if (product.image_url) {
    const img = document.createElement('img');
    img.src = product.image_url;
    img.alt = product.name || 'Product image';
    img.style.cssText = 'width:100%;height:100%;object-fit:cover;display:block;';

    const fallbackColor = '#bc003b';
    img.onerror = () => {
      const colorDiv = document.createElement('div');
      colorDiv.style.cssText = `width:100%;height:100%;background-color:${fallbackColor};`;
      img.parentNode.replaceChild(colorDiv, img);
    };

    imageSection.appendChild(img);
  } else {
    const colorDiv = document.createElement('div');
    colorDiv.style.cssText = 'width:100%;height:100%;background-color:#bc003b;';
    imageSection.appendChild(colorDiv);
  }

  // CTA button on image
  const ctaBtn = document.createElement('button');
  ctaBtn.className = 'image-cta-btn';
  ctaBtn.textContent = 'Adauga in cos';
  if (bridge) {
    ctaBtn.addEventListener('click', () => {
      bridge.sendMessage(`Add ${product.name} to cart`);
    });
  }
  imageSection.appendChild(ctaBtn);

  card.appendChild(imageSection);

  // Right side: Content section with darkened palette bg
  const contentSection = document.createElement('div');
  contentSection.className = 'product-content-section';
  contentSection.style.cssText = `background:${theme?.bg ?? '#1a1a1a'};color:${theme?.fg ?? '#fff'};`;

  const nameEl = document.createElement('h2');
  nameEl.className = 'product-name';
  nameEl.textContent = product.name || '';
  nameEl.style.color = theme?.fg ?? '#fff';
  contentSection.appendChild(nameEl);

  if (product.category) {
    const categoryChip = document.createElement('span');
    categoryChip.className = 'category-chip';
    categoryChip.textContent = product.category;
    contentSection.appendChild(categoryChip);
  }

  if (product.description) {
    const descEl = document.createElement('p');
    descEl.className = 'product-description';
    descEl.textContent = product.description;
    descEl.style.color = theme?.fg ?? '#fff';
    contentSection.appendChild(descEl);
  }

  if (product.price) {
    const priceEl = document.createElement('div');
    priceEl.className = 'product-price';
    priceEl.textContent = product.price;
    priceEl.style.color = theme?.fg ?? '#fff';
    contentSection.appendChild(priceEl);
  }

  if (product.availability) {
    const availEl = document.createElement('div');
    availEl.className = 'product-availability';
    availEl.textContent = product.availability;
    availEl.style.color = theme?.fg ?? '#fff';
    contentSection.appendChild(availEl);
  }

  card.appendChild(contentSection);
  block.appendChild(card);
}