export const formatPrice = (price) => {
  return `$${price.toFixed(2)}`;
};

export const calculateDiscount = (originalPrice, discountedPrice) => {
  return Math.round(((originalPrice - discountedPrice) / originalPrice) * 100);
};
