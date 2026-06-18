// Sample data for standalone EDS preview (no bridge).
// Using first product from samplePayload for detail card display.
const SAMPLE_DATA = {
  name: 'GUM Deep Clean Technique Toothbrush',
  description: 'Soft tapered bristles clean below the gumline with Quad-Grip handle for perfect brushing technique.',
  image_url: 'https://www.sunstargum.com/content/dam/sunstar-americas/retail-digital-shelf/consumer/Adult%20Toothbrushes/524-Technique%20Deep%20Full/00070942125895-524-HERO.jpg/jcr:content/renditions/cq5dam.zoom.2048.2048.jpeg',
  category: 'Toothbrushes'
};

// Brand palette from BuildWidgetRequest
const PALETTE = ['#231f20', '#464c4e', '#009257', '#2cb573', '#64656a'];

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
  let product;

  if (bridge) {
    bridge.applyHostStyles();
    const isPreview = bridge.hostContext?.preview === true;
    if (isPreview) {
      product = SAMPLE_DATA;
    } else {
      const _result = await bridge.toolResult;
      const structuredContent = _result?.structuredContent || _result;
      product = structuredContent;
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
  if (!product) {
    block.textContent = 'No product data available';
    return;
  }

  const card = document.createElement('div');
  card.className = 'product-detail-card';

  // Left: Image section
  const imageSection = document.createElement('div');
  imageSection.className = 'product-image';

  if (product.image_url) {
    const img = document.createElement('img');
    img.src = product.image_url;
    img.alt = product.name || 'Product image';
    img.style.cssText = 'width:100%;height:100%;object-fit:cover;display:block;';

    const fallbackColor = '#378ef0';
    img.onerror = () => {
      const colorDiv = document.createElement('div');
      colorDiv.style.cssText = `width:100%;height:100%;background-color:${fallbackColor};`;
      img.parentNode.replaceChild(colorDiv, img);
    };

    imageSection.appendChild(img);

    // CTA button on image
    const ctaBtn = document.createElement('button');
    ctaBtn.className = 'cta-on-image';
    ctaBtn.textContent = 'Find Where to Buy';
    if (bridge) {
      ctaBtn.addEventListener('click', () => {
        bridge.sendMessage(`Where can I buy ${product.name}?`);
      });
    }
    imageSection.appendChild(ctaBtn);
  } else {
    const colorDiv = document.createElement('div');
    colorDiv.style.cssText = 'width:100%;height:100%;background-color:#378ef0;';
    imageSection.appendChild(colorDiv);
  }

  card.appendChild(imageSection);

  // Right: Content section
  const contentSection = document.createElement('div');
  contentSection.className = 'product-content';
  contentSection.style.cssText = `background: ${theme?.bg ?? '#1a1a1a'}; color: ${theme?.fg ?? '#fff'};`;

  const nameEl = document.createElement('h2');
  nameEl.className = 'product-name';
  nameEl.textContent = product.name || 'Product';
  contentSection.appendChild(nameEl);

  if (product.description) {
    const descEl = document.createElement('p');
    descEl.className = 'product-description';
    descEl.textContent = product.description;
    contentSection.appendChild(descEl);
  }

  if (product.category) {
    const categoryEl = document.createElement('span');
    categoryEl.className = 'product-category';
    categoryEl.textContent = product.category;
    contentSection.appendChild(categoryEl);
  }

  card.appendChild(contentSection);
  block.appendChild(card);
}