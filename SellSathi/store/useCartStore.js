import { create } from 'zustand';

export const useCartStore = create((set, get) => ({
  items: [],
  addItem:    (item) => set((s) => ({ items: [...s.items, item] })),
  removeItem: (id)   => set((s) => ({ items: s.items.filter(i => i.id !== id) })),
  clearCart:  ()     => set({ items: [] }),
  getTotal:   ()     => get().items.reduce((sum, i) => sum + i.price * i.qty, 0),
}));
