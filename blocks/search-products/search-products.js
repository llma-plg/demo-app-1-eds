// Sample data for standalone EDS preview (no bridge).
// In production, data comes dynamically from bridge.toolResult.
const SAMPLE_DATA = [
  {
    "name": "Apple MacBook Air 13 M5",
    "description": "Laptop with Apple M5 10-core CPU, 13.6\" Retina Display, 16GB RAM, 512GB SSD.",
    "image_url": "https://lcdn.altex.ro/media/catalog/product/m/a/macbook_air_13_in_m5_midnight_pdp_image_position_1_ce_ww_a118d620.jpg",
    "price": "5.499 lei",
    "category": "Laptopuri"
  },
  {
    "name": "Samsung Galaxy A57 5G",
    "description": "Smartphone with 128GB storage, 8GB RAM, Dual SIM, Awesome Navy.",
    "image_url": "https://lcdn.altex.ro/media/catalog/product/s/a/samsung_galaxy_a57_1aed30e4.jpg",
    "price": "1.750 lei",
    "category": "Telefoane"
  },
  {
    "name": "Samsung QLED 50Q8F 4K TV",
    "description": "Smart TV QLED 4K HDR with 125cm display.",
    "image_url": "https://lcdn.altex.ro/media/catalog/product/g/q/gq75q8faauxzg_006_front2_titan_gray_ac0aa39d.jpg",
    "price": "1.680 lei",
    "category": "Televizoare"
  },
  {
    "name": "BEKO B3WBT681415W Washing Machine",
    "description": "Built-in washing machine with EnergySpin, SteamCure, 8kg, 1400rpm, Class A.",
    "image_url": "https://lcdn.altex.ro/media/catalog/product/b/3/b3wbt681415w_06_a8d490bd.jpg",
    "price": "2.399 lei",
    "category": "Electrocasnice"
  },
  {
    "name": "Lenovo LOQ Essential 15 Gaming",
    "description": "Gaming laptop with AMD Ryzen 7, 16GB RAM, 512GB SSD, NVIDIA RTX 3050 6GB.",
    "image_url": "https://lcdn.altex.ro/media/catalog/product/l/e/lenovo_loq_15arp10e_14_cd54942e.jpg",
    "price": "3.699 lei",
    "category": "Laptopuri Gaming"
  }
];

// Brand palette from BuildWidgetRequest
const PALETTE = ['#bc003b', '#f5cb38'];

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
  const CARD_COLORS = ['#378ef0','#9256d9','#0fb5ae','#e68619','#d83790','#2dca72','#4046ca','#72b340'];

  const wrapper = document.createElement('div');
  wrapper.className = 'carousel-wrapper';

  const scrollContainer = document.createElement('div');
  scrollContainer.className = 'carousel-scroll';

  const displayItems = items.slice(0, 5);

  displayItems.forEach((item, i) => {
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
    ctaBtn.textContent = 'Vezi detalii';
    ctaBtn.setAttribute('aria-label', `Vezi detalii despre ${item.name || 'produs'}`);
    if (bridge) {
      ctaBtn.addEventListener('click', () => {
        bridge.sendMessage(`Spune-mi mai multe despre ${item.name}`);
      });
    }
    imageContainer.appendChild(ctaBtn);

    card.appendChild(imageContainer);

    const info = document.createElement('div');
    info.className = 'product-info';
    info.style.cssText = `background:${theme?.bg ?? '#1a1a1a'};color:${theme?.fg ?? '#fff'}`;

    const name = document.createElement('h3');
    name.className = 'product-name';
    name.textContent = item.name || '';
    info.appendChild(name);

    const desc = document.createElement('p');
    desc.className = 'product-desc';
    desc.textContent = item.description || '';
    info.appendChild(desc);

    const metaRow = document.createElement('div');
    metaRow.className = 'product-meta';

    const price = document.createElement('span');
    price.className = 'product-price';
    price.textContent = item.price || '';
    metaRow.appendChild(price);

    if (item.category) {
      const badge = document.createElement('span');
      badge.className = 'product-badge';
      badge.textContent = item.category;
      metaRow.appendChild(badge);
    }

    info.appendChild(metaRow);
    card.appendChild(info);

    scrollContainer.appendChild(card);
  });

  wrapper.appendChild(scrollContainer);

  if (displayItems.length > 0) {
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
    const { scrollLeft, scrollWidth, clientWidth } = scrollContainer;
    leftArrow.style.display = scrollLeft > 10 ? 'flex' : 'none';
    rightArrow.style.display = scrollLeft < scrollWidth - clientWidth - 10 ? 'flex' : 'none';
  };

  const scrollByCard = (direction) => {
    const cardWidth = 220 + 16;
    scrollContainer.scrollBy({ left: direction * cardWidth, behavior: 'smooth' });
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

  scrollContainer.addEventListener('scroll', updateArrows);
  updateArrows();

  wrapper.appendChild(leftArrow);
  wrapper.appendChild(rightArrow);

  block.appendChild(wrapper);
}