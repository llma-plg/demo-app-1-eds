// Sample data for standalone EDS preview (no bridge).
// In production, data comes dynamically from bridge.toolResult.
const SAMPLE_DATA = [
  {
    "name": "GUM Technique+ Toothbrush",
    "description": "Multi-level bristle toothbrush designed for advanced cleaning along gum line and tooth surfaces.",
    "image_url": "https://www.sunstargum.com/content/dam/gum/regional/gb-en/products/toothbrushes/gum-technique-plus-toothbrush/GUM_Technique_Plus_Compact_Soft_Yellow_491_Angled_Thehical.png",
    "category": "Toothbrushes"
  },
  {
    "name": "GUM ActiVital Toothpaste",
    "description": "Daily toothpaste with antioxidants and Q10 for gentle plaque protection and gum vitality.",
    "image_url": "https://www.sunstargum.com/content/dam/gum/regional/gb-en/products/toothpastes/gum-activital-toothpaste/GUM_ActiVital_Toothpaste_75ml_6050_Angled.png",
    "category": "Toothpastes"
  },
  {
    "name": "GUM TRAV-LER Interdental Brush",
    "description": "Innovative interdental brush with triangular bristle technology for effective between-teeth cleaning.",
    "image_url": "https://www.sunstargum.com/content/dam/gum/regional/gb-en/products/interdental-brushes/gum-trav-ler-interdental-brush/GUM_TRAV-LER_1314_Angled.png",
    "category": "Interdental Brushes"
  },
  {
    "name": "GUM Expanding Floss",
    "description": "Dental floss that expands during use to adapt to varying interdental spaces for effective plaque removal.",
    "image_url": "https://www.sunstargum.com/content/dam/gum/regional/gb-en/products/floss/gum-expanding-floss/GUM_Expanding_Floss_30m_2030_Angled.png",
    "category": "Floss"
  },
  {
    "name": "GUM Soft-Picks Original",
    "description": "Flexible rubber interdental picks for gentle and easy cleaning between teeth.",
    "image_url": "https://www.sunstargum.com/content/dam/gum/regional/gb-en/products/rubber-picks/gum-soft-picks-original/GUM_Soft-Picks_Original_Regular_50_670_Angled.png",
    "category": "Rubber Picks"
  }
];

// Brand palette from BuildWidgetRequest — used to derive card info-strip background.
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
  return { bg:`#${dr.toString(16).padStart(2,'0')}${dg.toString(16).padStart(2,'0')}${db.toString(16).padStart(2,'0')}`, fg:'#ffffff' };
}

const CARD_COLORS = ['#378ef0','#9256d9','#0fb5ae','#e68619','#d83790','#2dca72','#4046ca','#72b340'];

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
  const theme = getThemedCardBg(PALETTE);
  renderProducts(block, items, theme, bridge);

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

function renderProducts(block, products, theme, bridge) {
  const wrapper = document.createElement('div');
  wrapper.className = 'search-products-wrapper';

  const carousel = document.createElement('div');
  carousel.className = 'search-products-carousel';

  const itemsToShow = products.slice(0, 5);
  itemsToShow.forEach((product, i) => {
    const card = document.createElement('div');
    card.className = 'search-products-card';

    const imageContainer = document.createElement('div');
    imageContainer.className = 'search-products-image';

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
      img.style.cssText = 'width:100%;height:100%;object-fit:cover;display:block;';
      img.onerror = () => img.parentNode.replaceChild(colorDiv(), img);
      imageContainer.appendChild(img);
    } else {
      imageContainer.appendChild(colorDiv());
    }

    const ctaBtn = document.createElement('button');
    ctaBtn.className = 'search-products-cta';
    ctaBtn.textContent = 'View Details';
    ctaBtn.setAttribute('aria-label', `View details for ${product.name || 'product'}`);
    if (bridge) {
      ctaBtn.addEventListener('click', () => {
        bridge.sendMessage(`Tell me more about ${product.name}`);
      });
    }
    imageContainer.appendChild(ctaBtn);

    card.appendChild(imageContainer);

    const info = document.createElement('div');
    info.className = 'search-products-info';
    info.style.cssText = `background:${theme?.bg ?? '#1a1a1a'};color:${theme?.fg ?? '#fff'}`;

    const title = document.createElement('div');
    title.className = 'search-products-title';
    title.textContent = product.name || '';
    info.appendChild(title);

    const desc = document.createElement('div');
    desc.className = 'search-products-desc';
    desc.textContent = product.description || '';
    info.appendChild(desc);

    if (product.category) {
      const badge = document.createElement('div');
      badge.className = 'search-products-badge';
      badge.textContent = product.category;
      info.appendChild(badge);
    }

    card.appendChild(info);
    carousel.appendChild(card);
  });

  wrapper.appendChild(carousel);

  if (products.length > 3) {
    const fade = document.createElement('div');
    fade.className = 'search-products-fade';
    fade.style.cssText = `position:absolute;top:0;right:0;height:100%;width:60px;background:linear-gradient(to right,transparent,${theme?.bg ?? '#1a1a1a'}cc);pointer-events:none;border-radius:0 10px 10px 0;`;
    wrapper.appendChild(fade);
  }

  const leftArrow = document.createElement('button');
  leftArrow.className = 'search-products-arrow search-products-arrow-left';
  leftArrow.textContent = '◀';
  leftArrow.setAttribute('aria-label', 'Scroll left');
  leftArrow.style.display = 'none';

  const rightArrow = document.createElement('button');
  rightArrow.className = 'search-products-arrow search-products-arrow-right';
  rightArrow.textContent = '▶';
  rightArrow.setAttribute('aria-label', 'Scroll right');

  const updateArrows = () => {
    const scrollLeft = carousel.scrollLeft;
    const scrollWidth = carousel.scrollWidth;
    const clientWidth = carousel.clientWidth;
    leftArrow.style.display = scrollLeft <= 1 ? 'none' : 'flex';
    rightArrow.style.display = scrollLeft + clientWidth >= scrollWidth - 1 ? 'none' : 'flex';
  };

  const scrollByCard = (direction) => {
    const cardWidth = 220 + 16;
    carousel.scrollBy({ left: direction * cardWidth, behavior: 'smooth' });
  };

  leftArrow.addEventListener('click', () => scrollByCard(-1));
  rightArrow.addEventListener('click', () => scrollByCard(1));
  leftArrow.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); scrollByCard(-1); } });
  rightArrow.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); scrollByCard(1); } });

  carousel.addEventListener('scroll', updateArrows);
  updateArrows();

  wrapper.appendChild(leftArrow);
  wrapper.appendChild(rightArrow);
  block.appendChild(wrapper);
}