// Sample data for standalone/preview mode
const SAMPLE_DATA = {
  name: "GUM TECHNIQUE Deep Clean Toothbrush",
  description: "Ultra-fine tapered bristles clean below the gumline with a Quad-Grip handle for perfect brushing technique.",
  image_url: "https://www.sunstargum.com/adobe/dynamicmedia/deliver/dm-aid--0a295760-5530-4008-a103-a99e6f050496/00070942125895-524-hero.jpg?width=800&preferwebp=true&quality=85",
  price: "$6.99",
  category: "Toothbrushes"
};

const PALETTE = ['#00a3e0', '#0072ce', '#ffffff'];

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
  let product;

  if (bridge) {
    bridge.applyHostStyles();
    const isPreview = bridge.hostContext?.preview === true;
    if (isPreview) {
      product = SAMPLE_DATA;
    } else {
      const _result = await bridge.toolResult;
      const structuredContent = _result?.structuredContent || _result;
      product = structuredContent || {};
    }
  } else {
    product = SAMPLE_DATA;
  }

  block.textContent = '';
  renderProductDetail(block, product, bridge);

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

function renderProductDetail(block, product, bridge) {
  const card = document.createElement('div');
  card.className = 'detail-card';

  const imageContainer = document.createElement('div');
  imageContainer.className = 'image-container';

  const CARD_COLORS = ['#378ef0','#9256d9','#0fb5ae','#e68619','#d83790','#2dca72','#4046ca','#72b340'];
  const fallbackColor = CARD_COLORS[0];
  
  const colorDiv = () => {
    const d = document.createElement('div');
    d.style.cssText = `width:100%;height:100%;background-color:${fallbackColor};border-radius:12px 0 0 12px;`;
    return d;
  };

  if (product.image_url) {
    const img = document.createElement('img');
    img.src = product.image_url;
    img.alt = product.name || 'Product image';
    img.style.cssText = 'width:100%;height:100%;object-fit:cover;display:block;border-radius:12px 0 0 12px;';
    img.onerror = () => {
      if (img.parentNode) {
        img.parentNode.replaceChild(colorDiv(), img);
      }
    };
    imageContainer.appendChild(img);

    const ctaBtn = document.createElement('button');
    ctaBtn.className = 'cta-btn-image';
    ctaBtn.textContent = 'Find Where to Buy';
    ctaBtn.style.cssText = `position:absolute;bottom:12px;left:50%;transform:translateX(-50%);background:#00a3e0;color:#fff;border:none;padding:8px 16px;border-radius:6px;font-size:13px;font-weight:600;cursor:pointer;white-space:nowrap;`;
    if (bridge) {
      ctaBtn.addEventListener('click', () => {
        bridge.sendMessage(`Where can I buy ${product.name || 'this product'}?`);
      });
    }
    imageContainer.appendChild(ctaBtn);
  } else {
    imageContainer.appendChild(colorDiv());
  }

  card.appendChild(imageContainer);

  const contentContainer = document.createElement('div');
  contentContainer.className = 'content-container';
  contentContainer.style.cssText = `background:${theme?.bg ?? '#1a1a1a'};color:${theme?.fg ?? '#fff'};`;

  const nameEl = document.createElement('h2');
  nameEl.className = 'product-name';
  nameEl.textContent = product.name || 'Product Name';
  nameEl.style.color = theme?.fg ?? '#fff';
  contentContainer.appendChild(nameEl);

  if (product.category) {
    const badge = document.createElement('span');
    badge.className = 'category-badge';
    badge.textContent = product.category;
    badge.style.cssText = `display:inline-block;background:rgba(255,255,255,0.2);color:${theme?.fg ?? '#fff'};padding:4px 10px;border-radius:12px;font-size:11px;font-weight:600;margin-bottom:8px;`;
    contentContainer.appendChild(badge);
  }

  const descEl = document.createElement('p');
  descEl.className = 'product-description';
  descEl.textContent = product.description || '';
  descEl.style.color = theme?.fg ?? '#fff';
  contentContainer.appendChild(descEl);

  if (product.price) {
    const priceEl = document.createElement('div');
    priceEl.className = 'product-price';
    priceEl.textContent = product.price;
    priceEl.style.color = theme?.fg ?? '#fff';
    contentContainer.appendChild(priceEl);
  }

  card.appendChild(contentContainer);
  block.appendChild(card);
}