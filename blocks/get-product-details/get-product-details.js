// Sample data for standalone EDS preview (no bridge).
// In production, data comes dynamically from bridge.toolResult as a single product object.
const SAMPLE_DATA = [
  {
    "name": "GUM® Deep Clean Technique® Toothbrush",
    "description": "Features soft tapered bristles to clean below the gumline with Quad-Grip® handle for perfect brushing technique.",
    "image_url": "https://www.sunstargum.com/adobe/dynamicmedia/deliver/dm-aid--0a295760-5530-4008-a103-a99e6f050496/00070942125895-524-hero.jpg?quality=85&width=1600&preferwebp=true",
    "category": "Toothbrushes"
  },
  {
    "name": "GUM® Soft-Picks® Original",
    "description": "Gentle, easy-to-use rubber bristle picks for comfortable cleaning between teeth.",
    "image_url": "https://www.sunstargum.com/adobe/dynamicmedia/deliver/dm-aid--a9a60fce-c215-4647-93d2-af40c8df6ae0/6323r-product-packaging-btc-softpicks-original-hero-cleanedup-us.jpg?quality=85&width=1600&preferwebp=true",
    "category": "Interdental Cleaners"
  },
  {
    "name": "GUM® Professional Clean Floss Picks",
    "description": "Durable mint-flavored dental floss that holds up against the tightest spaces without shredding.",
    "image_url": "https://www.sunstargum.com/adobe/dynamicmedia/deliver/dm-aid--55618c00-ce9d-42fe-a7ea-4207b94c8253/893rr9-product-packaging-flossers-pro-clean-hero-cleanedup-us.png?quality=85&width=1600&preferwebp=true",
    "category": "Dental Floss"
  }
];

// Brand palette from BuildWidgetRequest
const PALETTE = ['#231f20', '#464c4e', '#009257', '#2cb573', '#64656a'];

function getThemedCardBg(palette) {
  if (!palette || !palette[0]) return null;
  let hex = palette[0].replace('#', '');
  if (hex.length === 3) hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
  if (hex.length !== 6) return null;
  let [r, g, b] = [parseInt(hex.slice(0, 2), 16), parseInt(hex.slice(2, 4), 16), parseInt(hex.slice(4, 6), 16)];
  if (isNaN(r) || isNaN(g) || isNaN(b)) return null;
  const lum = (c) => { const s = c / 255; return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4); };
  const relLum = (r, g, b) => 0.2126 * lum(r) + 0.7152 * lum(g) + 0.0722 * lum(b);
  if (relLum(r, g, b) <= 0.12) return { bg: `#${hex}`, fg: '#ffffff' };
  let lo = 0, hi = 1;
  for (let i = 0; i < 20; i++) {
    const m = (lo + hi) / 2;
    if (relLum(Math.round(r * m), Math.round(g * m), Math.round(b * m)) > 0.12) hi = m; else lo = m;
  }
  const dr = Math.round(r * lo), dg = Math.round(g * lo), db = Math.round(b * lo);
  return {
    bg: `#${dr.toString(16).padStart(2, '0')}${dg.toString(16).padStart(2, '0')}${db.toString(16).padStart(2, '0')}`,
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
      product = SAMPLE_DATA[0];
    } else {
      // structuredContent IS the product object (outputSchema root is type:object, not array)
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
    const empty = document.createElement('div');
    empty.className = 'empty-state';
    empty.textContent = 'No product details available';
    block.appendChild(empty);
    return;
  }

  const card = document.createElement('div');
  card.className = 'product-detail-card';

  // Left side: Image with CTA button overlay
  const imageSection = document.createElement('div');
  imageSection.className = 'image-section';

  if (product.image_url) {
    const img = document.createElement('img');
    img.src = product.image_url;
    img.alt = product.name || 'Product image';
    img.style.cssText = 'width:100%;height:100%;object-fit:cover;display:block;';

    // Fallback for broken images
    img.onerror = () => {
      const colorDiv = document.createElement('div');
      colorDiv.style.cssText = 'width:100%;height:100%;background-color:#378ef0;';
      img.parentNode.replaceChild(colorDiv, img);
    };

    imageSection.appendChild(img);
  } else {
    // No image URL provided - render color fallback directly
    const colorDiv = document.createElement('div');
    colorDiv.style.cssText = 'width:100%;height:100%;background-color:#378ef0;';
    imageSection.appendChild(colorDiv);
  }

  // CTA button on image
  const ctaBtn = document.createElement('button');
  ctaBtn.className = 'cta-btn';
  ctaBtn.textContent = 'Where to Buy';
  ctaBtn.setAttribute('aria-label', `Find where to buy ${product.name || 'this product'}`);
  if (bridge) {
    ctaBtn.addEventListener('click', () => {
      bridge.sendMessage(`Where can I buy ${product.name}?`);
    });
  }
  imageSection.appendChild(ctaBtn);

  card.appendChild(imageSection);

  // Right side: Product details
  const contentSection = document.createElement('div');
  contentSection.className = 'content-section';
  contentSection.style.cssText = `background: ${theme?.bg ?? '#1a1a1a'}; color: ${theme?.fg ?? '#fff'};`;

  // Product name
  const name = document.createElement('h2');
  name.className = 'product-name';
  name.textContent = product.name || 'Product';
  contentSection.appendChild(name);

  // Category badge
  if (product.category) {
    const badge = document.createElement('span');
    badge.className = 'category-badge';
    badge.textContent = product.category;
    contentSection.appendChild(badge);
  }

  // Description
  if (product.description) {
    const desc = document.createElement('p');
    desc.className = 'product-description';
    desc.textContent = product.description;
    contentSection.appendChild(desc);
  }

  // Features list
  if (product.features && Array.isArray(product.features) && product.features.length > 0) {
    const featuresTitle = document.createElement('h3');
    featuresTitle.className = 'features-title';
    featuresTitle.textContent = 'Key Features';
    contentSection.appendChild(featuresTitle);

    const featuresList = document.createElement('ul');
    featuresList.className = 'features-list';
    product.features.forEach(feature => {
      const li = document.createElement('li');
      li.textContent = feature;
      featuresList.appendChild(li);
    });
    contentSection.appendChild(featuresList);
  }

  // Rating
  if (product.rating !== undefined && product.rating !== null) {
    const ratingContainer = document.createElement('div');
    ratingContainer.className = 'rating-container';

    const stars = document.createElement('span');
    stars.className = 'stars';
    stars.textContent = '★'.repeat(Math.floor(product.rating)) + '☆'.repeat(5 - Math.floor(product.rating));
    ratingContainer.appendChild(stars);

    const ratingText = document.createElement('span');
    ratingText.className = 'rating-text';
    ratingText.textContent = `${product.rating}/5`;
    if (product.review_count) {
      ratingText.textContent += ` (${product.review_count} reviews)`;
    }
    ratingContainer.appendChild(ratingText);

    contentSection.appendChild(ratingContainer);
  }

  card.appendChild(contentSection);
  block.appendChild(card);
}
