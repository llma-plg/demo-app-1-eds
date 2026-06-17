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

const PALETTE = ['#2bb573','#005dab','#06754a','#231f20','#057065'];

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
  for (let i=0; i<20; i++) { const m=(lo+hi)/2; if (relLum(Math.round(r*m),Math.round(g*m),Math.round(b*m)) > 0.12) hi=m; else lo=m; }
  const dr=Math.round(r*lo), dg=Math.round(g*lo), db=Math.round(b*lo);
  return { bg:`#${dr.toString(16).padStart(2,'0')}${dg.toString(16).padStart(2,'0')}${db.toString(16).padStart(2,'0')}`, fg:'#ffffff' };
}

const theme = getThemedCardBg(PALETTE);

export default async function decorate(block, bridge) {
  let item;

  if (bridge) {
    bridge.applyHostStyles();
    const isPreview = bridge.hostContext?.preview === true;
    if (isPreview) {
      item = SAMPLE_DATA[0];
    } else {
      const _result = await bridge.toolResult;
      item = (_result?.structuredContent || _result) || {};
    }
  } else {
    item = SAMPLE_DATA[0];
  }

  block.textContent = '';
  renderProductDetail(block, item, bridge);

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

function renderProductDetail(block, item, bridge) {
  const card = document.createElement('div');
  card.className = 'product-detail-card';

  const imageContainer = document.createElement('div');
  imageContainer.className = 'product-image';

  if (item.image_url) {
    const img = document.createElement('img');
    img.src = item.image_url;
    img.alt = item.name || 'Product image';
    img.style.cssText = 'width:100%;height:100%;object-fit:cover;display:block;';
    const fallbackColor = '#2bb573';
    img.onerror = () => {
      const colorDiv = document.createElement('div');
      colorDiv.style.cssText = `width:100%;height:100%;background-color:${fallbackColor};`;
      img.parentNode.replaceChild(colorDiv, img);
    };
    imageContainer.appendChild(img);
  } else {
    const colorDiv = document.createElement('div');
    colorDiv.style.cssText = 'width:100%;height:100%;background-color:#2bb573;';
    imageContainer.appendChild(colorDiv);
  }

  const ctaBtn = document.createElement('button');
  ctaBtn.className = 'cta-btn';
  ctaBtn.textContent = 'More Details';
  ctaBtn.style.cssText = 'position:absolute;bottom:12px;left:50%;transform:translateX(-50%);background:#2bb573;color:#fff;border:none;padding:8px 20px;border-radius:6px;font-size:13px;font-weight:600;cursor:pointer;white-space:nowrap;';
  if (bridge) {
    ctaBtn.addEventListener('click', () => {
      bridge.sendMessage(`Where can I buy ${item.name || 'this product'}?`);
    });
  }
  imageContainer.appendChild(ctaBtn);

  card.appendChild(imageContainer);

  const contentContainer = document.createElement('div');
  contentContainer.className = 'product-content';
  contentContainer.style.cssText = `background:${theme?.bg ?? '#1a1a1a'};color:${theme?.fg ?? '#fff'};`;

  const name = document.createElement('h2');
  name.className = 'product-name';
  name.textContent = item.name || 'Product';
  contentContainer.appendChild(name);

  if (item.category) {
    const categoryChip = document.createElement('span');
    categoryChip.className = 'category-chip';
    categoryChip.textContent = item.category;
    contentContainer.appendChild(categoryChip);
  }

  const description = document.createElement('p');
  description.className = 'product-description';
  description.textContent = item.description || '';
  contentContainer.appendChild(description);

  if (item.features && Array.isArray(item.features) && item.features.length > 0) {
    const featuresTitle = document.createElement('h3');
    featuresTitle.textContent = 'Features';
    featuresTitle.style.cssText = 'margin:12px 0 6px;font-size:14px;font-weight:600;';
    contentContainer.appendChild(featuresTitle);

    const featuresList = document.createElement('ul');
    featuresList.style.cssText = 'margin:0;padding-left:20px;font-size:12px;line-height:1.5;';
    item.features.forEach(feature => {
      const li = document.createElement('li');
      li.textContent = feature;
      featuresList.appendChild(li);
    });
    contentContainer.appendChild(featuresList);
  }

  if (item.how_to_use) {
    const usageTitle = document.createElement('h3');
    usageTitle.textContent = 'How to Use';
    usageTitle.style.cssText = 'margin:12px 0 6px;font-size:14px;font-weight:600;';
    contentContainer.appendChild(usageTitle);

    const usageText = document.createElement('p');
    usageText.textContent = item.how_to_use;
    usageText.style.cssText = 'margin:0;font-size:12px;line-height:1.5;opacity:0.85;';
    contentContainer.appendChild(usageText);
  }

  card.appendChild(contentContainer);
  block.appendChild(card);
}
