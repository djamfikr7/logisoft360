const express = require('express');
const router = express.Router();
const {
    getInvoices,
    getInvoiceById,
    createInvoice,
    updateInvoice,
    deleteInvoice,
    recordPayment,
    generatePDF
} = require('../controllers/invoiceController');
const { protect, admin } = require('../middleware/authMiddleware');

router.route('/')
    .get(protect, getInvoices)
    .post(protect, createInvoice);

router.route('/:id')
    .get(protect, getInvoiceById)
    .put(protect, updateInvoice)
    .delete(protect, admin, deleteInvoice); // Admin only

router.post('/:id/pay', protect, recordPayment);
router.get('/:id/pdf', protect, generatePDF);

module.exports = router;
