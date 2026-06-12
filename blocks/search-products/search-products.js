// Sample data for standalone EDS preview (no bridge).
// In production, data comes dynamically from bridge.toolResult.
const SAMPLE_DATA = [
  {
    name: "Men's Better Sweater™ Fleece Jacket",
    description: "Warm 100% recycled polyester full-zip jacket with sweater-knit aesthetic and Fair Trade Certified construction.",
    image_url: "https://cdn-yotpo-images-production.yotpo.com/Product/144677342/378852305/square.jpg?1738193748",
    price: "£130",
    category: "Fleece"
  },
  {
    name: "Black Hole® Duffel 55L",
    description: "Legendary 55-liter duffel with weather-resistant 100% recycled polyester and recycled TPU-film laminate.",
    image_url: "https://cdn-yotpo-images-production.yotpo.com/Product/618464627/518622744/square.jpg?1738281241",
    price: "£160",
    category: "Packs & Gear"
  },
  {
    name: "Men's Baggies™ Shorts - 5\"",
    description: "Quick-drying multifunctional shorts made from NetPlus® recycled fishing nets with mesh liner.",
    image_url: "https://cdn-yotpo-images-production.yotpo.com/Product/371389495/380033939/square.jpg?1746695975",
    price: "£60",
    category: "Shorts"
  }
];

const CARD_COLORS = ['#378ef0','#9256d9','#0fb5ae','#e68619','#d83790','#2dca72','#4046ca','#72b340'];

// Brand palette from BuildWidgetRequest — used to derive card info-strip background.
const PALETTE = ['#1a1a2e','#2d5f8a','#4a7c59'];

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

  const carouselContainer = document.createElement('div');
  carouselContainer.className = 'carousel-container';

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
    ctaBtn.className = 'card-cta';
    ctaBtn.textContent = 'View Details';
    ctaBtn.setAttribute('aria-label', `View details for ${item.name || 'product'}`);
    if (bridge) {
      ctaBtn.addEventListener('click', () => {
        bridge.sendMessage(`Tell me more about ${item.name}`);
      });
    }
    imageContainer.appendChild(ctaBtn);

    card.appendChild(imageContainer);

    const cardContent = document.createElement('div');
    cardContent.className = 'card-content';
    cardContent.style.cssText = `background:${theme?.bg ?? '#1a1a1a'};color:${theme?.fg ?? '#fff'}`;

    const name = document.createElement('div');
    name.className = 'card-name';
    name.textContent = item.name || '';
    cardContent.appendChild(name);

    if (item.description) {
      const desc = document.createElement('div');
      desc.className = 'card-description';
      desc.textContent = item.description;
      cardContent.appendChild(desc);
    }

    const footer = document.createElement('div');
    footer.className = 'card-footer';

    const price = document.createElement('span');
    price.className = 'card-price';
    price.textContent = item.price || '';
    footer.appendChild(price);

    if (item.category) {
      const badge = document.createElement('span');
      badge.className = 'card-badge';
      badge.textContent = item.category;
      footer.appendChild(badge);
    }

    cardContent.appendChild(footer);
    card.appendChild(cardContent);
    carouselContainer.appendChild(card);
  });

  wrapper.appendChild(carouselContainer);

  const fade = document.createElement('div');
  fade.className = 'carousel-fade';
  fade.style.cssText = `position:absolute;top:0;right:0;height:100%;width:60px;background:linear-gradient(to right,transparent,${theme?.bg ?? '#1a1a1a'}cc);pointer-events:none;border-radius:0 10px 10px 0;`;
  wrapper.appendChild(fade);

  const leftBtn = document.createElement('button');
  leftBtn.className = 'carousel-arrow carousel-arrow-left';
  leftBtn.textContent = '◀';
  leftBtn.setAttribute('aria-label', 'Scroll left');
  leftBtn.style.display = 'none';
  wrapper.appendChild(leftBtn);

  const rightBtn = document.createElement('button');
  rightBtn.className = 'carousel-arrow carousel-arrow-right';
  rightBtn.textContent = '▶';
  rightBtn.setAttribute('aria-label', 'Scroll right');
  wrapper.appendChild(rightBtn);

  const updateArrows = () => {
    const atStart = carouselContainer.scrollLeft <= 1;
    const atEnd = carouselContainer.scrollLeft >= carouselContainer.scrollWidth - carouselContainer.clientWidth - 1;
    leftBtn.style.display = atStart ? 'none' : 'flex';
    rightBtn.style.display = atEnd ? 'none' : 'flex';
  };

  const scrollByCard = (direction) => {
    const cardWidth = 220 + 16;
    carouselContainer.scrollBy({ left: direction * cardWidth, behavior: 'smooth' });
  };

  leftBtn.addEventListener('click', () => scrollByCard(-1));
  rightBtn.addEventListener('click', () => scrollByCard(1));

  leftBtn.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      scrollByCard(-1);
    }
  });

  rightBtn.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      scrollByCard(1);
    }
  });

  carouselContainer.addEventListener('scroll', updateArrows);
  updateArrows();

  block.appendChild(wrapper);
}