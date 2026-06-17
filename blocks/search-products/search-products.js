const SAMPLE_DATA = [
  {
    "name": "GUM PRO Toothbrush",
    "description": "Thin-tipped bristles for superior deep clean, cleans 7x deeper below the gum line.",
    "image_url": "https://www.sunstargum.com/adobe/dynamicmedia/deliver/dm-aid--b5d59fef-26ae-49cc-b97e-5abc1dbcead6/525btm-gum-pro-toothbrush-n5-p1.jpg?preferwebp=true&quality=85",
    "category": "Toothbrushes"
  },
  {
    "name": "GUM Technique+ Toothbrush",
    "description": "Dome-shaped bristles for optimal everyday care of teeth and gums with ergonomic 45-degree handle.",
    "image_url": "https://www.sunstargum.com/adobe/dynamicmedia/deliver/dm-aid--9b34efe3-0f17-44ed-9b43-072f07f418a3/491btm-gum-technique-plus-toothbrush-n5-p1.jpg?preferwebp=true&quality=85",
    "category": "Toothbrushes"
  },
  {
    "name": "GUM TRAV-LER Interdental Brush",
    "description": "Innovative interdental brush with triangular bristles removing up to 25% more plaque.",
    "image_url": "https://www.sunstargum.com/adobe/dynamicmedia/deliver/dm-aid--18e87415-18c9-4ba3-8365-0c8b41dced6e/p1312-gum-travler-brush-red.png?preferwebp=true&quality=85",
    "category": "Interdental Brushes"
  },
  {
    "name": "GUM SOFT-PICKS Original",
    "description": "Gentle rubber interdental cleaners with flexible bristles for easy between-teeth cleaning.",
    "image_url": "https://www.sunstargum.com/adobe/dynamicmedia/deliver/dm-aid--971419e8-f384-4b56-9e10-6bed87869a88/632-gum-soft-picksoriginal-interdentals-lightgreen-medium-n1.jpg?preferwebp=true&quality=85",
    "category": "Rubber Picks"
  },
  {
    "name": "GUM PAROEX 0.12% Intensive Action Mouthwash",
    "description": "Dual antiplaque mouthwash with chlorhexidine for intensive gum care and plaque control.",
    "image_url": "https://www.sunstargum.com/adobe/dynamicmedia/deliver/dm-aid--d1e4b9ff-6c81-4bf4-84db-1c098f2b77ad/1784emea1-emea-gum-paroex-012-mouthrinse-red-300ml-bottle-n1.jpg?preferwebp=true&quality=85",
    "category": "Mouthwashes"
  }
];

const PALETTE = ['#e30613', '#00a0af', '#ffffff'];
const CARD_COLORS = ['#378ef0','#9256d9','#0fb5ae','#e68619','#d83790','#2dca72','#4046ca','#72b340'];

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

  const wrapper = document.createElement('div');
  wrapper.className = 'carousel-wrapper';

  const container = document.createElement('div');
  container.className = 'carousel-container';

  const leftArrow = document.createElement('button');
  leftArrow.className = 'carousel-arrow left-arrow';
  leftArrow.setAttribute('aria-label', 'Scroll left');
  leftArrow.textContent = '◀';
  leftArrow.style.display = 'none';

  const rightArrow = document.createElement('button');
  rightArrow.className = 'carousel-arrow right-arrow';
  rightArrow.setAttribute('aria-label', 'Scroll right');
  rightArrow.textContent = '▶';

  wrapper.appendChild(leftArrow);
  wrapper.appendChild(container);
  wrapper.appendChild(rightArrow);

  products.slice(0, 5).forEach((product, index) => {
    const card = document.createElement('div');
    card.className = 'product-card';

    const imageWrapper = document.createElement('div');
    imageWrapper.className = 'card-image';

    const fallbackColor = CARD_COLORS[index % CARD_COLORS.length];
    const createColorDiv = () => {
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
          img.parentNode.replaceChild(createColorDiv(), img);
        }
      };
      imageWrapper.appendChild(img);
    } else {
      imageWrapper.appendChild(createColorDiv());
    }

    if (product.category) {
      const badge = document.createElement('span');
      badge.className = 'category-badge';
      badge.textContent = product.category;
      imageWrapper.appendChild(badge);
    }

    const ctaBtn = document.createElement('button');
    ctaBtn.className = 'cta-button';
    ctaBtn.textContent = 'View Details';
    if (bridge) {
      ctaBtn.addEventListener('click', () => {
        bridge.sendMessage(`Tell me more about ${product.name}`);
      });
    }
    imageWrapper.appendChild(ctaBtn);

    card.appendChild(imageWrapper);

    const info = document.createElement('div');
    info.className = 'card-info';
    info.style.cssText = `background:${theme?.bg ?? '#1a1a1a'};color:${theme?.fg ?? '#fff'}`;

    const name = document.createElement('div');
    name.className = 'product-name';
    name.textContent = product.name;
    info.appendChild(name);

    const desc = document.createElement('div');
    desc.className = 'product-description';
    desc.textContent = product.description;
    info.appendChild(desc);

    card.appendChild(info);
    container.appendChild(card);
  });

  const fade = document.createElement('div');
  fade.className = 'fade-gradient';
  fade.style.cssText = `position:absolute;top:0;right:0;height:100%;width:60px;background:linear-gradient(to right,transparent,${theme?.bg ?? '#1a1a1a'}cc);pointer-events:none;border-radius:0 10px 10px 0;`;
  wrapper.appendChild(fade);

  const updateArrows = () => {
    const { scrollLeft, scrollWidth, clientWidth } = container;
    leftArrow.style.display = scrollLeft > 0 ? 'flex' : 'none';
    rightArrow.style.display = scrollLeft + clientWidth < scrollWidth - 1 ? 'flex' : 'none';
  };

  const scrollByCard = (direction) => {
    const cardWidth = 220 + 16;
    container.scrollBy({ left: direction * cardWidth, behavior: 'smooth' });
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

  container.addEventListener('scroll', updateArrows);
  updateArrows();

  block.appendChild(wrapper);

  if (bridge) {
    bridge.reportSize(block.offsetWidth, block.offsetHeight);
    let resizeTimer;
    const ro = new ResizeObserver(() => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        bridge.reportSize(block.offsetWidth, block.offsetHeight);
      }, 150);
    });
    ro.observe(block);
  }
}