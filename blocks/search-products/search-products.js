// Sample data for standalone EDS preview (no bridge).
// In production, data comes dynamically from bridge.toolResult.
const SAMPLE_DATA = [
  {
    "name": "GUM Technique+ Toothbrush",
    "description": "Multi-level bristle toothbrush designed to reach every part of the mouth for advanced cleaning.",
    "image_url": "https://www.sunstargum.com/adobe/dynamicmedia/deliver/dm-aid--9b34efe3-0f17-44ed-9b43-072f07f418a3/491btm-gum-technique-plus-toothbrush-n5-p1.jpg?quality=85&preferwebp=true",
    "category": "Toothbrushes"
  },
  {
    "name": "GUM Sonic Daily Electric Toothbrush",
    "description": "Award-winning battery-powered sonic toothbrush delivering an extra deep and gentle daily clean.",
    "image_url": "https://www.sunstargum.com/adobe/dynamicmedia/deliver/dm-aid--fc5105f3-ba84-474b-a039-666d91c1f020/4100mwh-4100mbk-gum-sonic-daily-toothbrush-n5-p1.jpg?quality=85&preferwebp=true",
    "category": "Toothbrushes"
  },
  {
    "name": "GUM Easy Floss",
    "description": "PTFE dental floss that slides easily between tight spaces and below the gumline for gentle cleaning.",
    "image_url": "https://www.sunstargum.com/adobe/dynamicmedia/deliver/dm-aid--95ce33ba-90eb-4b4c-9ef7-58796d4fbd59/2000-gum-easyfloss-interdentals-30m-n6.jpg?quality=85&preferwebp=true",
    "category": "Floss"
  },
  {
    "name": "GUM Soft-Picks Original",
    "description": "Rubber interdental picks with soft bristles for gentle and easy plaque removal between teeth.",
    "image_url": "https://www.sunstargum.com/adobe/dynamicmedia/deliver/dm-aid--971419e8-f384-4b56-9e10-6bed87869a88/632-gum-soft-picksoriginal-interdentals-lightgreen-medium-n1.jpg?quality=85&preferwebp=true",
    "category": "Rubber Picks"
  },
  {
    "name": "GUM SensiVital+ Toothpaste",
    "description": "Sensitive teeth toothpaste offering fast, long-lasting protection by forming a protective layer on teeth.",
    "image_url": "https://www.sunstargum.com/adobe/dynamicmedia/deliver/dm-aid--d89aa33d-a342-48f7-81e3-4bcbf25f1708/6070emea-gum-sensivital-toothpastes-blue-freshmint-n2.jpg?quality=85&preferwebp=true",
    "category": "Toothpastes"
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
  return { bg:`#${dr.toString(16).padStart(2,'0')}${dg.toString(16).padStart(2,'0')}${db.toString(16).padStart(2,'0')}`, fg:'#ffffff' };
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
  renderCarousel(block, products, bridge);

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

function renderCarousel(block, products, bridge) {
  const CARD_COLORS = ['#378ef0','#9256d9','#0fb5ae','#e68619','#d83790','#2dca72','#4046ca','#72b340'];

  const wrapper = document.createElement('div');
  wrapper.className = 'carousel-wrapper';

  const container = document.createElement('div');
  container.className = 'carousel-container';

  const displayProducts = products.slice(0, 5);

  displayProducts.forEach((product, index) => {
    const card = document.createElement('div');
    card.className = 'product-card';

    const imageContainer = document.createElement('div');
    imageContainer.className = 'card-image';

    const fallbackColor = CARD_COLORS[index % CARD_COLORS.length];
    const colorDiv = () => {
      const d = document.createElement('div');
      d.style.cssText = `width:100%;height:100%;background-color:${fallbackColor};`;
      return d;
    };

    if (product.image_url) {
      const img = document.createElement('img');
      img.src = product.image_url;
      img.alt = product.name || 'Product image';
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
    ctaBtn.className = 'cta-button';
    ctaBtn.textContent = 'View Details';
    ctaBtn.setAttribute('aria-label', `View details for ${product.name || 'product'}`);
    if (bridge) {
      ctaBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        bridge.sendMessage(`Tell me more about ${product.name}`);
      });
    }
    imageContainer.appendChild(ctaBtn);

    card.appendChild(imageContainer);

    const content = document.createElement('div');
    content.className = 'card-content';
    content.style.cssText = `background: ${theme?.bg || '#1a1a1a'}; color: ${theme?.fg || '#fff'};`;

    const name = document.createElement('div');
    name.className = 'product-name';
    name.textContent = product.name || '';
    content.appendChild(name);

    const description = document.createElement('div');
    description.className = 'product-description';
    description.textContent = product.description || '';
    content.appendChild(description);

    const footer = document.createElement('div');
    footer.className = 'card-footer';

    if (product.category) {
      const badge = document.createElement('span');
      badge.className = 'category-badge';
      badge.textContent = product.category;
      footer.appendChild(badge);
    }

    content.appendChild(footer);
    card.appendChild(content);
    container.appendChild(card);
  });

  wrapper.appendChild(container);

  if (displayProducts.length > 3) {
    const fade = document.createElement('div');
    fade.className = 'fade-gradient';
    fade.style.cssText = `position:absolute;top:0;right:0;height:100%;width:60px;background:linear-gradient(to right,transparent,${theme?.bg || '#1a1a1a'}cc);pointer-events:none;border-radius:0 10px 10px 0;`;
    wrapper.appendChild(fade);
  }

  const leftArrow = document.createElement('button');
  leftArrow.className = 'arrow arrow-left';
  leftArrow.innerHTML = '◀';
  leftArrow.setAttribute('aria-label', 'Scroll left');
  leftArrow.style.display = 'none';

  const rightArrow = document.createElement('button');
  rightArrow.className = 'arrow arrow-right';
  rightArrow.innerHTML = '▶';
  rightArrow.setAttribute('aria-label', 'Scroll right');

  const updateArrows = () => {
    const scrollLeft = container.scrollLeft;
    const maxScroll = container.scrollWidth - container.clientWidth;
    leftArrow.style.display = scrollLeft <= 1 ? 'none' : 'flex';
    rightArrow.style.display = scrollLeft >= maxScroll - 1 ? 'none' : 'flex';
  };

  const scrollBy = (direction) => {
    const cardWidth = 220 + 16;
    container.scrollBy({ left: direction * cardWidth, behavior: 'smooth' });
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

  container.addEventListener('scroll', updateArrows);

  wrapper.appendChild(leftArrow);
  wrapper.appendChild(rightArrow);

  block.appendChild(wrapper);

  setTimeout(updateArrows, 100);
}
