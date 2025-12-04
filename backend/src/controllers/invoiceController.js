const prisma = require('../utils/prisma');

// @desc    Get all invoices
// @route   GET /api/v1/invoices
// @access  Private
const getInvoices = async (req, res, next) => {
    try {
        const invoices = await prisma.invoice.findMany({
            include: { customer: true },
            orderBy: { createdAt: 'desc' }
        });
        res.json(invoices);
    } catch (error) {
        next(error);
    }
};

// @desc    Get single invoice
// @route   GET /api/v1/invoices/:id
// @access  Private
const getInvoiceById = async (req, res, next) => {
    try {
        const invoice = await prisma.invoice.findUnique({
            where: { id: req.params.id },
            include: {
                customer: true,
                items: true,
                payments: true
            }
        });

        if (invoice) {
            res.json(invoice);
        } else {
            res.status(404);
            throw new Error('Invoice not found');
        }
    } catch (error) {
        next(error);
    }
};

// @desc    Create invoice
// @route   POST /api/v1/invoices
// @access  Private
const createInvoice = async (req, res, next) => {
    try {
        const { customerId, items } = req.body;

        // Calculate totals
        let subtotal = 0;
        let tvaAmount = 0;
        let totalAmount = 0;

        const invoiceItems = items.map(item => {
            const lineTotal = item.quantity * item.unitPrice;
            const lineTva = lineTotal * 0.19; // 19% TVA

            subtotal += lineTotal;
            tvaAmount += lineTva;

            return {
                productId: item.productId,
                productName: item.productName,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                tvaRate: 19.00
            };
        });

        totalAmount = subtotal + tvaAmount;

        // Generate Invoice Number (Simple logic for now)
        const count = await prisma.invoice.count();
        const invoiceNumber = `F2025/${String(count + 1).padStart(5, '0')}`;

        const invoice = await prisma.invoice.create({
            data: {
                invoiceNumber,
                customerId,
                subtotal,
                tvaAmount,
                totalAmount,
                items: {
                    create: invoiceItems
                }
            },
            include: { items: true }
        });

        res.status(201).json(invoice);
    } catch (error) {
        next(error);
    }
};

// @desc    Update invoice
// @route   PUT /api/v1/invoices/:id
// @access  Private
const updateInvoice = async (req, res, next) => {
    try {
        const { customerId, items } = req.body;
        const invoiceId = req.params.id;

        // Check if invoice exists and can be edited
        const existingInvoice = await prisma.invoice.findUnique({
            where: { id: invoiceId },
            include: { payments: true }
        });

        if (!existingInvoice) {
            res.status(404);
            throw new Error('Invoice not found');
        }

        // Prevent editing paid invoices
        if (existingInvoice.paymentStatus === 'paid') {
            res.status(400);
            throw new Error('Cannot edit a fully paid invoice');
        }

        // Calculate new totals
        let subtotal = 0;
        let tvaAmount = 0;

        const invoiceItems = items.map(item => {
            const lineTotal = item.quantity * item.unitPrice;
            const lineTva = lineTotal * 0.19;

            subtotal += lineTotal;
            tvaAmount += lineTva;

            return {
                productId: item.productId,
                productName: item.productName,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                tvaRate: 19.00
            };
        });

        const totalAmount = subtotal + tvaAmount;

        // Delete old items and create new ones
        await prisma.invoiceItem.deleteMany({
            where: { invoiceId }
        });

        const updatedInvoice = await prisma.invoice.update({
            where: { id: invoiceId },
            data: {
                customerId,
                subtotal,
                tvaAmount,
                totalAmount,
                items: {
                    create: invoiceItems
                }
            },
            include: { items: true, customer: true }
        });

        res.json(updatedInvoice);
    } catch (error) {
        next(error);
    }
};

// @desc    Record payment
// @route   POST /api/v1/invoices/:id/pay
// @access  Private
const recordPayment = async (req, res, next) => {
    try {
        const { amount, paymentMethod, notes } = req.body;
        const invoiceId = req.params.id;

        const invoice = await prisma.invoice.findUnique({
            where: { id: invoiceId }
        });

        if (!invoice) {
            res.status(404);
            throw new Error('Invoice not found');
        }

        // Create Payment
        const payment = await prisma.payment.create({
            data: {
                invoiceId,
                customerId: invoice.customerId,
                amount,
                paymentMethod,
                notes,
                paymentNumber: `PAY-${Date.now()}`
            }
        });

        // Update Invoice Status
        const newPaidAmount = Number(invoice.paidAmount) + Number(amount);
        let paymentStatus = 'partial';
        if (newPaidAmount >= Number(invoice.totalAmount)) {
            paymentStatus = 'paid';
        }

        await prisma.invoice.update({
            where: { id: invoiceId },
            data: {
                paidAmount: newPaidAmount,
                paymentStatus
            }
        });

        res.status(201).json(payment);
    } catch (error) {
        next(error);
    }
};

// @desc    Generate PDF
// @route   GET /api/v1/invoices/:id/pdf
// @access  Private
const generatePDF = async (req, res, next) => {
    // Placeholder for PDF generation logic
    res.json({ message: 'PDF generation not implemented yet' });
};

module.exports = {
    getInvoices,
    getInvoiceById,
    createInvoice,
    updateInvoice,
    recordPayment,
    generatePDF
};
