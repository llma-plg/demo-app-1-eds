// Sample data for standalone EDS preview (no bridge).
// In production, data comes dynamically from bridge.toolResult.
const SAMPLE_DATA = [
  {
    "name": "GUM SONIC DAILY Electric Toothbrush",
    "description": "Combines sonic vibrations with manual simplicity for 50% superior cleaning between teeth.",
    "image_url": "https://www.sunstargum.com/adobe/dynamicmedia/deliver/dm-aid--fc5105f3-ba84-474b-a039-666d91c1f020/4100mwh-4100mbk-gum-sonic-daily-toothbrush-n5-p1.jpg?preferwebp=true&quality=85",
    "price": "",
    "category": "Electric Toothbrushes"
  },
  {
    "name": "GUM Original White Toothpaste",
    "description": "Gently removes up to 97% of surface stains to restore natural tooth whiteness.",
    "image_url": "https://www.sunstargum.com/adobe/dynamicmedia/deliver/dm-aid--e3c1aee8-7d6c-41ef-b197-a131089b7a5b/1745ee1-en-cs-gr-bg-ar-gum-original-white-toothpaste-white-75ml-tube-n1.jpg?quality=85&preferwebp=true",
    "price": "",
    "category": "Toothpastes"
  },
  {
    "name": "GUM Technique+ Toothbrush",
    "description": "Multi-level dome-shaped bristles for optimal everyday care of teeth and gums.",
    "image_url": "https://www.sunstargum.com/adobe/dynamicmedia/deliver/dm-aid--9b34efe3-0f17-44ed-9b43-072f07f418a3/491btm-gum-technique-plus-toothbrush-n5-p1.jpg?preferwebp=true&quality=85",
    "price": "",
    "category": "Manual Toothbrushes"
  },
  {
    "name": "GUM Soft-Picks PRO",
    "description": "Ultra-soft rubber bristles slide comfortably between teeth for gentle plaque removal.",
    "image_url": "https://www.sunstargum.com/adobe/dynamicmedia/deliver/dm-aid--eab87e52-768d-4a8f-977d-2c0637642527/691-gum-soft-picks-pro-darkgreen-l-n1.jpg?quality=85&preferwebp=true",
    "price": "",
    "category": "Interdental Cleaners"
  },
  {
    "name": "GUM Original White Floss",
    "description": "Whitening dental floss for effective plaque and stain removal between teeth.",
    "image_url": "https://www.sunstargum.com/adobe/dynamicmedia/deliver/dm-aid--37bd71e6-9fc0-44a9-8c77-d01c7b8e5ea7/2040-gum-originalwhite-interdentals-30m-n6.jpg?quality=85&preferwebp=true",
    "price": "",
    "category": "Floss"
  },
  {
    "name": "GUM Bio Mouthrinse",
    "description": "Organic mouthwash with natural ingredients for a refreshing daily oral care rinse.",
    "image_url": "https://www.sunstargum.com/adobe/dynamicmedia/deliver/dm-aid--7e20e6d4-fb76-4f8a-81e5-985ca99b84b3/7030iemea-en-it-gum-bio-mouthrinse-transparent-300ml-bottle-n1.jpg?quality=85&preferwebp=true",
    "price": "",
    "category": "Mouthwashes"
  }
];

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
  wrapper.style.position = 'relative';

  const carousel = document.createElement('div');
  carousel.className = 'products-carousel';

  const CARD_COLORS = ['#378ef0','#9256d9','#0fb5ae','#e68619','#d83790','#2dca72','#4046ca','#72b340'];

  products.slice(0, 6).forEach((product, i) => {
    const card = document.createElement('div');
    card.className = 'product-card';

    const imageContainer = document.createElement('div');
    imageContainer.className = 'product-image';

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
    info.className = 'product-info';
    info.style.cssText = `background:${theme?.bg ?? '#1a1a1a'};color:${theme?.fg ?? '#fff'}`;

    if (product.category) {
      const badge = document.createElement('span');
      badge.className = 'category-badge';
      badge.textContent = product.category;
      info.appendChild(badge);
    }

    const title = document.createElement('h3');
    title.textContent = product.name || 'Product';
    title.style.color = theme?.fg ?? '#fff';
    info.appendChild(title);

    const desc = document.createElement('p');
    desc.className = 'product-description';
    desc.textContent = product.description || '';
    desc.style.color = theme?.fg ?? '#fff';
    info.appendChild(desc);

    card.appendChild(info);
    carousel.appendChild(card);
  });

  wrapper.appendChild(carousel);

  const fade = document.createElement('div');
  fade.style.cssText = `position:absolute;top:0;right:0;height:100%;width:60px;background:linear-gradient(to right,transparent,${theme?.bg ?? '#1a1a1a'}cc);pointer-events:none;border-radius:0 10px 10px 0;`;
  wrapper.appendChild(fade);

  const leftArrow = document.createElement('button');
  leftArrow.className = 'carousel-arrow left';
  leftArrow.innerHTML = '&#9664;';
  leftArrow.setAttribute('aria-label', 'Scroll left');
  leftArrow.style.display = 'none';
  leftArrow.addEventListener('click', () => {
    carousel.scrollBy({ left: -220, behavior: 'smooth' });
  });
  leftArrow.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      carousel.scrollBy({ left: -220, behavior: 'smooth' });
    }
  });

  const rightArrow = document.createElement('button');
  rightArrow.className = 'carousel-arrow right';
  rightArrow.innerHTML = '&#9654;';
  rightArrow.setAttribute('aria-label', 'Scroll right');
  rightArrow.addEventListener('click', () => {
    carousel.scrollBy({ left: 220, behavior: 'smooth' });
  });
  rightArrow.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      carousel.scrollBy({ left: 220, behavior: 'smooth' });
    }
  });

  carousel.addEventListener('scroll', () => {
    const isAtStart = carousel.scrollLeft <= 0;
    const isAtEnd = carousel.scrollLeft + carousel.clientWidth >= carousel.scrollWidth - 1;
    leftArrow.style.display = isAtStart ? 'none' : 'flex';
    rightArrow.style.display = isAtEnd ? 'none' : 'flex';
  });

  wrapper.appendChild(leftArrow);
  wrapper.appendChild(rightArrow);

  block.appendChild(wrapper);

  setTimeout(() => {
    const isAtEnd = carousel.scrollLeft + carousel.clientWidth >= carousel.scrollWidth - 1;
    rightArrow.style.display = isAtEnd ? 'none' : 'flex';
  }, 100);
}
