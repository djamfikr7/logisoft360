const express = require('express');
const router = express.Router();
const {
    getProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct,
    getProductByBarcode,
    getExpiringProducts,
    getLowStockProducts,
    adjustStock
} = require('../controllers/productController');
const { protect, admin } = require('../middleware/authMiddleware');

// Special routes (must be before :id routes)
router.get('/expiring', protect, getExpiringProducts);
router.get('/low-stock', protect, getLowStockProducts);
router.get('/barcode/:code', protect, getProductByBarcode);

router.route('/')
    .get(protect, getProducts)
    .post(protect, admin, createProduct);

router.route('/:id')
    .get(protect, getProductById)
    .put(protect, admin, updateProduct)
    .delete(protect, admin, deleteProduct);

router.post('/:id/adjust-stock', protect, admin, adjustStock);

module.exports = router;

