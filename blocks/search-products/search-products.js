// Sample data for standalone/preview mode.
// In production, data comes dynamically from bridge.toolResult.
const SAMPLE_DATA = [
  {
    "name": "GUM TECHNIQUE Deep Clean Toothbrush",
    "description": "Ultra-fine tapered bristles clean below the gumline with a Quad-Grip handle for perfect brushing technique.",
    "image_url": "https://www.sunstargum.com/adobe/dynamicmedia/deliver/dm-aid--0a295760-5530-4008-a103-a99e6f050496/00070942125895-524-hero.jpg?width=800&preferwebp=true&quality=85",
    "price": "$6.99",
    "category": "Toothbrushes"
  },
  {
    "name": "GUM SONIC POWER Battery Toothbrush",
    "description": "Offers 12,000 sonic vibrations for a deep clean, removing plaque 50% more effectively while reaching between teeth.",
    "image_url": "https://www.sunstargum.com/adobe/dynamicmedia/deliver/dm-aid--f5ccd9db-10f3-4785-8550-f70405cb29bf/00070942005432-4100-hero.jpg?width=800&preferwebp=true&quality=85",
    "category": "Toothbrushes"
  },
  {
    "name": "GUM SOFT-PICKS ORIGINAL",
    "description": "Gentle, easy-to-use rubber bristle picks for comfortable cleaning between teeth with a travel case included.",
    "image_url": "https://www.sunstargum.com/adobe/dynamicmedia/deliver/dm-aid--a9a60fce-c215-4647-93d2-af40c8df6ae0/6323r-product-packaging-btc-softpicks-original-hero-cleanedup-us.jpg?width=800&preferwebp=true&quality=85",
    "price": "$1.00",
    "category": "Interdental Cleaners"
  },
  {
    "name": "GUM SOFT-PICKS ADVANCED",
    "description": "Curved design with soft rubber bristles to easily slide between teeth and reach back molars.",
    "image_url": "https://www.sunstargum.com/adobe/dynamicmedia/deliver/dm-aid--455260c2-1b88-45d7-83d5-f84c4897a369/6504r-product-packaging-idb-soft-picks-advanced-hero-cleanedup-us.jpg?width=800&preferwebp=true&quality=85",
    "category": "Interdental Cleaners"
  },
  {
    "name": "GUM Proxabrush Go-Betweens Interdental Brushes",
    "description": "Clinically designed interdental brushes that remove 25% more plaque with triangular bristles as an effective alternative to flossing.",
    "image_url": "https://www.sunstargum.com/adobe/dynamicmedia/deliver/dm-aid--9a7745a0-0800-4b08-b506-9ce82ea562f0/proxabrush-go-betweens-idb-group.jpg?width=800&preferwebp=true&quality=85",
    "category": "Interdental Cleaners"
  }
];

// Brand palette from BuildWidgetRequest.
const PALETTE = ['#00a3e0','#0072ce','#ffffff'];

function getThemedCardBg(palette) {
  if (!palette || !palette[0]) return null;
  let hex = palette[0].replace('#','');
  if(hex.length===3)hex=hex[0]+hex[0]+hex[1]+hex[1]+hex[2]+hex[2];
  if(hex.length!==6)return null;
  let [r,g,b]=[parseInt(hex.slice(0,2),16),parseInt(hex.slice(2,4),16),parseInt(hex.slice(4,6),16)];
  if(isNaN(r)||isNaN(g)||isNaN(b))return null;
  const lum=(c)=>{const s=c/255;return s<=0.03928?s/12.92:Math.pow((s+0.055)/1.055,2.4);};
  const relLum=(r,g,b)=>0.2126*lum(r)+0.7152*lum(g)+0.0722*lum(b);
  if(relLum(r,g,b)<=0.12)return{bg:`#${hex}`,fg:'#ffffff'};
  let lo=0,hi=1;
  for(let i=0;i<20;i++){const m=(lo+hi)/2;if(relLum(Math.round(r*m),Math.round(g*m),Math.round(b*m))>0.12)hi=m;else lo=m;}
  const dr=Math.round(r*lo),dg=Math.round(g*lo),db=Math.round(b*lo);
  return{bg:`#${dr.toString(16).padStart(2,'0')}${dg.toString(16).padStart(2,'0')}${db.toString(16).padStart(2,'0')}`,fg:'#ffffff'};
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
  renderCarousel(block, items, bridge);

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

  const carousel = document.createElement('div');
  carousel.className = 'carousel';
  carousel.setAttribute('role', 'region');
  carousel.setAttribute('aria-label', 'Product carousel');

  const CARD_COLORS = ['#378ef0','#9256d9','#0fb5ae','#e68619','#d83790','#2dca72','#4046ca','#72b340'];

  items.slice(0, 5).forEach((item, i) => {
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

    if (item.image_url) {
      const img = document.createElement('img');
      img.src = item.image_url;
      img.alt = item.name || '';
      img.style.cssText = 'width:100%;height:100%;object-fit:cover;display:block;';
      img.onerror = () => {
        if (img.parentNode) img.parentNode.replaceChild(colorDiv(), img);
      };
      imageContainer.appendChild(img);
    } else {
      imageContainer.appendChild(colorDiv());
    }

    const ctaBtn = document.createElement('button');
    ctaBtn.className = 'cta-btn';
    ctaBtn.textContent = 'View Details';
    ctaBtn.setAttribute('aria-label', `View details for ${item.name || 'product'}`);
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
    name.className = 'product-name';
    name.textContent = item.name || '';
    content.appendChild(name);

    const description = document.createElement('div');
    description.className = 'product-description';
    description.textContent = item.description || '';
    content.appendChild(description);

    const footer = document.createElement('div');
    footer.className = 'product-footer';

    if (item.price) {
      const price = document.createElement('span');
      price.className = 'product-price';
      price.textContent = item.price;
      footer.appendChild(price);
    }

    if (item.category) {
      const badge = document.createElement('span');
      badge.className = 'product-badge';
      badge.textContent = item.category;
      footer.appendChild(badge);
    }

    content.appendChild(footer);
    card.appendChild(content);
    carousel.appendChild(card);
  });

  wrapper.appendChild(carousel);

  const fade = document.createElement('div');
  fade.className = 'fade-overlay';
  fade.style.cssText = `position:absolute;top:0;right:0;height:100%;width:60px;background:linear-gradient(to right,transparent,${theme?.bg ?? '#1a1a1a'}cc);pointer-events:none;border-radius:0 10px 10px 0;`;
  wrapper.appendChild(fade);

  const leftBtn = document.createElement('button');
  leftBtn.className = 'nav-btn nav-left';
  leftBtn.textContent = '◀';
  leftBtn.setAttribute('aria-label', 'Scroll left');
  leftBtn.style.display = 'none';
  leftBtn.addEventListener('click', () => {
    carousel.scrollBy({ left: -220, behavior: 'smooth' });
  });
  leftBtn.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      carousel.scrollBy({ left: -220, behavior: 'smooth' });
    }
  });
  wrapper.appendChild(leftBtn);

  const rightBtn = document.createElement('button');
  rightBtn.className = 'nav-btn nav-right';
  rightBtn.textContent = '▶';
  rightBtn.setAttribute('aria-label', 'Scroll right');
  rightBtn.addEventListener('click', () => {
    carousel.scrollBy({ left: 220, behavior: 'smooth' });
  });
  rightBtn.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      carousel.scrollBy({ left: 220, behavior: 'smooth' });
    }
  });
  wrapper.appendChild(rightBtn);

  const updateNavButtons = () => {
    const atStart = carousel.scrollLeft <= 0;
    const atEnd = carousel.scrollLeft + carousel.clientWidth >= carousel.scrollWidth - 1;
    leftBtn.style.display = atStart ? 'none' : 'flex';
    rightBtn.style.display = atEnd ? 'none' : 'flex';
  };

  carousel.addEventListener('scroll', updateNavButtons);
  updateNavButtons();

  block.appendChild(wrapper);
}
