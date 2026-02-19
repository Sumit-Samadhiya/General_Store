# Frontend Integration Guide - Customer API

This guide shows how to integrate the General Store customer API with a React frontend.

## 📦 Setup

### Install Dependencies
```bash
npm install axios
```

### Environment Configuration
Create `.env.local`:
```
REACT_APP_API_URL=http://localhost:5000
REACT_APP_API_TIMEOUT=5000
```

---

## 🔐 Authentication Service

### `services/authService.js`
```javascript
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL;

const authService = {
  login: async (email, password) => {
    const response = await axios.post(`${API_URL}/api/v1/auth/login`, {
      email,
      password
    });
    
    if (response.data.success) {
      const { accessToken, user } = response.data.data;
      localStorage.setItem('token', accessToken);
      localStorage.setItem('user', JSON.stringify(user));
      return { success: true, user, token: accessToken };
    }
    return { success: false, message: response.data.message };
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  getToken: () => localStorage.getItem('token'),
  
  isAuthenticated: () => !!localStorage.getItem('token'),

  getUser: () => JSON.parse(localStorage.getItem('user') || '{}')
};

export default authService;
```

---

## 🛍️ Product Service

### `services/productService.js`
```javascript
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL;

const productService = {
  // Get all products with filters
  getAllProducts: async (params = {}) => {
    const { page = 1, limit = 20, search, category, minPrice, maxPrice, sortBy, sortOrder } = params;
    
    const response = await axios.get(`${API_URL}/api/products`, {
      params: { page, limit, search, category, minPrice, maxPrice, sortBy, sortOrder }
    });
    
    if (response.data.success) {
      return { 
        success: true, 
        products: response.data.data.products || response.data.data,
        pagination: response.data.data.pagination || response.data.pagination
      };
    }
    return { success: false, message: response.data.message };
  },

  // Get product by ID
  getProductById: async (id) => {
    const response = await axios.get(`${API_URL}/api/products/${id}`);
    
    if (response.data.success) {
      return { success: true, product: response.data.data };
    }
    return { success: false, message: response.data.message };
  },

  // Get all categories
  getCategories: async () => {
    const response = await axios.get(`${API_URL}/api/products/categories`);
    
    if (response.data.success) {
      return { success: true, categories: response.data.data };
    }
    return { success: false, message: response.data.message };
  },

  // Search products
  searchProducts: async (query, params = {}) => {
    const response = await axios.get(`${API_URL}/api/products/search`, {
      params: { q: query, ...params }
    });
    
    if (response.data.success) {
      return { success: true, products: response.data.data };
    }
    return { success: false, message: response.data.message };
  },

  // Get products by category
  getProductsByCategory: async (category, params = {}) => {
    const response = await axios.get(`${API_URL}/api/products/category/${category}`, {
      params
    });
    
    if (response.data.success) {
      return { success: true, products: response.data.data.products };
    }
    return { success: false, message: response.data.message };
  },

  // Get products by shop
  getProductsByShop: async (shopId, params = {}) => {
    const response = await axios.get(`${API_URL}/api/products/shop/${shopId}`, {
      params
    });
    
    if (response.data.success) {
      return { success: true, products: response.data.data };
    }
    return { success: false, message: response.data.message };
  }
};

export default productService;
```

---

## 🛒 Cart Service

### `services/cartService.js`
```javascript
import axios from 'axios';
import authService from './authService';

const API_URL = process.env.REACT_APP_API_URL;

const getAuthHeader = () => ({
  'Authorization': `Bearer ${authService.getToken()}`
});

const cartService = {
  // Get user's cart
  getCart: async () => {
    const response = await axios.get(`${API_URL}/api/cart`, {
      headers: getAuthHeader()
    });
    
    if (response.data.success) {
      return { success: true, cart: response.data.data };
    }
    return { success: false, message: response.data.message };
  },

  // Get cart summary
  getCartSummary: async () => {
    const response = await axios.get(`${API_URL}/api/cart/summary`, {
      headers: getAuthHeader()
    });
    
    if (response.data.success) {
      return { success: true, summary: response.data.data };
    }
    return { success: false, message: response.data.message };
  },

  // Add item to cart
  addToCart: async (productId, quantity) => {
    const response = await axios.post(`${API_URL}/api/cart`, {
      productId,
      quantity
    }, {
      headers: getAuthHeader()
    });
    
    if (response.data.success) {
      return { success: true, cart: response.data.data };
    }
    return { success: false, message: response.data.message };
  },

  // Update cart item quantity
  updateCartItem: async (itemId, quantity) => {
    const response = await axios.put(`${API_URL}/api/cart/${itemId}`, {
      quantity
    }, {
      headers: getAuthHeader()
    });
    
    if (response.data.success) {
      return { success: true, cart: response.data.data };
    }
    return { success: false, message: response.data.message };
  },

  // Remove item from cart
  removeFromCart: async (itemId) => {
    const response = await axios.delete(`${API_URL}/api/cart/${itemId}`, {
      headers: getAuthHeader()
    });
    
    if (response.data.success) {
      return { success: true, cart: response.data.data };
    }
    return { success: false, message: response.data.message };
  },

  // Clear entire cart
  clearCart: async () => {
    const response = await axios.delete(`${API_URL}/api/cart`, {
      headers: getAuthHeader()
    });
    
    if (response.data.success) {
      return { success: true, message: 'Cart cleared' };
    }
    return { success: false, message: response.data.message };
  }
};

export default cartService;
```

---

## ⚛️ React Hooks

### `hooks/useProducts.js`
```javascript
import { useState, useEffect } from 'react';
import productService from '../services/productService';

export const useProducts = (filters = {}) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState(null);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      setError(null);
      
      const result = await productService.getAllProducts(filters);
      
      if (result.success) {
        setProducts(result.products);
        setPagination(result.pagination);
      } else {
        setError(result.message);
      }
      
      setLoading(false);
    };

    fetchProducts();
  }, [filters]);

  return { products, loading, error, pagination };
};

export const useProduct = (id) => {
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id) return;

    const fetchProduct = async () => {
      setLoading(true);
      setError(null);
      
      const result = await productService.getProductById(id);
      
      if (result.success) {
        setProduct(result.product);
      } else {
        setError(result.message);
      }
      
      setLoading(false);
    };

    fetchProduct();
  }, [id]);

  return { product, loading, error };
};

export const useCategories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCategories = async () => {
      setLoading(true);
      setError(null);
      
      const result = await productService.getCategories();
      
      if (result.success) {
        setCategories(result.categories);
      } else {
        setError(result.message);
      }
      
      setLoading(false);
    };

    fetchCategories();
  }, []);

  return { categories, loading, error };
};
```

### `hooks/useCart.js`
```javascript
import { useState, useEffect, useCallback } from 'react';
import cartService from '../services/cartService';
import authService from '../services/authService';

export const useCart = () => {
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchCart = useCallback(async () => {
    if (!authService.isAuthenticated()) {
      setCart(null);
      return;
    }

    setLoading(true);
    setError(null);
    
    const result = await cartService.getCart();
    
    if (result.success) {
      setCart(result.cart);
    } else {
      setError(result.message);
    }
    
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const addToCart = async (productId, quantity) => {
    const result = await cartService.addToCart(productId, quantity);
    if (result.success) {
      setCart(result.cart);
      return { success: true };
    }
    setError(result.message);
    return { success: false, message: result.message };
  };

  const updateItem = async (itemId, quantity) => {
    const result = await cartService.updateCartItem(itemId, quantity);
    if (result.success) {
      setCart(result.cart);
      return { success: true };
    }
    setError(result.message);
    return { success: false, message: result.message };
  };

  const removeItem = async (itemId) => {
    const result = await cartService.removeFromCart(itemId);
    if (result.success) {
      setCart(result.cart);
      return { success: true };
    }
    setError(result.message);
    return { success: false, message: result.message };
  };

  const clear = async () => {
    const result = await cartService.clearCart();
    if (result.success) {
      setCart(null);
      return { success: true };
    }
    setError(result.message);
    return { success: false, message: result.message };
  };

  return {
    cart,
    loading,
    error,
    addToCart,
    updateItem,
    removeItem,
    clear,
    refetch: fetchCart
  };
};

export const useCartSummary = () => {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      setSummary(null);
      return;
    }

    const fetchSummary = async () => {
      setLoading(true);
      const result = await cartService.getCartSummary();
      
      if (result.success) {
        setSummary(result.summary);
      }
      
      setLoading(false);
    };

    fetchSummary();
  }, []);

  return { summary, loading };
};
```

---

## 📄 Component Examples

### Product List Component
```jsx
import React, { useState } from 'react';
import { useProducts } from '../hooks/useProducts';

const ProductList = () => {
  const [filters, setFilters] = useState({ page: 1, limit: 20 });
  const { products, loading, error, pagination } = useProducts(filters);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <div className="products-grid">
        {products.map(product => (
          <ProductCard key={product._id} product={product} />
        ))}
      </div>

      {pagination && (
        <div className="pagination">
          <button 
            disabled={!pagination.hasPrevPage}
            onClick={() => setFilters({...filters, page: filters.page - 1})}
          >
            Previous
          </button>
          <span>Page {pagination.currentPage} of {pagination.totalPages}</span>
          <button 
            disabled={!pagination.hasNextPage}
            onClick={() => setFilters({...filters, page: filters.page + 1})}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};
```

### Product Details Component
```jsx
import React, { useState } from 'react';
import { useProduct } from '../hooks/useProducts';
import { useCart } from '../hooks/useCart';

const ProductDetail = ({ productId }) => {
  const { product, loading, error } = useProduct(productId);
  const { addToCart } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [message, setMessage] = useState(null);

  const handleAddToCart = async () => {
    const result = await addToCart(productId, quantity);
    if (result.success) {
      setMessage('Added to cart successfully!');
    } else {
      setMessage(`Error: ${result.message}`);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!product) return <div>Product not found</div>;

  return (
    <div className="product-detail">
      <h1>{product.name}</h1>
      <p>{product.description}</p>
      <p>Category: {product.category}</p>
      <p>Price: ${(product.price / 100).toFixed(2)}</p>
      <p>Stock: {product.stock} available</p>
      <p>Rating: {product.rating}/5 ({product.reviewCount} reviews)</p>

      <div>
        <input 
          type="number" 
          min="1" 
          max={product.stock}
          value={quantity}
          onChange={(e) => setQuantity(parseInt(e.target.value))}
        />
        <button 
          onClick={handleAddToCart}
          disabled={product.stock === 0}
        >
          Add to Cart
        </button>
      </div>

      {message && <p>{message}</p>}
    </div>
  );
};
```

### Cart Component
```jsx
import React from 'react';
import { useCart } from '../hooks/useCart';

const Cart = () => {
  const { cart, loading, updateItem, removeItem } = useCart();

  if (loading) return <div>Loading cart...</div>;
  if (!cart || cart.items.length === 0) return <div>Cart is empty</div>;

  return (
    <div className="cart">
      <h2>Your Cart</h2>

      <table>
        <thead>
          <tr>
            <th>Product</th>
            <th>Price</th>
            <th>Quantity</th>
            <th>Subtotal</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {cart.items.map(item => (
            <tr key={item._id}>
              <td>{item.productId.name}</td>
              <td>${(item.price / 100).toFixed(2)}</td>
              <td>
                <input 
                  type="number"
                  min="1"
                  value={item.quantity}
                  onChange={(e) => updateItem(item._id, parseInt(e.target.value))}
                />
              </td>
              <td>${((item.price * item.quantity) / 100).toFixed(2)}</td>
              <td>
                <button onClick={() => removeItem(item._id)}>Remove</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="cart-summary">
        <p>Total Items: {cart.itemCount}</p>
        <p>Total: ${(cart.total / 100).toFixed(2)}</p>
        <button>Checkout</button>
      </div>
    </div>
  );
};
```

---

## 🔄 Context API (Optional)

### `context/AuthContext.js`
```javascript
import React, { createContext, useState, useEffect } from 'react';
import authService from '../services/authService';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authService.isAuthenticated()) {
      setUser(authService.getUser());
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const result = await authService.login(email, password);
    if (result.success) {
      setUser(result.user);
    }
    return result;
  };

  const logout = () => {
    authService.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
```

---

## 🛡️ Error Handling

### Common Error Scenarios
```javascript
const handleApiError = (error) => {
  if (error.response?.status === 401) {
    // Unauthorized - redirect to login
    window.location.href = '/login';
  } else if (error.response?.status === 400) {
    // Bad request - show validation error
    console.error('Validation error:', error.response.data.message);
  } else if (error.response?.status === 404) {
    // Not found
    console.error('Resource not found');
  } else if (error.response?.status === 500) {
    // Server error
    console.error('Server error');
  } else {
    // Network error
    console.error('Network error');
  }
};
```

---

## 📝 Testing Components

### Jest Example
```javascript
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ProductList from '../ProductList';
import * as productService from '../services/productService';

jest.mock('../services/productService');

test('renders product list', async () => {
  productService.getAllProducts.mockResolvedValue({
    success: true,
    products: [{ _id: '1', name: 'Test Product', price: 10000 }],
    pagination: { currentPage: 1, totalPages: 1 }
  });

  render(<ProductList />);

  await waitFor(() => {
    expect(screen.getByText('Test Product')).toBeInTheDocument();
  });
});
```

---

## 📚 Best Practices

✅ **Authenticate Before Cart Operations** - Always check `authService.isAuthenticated()`  
✅ **Handle Loading States** - Show spinners/skeletons during API calls  
✅ **Validation** - Validate quantity input (min 1, max stock)  
✅ **Error Messages** - Show user-friendly error messages  
✅ **Cache Data** - Consider using React Query or SWR for caching  
✅ **Token Refresh** - Implement token refresh logic for expired tokens  
✅ **Rate Limiting** - Implement debouncing for search/filter updates  
✅ **Accessibility** - Use proper ARIA labels and semantic HTML  

---

## 🚀 Deployment Checklist

- [ ] Update `REACT_APP_API_URL` for production environment
- [ ] Implement secure token storage (consider httpOnly cookies)
- [ ] Add error boundary component
- [ ] Implement request timeout handling
- [ ] Add loading skeletons
- [ ] Set up analytics/monitoring
- [ ] Test all error scenarios
- [ ] Implement offline mode (optional)
- [ ] Add input validation on frontend
- [ ] Set up CI/CD pipeline

---

**Generated for:** General Store E-Commerce Platform  
**API Version:** 1.0  
**Last Updated:** February 19, 2026
