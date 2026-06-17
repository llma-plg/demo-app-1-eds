// Sample data for standalone EDS preview (no bridge).
// In production, data comes dynamically from bridge.toolResult.
const SAMPLE_DATA = [
  {
    "name": "GUM® TECHNIQUE Deep Clean Toothbrush",
    "description": "Features soft tapered bristles to clean below the gumline with Quad-Grip handle for perfect brushing technique.",
    "image_url": "https://www.sunstargum.com/adobe/dynamicmedia/deliver/dm-aid--0a295760-5530-4008-a103-a99e6f050496/00070942125895-524-hero.jpg?preferwebp=true&quality=85",
    "category": "Toothbrushes"
  },
  {
    "name": "GUM® Proxabrush® Go-Betweens® Interdental Brushes",
    "description": "Clinically designed interdental brushes that remove 25% more plaque between teeth as a quick alternative to flossing.",
    "image_url": "https://www.sunstargum.com/adobe/dynamicmedia/deliver/dm-aid--9a7745a0-0800-4b08-b506-9ce82ea562f0/proxabrush-go-betweens-idb-group.jpg?preferwebp=true&quality=85",
    "category": "Interdental Cleaners"
  },
  {
    "name": "GUM® Sonic Powered Toothbrush",
    "description": "Battery-powered toothbrush with 12,000 sonic vibrations that is 50% more effective in removing plaque and reaching between teeth.",
    "image_url": "https://www.sunstargum.com/adobe/dynamicmedia/deliver/dm-aid--f5ccd9db-10f3-4785-8550-f70405cb29bf/00070942005432-4100-hero.jpg?preferwebp=true&quality=85",
    "category": "Toothbrushes"
  },
  {
    "name": "GUM® Twisted Mint® Floss Picks",
    "description": "Durable twisted mint-flavored dental floss picks that deep clean and remove 2x the plaque between tight interdental spaces.",
    "image_url": "https://www.sunstargum.com/adobe/dynamicmedia/deliver/dm-aid--32917b7c-1791-4ed6-89b9-d369f38204fc/828rr9-product-packaging-flossers-twisted-mint-hero-cleanedup-us.png?preferwebp=true&quality=85",
    "category": "Dental Floss"
  },
  {
    "name": "GUM® Soft-Picks® Comfort Flex Mint",
    "description": "Minty rubber interdental picks with soft bristles and flexible neck for comfortable plaque removal between teeth.",
    "image_url": "https://www.sunstargum.com/adobe/dynamicmedia/deliver/dm-aid--c0f4b923-ffc5-4451-a966-6962237b1621/6705r-product-packaging-idb-soft-picks-comfort-flex-mint-hero-cleanedup-us.jpg?preferwebp=true&quality=85",
    "category": "Interdental Cleaners"
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
  renderCarousel(block, items.slice(0, 5), bridge);

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

function renderCarousel(block, items, bridge) {
  const wrapper = document.createElement('div');
  wrapper.className = 'carousel-wrapper';

  const scrollContainer = document.createElement('div');
  scrollContainer.className = 'carousel-scroll';

  const CARD_COLORS = ['#378ef0','#9256d9','#0fb5ae','#e68619','#d83790','#2dca72','#4046ca','#72b340'];

  items.forEach((item, i) => {
    const card = document.createElement('div');
    card.className = 'product-card';

    const imageContainer = document.createElement('div');
    imageContainer.className = 'card-image';

    const fallbackColor = CARD_COLORS[i % CARD_COLORS.length];
    const colorDiv = () => {
      const d = document.createElement('div');
      d.style.cssText = `width:100%;height:100%;background-color:${fallbackColor};`;
      return d;
    };

    if (item.image_url) {
      const img = document.createElement('img');
      img.src = item.image_url;
      img.alt = item.name || '';
      img.style.cssText = 'width:100%;height:100%;object-fit:cover;display:block;';
      img.onerror = () => img.parentNode.replaceChild(colorDiv(), img);
      imageContainer.appendChild(img);
    } else {
      imageContainer.appendChild(colorDiv());
    }

    const ctaBtn = document.createElement('button');
    ctaBtn.className = 'cta-button';
    ctaBtn.textContent = 'View Details';
    ctaBtn.setAttribute('aria-label', `View details for ${item.name}`);
    if (bridge) {
      ctaBtn.addEventListener('click', () => {
        bridge.sendMessage(`Tell me more about ${item.name}`);
      });
    }
    imageContainer.appendChild(ctaBtn);

    card.appendChild(imageContainer);

    const content = document.createElement('div');
    content.className = 'card-content';
    content.style.cssText = `background:${theme?.bg ?? '#1a1a1a'};color:${theme?.fg ?? '#fff'}`;

    const name = document.createElement('div');
    name.className = 'card-name';
    name.textContent = item.name;
    content.appendChild(name);

    const description = document.createElement('div');
    description.className = 'card-description';
    description.textContent = item.description;
    content.appendChild(description);

    if (item.category) {
      const category = document.createElement('div');
      category.className = 'card-category';
      category.textContent = item.category;
      content.appendChild(category);
    }

    card.appendChild(content);
    scrollContainer.appendChild(card);
  });

  wrapper.appendChild(scrollContainer);

  // Navigation arrows
  const leftArrow = document.createElement('button');
  leftArrow.className = 'nav-arrow nav-left';
  leftArrow.textContent = '◀';
  leftArrow.setAttribute('aria-label', 'Scroll left');
  leftArrow.style.display = 'none';

  const rightArrow = document.createElement('button');
  rightArrow.className = 'nav-arrow nav-right';
  rightArrow.textContent = '▶';
  rightArrow.setAttribute('aria-label', 'Scroll right');

  const updateArrows = () => {
    leftArrow.style.display = scrollContainer.scrollLeft <= 0 ? 'none' : 'flex';
    rightArrow.style.display =
      scrollContainer.scrollLeft + scrollContainer.clientWidth >= scrollContainer.scrollWidth - 1
      ? 'none' : 'flex';
  };

  const scroll = (direction) => {
    const cardWidth = 220 + 16; // card width + gap
    scrollContainer.scrollBy({ left: direction * cardWidth, behavior: 'smooth' });
  };

  leftArrow.addEventListener('click', () => scroll(-1));
  rightArrow.addEventListener('click', () => scroll(1));
  leftArrow.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      scroll(-1);
    }
  });
  rightArrow.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      scroll(1);
    }
  });

  scrollContainer.addEventListener('scroll', updateArrows);

  wrapper.appendChild(leftArrow);
  wrapper.appendChild(rightArrow);

  // Right fade gradient
  if (items.length > 3) {
    const fade = document.createElement('div');
    fade.className = 'fade-gradient';
    fade.style.cssText = `position:absolute;top:0;right:0;height:100%;width:60px;background:linear-gradient(to right,transparent,${theme?.bg ?? '#1a1a1a'}cc);pointer-events:none;border-radius:0 10px 10px 0;`;
    wrapper.appendChild(fade);
  }

  block.appendChild(wrapper);
  updateArrows();
}