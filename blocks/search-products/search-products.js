// Sample data for standalone EDS preview (no bridge).
// In production, data comes dynamically from bridge.toolResult.
const SAMPLE_DATA = [
  {
    "name": "GUM ActiVital Toothbrush",
    "description": "Features perfect-fit bristles to remove plaque from hard-to-reach areas like spaces between teeth and along the gumline.",
    "image_url": "https://www.sunstargum.com/adobe/dynamicmedia/deliver/dm-aid--01dad4e8-d1c5-4946-876d-1df0fef28c60/581mb-green-gum-activital-toothbrushes-green-compact-soft-n5.jpg",
    "category": "Toothbrushes"
  },
  {
    "name": "GUM TRAV-LER Interdental Brush",
    "description": "Comfortable and innovative brush with triangular bristles for up to 25% increased plaque removal between teeth.",
    "image_url": "https://www.sunstargum.com/adobe/dynamicmedia/deliver/dm-aid--18e87415-18c9-4ba3-8365-0c8b41dced6e/p1312-gum-travler-brush-red.png",
    "category": "Interdental Brushes"
  },
  {
    "name": "GUM SOFT-PICKS Original",
    "description": "Gentle rubber bristle picks for easy and comfortable interdental cleaning, available in 3 sizes.",
    "image_url": "https://www.sunstargum.com/adobe/dynamicmedia/deliver/dm-aid--971419e8-f384-4b56-9e10-6bed87869a88/632-gum-soft-picksoriginal-interdentals-lightgreen-medium-n1.jpg",
    "category": "Rubber Picks"
  },
  {
    "name": "GUM PAROEX 0.12% Intensive Action Mouthwash",
    "description": "Dual antiplaque system with chlorhexidine for intensive gum care, ideal after surgery or tooth extraction.",
    "image_url": "https://www.sunstargum.com/adobe/dynamicmedia/deliver/dm-aid--d1e4b9ff-6c81-4bf4-84db-1c098f2b77ad/1784emea1-emea-gum-paroex-012-mouthrinse-red-300ml-bottle-n1.jpg",
    "category": "Mouthwashes"
  },
  {
    "name": "GUM Easy Floss",
    "description": "Unique shred-resistant floss that slides easily between tight spaces and below the gumline for effective plaque removal.",
    "image_url": "https://www.sunstargum.com/adobe/dynamicmedia/deliver/dm-aid--95ce33ba-90eb-4b4c-9ef7-58796d4fbd59/2000-gum-easyfloss-interdentals-30m-n6.jpg",
    "category": "Floss"
  }
];

const PALETTE = ['#2bb573', '#005dab', '#06754a', '#231f20', '#057065'];

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

const CARD_COLORS = ['#378ef0','#9256d9','#0fb5ae','#e68619','#d83790','#2dca72','#4046ca','#72b340'];

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
  carousel.className = 'products-carousel';
  carousel.setAttribute('role', 'region');
  carousel.setAttribute('aria-label', 'Product carousel');

  const limitedProducts = products.slice(0, 5);

  limitedProducts.forEach((product, i) => {
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
      img.onerror = () => img.parentNode.replaceChild(colorDiv(), img);
      imageContainer.appendChild(img);
    } else {
      imageContainer.appendChild(colorDiv());
    }

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

    const info = document.createElement('div');
    info.className = 'product-info';
    info.style.cssText = `background:${theme?.bg ?? '#1a1a1a'};color:${theme?.fg ?? '#fff'}`;

    const name = document.createElement('h3');
    name.className = 'product-name';
    name.textContent = product.name;
    name.style.color = theme?.fg ?? '#fff';
    info.appendChild(name);

    const description = document.createElement('p');
    description.className = 'product-description';
    description.textContent = product.description;
    description.style.color = theme?.fg ?? '#fff';
    info.appendChild(description);

    const categoryBadge = document.createElement('span');
    categoryBadge.className = 'category-badge';
    categoryBadge.textContent = product.category;
    info.appendChild(categoryBadge);

    card.appendChild(info);
    carousel.appendChild(card);
  });

  wrapper.appendChild(carousel);

  if (limitedProducts.length > 3) {
    const fade = document.createElement('div');
    fade.className = 'carousel-fade';
    fade.style.cssText = `position:absolute;top:0;right:0;height:100%;width:60px;background:linear-gradient(to right,transparent,${theme?.bg ?? '#1a1a1a'}cc);pointer-events:none;border-radius:0 10px 10px 0;`;
    wrapper.appendChild(fade);
  }

  const leftArrow = document.createElement('button');
  leftArrow.className = 'carousel-arrow carousel-arrow-left';
  leftArrow.innerHTML = '&#9664;';
  leftArrow.setAttribute('aria-label', 'Scroll left');
  leftArrow.style.display = 'none';

  const rightArrow = document.createElement('button');
  rightArrow.className = 'carousel-arrow carousel-arrow-right';
  rightArrow.innerHTML = '&#9654;';
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

  ['click', 'keydown'].forEach(event => {
    leftArrow.addEventListener(event, (e) => {
      if (event === 'keydown' && e.key !== 'Enter' && e.key !== ' ') return;
      e.preventDefault();
      scrollByCard(-1);
    });
    rightArrow.addEventListener(event, (e) => {
      if (event === 'keydown' && e.key !== 'Enter' && e.key !== ' ') return;
      e.preventDefault();
      scrollByCard(1);
    });
  });

  carousel.addEventListener('scroll', updateArrows);
  updateArrows();

  wrapper.appendChild(leftArrow);
  wrapper.appendChild(rightArrow);

  block.appendChild(wrapper);
}
