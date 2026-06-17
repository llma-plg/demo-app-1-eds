// Sample data for standalone/preview mode.
// In production, data comes dynamically from bridge.toolResult.
const SAMPLE_DATA = [
  { name: 'GUM Soft-Picks Advanced', description: 'Gentle interdental cleaners for sensitive gums', category: 'Interdental Cleaners', sku: 'SP-ADV-01' },
  { name: 'GUM Flossers', description: 'Easy-to-use disposable flossers with fresh mint flavor', category: 'Dental Floss', sku: 'FLS-MNT-01' },
  { name: 'GUM Crayola Toothbrush', description: 'Colorful kids toothbrush with soft bristles', category: 'Toothbrushes', sku: 'TB-KID-01' },
  { name: 'GUM Proxabrush Go-Betweens', description: 'Tapered interdental brushes for hard-to-reach areas', category: 'Interdental Cleaners', sku: 'GB-TPN-01' },
  { name: 'GUM Travel Kit', description: 'Complete oral care essentials in a compact case', category: 'Kits', sku: 'KIT-TRV-01' },
];

// Brand palette from BuildWidgetRequest — used to derive card info-strip background.
const PALETTE = [];

// Fallback colors for missing images (per-card rotation)
const CARD_COLORS = ['#378ef0', '#9256d9', '#0fb5ae', '#e68619', '#d83790', '#2dca72', '#4046ca', '#72b340'];

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
    if (relLum(Math.round(r * m), Math.round(g * m), Math.round(b * m)) > 0.12) hi = m;
    else lo = m;
  }
  const dr = Math.round(r * lo), dg = Math.round(g * lo), db = Math.round(b * lo);
  return { bg: `#${dr.toString(16).padStart(2, '0')}${dg.toString(16).padStart(2, '0')}${db.toString(16).padStart(2, '0')}`, fg: '#ffffff' };
}

const theme = getThemedCardBg(PALETTE);

export default async function decorate(block, bridge) {
  let items;

  if (bridge) {
    bridge.applyHostStyles();
    const isPreview = bridge.hostContext?.preview === true;
    if (isPreview) {
      items = SAMPLE_DATA;
    } else {
      const _result = await bridge.toolResult;
      const structuredContent = _result?.structuredContent || _result;
      // structuredContent.products — bare array outputSchema; key derived from actionName "search_products"
      items = structuredContent?.products || [];
    }
  } else {
    items = SAMPLE_DATA;
  }

  block.textContent = '';
  renderProducts(block, items, bridge);

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

  const container = document.createElement('div');
  container.className = 'carousel-container';

  products.slice(0, 5).forEach((product, index) => {
    const card = document.createElement('div');
    card.className = 'product-card';

    // Image container
    const imageContainer = document.createElement('div');
    imageContainer.className = 'image-container';

    const fallbackColor = CARD_COLORS[index % CARD_COLORS.length];
    const createColorDiv = () => {
      const div = document.createElement('div');
      div.style.cssText = `width:100%;height:100%;background-color:${fallbackColor};`;
      return div;
    };

    if (product.image_url) {
      const img = document.createElement('img');
      img.src = product.image_url;
      img.alt = product.name || 'Product';
      img.onerror = () => {
        const colorDiv = createColorDiv();
        img.parentNode.replaceChild(colorDiv, img);
      };
      imageContainer.appendChild(img);
    } else {
      imageContainer.appendChild(createColorDiv());
    }

    // CTA button on image
    const ctaButton = document.createElement('button');
    ctaButton.className = 'cta-button';
    ctaButton.textContent = 'View Details';
    ctaButton.setAttribute('aria-label', `View details for ${product.name || 'product'}`);
    if (bridge) {
      ctaButton.addEventListener('click', () => {
        bridge.sendMessage(`Tell me more about ${product.name || 'this product'}`);
      });
    }
    imageContainer.appendChild(ctaButton);

    card.appendChild(imageContainer);

    // Card content
    const content = document.createElement('div');
    content.className = 'card-content';
    content.style.cssText = `background: ${theme?.bg ?? '#1a1a1a'}; color: ${theme?.fg ?? '#fff'};`;

    const name = document.createElement('h3');
    name.className = 'product-name';
    name.textContent = product.name || 'Product';
    content.appendChild(name);

    if (product.description) {
      const desc = document.createElement('p');
      desc.className = 'product-description';
      desc.textContent = product.description;
      content.appendChild(desc);
    }

    if (product.category) {
      const badge = document.createElement('span');
      badge.className = 'category-badge';
      badge.textContent = product.category;
      content.appendChild(badge);
    }

    card.appendChild(content);
    container.appendChild(card);
  });

  wrapper.appendChild(container);

  // Navigation arrows
  const leftArrow = document.createElement('button');
  leftArrow.className = 'nav-arrow left hidden';
  leftArrow.innerHTML = '◀';
  leftArrow.setAttribute('aria-label', 'Scroll left');
  leftArrow.addEventListener('click', () => {
    container.scrollBy({ left: -236, behavior: 'smooth' });
  });
  leftArrow.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      container.scrollBy({ left: -236, behavior: 'smooth' });
    }
  });

  const rightArrow = document.createElement('button');
  rightArrow.className = 'nav-arrow right';
  rightArrow.innerHTML = '▶';
  rightArrow.setAttribute('aria-label', 'Scroll right');
  rightArrow.addEventListener('click', () => {
    container.scrollBy({ left: 236, behavior: 'smooth' });
  });
  rightArrow.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      container.scrollBy({ left: 236, behavior: 'smooth' });
    }
  });

  wrapper.appendChild(leftArrow);
  wrapper.appendChild(rightArrow);

  // Right fade overlay
  const fade = document.createElement('div');
  fade.className = 'fade-overlay';
  fade.style.cssText = `background: linear-gradient(to right, transparent, ${theme?.bg ?? '#1a1a1a'}cc);`;
  wrapper.appendChild(fade);

  // Update arrow visibility on scroll
  const updateArrows = () => {
    const { scrollLeft, scrollWidth, clientWidth } = container;
    leftArrow.classList.toggle('hidden', scrollLeft <= 0);
    rightArrow.classList.toggle('hidden', scrollLeft + clientWidth >= scrollWidth - 1);
  };

  container.addEventListener('scroll', updateArrows);
  updateArrows();

  block.appendChild(wrapper);
}