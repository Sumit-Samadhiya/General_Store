// Demo data for 5 categories. Replace with API later.
const PLACEHOLDER = 'https://placehold.co/400x400/f5f5f4/78716c?text=Product';

export const DEMO_CATEGORY_PRODUCTS = {
  kitchen: [
    { _id: 'k1', name: 'Carrot - Orange', brand: 'Fresho!', image: PLACEHOLDER, price: 47.12, originalPrice: 62, discountPercent: 24, category: 'kitchen', weights: [{ label: '1 kg', value: '1 kg' }, { label: '500 g', value: '500 g' }] },
    { _id: 'k2', name: 'Cauliflower', brand: 'Fresho!', image: PLACEHOLDER, price: 20, originalPrice: 57, discountPercent: 65, category: 'kitchen', weights: [{ label: '1 pc (approx. 400 to 600 g)', value: '1 pc' }] },
    { _id: 'k3', name: 'Coriander Leaves', brand: 'Fresho!', image: PLACEHOLDER, price: 97.28, originalPrice: 128, discountPercent: 24, category: 'kitchen', weights: [{ label: '1 kg', value: '1 kg' }, { label: '100 g', value: '100 g' }] },
    { _id: 'k4', name: 'Cucumber', brand: 'Fresho!', image: PLACEHOLDER, price: 66.12, originalPrice: 87, discountPercent: 24, category: 'kitchen', weights: [{ label: '1 kg', value: '1 kg' }] },
  ],
  snacks: [
    { _id: 's1', name: 'Almonds', brand: 'Store', image: PLACEHOLDER, price: 449, originalPrice: 499, discountPercent: 10, category: 'snacks', weights: [{ label: '200 g', value: '200 g' }, { label: '500 g', value: '500 g' }] },
    { _id: 's2', name: 'Cashew', brand: 'Store', image: PLACEHOLDER, price: 599, originalPrice: 699, discountPercent: 14, category: 'snacks', weights: [{ label: '200 g', value: '200 g' }] },
    { _id: 's3', name: 'Peanuts', brand: 'Store', image: PLACEHOLDER, price: 89, originalPrice: 99, discountPercent: 10, category: 'snacks', weights: [{ label: '250 g', value: '250 g' }, { label: '500 g', value: '500 g' }] },
  ],
  beauty: [
    { _id: 'b1', name: 'Face Cream', brand: 'Beauty', image: PLACEHOLDER, price: 199, originalPrice: 249, discountPercent: 20, category: 'beauty', weights: [{ label: '50 g', value: '50 g' }] },
    { _id: 'b2', name: 'Shampoo', brand: 'Beauty', image: PLACEHOLDER, price: 299, originalPrice: 349, discountPercent: 14, category: 'beauty', weights: [{ label: '200 ml', value: '200 ml' }, { label: '400 ml', value: '400 ml' }] },
    { _id: 'b3', name: 'Soap', brand: 'Beauty', image: PLACEHOLDER, price: 45, originalPrice: 50, discountPercent: 10, category: 'beauty', weights: [{ label: '1 pc', value: '1 pc' }, { label: '3 pcs', value: '3 pcs' }] },
  ],
  bakery: [
    { _id: 'bk1', name: 'White Bread', brand: 'Bakery', image: PLACEHOLDER, price: 40, originalPrice: 45, discountPercent: 11, category: 'bakery', weights: [{ label: '400 g', value: '400 g' }] },
    { _id: 'bk2', name: 'Croissant', brand: 'Bakery', image: PLACEHOLDER, price: 60, originalPrice: 70, discountPercent: 14, category: 'bakery', weights: [{ label: '1 pc', value: '1 pc' }, { label: '4 pcs', value: '4 pcs' }] },
    { _id: 'bk3', name: 'Muffin', brand: 'Bakery', image: PLACEHOLDER, price: 55, originalPrice: 60, discountPercent: 8, category: 'bakery', weights: [{ label: '1 pc', value: '1 pc' }] },
  ],
  household: [
    { _id: 'h1', name: 'Dish Soap', brand: 'Home', image: PLACEHOLDER, price: 99, originalPrice: 120, discountPercent: 18, category: 'household', weights: [{ label: '500 ml', value: '500 ml' }, { label: '1 L', value: '1 L' }] },
    { _id: 'h2', name: 'Tissue Roll', brand: 'Home', image: PLACEHOLDER, price: 149, originalPrice: 179, discountPercent: 17, category: 'household', weights: [{ label: '4 pcs', value: '4 pcs' }] },
    { _id: 'h3', name: 'Floor Cleaner', brand: 'Home', image: PLACEHOLDER, price: 199, originalPrice: 229, discountPercent: 13, category: 'household', weights: [{ label: '1 L', value: '1 L' }] },
  ],
};
