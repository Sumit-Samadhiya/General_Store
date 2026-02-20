import { useState } from 'react';
import { useCart } from '../../../context/CartContext';

const SmartBasketCard = ({ product, compact = false }) => {
  const { addToCart } = useCart();
  const [selectedWeight, setSelectedWeight] = useState(product.weights?.[0]?.value ?? product.weight ?? '1 kg');

  const price = product.discountedPrice ?? product.price;
  const originalPrice = product.originalPrice ?? product.price;
  const discountPercent = product.discountPercent ?? (originalPrice > price
    ? Math.round(((originalPrice - price) / originalPrice) * 100)
    : 0);

  const handleAdd = () => {
    addToCart(
      {
        _id: product._id,
        name: product.name,
        brand: product.brand,
        price: originalPrice,
        discountedPrice: price,
        images: product.image ? [product.image] : [],
        category: product.category,
        weight: selectedWeight,
      },
      1,
      selectedWeight
    );
  };

  const weights = product.weights?.length
    ? product.weights
    : [{ label: product.weightLabel || '1 kg', value: selectedWeight }];

  return (
    <div
      className={`shrink-0 rounded-xl border border-stone-200 bg-white shadow-sm transition hover:shadow-md ${
        compact ? 'w-[140px] sm:w-[160px] md:w-[180px]' : 'w-[160px] sm:w-[180px] md:w-[200px] lg:w-[220px]'
      }`}
    >
      <div className="relative aspect-square overflow-hidden rounded-t-xl bg-stone-100">
        {discountPercent > 0 && (
          <div
            className="absolute left-0 top-0 z-10 flex h-9 w-14 items-center justify-center bg-primary-600 text-xs font-bold text-white"
            style={{ clipPath: 'polygon(0 0, 100% 0, 100% 100%)' }}
          >
            {discountPercent}% OFF
          </div>
        )}
        <img
          src={product.image || 'https://placehold.co/400x400/f5f5f4/78716c?text=No+Image'}
          alt={product.name}
          className="h-full w-full object-cover"
        />
        <div className="absolute bottom-1.5 right-1.5 flex items-center gap-1 rounded-full bg-amber-400 px-1.5 py-0.5 text-[10px] font-semibold text-stone-900">
          <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
          </svg>
          10 MINS
        </div>
      </div>
      <div className={compact ? 'p-2' : 'p-3'}>
        <p className={compact ? 'text-[10px] text-stone-500' : 'text-xs text-stone-500'}>{product.brand}</p>
        <h3 className={`mt-0.5 font-semibold text-stone-800 line-clamp-2 ${compact ? 'text-xs' : 'text-sm'}`}>
          {product.name}
        </h3>
        <select
          value={selectedWeight}
          onChange={(e) => setSelectedWeight(e.target.value)}
          className={`mt-1.5 w-full rounded border border-stone-300 bg-stone-50 text-stone-700 focus:border-stone-400 focus:outline-none ${
            compact ? 'py-1 text-[10px]' : 'py-1.5 text-xs'
          }`}
        >
          {weights.map((w) => (
            <option key={w.value} value={w.value}>{w.label}</option>
          ))}
        </select>
        <div className={`mt-1.5 flex items-center gap-1.5 ${compact ? 'flex-wrap' : ''}`}>
          <span className={`font-bold text-stone-900 ${compact ? 'text-xs' : 'text-sm'}`}>₹{price}</span>
          {originalPrice > price && (
            <span className={`text-stone-400 line-through ${compact ? 'text-[10px]' : 'text-xs'}`}>
              ₹{originalPrice}
            </span>
          )}
        </div>
        <div className={`mt-2 flex items-center justify-between gap-1 ${compact ? 'mt-1.5' : ''}`}>
          <button type="button" className="rounded p-1 text-stone-400 transition hover:bg-stone-100 hover:text-stone-600" aria-label="Save">
            <svg className={compact ? 'h-4 w-4' : 'h-5 w-5'} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
          </button>
          <button
            type="button"
            onClick={handleAdd}
            className="rounded bg-red-500 px-2.5 py-1 text-xs font-semibold text-white transition hover:bg-red-600"
          >
            Add
          </button>
        </div>
      </div>
    </div>
  );
};

export default SmartBasketCard;
