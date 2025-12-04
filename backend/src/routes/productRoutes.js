const express = require('express');
const router = express.Router();
const {
    getProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct,
    getProductByBarcode
} = require('../controllers/productController');
const { protect, admin } = require('../middleware/authMiddleware');

router.route('/')
    .get(protect, getProducts)
    .post(protect, admin, createProduct);

router.route('/:id')
    .get(protect, getProductById)
    .put(protect, admin, updateProduct)
    .delete(protect, admin, deleteProduct);

router.get('/barcode/:code', protect, getProductByBarcode);

module.exports = router;
