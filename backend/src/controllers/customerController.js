const prisma = require('../utils/prisma');

// @desc    Get all customers
// @route   GET /api/v1/customers
// @access  Private
const getCustomers = async (req, res, next) => {
    try {
        const { tier, search, hasDebt } = req.query;

        let where = { isActive: true };

        // Filter by loyalty tier
        if (tier) {
            where.loyaltyTier = tier;
        }

        // Search by name, phone, or NIF
        if (search) {
            where.OR = [
                { fullName: { contains: search, mode: 'insensitive' } },
                { companyName: { contains: search, mode: 'insensitive' } },
                { phone: { contains: search } },
                { nif: { contains: search } }
            ];
        }

        // Filter customers with outstanding debt
        if (hasDebt === 'true') {
            where.currentBalance = { gt: 0 };
        }

        const customers = await prisma.customer.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            include: {
                _count: {
                    select: { invoices: true }
                }
            }
        });

        res.json(customers);
    } catch (error) {
        next(error);
    }
};

// @desc    Get single customer
// @route   GET /api/v1/customers/:id
// @access  Private
const getCustomerById = async (req, res, next) => {
    try {
        const customer = await prisma.customer.findUnique({
            where: { id: req.params.id },
            include: {
                invoices: {
                    orderBy: { createdAt: 'desc' },
                    take: 10
                },
                payments: {
                    orderBy: { createdAt: 'desc' },
                    take: 10
                }
            }
        });

        if (customer) {
            res.json(customer);
        } else {
            res.status(404);
            throw new Error('Customer not found');
        }
    } catch (error) {
        next(error);
    }
};

// @desc    Create a customer
// @route   POST /api/v1/customers
// @access  Private
const createCustomer = async (req, res, next) => {
    try {
        const {
            customerType, fullName, companyName, nif, nis, rc,
            email, phone, mobile, addressLine1, addressLine2,
            commune, daira, wilaya, postalCode, creditLimit
        } = req.body;

        // Check if NIF already exists
        if (nif) {
            const existing = await prisma.customer.findUnique({ where: { nif } });
            if (existing) {
                res.status(400);
                throw new Error('Un client avec ce NIF existe déjà');
            }
        }

        const customer = await prisma.customer.create({
            data: {
                customerType: customerType || 'individual',
                fullName,
                companyName,
                nif,
                nis,
                rc,
                email,
                phone,
                mobile,
                addressLine1,
                addressLine2,
                commune,
                daira,
                wilaya,
                postalCode,
                creditLimit: creditLimit || 0
            }
        });

        res.status(201).json(customer);
    } catch (error) {
        next(error);
    }
};

// @desc    Update a customer
// @route   PUT /api/v1/customers/:id
// @access  Private
const updateCustomer = async (req, res, next) => {
    try {
        const {
            fullName, companyName, nif, nis, rc,
            email, phone, mobile, addressLine1, addressLine2,
            commune, daira, wilaya, postalCode, creditLimit, isActive
        } = req.body;

        const customer = await prisma.customer.update({
            where: { id: req.params.id },
            data: {
                fullName,
                companyName,
                nif,
                nis,
                rc,
                email,
                phone,
                mobile,
                addressLine1,
                addressLine2,
                commune,
                daira,
                wilaya,
                postalCode,
                creditLimit,
                isActive
            }
        });

        res.json(customer);
    } catch (error) {
        next(error);
    }
};

// @desc    Delete a customer (soft delete)
// @route   DELETE /api/v1/customers/:id
// @access  Private/Admin
const deleteCustomer = async (req, res, next) => {
    try {
        // Check if customer has unpaid invoices
        const customer = await prisma.customer.findUnique({
            where: { id: req.params.id },
            include: {
                invoices: {
                    where: { paymentStatus: { in: ['pending', 'partial', 'overdue'] } }
                }
            }
        });

        if (!customer) {
            res.status(404);
            throw new Error('Customer not found');
        }

        if (customer.invoices.length > 0) {
            res.status(400);
            throw new Error('Impossible de supprimer un client avec des factures impayées');
        }

        // Soft delete
        await prisma.customer.update({
            where: { id: req.params.id },
            data: { isActive: false }
        });

        res.json({ message: 'Client désactivé' });
    } catch (error) {
        next(error);
    }
};

// @desc    Get customer transaction history
// @route   GET /api/v1/customers/:id/history
// @access  Private
const getCustomerHistory = async (req, res, next) => {
    try {
        const customer = await prisma.customer.findUnique({
            where: { id: req.params.id },
            include: {
                invoices: {
                    orderBy: { createdAt: 'desc' },
                    include: { items: true }
                },
                payments: {
                    orderBy: { createdAt: 'desc' }
                },
                deliveries: {
                    orderBy: { createdAt: 'desc' }
                }
            }
        });

        if (!customer) {
            res.status(404);
            throw new Error('Customer not found');
        }

        res.json({
            customer,
            totalInvoices: customer.invoices.length,
            totalPayments: customer.payments.length,
            totalDeliveries: customer.deliveries.length
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Update customer loyalty points
// @route   POST /api/v1/customers/:id/points
// @access  Private
const updateLoyaltyPoints = async (req, res, next) => {
    try {
        const { points, action } = req.body; // action: 'add' or 'redeem'

        const customer = await prisma.customer.findUnique({
            where: { id: req.params.id }
        });

        if (!customer) {
            res.status(404);
            throw new Error('Customer not found');
        }

        let newPoints = customer.loyaltyPoints;
        if (action === 'add') {
            newPoints += points;
        } else if (action === 'redeem') {
            if (customer.loyaltyPoints < points) {
                res.status(400);
                throw new Error('Points insuffisants');
            }
            newPoints -= points;
        }

        // Determine tier based on points
        let newTier = 'Bronze';
        if (newPoints >= 5000) newTier = 'Platinum';
        else if (newPoints >= 2000) newTier = 'Gold';
        else if (newPoints >= 500) newTier = 'Silver';

        const updated = await prisma.customer.update({
            where: { id: req.params.id },
            data: {
                loyaltyPoints: newPoints,
                loyaltyTier: newTier
            }
        });

        res.json(updated);
    } catch (error) {
        next(error);
    }
};

// @desc    Get customers with debt
// @route   GET /api/v1/customers/with-debt
// @access  Private
const getCustomersWithDebt = async (req, res, next) => {
    try {
        // Get customers who have unpaid invoices
        const customers = await prisma.customer.findMany({
            where: {
                invoices: {
                    some: {
                        paymentStatus: { in: ['pending', 'partial', 'overdue'] }
                    }
                }
            },
            include: {
                invoices: {
                    where: {
                        paymentStatus: { in: ['pending', 'partial', 'overdue'] }
                    }
                }
            }
        });

        // Calculate total debt per customer
        const customersWithDebt = customers.map(customer => {
            const totalDebt = customer.invoices.reduce((sum, inv) => {
                return sum + (Number(inv.totalAmount) - Number(inv.paidAmount));
            }, 0);
            return {
                ...customer,
                totalDebt,
                invoiceCount: customer.invoices.length
            };
        });

        res.json(customersWithDebt);
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getCustomers,
    getCustomerById,
    createCustomer,
    updateCustomer,
    deleteCustomer,
    getCustomerHistory,
    updateLoyaltyPoints,
    getCustomersWithDebt
};
