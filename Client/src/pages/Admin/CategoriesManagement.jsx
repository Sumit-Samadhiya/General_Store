import { useState, useEffect } from 'react';
import ConfirmDeleteModal from '../../components/Admin/ConfirmDeleteModal.jsx';
import CategoryModal from '../../components/Admin/CategoryModal.jsx';
import styles from './CategoriesManagement.module.css';

const CategoriesManagement = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredCategories, setFilteredCategories] = useState([]);

  // Modal states
  const [categoryModal, setCategoryModal] = useState({
    isOpen: false,
    mode: 'add', // 'add' or 'edit'
    category: null
  });

  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    categoryId: null,
    categoryName: null,
    productCount: 0
  });

  const [deleting, setDeleting] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Fetch categories
  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      const response = await fetch('http://localhost:5000/api/v1/categories', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const result = await response.json();

      if (result.success) {
        setCategories(result.data || []);
        setError(null);
      } else {
        setError(result.message || 'Failed to fetch categories');
      }
    } catch (err) {
      setError('Error fetching categories: ' + err.message);
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Filter categories based on search
  useEffect(() => {
    let result = categories;

    if (searchTerm) {
      result = result.filter(cat =>
        cat.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (cat.description && cat.description.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    setFilteredCategories(result);
  }, [categories, searchTerm]);

  // Open add category modal
  const openAddModal = () => {
    setCategoryModal({
      isOpen: true,
      mode: 'add',
      category: null
    });
  };

  // Open edit category modal
  const openEditModal = (category) => {
    setCategoryModal({
      isOpen: true,
      mode: 'edit',
      category
    });
  };

  // Close category modal
  const closeCategoryModal = () => {
    setCategoryModal({
      isOpen: false,
      mode: 'add',
      category: null
    });
  };

  // Handle category form submission
  const handleCategorySubmit = async (formData) => {
    setSubmitting(true);

    try {
      const token = localStorage.getItem('adminToken');
      const method = categoryModal.mode === 'add' ? 'POST' : 'PUT';
      const url = categoryModal.mode === 'add' 
        ? 'http://localhost:5000/api/v1/categories'
        : `http://localhost:5000/api/v1/categories/${categoryModal.category._id}`;

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const result = await response.json();

      if (result.success) {
        if (categoryModal.mode === 'add') {
          setCategories([...categories, result.data]);
          setSuccess('Category added successfully!');
        } else {
          setCategories(categories.map(cat => 
            cat._id === result.data._id ? result.data : cat
          ));
          setSuccess('Category updated successfully!');
        }
        
        closeCategoryModal();
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(result.message || 'Failed to save category');
      }
    } catch (err) {
      setError('Error saving category: ' + err.message);
      console.error('Submit error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  // Open delete modal
  const openDeleteModal = async (category) => {
    // Use the product count from the category data returned by the API
    setDeleteModal({
      isOpen: true,
      categoryId: category._id,
      categoryName: category.name,
      productCount: category.productCount || 0
    });
  };

  // Confirm delete
  const confirmDelete = async () => {
    if (!deleteModal.categoryId) return;

    setDeleting(true);
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(
        `http://localhost:5000/api/v1/categories/${deleteModal.categoryId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const result = await response.json();

      if (result.success) {
        setCategories(categories.filter(cat => cat._id !== deleteModal.categoryId));
        setSuccess(`${deleteModal.categoryName} deleted successfully!`);
        
        setTimeout(() => setSuccess(null), 3000);
        setDeleteModal({ isOpen: false, categoryId: null, categoryName: null, productCount: 0 });
      } else {
        setError(result.message || 'Failed to delete category');
      }
    } catch (err) {
      setError('Error deleting category: ' + err.message);
      console.error('Delete error:', err);
    } finally {
      setDeleting(false);
    }
  };

  // Cancel delete
  const cancelDelete = () => {
    setDeleteModal({ isOpen: false, categoryId: null, categoryName: null, productCount: 0 });
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1>Categories Management</h1>
          <p className={styles.subtitle}>Manage product categories and taxonomies</p>
        </div>
        <button className={styles.addBtn} onClick={openAddModal}>
          + Add New Category
        </button>
      </div>

      {error && <div className={styles.errorAlert}>{error}</div>}
      {success && <div className={styles.successAlert}>{success}</div>}

      {/* Search */}
      <div className={styles.searchSection}>
        <input
          type="text"
          placeholder="Search categories by name or description..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={styles.searchInput}
        />
        <span className={styles.resultCount}>
          {filteredCategories.length} categories found
        </span>
      </div>

      {/* Loading State */}
      {loading && (
        <div className={styles.emptyState}>
          <div className={styles.spinner}></div>
          <p>Loading categories...</p>
        </div>
      )}

      {/* Error State */}
      {!loading && error && !categories.length && (
        <div className={styles.errorState}>
          <p>⚠️ Failed to load categories</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && filteredCategories.length === 0 && (
        <div className={styles.emptyState}>
          <p>📁 No categories found</p>
          <small>Try adding a new category or adjusting your search</small>
        </div>
      )}

      {/* Categories Table */}
      {!loading && filteredCategories.length > 0 && (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Category Name</th>
                <th>Description</th>
                <th>Products</th>
                <th>Created Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCategories.map(category => (
                <tr key={category._id} className={styles.row}>
                  <td className={styles.nameCell}>
                    <span className={styles.categoryName}>{category.name}</span>
                  </td>
                  <td className={styles.descriptionCell}>
                    <span className={styles.description}>
                      {category.description || '-'}
                    </span>
                  </td>
                  <td className={styles.countCell}>
                    <span className={styles.badge}>{category.productCount || 0}</span>
                  </td>
                  <td className={styles.dateCell}>
                    {formatDate(category.createdAt)}
                  </td>
                  <td>
                    <div className={styles.actions}>
                      <button
                        className={styles.btnEdit}
                        title="Edit"
                        onClick={() => openEditModal(category)}
                      >
                        ✏️
                      </button>
                      <button
                        className={styles.btnDelete}
                        title="Delete"
                        onClick={() => openDeleteModal(category)}
                        disabled={deleting}
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Category Modal */}
      <CategoryModal
        isOpen={categoryModal.isOpen}
        mode={categoryModal.mode}
        category={categoryModal.category}
        onClose={closeCategoryModal}
        onSubmit={handleCategorySubmit}
        isLoading={submitting}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={deleteModal.isOpen}
        title="Delete Category"
        message={
          deleteModal.productCount > 0
            ? `This category has ${deleteModal.productCount} product(s). Deleting it will not delete the products, but they will lose this category assignment.`
            : 'Are you sure you want to delete this category?'
        }
        itemName={deleteModal.categoryName}
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
        isLoading={deleting}
        isDangerous={true}
      />
    </div>
  );
};

export default CategoriesManagement;
