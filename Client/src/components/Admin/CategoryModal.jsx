import { useState, useEffect } from 'react';
import styles from './CategoryModal.module.css';

const CategoryModal = ({ isOpen, mode, category, onClose, onSubmit, isLoading }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });

  const [errors, setErrors] = useState({});

  // Initialize form when modal opens or category changes
  useEffect(() => {
    if (isOpen) {
      if (mode === 'edit' && category) {
        setFormData({
          name: category.name || '',
          description: category.description || ''
        });
      } else {
        setFormData({
          name: '',
          description: ''
        });
      }
      setErrors({});
    }
  }, [isOpen, mode, category]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Category name is required';
    }

    if (formData.name.trim().length < 2) {
      newErrors.name = 'Category name must be at least 2 characters';
    }

    if (formData.name.trim().length > 50) {
      newErrors.name = 'Category name must not exceed 50 characters';
    }

    if (formData.description && formData.description.length > 500) {
      newErrors.description = 'Description must not exceed 500 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    onSubmit({
      name: formData.name.trim(),
      description: formData.description.trim()
    });
  };

  if (!isOpen) return null;

  const title = mode === 'add' ? 'Add New Category' : 'Edit Category';

  return (
    <>
      {/* Overlay */}
      <div className={styles.overlay} onClick={onClose}></div>

      {/* Modal */}
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2>{title}</h2>
          <button
            className={styles.closeBtn}
            onClick={onClose}
            disabled={isLoading}
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          {/* Category Name */}
          <div className={styles.formGroup}>
            <label htmlFor="name">
              Category Name <span className={styles.required}>*</span>
            </label>
            <input
              id="name"
              type="text"
              name="name"
              placeholder="e.g., Electronics, Clothing, Food..."
              value={formData.name}
              onChange={handleChange}
              disabled={isLoading}
              className={errors.name ? styles.inputError : ''}
              maxLength="50"
            />
            {errors.name && <span className={styles.error}>{errors.name}</span>}
            <small className={styles.charCount}>
              {formData.name.length}/50
            </small>
          </div>

          {/* Description */}
          <div className={styles.formGroup}>
            <label htmlFor="description">
              Description <span className={styles.optional}>(Optional)</span>
            </label>
            <textarea
              id="description"
              name="description"
              placeholder="Brief description of this category..."
              value={formData.description}
              onChange={handleChange}
              disabled={isLoading}
              rows="4"
              maxLength="500"
              className={errors.description ? styles.inputError : ''}
            />
            {errors.description && (
              <span className={styles.error}>{errors.description}</span>
            )}
            <small className={styles.charCount}>
              {formData.description.length}/500
            </small>
          </div>

          {/* Buttons */}
          <div className={styles.buttonGroup}>
            <button
              type="button"
              className={styles.cancelBtn}
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={styles.submitBtn}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span className={styles.spinner}></span>
                  {mode === 'add' ? 'Adding...' : 'Updating...'}
                </>
              ) : (
                mode === 'add' ? 'Add Category' : 'Update Category'
              )}
            </button>
          </div>
        </form>
      </div>
    </>
  );
};

export default CategoryModal;
