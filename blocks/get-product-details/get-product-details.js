export default async function decorate(block, bridge) {
  const { structuredContent, darkMode } = bridge.config;
  
  // structuredContent.product — derived from action name "get_product_details" (bare array outputSchema rule)
  const product = structuredContent?.product || structuredContent;
  
  if (!product) {
    block.textContent = 'No product data available';
    return;
  }

  const card = document.createElement('div');
  card.className = 'card';
  
  // Image container with CTA
  const imageContainer = document.createElement('div');
  imageContainer.className = 'image-container';
  
  if (product.image_url) {
    const img = document.createElement('img');
    img.src = product.image_url;
    img.alt = product.name || 'Product image';
    imageContainer.appendChild(img);
  }
  
  const ctaButton = document.createElement('button');
  ctaButton.className = 'cta-button';
  ctaButton.textContent = 'Where to Buy';
  ctaButton.setAttribute('aria-label', 'Find where to buy this product');
  imageContainer.appendChild(ctaButton);
  
  // Content container
  const content = document.createElement('div');
  content.className = 'content';
  
  if (product.name) {
    const name = document.createElement('h3');
    name.className = 'name';
    name.textContent = product.name;
    content.appendChild(name);
  }
  
  if (product.category) {
    const category = document.createElement('span');
    category.className = 'category';
    category.textContent = product.category;
    content.appendChild(category);
  }
  
  if (product.description) {
    const description = document.createElement('p');
    description.className = 'description';
    description.textContent = product.description;
    content.appendChild(description);
  }
  
  if (product.features && Array.isArray(product.features) && product.features.length > 0) {
    const features = document.createElement('ul');
    features.className = 'features';
    product.features.forEach(feature => {
      const li = document.createElement('li');
      li.textContent = feature;
      features.appendChild(li);
    });
    content.appendChild(features);
  }
  
  card.appendChild(imageContainer);
  card.appendChild(content);
  block.appendChild(card);
  
  // Dark mode support
  if (darkMode) {
    document.body.classList.add('dark');
  }
  
  // Report size
  const ro = new ResizeObserver(() => {
    const rect = block.getBoundingClientRect();
    bridge.reportSize({ width: Math.ceil(rect.width), height: Math.ceil(rect.height) });
  });
  ro.observe(block);
}