import { Link, useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import MainHeader from '../components/Header/MainHeader';
import { getProductsByCategory } from '../services/productsApi';

const CategoryPage = () => {
  const { category } = useParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    getProductsByCategory(category || '')
      .then((data) => { if (!cancelled) setProducts(Array.isArray(data) ? data : []); })
      .catch(() => { if (!cancelled) setProducts([]); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [category]);

  const title = category ? `${category.charAt(0).toUpperCase() + category.slice(1)}` : 'Category';

  return (
    <div className="min-h-screen bg-stone-50">
      <MainHeader />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Link to="/" className="text-sm text-stone-500 hover:text-stone-900">← Home</Link>
        <h1 className="mt-4 font-display text-3xl font-bold text-stone-900">{title}</h1>
        {loading ? (
          <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => <div key={i} className="h-64 animate-pulse rounded-2xl bg-stone-200" />)}
          </div>
        ) : products.length > 0 ? (
          <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {products.map((p) => (
              <Link
                key={p._id}
                to="/"
                className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm hover:shadow-md"
              >
                <div className="aspect-square bg-stone-100">
                  <img
                    src={p.images?.[0] || 'https://placehold.co/400x400/f5f5f4/78716c?text=No+Image'}
                    alt={p.name}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-stone-800 line-clamp-2">{p.name}</h3>
                  <p className="mt-1 text-sm text-stone-500">{p.brand}</p>
                  <p className="mt-2 font-bold text-stone-900">₹{p.discountedPrice ?? p.price}</p>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p className="mt-8 text-stone-500">No products in this category.</p>
        )}
      </main>
    </div>
  );
};

export default CategoryPage;
