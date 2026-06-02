import { create } from 'zustand';

export const useCartStore = create((set, get) => ({
  items: JSON.parse(localStorage.getItem('vlxd_cart')) || [],

  addItem: (product, quantity = 1) => {
    const items = [...get().items];
    const existingIndex = items.findIndex((item) => item.product.id === product.id);

    if (existingIndex > -1) {
      items[existingIndex].quantity += quantity;
    } else {
      items.push({ product, quantity });
    }

    localStorage.setItem('vlxd_cart', JSON.stringify(items));
    set({ items });
  },

  removeItem: (productId) => {
    const items = get().items.filter((item) => item.product.id !== productId);
    localStorage.setItem('vlxd_cart', JSON.stringify(items));
    set({ items });
  },

  updateQuantity: (productId, quantity) => {
    if (quantity <= 0) {
      get().removeItem(productId);
      return;
    }
    const items = get().items.map((item) =>
      item.product.id === productId ? { ...item, quantity } : item
    );
    localStorage.setItem('vlxd_cart', JSON.stringify(items));
    set({ items });
  },

  clearCart: () => {
    localStorage.removeItem('vlxd_cart');
    set({ items: [] });
  },

  // Helper to compute unit price according to customer tier
  getItemPrice: (product, tier = 'Retail') => {
    if (!product.priceTiers || product.priceTiers.length === 0) {
      return product.basePrice;
    }
    const tierPrice = product.priceTiers.find(
      (t) => t.tierName.toLowerCase() === tier.toLowerCase()
    );
    return tierPrice ? tierPrice.price : product.basePrice;
  },

  getCartTotal: (tier = 'Retail') => {
    return get().items.reduce((total, item) => {
      const price = get().getItemPrice(item.product, tier);
      return total + price * item.quantity;
    }, 0);
  }
}));
