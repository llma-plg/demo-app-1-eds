const SAMPLE_DATA = [
  {
    "name": "GUM Technique Plus Toothbrush",
    "description": "Multi-level bristle toothbrush designed to reach every part of the mouth for advanced cleaning.",
    "image_url": "https://www.sunstargum.com/adobe/dynamicmedia/deliver/dm-aid--9b34efe3-0f17-44ed-9b43-072f07f418a3/491btm-gum-technique-plus-toothbrush-n5-p1.jpg?width=800&preferwebp=true&quality=85",
    "category": "Toothbrushes"
  },
  {
    "name": "GUM Expanding Floss",
    "description": "Dental floss that expands to reach more tooth surfaces and clean below the gumline.",
    "image_url": "https://www.sunstargum.com/adobe/dynamicmedia/deliver/dm-aid--2e651277-05fa-4fc3-9959-0a18277c8d16/2030-gum-expanding-interdentals-30m-n6.jpg?width=800&preferwebp=true&quality=85",
    "category": "Floss"
  },
  {
    "name": "GUM Trav-Ler Interdental Brush",
    "description": "Comfortable and innovative brush designed to effectively clean all interdental areas.",
    "image_url": "https://www.sunstargum.com/adobe/dynamicmedia/deliver/dm-aid--18e87415-18c9-4ba3-8365-0c8b41dced6e/p1312-gum-travler-brush-red.png?width=800&preferwebp=true&quality=85",
    "category": "Interdental Brushes"
  },
  {
    "name": "GUM Soft-Picks Original",
    "description": "Gentle, easy-to-use rubber bristle picks for comfortable cleaning between teeth.",
    "image_url": "https://www.sunstargum.com/adobe/dynamicmedia/deliver/dm-aid--971419e8-f384-4b56-9e10-6bed87869a88/632-gum-soft-picksoriginal-interdentals-lightgreen-medium-n1.jpg?width=800&preferwebp=true&quality=85",
    "category": "Rubber Picks"
  },
  {
    "name": "GUM Paroex 0.12% Intensive Action Mouthwash",
    "description": "Intensive action mouthwash with chlorhexidine to reduce plaque and soothe sensitive gums.",
    "image_url": "https://www.sunstargum.com/adobe/dynamicmedia/deliver/dm-aid--d1e4b9ff-6c81-4bf4-84db-1c098f2b77ad/1784emea1-emea-gum-paroex-012-mouthrinse-red-300ml-bottle-n1.jpg?width=800&preferwebp=true&quality=85",
    "category": "Mouthwashes"
  }
];

const PALETTE = ['#00a651','#005c2f','#ffffff'];

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
      items = structuredContent?.products || [];
    }
  } else {
    items = SAMPLE_DATA;
  }

  block.textContent = '';

  const wrapper = document.createElement('div');
  wrapper.className = 'carousel-wrapper';

  const carousel = document.createElement('div');
  carousel.className = 'carousel';
  carousel.setAttribute('role', 'region');
  carousel.setAttribute('aria-label', 'Product carousel');

  const leftBtn = document.createElement('button');
  leftBtn.className = 'nav-btn nav-left';
  leftBtn.setAttribute('aria-label', 'Scroll left');
  leftBtn.textContent = '◀';
  leftBtn.style.display = 'none';

  const rightBtn = document.createElement('button');
  rightBtn.className = 'nav-btn nav-right';
  rightBtn.setAttribute('aria-label', 'Scroll right');
  rightBtn.textContent = '▶';

  const updateNavButtons = () => {
    const scrollLeft = carousel.scrollLeft;
    const maxScroll = carousel.scrollWidth - carousel.clientWidth;
    leftBtn.style.display = scrollLeft <= 1 ? 'none' : 'flex';
    rightBtn.style.display = scrollLeft >= maxScroll - 1 ? 'none' : 'flex';
  };

  const scrollByCard = (direction) => {
    const cardWidth = 220 + 16;
    carousel.scrollBy({ left: direction * cardWidth, behavior: 'smooth' });
    setTimeout(updateNavButtons, 300);
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

  carousel.addEventListener('scroll', updateNavButtons);

  items.slice(0, 5).forEach((item, i) => {
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
    ctaBtn.className = 'cta-overlay';
    ctaBtn.textContent = 'View Details';
    if (bridge) {
      ctaBtn.addEventListener('click', () => {
        bridge.sendMessage(`Tell me more about ${item.name}`);
      });
    }
    imageContainer.appendChild(ctaBtn);

    card.appendChild(imageContainer);

    const info = document.createElement('div');
    info.className = 'card-info';
    info.style.cssText = `background:${theme?.bg ?? '#1a1a1a'};color:${theme?.fg ?? '#fff'}`;

    if (item.category) {
      const badge = document.createElement('span');
      badge.className = 'category-badge';
      badge.textContent = item.category;
      info.appendChild(badge);
    }

    const name = document.createElement('h3');
    name.className = 'product-name';
    name.textContent = item.name || '';
    info.appendChild(name);

    const desc = document.createElement('p');
    desc.className = 'product-desc';
    desc.textContent = item.description || '';
    info.appendChild(desc);

    card.appendChild(info);
    carousel.appendChild(card);
  });

  const fade = document.createElement('div');
  fade.className = 'fade-overlay';
  fade.style.cssText = `position:absolute;top:0;right:0;height:100%;width:60px;background:linear-gradient(to right,transparent,${theme?.bg ?? '#1a1a1a'}cc);pointer-events:none;border-radius:0 10px 10px 0;`;

  wrapper.appendChild(carousel);
  wrapper.appendChild(fade);
  wrapper.appendChild(leftBtn);
  wrapper.appendChild(rightBtn);
  block.appendChild(wrapper);

  updateNavButtons();

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
