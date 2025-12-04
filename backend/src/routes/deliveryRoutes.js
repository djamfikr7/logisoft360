const express = require('express');
const router = express.Router();
const {
    createDelivery,
    getDeliveryById,
    updateDeliveryStatus,
    trackDelivery,
    generateLabel
} = require('../controllers/deliveryController');
const { protect } = require('../middleware/authMiddleware');

router.post('/', protect, createDelivery);
router.get('/:id', protect, getDeliveryById);
router.put('/:id/status', protect, updateDeliveryStatus);
router.post('/:id/label', protect, generateLabel);

// Public tracking endpoint
router.get('/track/:number', trackDelivery);

module.exports = router;
