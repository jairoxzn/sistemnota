// Estado global del carrito del punto de venta (Zustand).
import { create } from 'zustand';

export const useCartStore = create((set, get) => ({
  items: [], // { id, code, name, price, stock, quantity }
  customer: null,
  paymentMethod: 'CASH',
  discount: 0,

  // Agrega un producto o incrementa su cantidad (respetando stock)
  addItem: (product) =>
    set((state) => {
      const existing = state.items.find((i) => i.id === product.id);
      if (existing) {
        const quantity = Math.min(existing.quantity + 1, product.stock);
        return {
          items: state.items.map((i) => (i.id === product.id ? { ...i, quantity } : i)),
        };
      }
      if (product.stock <= 0) return state; // sin stock, no se agrega
      return {
        items: [
          ...state.items,
          {
            id: product.id,
            code: product.code,
            name: product.name,
            price: Number(product.price),
            stock: product.stock,
            quantity: 1,
          },
        ],
      };
    }),

  setQuantity: (id, quantity) =>
    set((state) => ({
      items: state.items.map((i) =>
        i.id === id ? { ...i, quantity: Math.max(1, Math.min(quantity, i.stock)) } : i
      ),
    })),

  removeItem: (id) => set((state) => ({ items: state.items.filter((i) => i.id !== id) })),

  setCustomer: (customer) => set({ customer }),
  setPaymentMethod: (paymentMethod) => set({ paymentMethod }),
  setDiscount: (discount) => set({ discount: Math.max(0, Number(discount) || 0) }),

  clear: () => set({ items: [], customer: null, paymentMethod: 'CASH', discount: 0 }),

  // Cálculos derivados
  subtotal: () => get().items.reduce((acc, i) => acc + i.price * i.quantity, 0),
  total: () => {
    const sub = get().subtotal();
    return Math.max(0, sub - Math.min(get().discount, sub));
  },
  count: () => get().items.reduce((acc, i) => acc + i.quantity, 0),
}));
