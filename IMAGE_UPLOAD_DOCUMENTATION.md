# Image Upload Feature Documentation

## 🖼️ Overview

The General Store API includes comprehensive image upload functionality with support for multiple storage backends:
- **Local Storage** (Development)
- **AWS S3** (Production)
- **Cloudinary** (Production)

All uploads include validation, security checks, and automatic image variant generation.

---

## 📦 Installation

### 1. Install Dependencies

```bash
npm install multer aws-sdk cloudinary image-size
```

### 2. Configure Environment Variables

Create/update `.env` file:

```dotenv
# Image Storage Configuration
# Options: local, s3, cloudinary
STORAGE_TYPE=local

# AWS S3 Configuration (if STORAGE_TYPE=s3)
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
AWS_REGION=us-east-1
AWS_S3_BUCKET=your-bucket-name

# Cloudinary Configuration (if STORAGE_TYPE=cloudinary)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### 3. Directory Structure

For local storage, uploads are automatically organized:
```
Server/
├── uploads/
│   ├── products/     # Product images
│   ├── profiles/     # User profile pictures
│   └── banners/      # Shop banners
```

---

## 🚀 API Endpoints

### 1. Upload Single Image

**Endpoint:** `POST /api/upload`

**Parameters:**
- `folder` (query/body): Target folder - `products`, `profiles`, or `banners` (default: `products`)

**Request:**
```bash
curl -X POST http://localhost:5000/api/upload \
  -F "image=@path/to/image.jpg" \
  -F "folder=products"
```

**Response:**
```json
{
  "success": true,
  "message": "Image uploaded successfully",
  "data": {
    "filename": "image-1645012800000-123456789.jpg",
    "url": "http://localhost:5000/api/v1/images/products/image-1645012800000-123456789.jpg",
    "path": "uploads/products/image-1645012800000-123456789.jpg",
    "size": 124567,
    "mimetype": "image/jpeg",
    "variants": {
      "original": "...",
      "thumbnail": "...",
      "small": "...",
      "medium": "...",
      "large": "..."
    },
    "cloudinaryId": null,
    "uploadedAt": "2026-02-19T12:00:00.000Z"
  }
}
```

---

### 2. Upload Multiple Images

**Endpoint:** `POST /api/upload/batch`

**Parameters:**
- `folder` (query/body): Target folder (default: `products`)

**Request:**
```bash
curl -X POST http://localhost:5000/api/upload/batch \
  -F "images=@image1.jpg" \
  -F "images=@image2.jpg" \
  -F "images=@image3.jpg" \
  -F "folder=products"
```

**Response:**
```json
{
  "success": true,
  "message": "3 images uploaded successfully",
  "data": {
    "count": 3,
    "images": [
      {
        "filename": "image-...",
        "url": "...",
        "size": 124567,
        "variants": {...}
      },
      ...
    ],
    "uploadedAt": "2026-02-19T12:00:00.000Z"
  }
}
```

---

### 3. Delete Image

**Endpoint:** `DELETE /api/upload/:imageUrl`

**Parameters:**
- `:imageUrl` (path): URI-encoded image URL or path
- `cloudinaryId` (body, optional): Cloudinary public ID for Cloudinary deletion

**Request:**
```bash
# For local storage or S3
curl -X DELETE http://localhost:5000/api/upload/image-1645012800000-123456789.jpg

# For Cloudinary
curl -X DELETE http://localhost:5000/api/upload/general-store%2Fproducts%2Fimage123 \
  -H "Content-Type: application/json" \
  -d '{"cloudinaryId":"general-store/products/image123"}'
```

**Response:**
```json
{
  "success": true,
  "message": "Image deleted from local storage",
  "data": {
    "deletedAt": "2026-02-19T12:00:00.000Z"
  }
}
```

---

### 4. Get Image Information

**Endpoint:** `GET /api/upload/info/:imageUrl`

**Parameters:**
- `:imageUrl` (path): URI-encoded image URL
- `cloudinaryId` (query, optional): For Cloudinary images

**Request:**
```bash
curl http://localhost:5000/api/upload/info/image-1645012800000-123456789.jpg \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "url": "http://localhost:5000/api/v1/images/products/image-1645012800000-123456789.jpg",
    "variants": {
      "original": "...",
      "thumbnail": "...",
      "small": "...",
      "medium": "...",
      "large": "..."
    },
    "cloudinaryId": null,
    "createdAt": "2026-02-19T12:00:00.000Z"
  }
}
```

---

## 📋 File Specifications

### Supported Formats
- JPEG (.jpg, .jpeg)
- PNG (.png)
- GIF (.gif)
- WebP (.webp)

### File Size Limits
| Usage | Max Size |
|-------|----------|
| Product Images | 5 MB |
| Profile Pictures | 2 MB |
| Banners | 10 MB |

### MIME Type Validation
```
image/jpeg
image/png
image/gif
image/webp
```

---

## 🔐 Security Features

### Input Validation
- ✅ File type validation (MIME type check)
- ✅ File extension validation
- ✅ File size limit enforcement
- ✅ Filename sanitization
- ✅ Path traversal prevention

### Error Handling
```javascript
// Invalid file type
{
  "success": false,
  "message": "Invalid file type. Allowed types: .jpg, .jpeg, .png, .gif, .webp"
}

// File too large
{
  "success": false,
  "message": "File too large. Maximum size is 5242880 bytes"
}

// Missing file
{
  "success": false,
  "message": "No file uploaded"
}
```

### Secure URL Generation
- Automatic filename sanitization
- Unique filename generation (timestamp + random)
- Secure path handling
- URL encoding for safe transmission

---

## 🏗️ Architecture

### File Structure
```
Server/
├── src/
│   ├── config/
│   │   └── upload.js           # Multer configuration
│   ├── controllers/
│   │   └── uploadController.js # Upload endpoint handlers
│   ├── middleware/
│   │   └── imageMiddleware.js  # Image validation middleware
│   ├── routes/
│   │   └── uploadRoutes.js     # Upload endpoint routes
│   └── utils/
│       └── imageService.js     # Image storage service
└── uploads/
    ├── products/               # Product images
    ├── profiles/               # Profile images
    └── banners/                # Banner images
```

### Storage Flow

```
Request with Image
    ↓
Multer Middleware (File Reception)
    ↓
File Validation (Type, Size, Extension)
    ↓
Storage Service (Local/S3/Cloudinary)
    ↓
URL Generation & Response
```

---

## 💾 Storage Configuration

### Local Storage (Development)

```javascript
// .env
STORAGE_TYPE=local
API_BASE_URL=http://localhost:5000/api/v1
```

**Behavior:**
- Files saved to `Server/uploads/` directory
- Served via Express static middleware
- Access via: `http://localhost:5000/images/products/filename`

**Advantages:**
- No external dependencies
- Zero latency
- Perfect for development

**Disadvantages:**
- Not scalable for production
- No automatic deletion
- Storage limits

---

### AWS S3 Configuration

```javascript
// .env
STORAGE_TYPE=s3
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG...
AWS_REGION=us-east-1
AWS_S3_BUCKET=general-store-images
```

**Setup Steps:**
```bash
# 1. Create S3 bucket in AWS Console

# 2. Create IAM user with S3 permissions
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject"
      ],
      "Resource": "arn:aws:s3:::general-store-images/*"
    }
  ]
}

# 3. Configure bucket CORS
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
    "AllowedOrigins": ["http://localhost:3000", "https://yourdomain.com"],
    "ExposeHeaders": ["ETag"]
  }
]
```

**Image URL Format:**
```
https://general-store-images.s3.amazonaws.com/products/filename.jpg
```

**Advantages:**
- Highly scalable
- CDN integration available
- Reliable and durable
- Automatic deletion support

**Disadvantages:**
- Monthly costs
- AWS account required
- Network latency

---

### Cloudinary Configuration

```javascript
// .env
STORAGE_TYPE=cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=123456789012345
CLOUDINARY_API_SECRET=abcdefghijklmnopqrstuvwxyz
```

**Setup Steps:**
```bash
# 1. Sign up at https://cloudinary.com/

# 2. Get credentials from Dashboard
#    - Cloud Name
#    - API Key
#    - API Secret

# 3. Add to .env
```

**Image URL Format (with transformations):**
```
https://res.cloudinary.com/cloud_name/image/upload/c_fill,h_400,w_400/v123/general-store/products/filename.jpg
```

**Automatic Image Variants:**
```javascript
{
  "original": "https://res.cloudinary.com/.../v123/image.jpg",
  "thumbnail": "https://res.cloudinary.com/.../c_fill,h_200,w_200/v123/image.jpg",
  "small": "https://res.cloudinary.com/.../c_fill,h_400,w_400/v123/image.jpg",
  "medium": "https://res.cloudinary.com/.../c_fill,h_800,w_800/v123/image.jpg",
  "large": "https://res.cloudinary.com/.../c_fill,h_1200,w_1200/v123/image.jpg"
}
```

**Advantages:**
- Automatic image optimization
- Built-in image variants
- Advanced transformations
- Free tier available
- Easy setup

**Disadvantages:**
- External dependency
- Costs at scale
- API rate limits

---

## 📝 Integration Examples

### Integration with Product Upload

```javascript
const { Router } = require('express');
const { uploadMiddleware } = require('../controllers/uploadController');
const adminProductController = require('../controllers/adminProductController');

const router = Router();

// Upload product image, then create product
router.post(
  '/with-image',
  uploadMiddleware('image', 'products'),
  async (req, res) => {
    try {
      // req.file contains upload result
      const product = {
        ...req.body,
        image: req.file.filename,
        imageUrl: req.file.url
      };

      // Create product with image
      const result = await adminProductController.createProduct(product);
      res.status(201).json(result);
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }
);

module.exports = router;
```

### Integration with Frontend

**React Component:**
```javascript
import React, { useState } from 'react';
import axios from 'axios';

const ImageUpload = () => {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [imageUrl, setImageUrl] = useState(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    setFile(selectedFile);
    setPreview(URL.createObjectURL(selectedFile));
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('folder', 'products');

      const response = await axios.post(
        'http://localhost:5000/api/upload',
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' }
        }
      );

      setImageUrl(response.data.data.url);
      console.log('Upload successful:', response.data.data);
    } catch (error) {
      console.error('Upload failed:', error.response?.data?.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!imageUrl) return;

    try {
      const filename = imageUrl.split('/').pop();
      await axios.delete(
        `http://localhost:5000/api/upload/${filename}`
      );

      setImageUrl(null);
      setFile(null);
      setPreview(null);
    } catch (error) {
      console.error('Delete failed:', error.response?.data?.message);
    }
  };

  return (
    <div>
      <input 
        type="file" 
        accept="image/*" 
        onChange={handleFileChange}
        disabled={uploading}
      />
      
      {preview && (
        <div>
          <img src={preview} alt="Preview" style={{ maxWidth: '200px' }} />
        </div>
      )}

      <button 
        onClick={handleUpload}
        disabled={!file || uploading}
      >
        {uploading ? 'Uploading...' : 'Upload'}
      </button>

      {imageUrl && (
        <div>
          <img src={imageUrl} alt="Uploaded" style={{ maxWidth: '200px' }} />
          <button onClick={handleDelete}>Delete</button>
        </div>
      )}
    </div>
  );
};

export default ImageUpload;
```

---

## 🧪 Testing

### Testing with cURL

**Upload Image:**
```bash
curl -X POST http://localhost:5000/api/upload \
  -F "image=@/path/to/image.jpg" \
  -F "folder=products"
```

**Upload Batch:**
```bash
curl -X POST http://localhost:5000/api/upload/batch \
  -F "images=@image1.jpg" \
  -F "images=@image2.jpg"
```

**Delete Image:**
```bash
curl -X DELETE http://localhost:5000/api/upload/image-1645012800000-123456789.jpg
```

**Get Info:**
```bash
curl http://localhost:5000/api/upload/info/image-1645012800000-123456789.jpg
```

### Testing with Postman

1. **Create Request**
   - Method: `POST`
   - URL: `http://localhost:5000/api/upload`

2. **Set Body**
   - Type: `form-data`
   - Key: `image`, Value: Select file
   - Key: `folder`, Value: `products`

3. **Send** and check response

---

## 🐛 Troubleshooting

### Issue: "No file uploaded"

**Cause:** Multipart form data not sent correctly

**Solution:**
```bash
# Ensure multipart header
curl -X POST http://localhost:5000/api/upload \
  -F "image=@image.jpg"  # -F sets multipart automatically
```

---

### Issue: "Invalid file type"

**Cause:** File extension or MIME type not supported

**Solution:**
```javascript
// Supported types:
- image/jpeg (.jpg, .jpeg)
- image/png (.png)
- image/gif (.gif)
- image/webp (.webp)

// Convert image:
ffmpeg -i image.bmp image.jpg
```

---

### Issue: "File too large"

**Cause:** File exceeds size limit

**Solution:**
```bash
# Compress image
ImageMagick: convert input.jpg -quality 85 output.jpg
FFmpeg: ffmpeg -i input.jpg -q:v 5 output.jpg

# Check file size
ls -lh image.jpg
```

---

### Issue: AWS S3 "Access Denied"

**Cause:** Invalid credentials or permissions

**Solution:**
```bash
# Verify AWS credentials
echo $AWS_ACCESS_KEY_ID
echo $AWS_SECRET_ACCESS_KEY

# Check IAM policy allows:
# - s3:PutObject
# - s3:DeleteObject

# Check S3 bucket exists
aws s3 ls
```

---

### Issue: Cloudinary "Authentication failed"

**Cause:** Invalid credentials

**Solution:**
```bash
# Verify credentials in Cloudinary Dashboard
# Settings → API Keys

echo $CLOUDINARY_CLOUD_NAME
echo $CLOUDINARY_API_KEY
echo $CLOUDINARY_API_SECRET
```

---

## 📊 Performance Tips

### Optimize Upload Speed
```javascript
// Compress before upload (client-side)
const canvas = document.createElement('canvas');
canvas.width = 800;
canvas.height = 600;
// ... resize image
canvas.toBlob(blob => {
  // Upload smaller blob
});
```

### Optimize Storage
```javascript
// Delete old images automatically
const deleteOldImages = async () => {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  // Query images older than 30 days
  // Delete them
};
```

### Optimize Retrieval
```javascript
// Use image variants
<img 
  src={image.variants.thumbnail}  // 200x200 for thumbnails
  loading="lazy"                   // Lazy loading
/>
```

---

## 🔄 Cloud Storage Migration

### Migrate from Local to S3

```bash
# 1. Backup local images
rsync -av uploads/ backup/uploads/

# 2. Update .env
STORAGE_TYPE=s3

# 3. Migrate images to S3
aws s3 sync uploads/ s3://general-store-images/

# 4. Test new uploads
# Upload test image, verify in S3 console
```

---

## 📚 Related Docs

- [API Documentation](./CUSTOMER_API_DOCUMENTATION.md)
- [Deployment Guide](./DEPLOYMENT_GUIDE.md)
- [System Overview](./SYSTEM_OVERVIEW.md)

---

**Last Updated:** February 19, 2026  
**Version:** 1.0  
**Status:** Production Ready
