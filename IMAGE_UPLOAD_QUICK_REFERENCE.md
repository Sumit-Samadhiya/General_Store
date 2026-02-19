# Image Upload API - Quick Reference

## 🚀 Quick Start

### 1. Installation
```bash
cd Server
npm install multer aws-sdk cloudinary image-size
```

### 2. Configure Environment
```bash
# .env
STORAGE_TYPE=local                    # or s3, cloudinary
API_BASE_URL=http://localhost:5000/api/v1
```

### 3. Start Server
```bash
npm start
```

### 4. Upload Image
```bash
curl -X POST http://localhost:5000/api/upload \
  -F "image=@photo.jpg" \
  -F "folder=products"
```

---

## 📋 Endpoints

### Upload Single

```
POST /api/upload
Query/Body: folder=products|profiles|banners
Response: { success, data: { url, variants, size, ... } }
```

### Upload Batch

```
POST /api/upload/batch
Query/Body: folder=products|profiles|banners (max 5 files)
Response: { success, data: { count, images: [...] } }
```

### Delete Image

```
DELETE /api/upload/:imageUrl
Body: { cloudinaryId } (optional)
Response: { success, message, data: { deletedAt } }
```

### Get Image Info

```
GET /api/upload/info/:imageUrl?cloudinaryId=...
Response: { success, data: { url, variants, cloudinaryId } }
```

---

## 📸 File Specs

| Type | Max Size | Format |
|------|----------|--------|
| Product | 5 MB | JPG, PNG, GIF, WebP |
| Profile | 2 MB | JPG, PNG, GIF, WebP |
| Banner | 10 MB | JPG, PNG, GIF, WebP |

---

## 🏗️ Storage Options

### Local (Development)
```env
STORAGE_TYPE=local
# Files in: Server/uploads/{products|profiles|banners}/
# Access: http://localhost:5000/images/{folder}/{filename}
```

### AWS S3
```env
STORAGE_TYPE=s3
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=us-east-1
AWS_S3_BUCKET=bucket-name
```

### Cloudinary
```env
STORAGE_TYPE=cloudinary
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
```

---

## 🧪 Test Script

```bash
# Run all tests
bash test-image-upload.sh

# Or test manually
curl -X POST http://localhost:5000/api/upload -F "image=@test.jpg"
```

---

## 💾 Response Examples

### Success
```json
{
  "success": true,
  "message": "Image uploaded successfully",
  "data": {
    "filename": "image-1645012800000-123456789.jpg",
    "url": "http://localhost:5000/images/products/image-1645012800000-123456789.jpg",
    "size": 124567,
    "variants": {
      "original": "...",
      "thumbnail": "...",
      "small": "...",
      "medium": "...",
      "large": "..."
    },
    "uploadedAt": "2026-02-19T12:00:00.000Z"
  }
}
```

### Error
```json
{
  "success": false,
  "message": "Invalid file type. Allowed types: .jpg, .jpeg, .png, .gif, .webp"
}
```

---

## 🔐 Security

✅ File type validation (MIME + extension)  
✅ File size limits enforced  
✅ Filename sanitization  
✅ Path traversal prevention  
✅ Automatic cleanup on error  

---

## 🎯 Usage Examples

**Frontend Upload (JavaScript):**
```javascript
const formData = new FormData();
formData.append('image', fileInput.files[0]);
formData.append('folder', 'products');

const response = await fetch('http://localhost:5000/api/upload', {
  method: 'POST',
  body: formData
});

const { data } = await response.json();
console.log('Image URL:', data.url);
```

**Product with Image:**
```javascript
// Upload image first
const imageResponse = await fetch('http://localhost:5000/api/upload', {
  method: 'POST',
  body: formData
});
const { data: image } = await imageResponse.json();

// Create product with image URL
const product = {
  name: "Product Name",
  description: "...",
  image: image.url,
  imageVariants: image.variants
};
```

---

## 🚨 Common Issues

| Issue | Solution |
|-------|----------|
| "No file uploaded" | Use `-F "image=@file"` in cURL |
| "Invalid file type" | Use JPG, PNG, GIF, or WebP |
| "File too large" | Check size limits above |
| "Not found" | Server not running on port 5000 |
| AWS error | Verify credentials and permissions |
| Cloudinary error | Check API keys in Dashboard |

---

## 📦 Files Created

```
Server/
├── src/
│   ├── config/upload.js              # Multer configuration
│   ├── controllers/uploadController.js # Endpoints
│   ├── middleware/imageMiddleware.js  # Validation
│   ├── routes/uploadRoutes.js        # Routes
│   └── utils/imageService.js         # Storage service
├── uploads/                          # Local storage
│   ├── products/
│   ├── profiles/
│   └── banners/
├── .env                              # Configuration
└── package.json                      # Dependencies
```

---

## 📚 Docs

- [Full Documentation](./IMAGE_UPLOAD_DOCUMENTATION.md)
- [API Reference](./CUSTOMER_API_DOCUMENTATION.md)
- [Deployment Guide](./DEPLOYMENT_GUIDE.md)

---

## 🎬 Next Steps

1. ✅ Install dependencies: `npm install`
2. ✅ Configure `.env` file
3. ✅ Start server: `npm start`
4. ✅ Test endpoints: `bash test-image-upload.sh`
5. ✅ Integrate with products

---

**Last Updated:** February 19, 2026  
**Version:** 1.0  
**Status:** Production Ready ✅
