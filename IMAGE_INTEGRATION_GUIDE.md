# Image Integration Guide - Products & Cart

This guide shows how to integrate the image upload functionality with existing product and cart endpoints.

---

## 📦 Product Images Integration

### 1. Upload Product Image First

```bash
# Step 1: Upload product image
curl -X POST http://localhost:5000/api/upload \
  -F "image=@product.jpg" \
  -F "folder=products"

# Response:
{
  "data": {
    "url": "http://localhost:5000/images/products/image-1645012800000-123456789.jpg",
    "variants": {...}
  }
}
```

### 2. Create Product with Image URL

```bash
# Step 2: Create product with uploaded image
curl -X POST http://localhost:5000/api/v1/admin/products \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Laptop",
    "description": "High-performance laptop",
    "category": "electronics",
    "price": 99900,
    "stock": 50,
    "images": [
      "http://localhost:5000/images/products/image-1645012800000-123456789.jpg"
    ]
  }'
```

### 3. Update Product with New Images

```bash
# Step 1: Upload new image
curl -X POST http://localhost:5000/api/upload \
  -F "image=@new-image.jpg" \
  -F "folder=products"

# Step 2: Update product
curl -X PUT http://localhost:5000/api/v1/admin/products/60d5ec49c1234567890abcde \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "images": [
      "http://localhost:5000/images/products/image-1645012800000-123456789.jpg",
      "http://localhost:5000/images/products/image-1645012800000-987654321.jpg"
    ]
  }'

# Step 3: Delete old image if needed
curl -X DELETE http://localhost:5000/api/upload/image-old-hash.jpg
```

---

## 🛒 Shopping Cart with Product Images

### Display Product with Images in Cart

```javascript
// React Frontend Example
const CartItem = ({ item }) => {
  const { productId, quantity } = item;
  const { name, price, image } = productId; // image is the URL

  return (
    <div className="cart-item">
      <img 
        src={image} 
        alt={name}
        style={{ width: '100px', height: '100px', objectFit: 'cover' }}
      />
      <div>
        <h3>{name}</h3>
        <p>Price: ${(price / 100).toFixed(2)}</p>
        <p>Quantity: {quantity}</p>
      </div>
    </div>
  );
};
```

### API Response with Images

When fetching cart with populated products:

```json
{
  "success": true,
  "data": {
    "_id": "60d5ec50c1234567890abcdf",
    "items": [
      {
        "_id": "60d5ec51c1234567890abce0",
        "productId": {
          "_id": "60d5ec49c1234567890abcde",
          "name": "Laptop",
          "price": 99900,
          "image": "http://localhost:5000/images/products/image-1645012800000-123456789.jpg",
          "images": [
            "http://localhost:5000/images/products/image-1645012800000-123456789.jpg",
            "http://localhost:5000/images/products/image-1645012800000-987654321.jpg"
          ]
        },
        "quantity": 2,
        "price": 99900
      }
    ],
    "total": 199800
  }
}
```

---

## 👤 Shop Profile with Banner and Logo

### Upload Shop Logo

```bash
# Upload shop logo
curl -X POST http://localhost:5000/api/upload \
  -F "image=@logo.png" \
  -F "folder=profiles"

# Response: { data: { url: "..." } }
```

### Upload Shop Banner

```bash
# Upload shop banner
curl -X POST http://localhost:5000/api/upload \
  -F "image=@banner.jpg" \
  -F "folder=banners"

# Response: { data: { url: "..." } }
```

### Create/Update Shop with Images

```bash
curl -X POST http://localhost:5000/api/v1/admin/shop \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Tech Store",
    "description": "Premium electronics",
    "logo": "http://localhost:5000/images/profiles/logo-abc123.png",
    "banner": "http://localhost:5000/images/banners/banner-def456.jpg"
  }'
```

---

## 🎨 Image Variants Usage

### Responsive Images in Frontend

```html
<!-- Display different sizes for different screen sizes -->
<picture>
  <!-- Mobile: use thumbnail -->
  <source 
    media="(max-width: 640px)" 
    srcset="{{ image.variants.thumbnail }}"
  />
  <!-- Tablet: use small -->
  <source 
    media="(max-width: 1024px)" 
    srcset="{{ image.variants.small }}"
  />
  <!-- Desktop: use original -->
  <img 
    src="{{ image.variants.original }}" 
    alt="Product"
  />
</picture>
```

### Optimized Image Loading

```javascript
// React with lazy loading
import { useState } from 'react';

const LazyImage = ({ src, variants }) => {
  const [loaded, setLoaded] = useState(false);

  return (
    <img
      src={variants.thumbnail}  // Load thumbnail first
      onLoad={() => setLoaded(true)}
      onError={() => setLoaded(false)}
    />
  );
};
```

---

## 🗑️ Image Cleanup Strategy

### Delete Old Images Before Update

```javascript
// Before updating product with new images
async function updateProductImages(productId, newImageUrls, oldImageUrls) {
  // 1. Delete old images
  for (const oldUrl of oldImageUrls) {
    const filename = oldUrl.split('/').pop();
    await fetch(`/api/upload/${filename}`, {
      method: 'DELETE'
    });
  }

  // 2. Update product
  await fetch(`/api/v1/admin/products/${productId}`, {
    method: 'PUT',
    body: JSON.stringify({ images: newImageUrls })
  });
}
```

### Auto-cleanup Old Product Images

```javascript
// When product is deleted, delete all its images
async function deleteProduct(productId) {
  // 1. Get product to find images
  const product = await getProduct(productId);

  // 2. Delete all images
  for (const imageUrl of product.images) {
    const filename = imageUrl.split('/').pop();
    await deleteImage(filename);
  }

  // 3. Delete product
  await deleteProductFromDB(productId);
}
```

---

## 🔄 Batch Image Operations

### Upload Multiple Product Images At Once

```bash
curl -X POST http://localhost:5000/api/upload/batch \
  -F "images=@product1.jpg" \
  -F "images=@product2.jpg" \
  -F "images=@product3.jpg" \
  -F "folder=products"

# Response:
{
  "success": true,
  "data": {
    "count": 3,
    "images": [
      { "url": "..." },
      { "url": "..." },
      { "url": "..." }
    ]
  }
}
```

### Create Product with Multiple Images in One Request

```javascript
// Frontend: Upload all images first, then create product
async function createProductWithImages(formData, imageFiles) {
  // Step 1: Upload all images
  const uploadPromises = imageFiles.map(file => {
    const form = new FormData();
    form.append('image', file);
    form.append('folder', 'products');
    return fetch('/api/upload', { method: 'POST', body: form });
  });

  const uploadResponses = await Promise.all(uploadPromises);
  const imageUrls = await Promise.all(
    uploadResponses.map(r => r.json().then(d => d.data.url))
  );

  // Step 2: Create product with image URLs
  const product = {
    ...formData,
    images: imageUrls
  };

  return fetch('/api/v1/admin/products', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(product)
  });
}
```

---

## 📱 Frontend Components

### Product Image Gallery

```jsx
import React, { useState } from 'react';

const ProductGallery = ({ product }) => {
  const [selectedImage, setSelectedImage] = useState(product.images[0]);

  return (
    <div className="gallery">
      {/* Main image */}
      <div className="main-image">
        <img src={selectedImage} alt={product.name} />
      </div>

      {/* Thumbnails */}
      <div className="thumbnails">
        {product.images.map((image, idx) => (
          <img
            key={idx}
            src={image.replace('/original/', '/thumbnail/')}
            alt={`${product.name} ${idx + 1}`}
            onClick={() => setSelectedImage(image)}
            style={{
              cursor: 'pointer',
              border: selectedImage === image ? '2px solid blue' : 'none'
            }}
          />
        ))}
      </div>
    </div>
  );
};
```

### Shop Profile with Logo and Banner

```jsx
const ShopProfile = ({ shop }) => {
  return (
    <div className="shop-profile">
      {/* Banner */}
      {shop.banner && (
        <div className="shop-banner">
          <img src={shop.banner} alt={shop.name} />
        </div>
      )}

      {/* Logo and Info */}
      <div className="shop-header">
        {shop.logo && (
          <img src={shop.logo} alt={shop.name} className="shop-logo" />
        )}
        <h1>{shop.name}</h1>
        <p>{shop.description}</p>
      </div>
    </div>
  );
};
```

### Image Upload Form

```jsx
import React, { useState } from 'react';

const ImageUploadForm = ({ onUploadSuccess }) => {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('folder', 'products');

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) throw new Error('Upload failed');

      const { data } = await response.json();
      onUploadSuccess(data);

      // Reset form
      setFile(null);
      setPreview(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="upload-form">
      <input
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        disabled={uploading}
      />

      {preview && (
        <div className="preview">
          <img src={preview} alt="Preview" />
        </div>
      )}

      {error && <p className="error">{error}</p>}

      <button 
        onClick={handleUpload}
        disabled={!file || uploading}
      >
        {uploading ? 'Uploading...' : 'Upload'}
      </button>
    </div>
  );
};

export default ImageUploadForm;
```

---

## 🔐 Secure Image Handling

### Prevent Direct File Access

```javascript
// In server.js - only allow specific folders to be served
const allowedFolders = ['products', 'profiles', 'banners'];

app.use('/images/:folder/:filename', (req, res, next) => {
  if (!allowedFolders.includes(req.params.folder)) {
    return res.status(403).json({ success: false, message: 'Forbidden' });
  }
  next();
}, express.static(path.join(__dirname, '../uploads')));
```

### Validate Image on Client

```javascript
// Validate before upload
function validateImage(file) {
  // Check file size
  const MAX_SIZE = 5 * 1024 * 1024; // 5MB
  if (file.size > MAX_SIZE) {
    throw new Error('File too large');
  }

  // Check file type
  const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif'];
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error('Invalid file type');
  }

  return true;
}
```

---

## 📊 Database Schema Updates

### Product Model with Images

```javascript
const productSchema = new Schema({
  name: String,
  description: String,
  image: String,        // Primary image URL
  images: [String],     // Array of image URLs
  imageVariants: {
    thumbnail: String,
    small: String,
    medium: String,
    large: String
  },
  // ... other fields
});
```

### Shop Model with Images

```javascript
const shopSchema = new Schema({
  name: String,
  logo: String,        // Logo image URL
  banner: String,      // Banner image URL
  logoVariants: {
    thumbnail: String,
    small: String
  },
  bannerVariants: {
    thumbnail: String,
    medium: String,
    large: String
  },
  // ... other fields
});
```

---

## ✅ Implementation Checklist

- [ ] Install multer and cloud storage dependencies
- [ ] Create upload configuration
- [ ] Create image service
- [ ] Create upload controller
- [ ] Create upload routes
- [ ] Add upload routes to server
- [ ] Create image middleware
- [ ] Test single file upload
- [ ] Test batch file upload
- [ ] Test image deletion
- [ ] Test image retrieval
- [ ] Integrate with product endpoints
- [ ] Integrate with shop endpoints
- [ ] Create frontend components
- [ ] Test complete workflow
- [ ] Configure cloud storage (S3/Cloudinary)
- [ ] Set up image cleanup jobs
- [ ] Document API usage
- [ ] Deploy to production

---

## 🚀 Next Steps

1. Review [Image Upload Documentation](./IMAGE_UPLOAD_DOCUMENTATION.md)
2. Run test script: `bash test-image-upload.sh`
3. Import Postman collection
4. Integrate with your frontend
5. Configure cloud storage for production
6. Set up image cleanup jobs

---

**Last Updated:** February 19, 2026  
**Status:** Ready for Integration
