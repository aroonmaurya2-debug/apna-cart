(() => {
  const findProduct = (button) => {
    const card = button?.closest?.('.product-card');
    const id = Number(card?.dataset.backendProduct || card?.dataset.productId || 0);
    if (!id) return null;
    return { id, card };
  };
  const openCheckout = (button) => {
    const found = findProduct(button);
    if (!found) return false;
    const card = found.card;
    const add = card.querySelector('[data-add-backend]');
    if (add) add.click();
    setTimeout(() => {
      const cart = [...document.querySelectorAll('.bottom-nav button, .bottom-nav a')].find(el => /cart/i.test(el.textContent || el.getAttribute('aria-label') || ''));
      if (cart) cart.click();
      else window.dispatchEvent(new CustomEvent('apna-cart-open-cart'));
    }, 80);
    return true;
  };
  document.addEventListener('click', (e) => {
    const button = e.target?.closest?.('.ac-buy');
    if (!button) return;
    // Product-detail-enhance.js handles Buy Now inside the product modal.
    // This global handler is only for Buy Now buttons attached to product cards.
    if (button.closest?.('.product-modal,.product-detail-overlay,[role="dialog"]')) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    openCheckout(button);
  }, true);
})();