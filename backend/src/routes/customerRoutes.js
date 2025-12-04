const express = require('express');
const router = express.Router();
const {
    getCustomers,
    getCustomerById,
    createCustomer,
    updateCustomer,
    deleteCustomer,
    getCustomerHistory,
    updateLoyaltyPoints,
    getCustomersWithDebt
} = require('../controllers/customerController');
const { protect, admin } = require('../middleware/authMiddleware');

// Special routes (must be before :id routes)
router.get('/with-debt', protect, getCustomersWithDebt);

router.route('/')
    .get(protect, getCustomers)
    .post(protect, createCustomer);

router.route('/:id')
    .get(protect, getCustomerById)
    .put(protect, updateCustomer)
    .delete(protect, admin, deleteCustomer);

router.get('/:id/history', protect, getCustomerHistory);
router.post('/:id/points', protect, updateLoyaltyPoints);

module.exports = router;
