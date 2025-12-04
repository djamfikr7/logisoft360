const prisma = require('../utils/prisma');

// @desc    Create delivery for invoice
// @route   POST /api/v1/deliveries
// @access  Private
const createDelivery = async (req, res, next) => {
    try {
        const {
            invoiceId, deliveryMethod, deliveryAddress,
            wilaya, commune, postalCode, contactPhone,
            isCod, codAmount
        } = req.body;

        // Verify invoice exists
        const invoice = await prisma.invoice.findUnique({
            where: { id: invoiceId },
            include: { customer: true }
        });

        if (!invoice) {
            res.status(404);
            throw new Error('Invoice not found');
        }

        // Generate Tracking Number (e.g., DZ-YAL-12345678)
        const prefix = deliveryMethod === 'yalidine' ? 'YAL' : 'LOG';
        const trackingNumber = `DZ-${prefix}-${Date.now().toString().slice(-8)}`;

        const delivery = await prisma.delivery.create({
            data: {
                trackingNumber,
                invoiceId,
                customerId: invoice.customerId,
                deliveryMethod,
                deliveryAddress,
                wilaya,
                commune,
                postalCode,
                contactPhone,
                isCod,
                codAmount: isCod ? codAmount : 0,
                status: 'pending'
            }
        });

        // Add initial status history
        await prisma.deliveryStatusHistory.create({
            data: {
                deliveryId: delivery.id,
                status: 'pending',
                notes: 'Shipment created',
                location: 'Warehouse Algiers'
            }
        });

        res.status(201).json(delivery);
    } catch (error) {
        next(error);
    }
};

// @desc    Get delivery details
// @route   GET /api/v1/deliveries/:id
// @access  Private
const getDeliveryById = async (req, res, next) => {
    try {
        const delivery = await prisma.delivery.findUnique({
            where: { id: req.params.id },
            include: {
                invoice: true,
                customer: true,
                statusHistory: {
                    orderBy: { createdAt: 'desc' }
                }
            }
        });

        if (delivery) {
            res.json(delivery);
        } else {
            res.status(404);
            throw new Error('Delivery not found');
        }
    } catch (error) {
        next(error);
    }
};

// @desc    Update delivery status
// @route   PUT /api/v1/deliveries/:id/status
// @access  Private
const updateDeliveryStatus = async (req, res, next) => {
    try {
        const { status, notes, location } = req.body;

        const delivery = await prisma.delivery.update({
            where: { id: req.params.id },
            data: { status }
        });

        // Add history entry
        await prisma.deliveryStatusHistory.create({
            data: {
                deliveryId: delivery.id,
                status,
                notes,
                location,
                updatedBy: req.user.id
            }
        });

        res.json(delivery);
    } catch (error) {
        next(error);
    }
};

// @desc    Track delivery (Public)
// @route   GET /api/v1/deliveries/track/:number
// @access  Public
const trackDelivery = async (req, res, next) => {
    try {
        const delivery = await prisma.delivery.findUnique({
            where: { trackingNumber: req.params.number },
            select: {
                trackingNumber: true,
                status: true,
                deliveryMethod: true,
                wilaya: true,
                statusHistory: {
                    select: {
                        status: true,
                        notes: true,
                        location: true,
                        createdAt: true
                    },
                    orderBy: { createdAt: 'desc' }
                }
            }
        });

        if (delivery) {
            res.json(delivery);
        } else {
            res.status(404);
            throw new Error('Tracking number not found');
        }
    } catch (error) {
        next(error);
    }
};

// @desc    Generate Shipping Label
// @route   POST /api/v1/deliveries/:id/label
// @access  Private
const generateLabel = async (req, res, next) => {
    try {
        const delivery = await prisma.delivery.findUnique({
            where: { id: req.params.id },
            include: { customer: true }
        });

        if (!delivery) {
            res.status(404);
            throw new Error('Delivery not found');
        }

        // In a real app, we would generate a PDF here using a library like PDFKit
        // For now, we return the data needed to render the label on the frontend
        const labelData = {
            trackingNumber: delivery.trackingNumber,
            recipient: {
                name: delivery.customer.fullName,
                address: delivery.deliveryAddress,
                wilaya: delivery.wilaya,
                phone: delivery.contactPhone
            },
            cod: {
                isCod: delivery.isCod,
                amount: delivery.codAmount
            },
            sender: {
                name: 'Logisoft360 Algérie',
                address: '123 Rue Didouche Mourad, Alger',
                nif: '001234567890123'
            },
            generatedAt: new Date()
        };

        // Update delivery record
        await prisma.delivery.update({
            where: { id: delivery.id },
            data: { labelGenerated: true }
        });

        res.json(labelData);
    } catch (error) {
        next(error);
    }
};

module.exports = {
    createDelivery,
    getDeliveryById,
    updateDeliveryStatus,
    trackDelivery,
    generateLabel
};
