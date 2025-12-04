const express = require('express');
const router = express.Router();
const {
    getInvoices,
    getInvoiceById,
    createInvoice,
    updateInvoice,
    recordPayment,
    generatePDF
} = require('../controllers/invoiceController');
const { protect } = require('../middleware/authMiddleware');

router.route('/')
    .get(protect, getInvoices)
    .post(protect, createInvoice);

router.route('/:id')
    .get(protect, getInvoiceById)
    .put(protect, updateInvoice);

router.post('/:id/pay', protect, recordPayment);
router.get('/:id/pdf', protect, generatePDF);

module.exports = router;
