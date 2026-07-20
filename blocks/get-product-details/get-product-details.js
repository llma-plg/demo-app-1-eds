// Sample data for standalone/preview mode
const SAMPLE_DATA = [
  {
    name: "GUM® TECHNIQUE Deep Clean Toothbrush",
    description: "Features soft tapered bristles to clean below the gumline with a Quad-Grip handle for perfect brushing technique.",
    image_url: "https://www.sunstargum.com/adobe/dynamicmedia/deliver/dm-aid--0a295760-5530-4008-a103-a99e6f050496/00070942125895-524-hero.jpg?preferwebp=true&width=1600&quality=85",
    category: "Toothbrushes"
  },
  {
    name: "GUM® Professional Clean Floss Picks",
    description: "Durable mint-flavor dental floss that holds up against the tightest interdental spaces without shredding.",
    image_url: "https://www.sunstargum.com/adobe/dynamicmedia/deliver/dm-aid--55618c00-ce9d-42fe-a7ea-4207b94c8253/893rr9-product-packaging-flossers-pro-cleanedup-us.png?width=1600&quality=85&preferwebp=true",
    category: "Dental Floss"
  },
  {
    name: "GUM® Soft-Picks® Original",
    description: "Gentle, easy-to-use rubber bristle picks for comfortable interdental cleaning.",
    image_url: "https://www.sunstargum.com/content/dam/sunstar-americas/gum/product-catalogue/us/con/interdental/6323R-Product-Packaging-BTC-SoftPicks-Original-Hero-CleanedUp-US.jpg",
    category: "Interdental Cleaners"
  },
  {
    name: "GUM® Sonic Powered Toothbrush",
    description: "Offers 12,000 sonic vibrations for a deep clean, removing plaque 50% more effectively while reaching between teeth.",
    image_url: "https://www.sunstargum.com/adobe/dynamicmedia/deliver/dm-aid--f5ccd9db-10f3-4785-8550-f70405cb29bf/00070942005432-4100-hero.jpg?preferwebp=true&width=1600&quality=85",
    category: "Toothbrushes"
  },
  {
    name: "GUM® Soft-Picks® Comfort Flex",
    description: "Soft rubber bristles with a flexible neck for easy removal of food residue and plaque between teeth.",
    image_url: "https://www.sunstargum.com/content/dam/sunstar-americas/gum/product-catalogue/us/con/interdental/6705R-Product-Packaging-IDB-Soft-Picks-Comfort-Flex-Mint-Hero-CleanedUp.US.jpg",
    category: "Interdental Cleaners"
  },
  {
    name: "GUM® ButlerWeave Dental Floss",
    description: "Strong, smooth floss resistant to shredding that effectively removes plaque between teeth and below the gumline.",
    image_url: "https://www.sunstargum.com/content/dam/sunstar-americas/gum/product-catalogue/us/con/interdental/1840RQ-Product-Packaging-Floss-ButlerWeave-Mint-Hero-CleanedUp.US.jpg",
    category: "Dental Floss"
  }
];

const PALETTE = ['#009257', '#2cb573'];

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
      product = SAMPLE_DATA[0];
    } else {
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
    block.textContent = 'No product data available.';
    return;
  }

  const card = document.createElement('div');
  card.className = 'detail-card';

  const imageContainer = document.createElement('div');
  imageContainer.className = 'image-container';

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
    img.onerror = () => {
      if (img.parentNode) {
        img.parentNode.replaceChild(colorDiv(), img);
      }
    };
    imageContainer.appendChild(img);
  } else {
    imageContainer.appendChild(colorDiv());
  }

  const ctaBtn = document.createElement('button');
  ctaBtn.className = 'cta-btn';
  ctaBtn.textContent = 'Where to Buy';
  ctaBtn.setAttribute('aria-label', `Find where to buy ${product.name || 'this product'}`);
  if (bridge) {
    ctaBtn.addEventListener('click', () => {
      bridge.sendMessage(`Where can I buy ${product.name || 'this product'}?`);
    });
  }
  imageContainer.appendChild(ctaBtn);

  card.appendChild(imageContainer);

  const content = document.createElement('div');
  content.className = 'content';
  content.style.cssText = `background:${theme?.bg ?? '#1a1a1a'};color:${theme?.fg ?? '#fff'}`;

  if (product.category) {
    const category = document.createElement('div');
    category.className = 'category';
    category.textContent = product.category;
    content.appendChild(category);
  }

  const name = document.createElement('h2');
  name.className = 'product-name';
  name.textContent = product.name || 'Product';
  content.appendChild(name);

  if (product.description) {
    const desc = document.createElement('p');
    desc.className = 'description';
    desc.textContent = product.description;
    content.appendChild(desc);
  }

  if (product.features && Array.isArray(product.features) && product.features.length > 0) {
    const featuresList = document.createElement('ul');
    featuresList.className = 'features';
    product.features.forEach(feature => {
      const li = document.createElement('li');
      li.textContent = feature;
      featuresList.appendChild(li);
    });
    content.appendChild(featuresList);
  }

  if (product.rating || product.review_count) {
    const ratingInfo = document.createElement('div');
    ratingInfo.className = 'rating-info';

    if (product.rating) {
      const stars = document.createElement('span');
      stars.className = 'stars';
      stars.setAttribute('aria-label', `${product.rating} out of 5 stars`);
      stars.textContent = '★'.repeat(Math.round(product.rating)) + ' ' + product.rating.toFixed(1);
      ratingInfo.appendChild(stars);
    }

    if (product.review_count) {
      const reviews = document.createElement('span');
      reviews.textContent = `(${product.review_count} reviews)`;
      ratingInfo.appendChild(reviews);
    }

    content.appendChild(ratingInfo);
  }

  if (product.sku) {
    const sku = document.createElement('div');
    sku.className = 'sku';
    sku.textContent = `SKU: ${product.sku}`;
    content.appendChild(sku);
  }

  // "Continue on website" handoff: mint a single-use token carrying the user's
  // anonymized intent (echoed by the get-product-details handler into
  // structuredContent.intent), then ask the host to open the partner site with
  // only the opaque token in the URL. Only shown inside a host bridge — a
  // standalone EDS preview has no host to open a link through.
  if (bridge) {
    const continueBtn = document.createElement('button');
    continueBtn.className = 'continue-btn';
    continueBtn.textContent = 'Continue on website';
    continueBtn.setAttribute('aria-label', 'Continue this session on the website');
    continueBtn.addEventListener('click', async () => {
      continueBtn.disabled = true;
      const original = continueBtn.textContent;
      continueBtn.textContent = 'Preparing link…';
      try {
        // Prefer the model-supplied intent; fall back to a product-derived one
        // so the handoff still carries context if the model omitted intent.
        const intent = product.intent
          || (product.name ? `user is interested in ${product.name}` : '');
        // eslint-disable-next-line no-console
        console.log('[handoff] minting, intent =', intent || '(empty)');
        const result = await bridge.callTool('mint-handoff', { intent });
        // eslint-disable-next-line no-console
        console.log('[handoff] mint result =', result);
        const token = result?.structuredContent?.token;
        if (!token) throw new Error('no token returned');

        // Hard-coded partner site resume page (no trailing slash — the path is
        // appended below). The host must allow this origin (redirectDomains).
        const PARTNER_BASE = 'https://www.sunstargum.com/us-en';
        const url = `${PARTNER_BASE}/resume?h=${encodeURIComponent(token)}`;

        // Open the external URL. ChatGPT implements the vendor openExternal
        // (gated on redirectDomains); the MCP-standard ui/open-link is used by
        // other hosts. Try the vendor API first, then the bridge, then a
        // plain anchor as a last resort.
        // eslint-disable-next-line no-console
        console.log('[handoff] opening', url);
        if (typeof window !== 'undefined' && typeof window.openai?.openExternal === 'function') {
          window.openai.openExternal({ href: url });
        } else if (typeof bridge.openLink === 'function') {
          await bridge.openLink(url);
        } else {
          window.open(url, '_blank', 'noopener');
        }
        continueBtn.textContent = 'Opening website…';
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error('[handoff] failed:', e);
        continueBtn.disabled = false;
        continueBtn.textContent = original;
      }
    });
    content.appendChild(continueBtn);
  }

  card.appendChild(content);
  block.appendChild(card);
}
