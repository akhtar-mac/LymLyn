import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useCartStore = create(
  persist(
    (set, get) => ({
      items: [], // [{ variantId, productId, name, colorName, colorHex, size, price, quantity, imageUrl, slug }]

      addItem: (item) => {
        const { items } = get();
        const existing = items.find((i) => i.variantId === item.variantId);

        if (existing) {
          set({
            items: items.map((i) =>
              i.variantId === item.variantId
                ? { ...i, quantity: i.quantity + (item.quantity || 1) }
                : i
            ),
          });
        } else {
          set({ items: [...items, { ...item, quantity: item.quantity || 1 }] });
        }
      },

      removeItem: (variantId) => {
        set({ items: get().items.filter((i) => i.variantId !== variantId) });
      },

      updateQuantity: (variantId, quantity) => {
        if (quantity < 1) return get().removeItem(variantId);
        set({
          items: get().items.map((i) =>
            i.variantId === variantId ? { ...i, quantity } : i
          ),
        });
      },

      clearCart: () => set({ items: [] }),

      // Derived values
      get itemCount() {
        return get().items.reduce((sum, i) => sum + i.quantity, 0);
      },

      get subtotal() {
        return get().items.reduce((sum, i) => sum + i.price * i.quantity, 0);
      },
    }),
    {
      name: 'lymlyn-cart',
      partialize: (state) => ({ items: state.items }),
    }
  )
);

export default useCartStore;
