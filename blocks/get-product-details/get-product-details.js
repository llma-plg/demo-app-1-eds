const SAMPLE_DATA = {
  name: 'GUM SONIC DAILY Electric Toothbrush',
  description: 'Combines sonic vibrations with manual simplicity for 50% superior cleaning between teeth.',
  image_url: 'https://www.sunstargum.com/adobe/dynamicmedia/deliver/dm-aid--fc5105f3-ba84-474b-a039-666d91c1f020/4100mwh-4100mbk-gum-sonic-daily-toothbrush-n5-p1.jpg?preferwebp=true&quality=85',
  category: 'Electric Toothbrushes',
  highlights: [
    '50% superior cleaning between teeth',
    'Sonic vibrations with manual simplicity',
    'Ergonomic design for comfortable grip'
  ],
  usage_instructions: 'Use twice daily for optimal oral health. Replace brush head every 3 months.'
};

const PALETTE = [];
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
  return { bg:`#${dr.toString(16).padStart(2,'0')}${dg.toString(16).padStart(2,'0')}${db.toString(16).padStart(2,'0')}`, fg:'#ffffff' };
}

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
  renderProduct(block, product, bridge);

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

function renderProduct(block, product, bridge) {
  const theme = getThemedCardBg(PALETTE);
  const card = document.createElement('div');
  card.className = 'product-detail-card';

  const imageSection = document.createElement('div');
  imageSection.className = 'product-image-section';

  const imageContainer = document.createElement('div');
  imageContainer.className = 'product-image-container';

  const fallbackColor = CARD_COLORS[0];
  const colorDiv = () => {
    const d = document.createElement('div');
    d.className = 'image-fallback';
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

  imageSection.appendChild(imageContainer);

  const ctaBtn = document.createElement('button');
  ctaBtn.className = 'product-cta-btn';
  ctaBtn.textContent = 'Find a Retailer';
  if (bridge) {
    ctaBtn.addEventListener('click', () => {
      bridge.sendMessage(`Where can I buy ${product.name || 'this product'}?`);
    });
  }
  imageSection.appendChild(ctaBtn);

  const contentSection = document.createElement('div');
  contentSection.className = 'product-content-section';
  contentSection.style.cssText = `background:${theme?.bg ?? '#1a1a1a'};color:${theme?.fg ?? '#fff'}`;

  if (product.category) {
    const categoryBadge = document.createElement('span');
    categoryBadge.className = 'product-category';
    categoryBadge.textContent = product.category;
    contentSection.appendChild(categoryBadge);
  }

  const productName = document.createElement('h2');
  productName.className = 'product-name';
  productName.textContent = product.name || 'Product Name';
  contentSection.appendChild(productName);

  const productDesc = document.createElement('p');
  productDesc.className = 'product-description';
  productDesc.textContent = product.description || '';
  contentSection.appendChild(productDesc);

  if (product.highlights && product.highlights.length > 0) {
    const highlightsList = document.createElement('ul');
    highlightsList.className = 'product-highlights';
    product.highlights.forEach(highlight => {
      const li = document.createElement('li');
      li.textContent = highlight;
      highlightsList.appendChild(li);
    });
    contentSection.appendChild(highlightsList);
  }

  if (product.usage_instructions) {
    const usageLabel = document.createElement('div');
    usageLabel.className = 'usage-label';
    usageLabel.textContent = 'Usage';
    contentSection.appendChild(usageLabel);

    const usageText = document.createElement('p');
    usageText.className = 'usage-instructions';
    usageText.textContent = product.usage_instructions;
    contentSection.appendChild(usageText);
  }

  card.appendChild(imageSection);
  card.appendChild(contentSection);
  block.appendChild(card);
}