// Sample data for standalone/preview mode.
// In production, data comes dynamically from bridge.toolResult.
const SAMPLE_DATA = [
  {
    "name": "GUM® Deep Clean Technique® Toothbrush",
    "description": "Features soft tapered bristles to clean below the gumline with Quad-Grip® handle for perfect brushing technique.",
    "image_url": "https://www.sunstargum.com/adobe/dynamicmedia/deliver/dm-aid--0a295760-5530-4008-a103-a99e6f050496/00070942125895-524-hero.jpg?quality=85&width=1600&preferwebp=true",
    "category": "Toothbrushes"
  },
  {
    "name": "GUM® Soft-Picks® Original",
    "description": "Gentle, easy-to-use rubber bristle picks for comfortable cleaning between teeth.",
    "image_url": "https://www.sunstargum.com/adobe/dynamicmedia/deliver/dm-aid--a9a60fce-c215-4647-93d2-af40c8df6ae0/6323r-product-packaging-btc-softpicks-original-hero-cleanedup-us.jpg?quality=85&width=1600&preferwebp=true",
    "category": "Interdental Cleaners"
  },
  {
    "name": "GUM® Professional Clean Floss Picks",
    "description": "Durable mint-flavored dental floss that holds up against the tightest spaces without shredding.",
    "image_url": "https://www.sunstargum.com/adobe/dynamicmedia/deliver/dm-aid--55618c00-ce9d-42fe-a7ea-4207b94c8253/893rr9-product-packaging-flossers-pro-clean-hero-cleanedup-us.png?quality=85&width=1600&preferwebp=true",
    "category": "Dental Floss"
  },
  {
    "name": "GUM® Sonic Powered Toothbrush",
    "description": "Offers 12,000 sonic vibrations for a deep clean, removing plaque 50% more effectively.",
    "image_url": "https://www.sunstargum.com/adobe/dynamicmedia/deliver/dm-aid--f5ccd9db-10f3-4785-8550-f70405cb29bf/00070942005432-4100-hero.jpg?width=1600&quality=85&preferwebp=true",
    "category": "Toothbrushes"
  },
  {
    "name": "GUM® Proxabrush® Go-Betweens®",
    "description": "Clinically designed interdental brushes offering a quick and effective alternative to flossing.",
    "image_url": "https://www.sunstargum.com/content/dam/sunstar-americas/gum/product-catalogue/us/con/interdental/Proxabrush-Go-Betweens-IDB-GROUP.jpg/jcr:content/renditions/cq5dam.zoom.2048.2048.jpeg",
    "category": "Interdental Cleaners"
  }
];

// Brand palette from BuildWidgetRequest
const PALETTE = ['#231f20','#464c4e','#009257','#2cb573','#64656a'];

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
  const theme = getThemedCardBg(PALETTE);
  const wrapper = document.createElement('div');
  wrapper.className = 'carousel-wrapper';

  const carousel = document.createElement('div');
  carousel.className = 'carousel';

  const displayItems = items.slice(0, 5);
  displayItems.forEach((item, idx) => {
    const card = document.createElement('div');
    card.className = 'product-card';

    const imageContainer = document.createElement('div');
    imageContainer.className = 'image-container';

    const fallbackColor = CARD_COLORS[idx % CARD_COLORS.length];
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

    if (item.category) {
      const badge = document.createElement('span');
      badge.className = 'category-badge';
      badge.textContent = item.category;
      content.appendChild(badge);
    }

    const name = document.createElement('h3');
    name.className = 'product-name';
    name.textContent = item.name || '';
    name.style.color = theme?.fg ?? '#fff';
    content.appendChild(name);

    const desc = document.createElement('p');
    desc.className = 'product-description';
    desc.textContent = item.description || '';
    desc.style.color = theme?.fg ?? '#fff';
    content.appendChild(desc);

    card.appendChild(content);
    carousel.appendChild(card);
  });

  wrapper.appendChild(carousel);

  // Add fade gradient
  const fade = document.createElement('div');
  fade.className = 'fade-gradient';
  fade.style.cssText = `position:absolute;top:0;right:0;height:100%;width:60px;background:linear-gradient(to right,transparent,${theme?.bg ?? '#1a1a1a'}cc);pointer-events:none;border-radius:0 10px 10px 0;`;
  wrapper.appendChild(fade);

  // Navigation arrows
  const leftArrow = document.createElement('button');
  leftArrow.className = 'nav-arrow left';
  leftArrow.setAttribute('aria-label', 'Scroll left');
  leftArrow.textContent = '◀';
  leftArrow.style.display = 'none';

  const rightArrow = document.createElement('button');
  rightArrow.className = 'nav-arrow right';
  rightArrow.setAttribute('aria-label', 'Scroll right');
  rightArrow.textContent = '▶';

  const updateArrows = () => {
    const atStart = carousel.scrollLeft <= 1;
    const atEnd = carousel.scrollLeft + carousel.offsetWidth >= carousel.scrollWidth - 1;
    leftArrow.style.display = atStart ? 'none' : 'flex';
    rightArrow.style.display = atEnd ? 'none' : 'flex';
  };

  const scrollBy = (direction) => {
    const cardWidth = 220 + 16; // card width + gap
    carousel.scrollBy({ left: direction * cardWidth, behavior: 'smooth' });
  };

  leftArrow.addEventListener('click', () => scrollBy(-1));
  rightArrow.addEventListener('click', () => scrollBy(1));

  leftArrow.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      scrollBy(-1);
    }
  });

  rightArrow.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      scrollBy(1);
    }
  });

  carousel.addEventListener('scroll', updateArrows);

  wrapper.appendChild(leftArrow);
  wrapper.appendChild(rightArrow);

  block.appendChild(wrapper);

  setTimeout(updateArrows, 100);
}