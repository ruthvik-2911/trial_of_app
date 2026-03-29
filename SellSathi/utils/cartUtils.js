export const getCartTotal = (items) => {
  return items.reduce((total, item) => total + (item.price * item.qty), 0);
};

export const getCartCount = (items) => {
  return items.reduce((count, item) => count + item.qty, 0);
};
