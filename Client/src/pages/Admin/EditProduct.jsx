import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import styles from './AddProduct.module.css';

const CATEGORIES = [
  { value: '', label: 'Select Category' },
  { value: 'kitchen', label: 'Kitchen' },
  { value: 'snacks', label: 'Snacks' },
  { value: 'beauty', label: 'Beauty' },
  { value: 'bakery', label: 'Bakery' },
  { value: 'household', label: 'Household' }
];

const WEIGHT_OPTIONS = [
  { value: '', label: 'Select Weight' },
  { value: '100g', label: '100g' },
  { value: '250g', label: '250g' },
  { value: '500g', label: '500g' },
  { value: '1kg', label: '1kg' }
];

const SIZE_OPTIONS = [
  { value: '', label: 'Select Size' },
  { value: '250ml', label: '250ml' },
  { value: '500ml', label: '500ml' },
  { value: '1L', label: '1L' },
  { value: '2L', label: '2L' }
];

const EditProduct = () => {
  const navigate = useNavigate();
  const { productId } = useParams();
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    brand: '',
    description: '',
    category: '',
    weight: '',
    size: '',
    price: '',
    discountedPrice: '',
    sku: '',
    isAvailable: true
  });

  // Track existing and new images separately
  const [existingImages, setExistingImages] = useState([]);
  const [imagesToRemove, setImagesToRemove] = useState([]);
  const [newImagePreviews, setNewImagePreviews] = useState([]);
  const [errors, setErrors] = useState({});

  // Fetch product data on mount
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const response = await fetch(`http://localhost:5000/api/v1/products/${productId}`);
        const result = await response.json();

        if (result.success) {
          const product = result.data;
          setFormData({
            name: product.name || '',
            brand: product.brand || '',
            description: product.description || '',
            category: product.category || '',
            weight: product.weight || '',
            size: product.size || '',
            price: product.price || '',
            discountedPrice: product.discountedPrice || '',
            sku: product.sku || '',
            isAvailable: product.isAvailable !== undefined ? product.isAvailable : true
          });
          setExistingImages(product.images || []);
          setError(null);
        } else {
          setError(result.message || 'Failed to load product');
        }
      } catch (err) {
        setError('Error loading product: ' + err.message);
        console.error('Fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    if (productId) {
      fetchProduct();
    }
  }, [productId]);

  // Handle text input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    // Clear field error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };

  // Handle category change to reset weight/size
  const handleCategoryChange = (e) => {
    const { value } = e.target;
    setFormData(prev => ({
      ...prev,
      category: value,
      weight: '',
      size: ''
    }));
    if (errors.category) {
      setErrors(prev => ({
        ...prev,
        category: null
      }));
    }
  };

  // Handle new image selection
  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files);
    const currentNewCount = newImagePreviews.length;

    if (currentNewCount + files.length > 5) {
      setError('Maximum 5 total images allowed');
      return;
    }

    const validFiles = [];
    const validationErrors = [];

    files.forEach((file, idx) => {
      // Validate file type
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        validationErrors.push(`File ${idx + 1}: Invalid format. Only JPG, PNG, WebP allowed`);
        return;
      }

      // Validate file size (5MB = 5242880 bytes)
      if (file.size > 5242880) {
        validationErrors.push(`File ${idx + 1}: Size exceeds 5MB`);
        return;
      }

      validFiles.push(file);

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewImagePreviews(prev => [...prev, {
          id: Date.now() + idx,
          src: reader.result,
          file: file,
          name: file.name,
          isNew: true
        }]);
      };
      reader.readAsDataURL(file);
    });

    if (validationErrors.length > 0) {
      setError(validationErrors.join('; '));
    }

    e.target.value = ''; // Reset input
  };

  // Remove existing image
  const removeExistingImage = (imageUrl) => {
    setImagesToRemove(prev => [...prev, imageUrl]);
    setExistingImages(prev => prev.filter(img => img !== imageUrl));
  };

  // Restore existing image
  const restoreExistingImage = (imageUrl) => {
    setImagesToRemove(prev => prev.filter(img => img !== imageUrl));
    setExistingImages(prev => [...prev, imageUrl]);
  };

  // Remove new image preview
  const removeNewImage = (id) => {
    setNewImagePreviews(prev => prev.filter(img => img.id !== id));
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) newErrors.name = 'Product name is required';
    if (!formData.brand.trim()) newErrors.brand = 'Brand is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    if (!formData.category) newErrors.category = 'Category is required';

    if (formData.category !== 'household' && !formData.weight) {
      newErrors.weight = 'Weight is required for non-household products';
    }
    if (formData.category === 'household' && !formData.size) {
      newErrors.size = 'Size is required for household products';
    }

    if (!formData.price) {
      newErrors.price = 'Price is required';
    } else if (parseFloat(formData.price) <= 0) {
      newErrors.price = 'Price must be greater than 0';
    }

    if (formData.discountedPrice) {
      const price = parseFloat(formData.price);
      const discounted = parseFloat(formData.discountedPrice);
      if (discounted >= price) {
        newErrors.discountedPrice = 'Discounted price must be less than original price';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!validateForm()) {
      return;
    }

    setSubmitting(true);

    try {
      const token = localStorage.getItem('adminToken');
      let allImageUrls = [...existingImages];

      // Step 1: Upload new images if any exist
      if (newImagePreviews.length > 0) {
        const imageFormData = new FormData();
        newImagePreviews.forEach(img => {
          imageFormData.append('images', img.file);
        });

        const uploadResponse = await fetch('http://localhost:5000/api/upload/batch', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: imageFormData
        });

        const uploadResult = await uploadResponse.json();
        console.log('Upload response:', uploadResult);

        if (!uploadResult.success) {
          setError(uploadResult.message || 'Failed to upload images');
          setSubmitting(false);
          return;
        }

        // Extract image URLs from upload response
        if (uploadResult.data && uploadResult.data.images && Array.isArray(uploadResult.data.images)) {
          const newImageUrls = uploadResult.data.images.map(img => img.url);
          allImageUrls = [...allImageUrls, ...newImageUrls];
          console.log('Extracted image URLs:', newImageUrls);
        } else {
          console.warn('Unexpected upload response structure:', uploadResult);
          setError('Upload response format unexpected');
          setSubmitting(false);
          return;
        }
      }

      // Step 2: Update product with all images
      const submitData = {
        name: formData.name,
        brand: formData.brand,
        description: formData.description,
        category: formData.category,
        price: parseFloat(formData.price),
        isAvailable: formData.isAvailable,
        images: allImageUrls,
        sku: formData.sku || undefined
      };

      // Add optional fields
      if (formData.discountedPrice) {
        submitData.discountedPrice = parseFloat(formData.discountedPrice);
      }

      if (formData.category === 'household') {
        submitData.size = formData.size;
      } else {
        submitData.weight = formData.weight;
      }

      console.log('Submitting update data:', submitData);

      const response = await fetch(`http://localhost:5000/api/v1/products/${productId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(submitData)
      });

      const result = await response.json();

      if (result.success) {
        setSuccess('Product updated successfully!');
        setTimeout(() => {
          navigate('/admin/products');
        }, 1500);
      } else {
        // Show detailed error messages
        let errorMessage = result.message || 'Failed to update product';
        if (result.errors && Array.isArray(result.errors)) {
          errorMessage = result.errors.join(', ');
        }
        console.log('API Response:', result);
        setError(errorMessage);
      }
    } catch (err) {
      console.error('Submission error:', err);
      setError('Error updating product: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingState}>
          <div className={styles.spinner}></div>
          <p>Loading product...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Edit Product</h1>
        <p className={styles.subtitle}>Update product information</p>
      </div>

      {error && <div className={styles.errorAlert}>{error}</div>}
      {success && <div className={styles.successAlert}>{success}</div>}

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formSection}>
          <h2>Product Information</h2>

          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label htmlFor="name">Product Name *</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="e.g., Stainless Steel Mixing Bowl"
                className={errors.name ? styles.inputError : ''}
              />
              {errors.name && <span className={styles.errorText}>{errors.name}</span>}
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="brand">Brand *</label>
              <input
                type="text"
                id="brand"
                name="brand"
                value={formData.brand}
                onChange={handleInputChange}
                placeholder="e.g., Prestige, Hawkins"
                className={errors.brand ? styles.inputError : ''}
              />
              {errors.brand && <span className={styles.errorText}>{errors.brand}</span>}
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="sku">SKU</label>
              <input
                type="text"
                id="sku"
                name="sku"
                value={formData.sku}
                onChange={handleInputChange}
                placeholder="e.g., BOWL-001"
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="category">Category *</label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleCategoryChange}
                className={errors.category ? styles.inputError : ''}
              >
                {CATEGORIES.map(cat => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
              {errors.category && <span className={styles.errorText}>{errors.category}</span>}
            </div>

            {formData.category === 'household' ? (
              <div className={styles.formGroup}>
                <label htmlFor="size">Size *</label>
                <select
                  id="size"
                  name="size"
                  value={formData.size}
                  onChange={handleInputChange}
                  className={errors.size ? styles.inputError : ''}
                >
                  {SIZE_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                {errors.size && <span className={styles.errorText}>{errors.size}</span>}
              </div>
            ) : formData.category ? (
              <div className={styles.formGroup}>
                <label htmlFor="weight">Weight *</label>
                <select
                  id="weight"
                  name="weight"
                  value={formData.weight}
                  onChange={handleInputChange}
                  className={errors.weight ? styles.inputError : ''}
                >
                  {WEIGHT_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                {errors.weight && <span className={styles.errorText}>{errors.weight}</span>}
              </div>
            ) : null}
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="description">Description *</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Detailed product description (minimum 10 characters)"
              rows="4"
              className={errors.description ? styles.inputError : ''}
            />
            {errors.description && <span className={styles.errorText}>{errors.description}</span>}
          </div>
        </div>

        <div className={styles.formSection}>
          <h2>Pricing</h2>

          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label htmlFor="price">Price (₹) *</label>
              <input
                type="number"
                id="price"
                name="price"
                value={formData.price}
                onChange={handleInputChange}
                placeholder="e.g., 999"
                step="0.01"
                min="0"
                className={errors.price ? styles.inputError : ''}
              />
              {errors.price && <span className={styles.errorText}>{errors.price}</span>}
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="discountedPrice">Discounted Price (₹)</label>
              <input
                type="number"
                id="discountedPrice"
                name="discountedPrice"
                value={formData.discountedPrice}
                onChange={handleInputChange}
                placeholder="e.g., 799"
                step="0.01"
                min="0"
                className={errors.discountedPrice ? styles.inputError : ''}
              />
              {errors.discountedPrice && <span className={styles.errorText}>{errors.discountedPrice}</span>}
            </div>
          </div>
        </div>

        <div className={styles.formSection}>
          <h2>Product Images</h2>

          {/* Existing Images */}
          {existingImages.length > 0 && (
            <div className={styles.existingImages}>
              <h3>Current Images</h3>
              <div className={styles.imageGrid}>
                {existingImages.map((imageUrl) => (
                  <div key={imageUrl} className={styles.imagePreview}>
                    <img src={imageUrl} alt="Product" />
                    <button
                      type="button"
                      className={styles.removeBtn}
                      onClick={() => removeExistingImage(imageUrl)}
                      title="Remove image"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Images Marked for Removal */}
          {imagesToRemove.length > 0 && (
            <div className={styles.removedImages}>
              <h3>Images to Remove</h3>
              <div className={styles.imageGrid}>
                {imagesToRemove.map((imageUrl) => (
                  <div key={imageUrl} className={styles.imagePreviewRemoved}>
                    <img src={imageUrl} alt="Product" />
                    <button
                      type="button"
                      className={styles.restoreBtn}
                      onClick={() => restoreExistingImage(imageUrl)}
                      title="Keep image"
                    >
                      ↺
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Upload New Images */}
          <div className={styles.uploadArea}>
            <div className={styles.uploadBox}>
              <input
                type="file"
                id="images"
                name="images"
                multiple
                accept="image/jpeg,image/png,image/webp"
                onChange={handleImageSelect}
                className={styles.fileInput}
              />
              <label htmlFor="images" className={styles.uploadLabel}>
                <span>📁 Click to upload or drag images here</span>
                <small>JPG, PNG, WebP (max 5MB each, max 5 images total)</small>
              </label>
            </div>
          </div>

          {/* New Image Previews */}
          {newImagePreviews.length > 0 && (
            <div className={styles.newImages}>
              <h3>New Images to Upload</h3>
              <div className={styles.imageGrid}>
                {newImagePreviews.map((img) => (
                  <div key={img.id} className={styles.imagePreview}>
                    <img src={img.src} alt="New Product" />
                    <button
                      type="button"
                      className={styles.removeBtn}
                      onClick={() => removeNewImage(img.id)}
                      title="Remove image"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className={styles.formSection}>
          <h2>Status</h2>

          <div className={styles.toggleContainer}>
            <label htmlFor="isAvailable" className={styles.toggleLabel}>
              <input
                type="checkbox"
                id="isAvailable"
                name="isAvailable"
                checked={formData.isAvailable}
                onChange={handleInputChange}
                className={styles.toggleInput}
              />
              <span className={styles.toggleSwitch}></span>
              <span className={styles.toggleText}>
                {formData.isAvailable ? 'Product Available' : 'Product Unavailable'}
              </span>
            </label>
          </div>
        </div>

        <div className={styles.formActions}>
          <button
            type="submit"
            disabled={submitting || loading}
            className={styles.submitBtn}
          >
            {submitting ? 'Updating...' : 'Update Product'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/admin/products')}
            disabled={submitting}
            className={styles.cancelBtn}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditProduct;
