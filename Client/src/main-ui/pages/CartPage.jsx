import { Link } from 'react-router-dom';
import MainHeader from '../components/Header/MainHeader';
import { useCart } from '../../context/CartContext';

const CartPage = () => {
  const { cartItems, getTotalPrice, removeFromCart, updateQuantity } = useCart();
  const total = getTotalPrice();

  return (
    <div className="min-h-screen bg-stone-50">
      <MainHeader />
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <h1 className="font-display text-3xl font-bold text-stone-900">Cart</h1>
        {cartItems.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-stone-200 bg-white p-12 text-center">
            <p className="text-stone-600">Your cart is empty.</p>
            <Link to="/" className="mt-4 inline-block font-medium text-primary-600 hover:underline">Continue shopping</Link>
          </div>
        ) : (
          <div className="mt-8 space-y-4">
            {cartItems.map((item) => (
              <div
                key={`${item._id}-${item.weight}`}
                className="flex gap-4 rounded-2xl border border-stone-200 bg-white p-4"
              >
                <img
                  src={item.image}
                  alt={item.name}
                  className="h-24 w-24 rounded-xl object-cover"
                />
                <div className="flex-1">
                  <h3 className="font-semibold text-stone-900">{item.name}</h3>
                  <p className="text-sm text-stone-500">{item.weight && `Weight: ${item.weight}`}</p>
                  <p className="mt-1 font-bold text-stone-900">₹{item.price} × {item.quantity}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => updateQuantity(item._id, item.weight, item.quantity - 1)}
                    className="rounded-lg border border-stone-300 px-2 py-1 text-sm hover:bg-stone-50"
                  >
                    −
                  </button>
                  <span className="w-8 text-center text-sm">{item.quantity}</span>
                  <button
                    type="button"
                    onClick={() => updateQuantity(item._id, item.weight, item.quantity + 1)}
                    className="rounded-lg border border-stone-300 px-2 py-1 text-sm hover:bg-stone-50"
                  >
                    +
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => removeFromCart(item._id, item.weight)}
                  className="text-sm text-red-600 hover:underline"
                >
                  Remove
                </button>
              </div>
            ))}
            <div className="rounded-2xl border border-stone-200 bg-white p-6">
              <p className="text-right text-xl font-bold text-stone-900">Total: ₹{total.toFixed(2)}</p>
              <p className="mt-2 text-right text-sm text-stone-500">Checkout — coming soon.</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default CartPage;
