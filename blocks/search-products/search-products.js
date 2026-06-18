// Sample data for standalone EDS preview (no bridge).
// In production, data comes dynamically from bridge.toolResult.
const SAMPLE_DATA = [
  {
    "name": "GUM® TECHNIQUE Deep Clean Toothbrush",
    "description": "Features soft tapered bristles to clean below the gumline with a Quad-Grip handle for perfect brushing technique.",
    "image_url": "https://www.sunstargum.com/adobe/dynamicmedia/deliver/dm-aid--0a295760-5530-4008-a103-a99e6f050496/00070942125895-524-hero.jpg?preferwebp=true&width=1600&quality=85",
    "category": "Toothbrushes"
  },
  {
    "name": "GUM® Professional Clean Floss Picks",
    "description": "Durable mint-flavor dental floss that holds up against the tightest interdental spaces without shredding.",
    "image_url": "https://www.sunstargum.com/adobe/dynamicmedia/deliver/dm-aid--55618c00-ce9d-42fe-a7ea-4207b94c8253/893rr9-product-packaging-flossers-pro-clean-hero-cleanedup-us.png?width=1600&quality=85&preferwebp=true",
    "category": "Dental Floss"
  },
  {
    "name": "GUM® Soft-Picks® Original",
    "description": "Gentle, easy-to-use rubber bristle picks for comfortable interdental cleaning.",
    "image_url": "https://www.sunstargum.com/content/dam/sunstar-americas/gum/product-catalogue/us/con/interdental/6323R-Product-Packaging-BTC-SoftPicks-Original-Hero-CleanedUp-US.jpg",
    "category": "Interdental Cleaners"
  },
  {
    "name": "GUM® Sonic Powered Toothbrush",
    "description": "Offers 12,000 sonic vibrations for a deep clean, removing plaque 50% more effectively while reaching between teeth.",
    "image_url": "https://www.sunstargum.com/adobe/dynamicmedia/deliver/dm-aid--f5ccd9db-10f3-4785-8550-f70405cb29bf/00070942005432-4100-hero.jpg?preferwebp=true&width=1600&quality=85",
    "category": "Toothbrushes"
  },
  {
    "name": "GUM® Soft-Picks® Comfort Flex",
    "description": "Soft rubber bristles with a flexible neck for easy removal of food residue and plaque between teeth.",
    "image_url": "https://www.sunstargum.com/content/dam/sunstar-americas/gum/product-catalogue/us/con/interdental/6705R-Product-Packaging-IDB-Soft-Picks-Comfort-Flex-Mint-Hero-CleanedUp.US.jpg",
    "category": "Interdental Cleaners"
  },
  {
    "name": "GUM® ButlerWeave Dental Floss",
    "description": "Strong, smooth floss resistant to shredding that effectively removes plaque between teeth and below the gumline.",
    "image_url": "https://www.sunstargum.com/content/dam/sunstar-americas/gum/product-catalogue/us/con/interdental/1840RQ-Product-Packaging-Floss-ButlerWeave-Mint-Hero-CleanedUp.US.jpg",
    "category": "Dental Floss"
  }
];

// Brand palette from BuildWidgetRequest — used to derive card info-strip background.
const PALETTE = ['#009257', '#2cb573'];

// Darkens palette[0] to luminance ≤ 0.12 so white text has WCAG AA contrast.
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
  return { bg: `#${dr.toString(16).padStart(2, '0')}${dg.toString(16).padStart(2, '0')}${db.toString(16).padStart(2, '0')}`, fg: '#ffffff' };
}

const theme = getThemedCardBg(PALETTE);

// Distinct card fallback colors for broken images
const CARD_COLORS = ['#378ef0', '#9256d9', '#0fb5ae', '#e68619', '#d83790', '#2dca72', '#4046ca', '#72b340'];

export default async function decorate(block, bridge) {
  let products;

  if (bridge) {
    bridge.applyHostStyles();
    const isPreview = bridge.hostContext?.preview === true;
    if (isPreview) {
      products = SAMPLE_DATA;
    } else {
      const _result = await bridge.toolResult;
      const structuredContent = _result?.structuredContent || _result;
      // structuredContent.products — bare array outputSchema; key derived from actionName "search_products"
      products = structuredContent?.products || [];
    }
  } else {
    products = SAMPLE_DATA;
  }

  block.textContent = '';
  renderProducts(block, products, bridge);

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

function renderProducts(block, products, bridge) {
  const wrapper = document.createElement('div');
  wrapper.className = 'carousel-wrapper';

  const carousel = document.createElement('div');
  carousel.className = 'carousel';

  products.forEach((product, i) => {
    const card = document.createElement('div');
    card.className = 'product-card';

    const imageContainer = document.createElement('div');
    imageContainer.className = 'image-container';

    const fallbackColor = CARD_COLORS[i % CARD_COLORS.length];
    const colorDiv = () => {
      const d = document.createElement('div');
      d.style.cssText = `width:100%;height:100%;background-color:${fallbackColor};`;
      return d;
    };

    if (product.image_url) {
      const img = document.createElement('img');
      img.src = product.image_url;
      img.alt = product.name || '';
      img.loading = 'lazy';
      img.onerror = () => {
        if (img.parentNode) {
          img.parentNode.replaceChild(colorDiv(), img);
        }
      };
      imageContainer.appendChild(img);
    } else {
      imageContainer.appendChild(colorDiv());
    }

    // Category badge in top corner
    if (product.category) {
      const badge = document.createElement('div');
      badge.className = 'category-badge';
      badge.textContent = product.category;
      imageContainer.appendChild(badge);
    }

    // CTA button on image
    const ctaBtn = document.createElement('button');
    ctaBtn.className = 'cta-button';
    ctaBtn.textContent = 'View Details';
    if (bridge) {
      ctaBtn.addEventListener('click', () => {
        bridge.sendMessage(`Tell me more about ${product.name}`);
      });
    }
    imageContainer.appendChild(ctaBtn);

    card.appendChild(imageContainer);

    // Card content section with darkened palette bg
    const content = document.createElement('div');
    content.className = 'card-content';
    content.style.cssText = `background:${theme?.bg ?? '#1a1a1a'};color:${theme?.fg ?? '#fff'}`;

    const name = document.createElement('h3');
    name.className = 'product-name';
    name.textContent = product.name;
    content.appendChild(name);

    const description = document.createElement('p');
    description.className = 'product-description';
    description.textContent = product.description;
    content.appendChild(description);

    card.appendChild(content);
    carousel.appendChild(card);
  });

  wrapper.appendChild(carousel);

  // Right fade gradient to signal more content
  const fade = document.createElement('div');
  fade.className = 'fade-overlay';
  fade.style.cssText = `position:absolute;top:0;right:0;height:100%;width:60px;background:linear-gradient(to right,transparent,${theme?.bg ?? '#1a1a1a'}cc);pointer-events:none;border-radius:0 10px 10px 0;`;
  wrapper.appendChild(fade);

  // Navigation arrows
  const leftArrow = document.createElement('button');
  leftArrow.className = 'nav-arrow nav-left';
  leftArrow.setAttribute('aria-label', 'Scroll left');
  leftArrow.textContent = '◀';
  leftArrow.style.display = 'none'; // Hidden at start

  const rightArrow = document.createElement('button');
  rightArrow.className = 'nav-arrow nav-right';
  rightArrow.setAttribute('aria-label', 'Scroll right');
  rightArrow.textContent = '▶';

  const updateArrows = () => {
    const { scrollLeft, scrollWidth, clientWidth } = carousel;
    leftArrow.style.display = scrollLeft > 5 ? 'flex' : 'none';
    rightArrow.style.display = scrollLeft + clientWidth < scrollWidth - 5 ? 'flex' : 'none';
  };

  const scrollByCard = (direction) => {
    const cardWidth = 220 + 16; // card width + gap
    carousel.scrollBy({ left: direction * cardWidth, behavior: 'smooth' });
  };

  leftArrow.addEventListener('click', () => scrollByCard(-1));
  rightArrow.addEventListener('click', () => scrollByCard(1));

  leftArrow.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      scrollByCard(-1);
    }
  });

  rightArrow.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      scrollByCard(1);
    }
  });

  carousel.addEventListener('scroll', updateArrows);
  updateArrows();

  wrapper.appendChild(leftArrow);
  wrapper.appendChild(rightArrow);

  block.appendChild(wrapper);
}
