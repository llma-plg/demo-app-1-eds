// Sample data for standalone EDS preview (no bridge).
// In production, data comes dynamically from bridge.toolResult.
const SAMPLE_DATA = [
  {
    "name": "GUM Technique+ Toothbrush",
    "description": "Multi-level bristle toothbrush designed to reach every part of the mouth for advanced cleaning.",
    "image_url": "https://www.sunstargum.com/adobe/dynamicmedia/deliver/dm-aid--9b34efe3-0f17-44ed-9b43-072f07f418a3/491btm-gum-technique-plus-toothbrush-n5-p1.jpg?quality=85&preferwebp=true",
    "category": "Toothbrushes",
    "sku": "491BTM",
    "highlights": [
      "Multi-level bristles for superior cleaning",
      "Reaches every part of the mouth",
      "Advanced plaque removal"
    ],
    "how_to_use": "Brush teeth thoroughly at least twice a day or as directed by a dentist."
  },
  {
    "name": "GUM Sonic Daily Electric Toothbrush",
    "description": "Award-winning battery-powered sonic toothbrush delivering an extra deep and gentle daily clean.",
    "image_url": "https://www.sunstargum.com/adobe/dynamicmedia/deliver/dm-aid--fc5105f3-ba84-474b-a039-666d91c1f020/4100mwh-4100mbk-gum-sonic-daily-toothbrush-n5-p1.jpg?quality=85&preferwebp=true",
    "category": "Toothbrushes",
    "sku": "4100MWH",
    "highlights": [
      "Sonic technology for deep cleaning",
      "Battery-powered convenience",
      "Award-winning design"
    ],
    "how_to_use": "Apply toothpaste and turn on. Move gently across teeth for 2 minutes."
  },
  {
    "name": "GUM Easy Floss",
    "description": "PTFE dental floss that slides easily between tight spaces and below the gumline for gentle cleaning.",
    "image_url": "https://www.sunstargum.com/adobe/dynamicmedia/deliver/dm-aid--95ce33ba-90eb-4b4c-9ef7-58796d4fbd59/2000-gum-easyfloss-interdentals-30m-n6.jpg?quality=85&preferwebp=true",
    "category": "Floss",
    "sku": "2000",
    "highlights": [
      "PTFE material slides easily",
      "Reaches tight spaces",
      "Gentle on gums"
    ],
    "how_to_use": "Wind 18 inches around fingers, slide gently between teeth, curve around each tooth."
  },
  {
    "name": "GUM Soft-Picks Original",
    "description": "Rubber interdental picks with soft bristles for gentle and easy plaque removal between teeth.",
    "image_url": "https://www.sunstargum.com/adobe/dynamicmedia/deliver/dm-aid--971419e8-f384-4b56-9e10-6bed87869a88/632-gum-soft-picksoriginal-interdentals-lightgreen-medium-n1.jpg?quality=85&preferwebp=true",
    "category": "Rubber Picks",
    "sku": "632",
    "highlights": [
      "Soft rubber bristles",
      "Easy interdental cleaning",
      "Gentle plaque removal"
    ],
    "how_to_use": "Gently insert between teeth and move in and out to remove plaque."
  },
  {
    "name": "GUM SensiVital+ Toothpaste",
    "description": "Sensitive teeth toothpaste offering fast, long-lasting protection by forming a protective layer on teeth.",
    "image_url": "https://www.sunstargum.com/adobe/dynamicmedia/deliver/dm-aid--d89aa33d-a342-48f7-81e3-4bcbf25f1708/6070emea-gum-sensivital-toothpastes-blue-freshmint-n2.jpg?quality=85&preferwebp=true",
    "category": "Toothpastes",
    "sku": "6070EMEA",
    "highlights": [
      "Fast relief for sensitive teeth",
      "Long-lasting protection",
      "Forms protective layer"
    ],
    "how_to_use": "Apply to toothbrush and brush for 2 minutes, twice daily."
  }
];

// Brand palette from BuildWidgetRequest — replace with actual palette[] from the action payload.
// getThemedCardBg() darkens palette[0] to luminance ≤ 0.12 so white text has WCAG AA contrast.
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
  for (let i=0; i<20; i++) { const m=(lo+hi)/2; if (relLum(Math.round(r*m),Math.round(g*m),Math.round(b*m)) > 0.12) hi=m; else lo=m; }
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
      product = SAMPLE_DATA[0];
    } else {
      const _result = await bridge.toolResult;
      const structuredContent = _result?.structuredContent || _result;
      product = structuredContent;
    }
  } else {
    product = SAMPLE_DATA[0];
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
  if (!product) {
    const empty = document.createElement('div');
    empty.className = 'empty-state';
    empty.textContent = 'No product details available.';
    block.appendChild(empty);
    return;
  }

  const card = document.createElement('div');
  card.className = 'detail-card';

  // Image container (left side)
  const imageContainer = document.createElement('div');
  imageContainer.className = 'image-container';

  const CARD_COLORS = ['#378ef0','#9256d9','#0fb5ae','#e68619','#d83790','#2dca72','#4046ca','#72b340'];
  const fallbackColor = CARD_COLORS[0];

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
    img.onerror = () => img.parentNode.replaceChild(colorDiv(), img);
    imageContainer.appendChild(img);

    // CTA button on image
    const ctaBtn = document.createElement('button');
    ctaBtn.className = 'cta-on-image';
    ctaBtn.textContent = 'Find a Retailer';
    ctaBtn.setAttribute('aria-label', 'Find a retailer for this product');
    if (bridge) {
      ctaBtn.addEventListener('click', () => {
        bridge.sendMessage(`Where can I buy ${product.name}?`);
      });
    }
    imageContainer.appendChild(ctaBtn);
  } else {
    imageContainer.appendChild(colorDiv());
  }

  card.appendChild(imageContainer);

  // Content container (right side)
  const contentContainer = document.createElement('div');
  contentContainer.className = 'content-container';
  contentContainer.style.cssText = `background:${theme?.bg ?? '#1a1a1a'};color:${theme?.fg ?? '#fff'}`;

  // Product name
  const name = document.createElement('h2');
  name.className = 'product-name';
  name.textContent = product.name || 'Product';
  name.style.color = theme?.fg ?? '#fff';
  contentContainer.appendChild(name);

  // Category badge
  if (product.category) {
    const categoryBadge = document.createElement('span');
    categoryBadge.className = 'category-badge';
    categoryBadge.textContent = product.category;
    contentContainer.appendChild(categoryBadge);
  }

  // Description
  if (product.description) {
    const desc = document.createElement('p');
    desc.className = 'product-description';
    desc.textContent = product.description;
    desc.style.color = theme?.fg ?? '#fff';
    contentContainer.appendChild(desc);
  }

  // Highlights
  if (product.highlights && product.highlights.length > 0) {
    const highlightsTitle = document.createElement('h3');
    highlightsTitle.className = 'highlights-title';
    highlightsTitle.textContent = 'Key Features';
    highlightsTitle.style.color = theme?.fg ?? '#fff';
    contentContainer.appendChild(highlightsTitle);

    const highlightsList = document.createElement('ul');
    highlightsList.className = 'highlights-list';
    product.highlights.forEach(highlight => {
      const li = document.createElement('li');
      li.textContent = highlight;
      li.style.color = theme?.fg ?? '#fff';
      highlightsList.appendChild(li);
    });
    contentContainer.appendChild(highlightsList);
  }

  // How to use
  if (product.how_to_use) {
    const howToTitle = document.createElement('h3');
    howToTitle.className = 'how-to-title';
    howToTitle.textContent = 'How to Use';
    howToTitle.style.color = theme?.fg ?? '#fff';
    contentContainer.appendChild(howToTitle);

    const howToText = document.createElement('p');
    howToText.className = 'how-to-text';
    howToText.textContent = product.how_to_use;
    howToText.style.color = theme?.fg ?? '#fff';
    contentContainer.appendChild(howToText);
  }

  card.appendChild(contentContainer);
  block.appendChild(card);
}