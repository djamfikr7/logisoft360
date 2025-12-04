const prisma = require('../utils/prisma');

// @desc    Get all products
// @route   GET /api/v1/products
// @access  Private
const getProducts = async (req, res, next) => {
    try {
        const { expiringDays, lowStock, category } = req.query;

        let where = {};

        // Filter by category
        if (category) {
            where.categoryId = category;
        }

        // Filter low stock products
        if (lowStock === 'true') {
            where.stockQuantity = {
                lte: prisma.raw('min_stock_level')
            };
        }

        const products = await prisma.product.findMany({
            where,
            include: { category: true },
            orderBy: { createdAt: 'desc' }
        });

        // Add computed fields for expiry status
        const now = new Date();
        const productsWithStatus = products.map(product => {
            let expiryStatus = null;
            if (product.expiryDate) {
                const daysUntilExpiry = Math.ceil((new Date(product.expiryDate) - now) / (1000 * 60 * 60 * 24));
                if (daysUntilExpiry < 0) {
                    expiryStatus = 'expired';
                } else if (daysUntilExpiry <= 30) {
                    expiryStatus = 'expiring_soon';
                } else {
                    expiryStatus = 'ok';
                }
            }
            return {
                ...product,
                expiryStatus,
                isLowStock: product.stockQuantity <= product.minStockLevel
            };
        });

        // Filter by expiring days if specified
        if (expiringDays) {
            const days = parseInt(expiringDays);
            const futureDate = new Date();
            futureDate.setDate(futureDate.getDate() + days);

            const filtered = productsWithStatus.filter(p =>
                p.expiryDate && new Date(p.expiryDate) <= futureDate
            );
            return res.json(filtered);
        }

        res.json(productsWithStatus);
    } catch (error) {
        next(error);
    }
};

// @desc    Get products expiring soon
// @route   GET /api/v1/products/expiring
// @access  Private
const getExpiringProducts = async (req, res, next) => {
    try {
        const days = parseInt(req.query.days) || 30;
        const now = new Date();
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + days);

        const products = await prisma.product.findMany({
            where: {
                expiryDate: {
                    lte: futureDate,
                    gte: now
                }
            },
            include: { category: true },
            orderBy: { expiryDate: 'asc' }
        });

        res.json(products);
    } catch (error) {
        next(error);
    }
};

// @desc    Get low stock products
// @route   GET /api/v1/products/low-stock
// @access  Private
const getLowStockProducts = async (req, res, next) => {
    try {
        const products = await prisma.product.findMany({
            include: { category: true },
            orderBy: { stockQuantity: 'asc' }
        });

        // Filter products where stock <= minStockLevel
        const lowStock = products.filter(p => p.stockQuantity <= p.minStockLevel);
        res.json(lowStock);
    } catch (error) {
        next(error);
    }
};

// @desc    Get single product
// @route   GET /api/v1/products/:id
// @access  Private
const getProductById = async (req, res, next) => {
    try {
        const product = await prisma.product.findUnique({
            where: { id: req.params.id },
            include: { category: true }
        });

        if (product) {
            res.json(product);
        } else {
            res.status(404);
            throw new Error('Product not found');
        }
    } catch (error) {
        next(error);
    }
};

// @desc    Create a product
// @route   POST /api/v1/products
// @access  Private/Admin
const createProduct = async (req, res, next) => {
    try {
        const {
            sku, barcode, name, description, categoryId,
            costPrice, salePrice, stockQuantity, minStockLevel,
            batchNumber, serialNumber, expiryDate, tvaRate
        } = req.body;

        const product = await prisma.product.create({
            data: {
                sku,
                barcode,
                name,
                description,
                categoryId,
                costPrice,
                salePrice,
                stockQuantity: stockQuantity || 0,
                minStockLevel: minStockLevel || 5,
                batchNumber,
                serialNumber,
                expiryDate: expiryDate ? new Date(expiryDate) : null,
                tvaRate: tvaRate || 19.00
            }
        });

        res.status(201).json(product);
    } catch (error) {
        next(error);
    }
};

// @desc    Update a product
// @route   PUT /api/v1/products/:id
// @access  Private/Admin
const updateProduct = async (req, res, next) => {
    try {
        const {
            name, description, costPrice, salePrice,
            stockQuantity, minStockLevel, batchNumber,
            serialNumber, expiryDate, tvaRate, isActive
        } = req.body;

        const updateData = {};
        if (name !== undefined) updateData.name = name;
        if (description !== undefined) updateData.description = description;
        if (costPrice !== undefined) updateData.costPrice = costPrice;
        if (salePrice !== undefined) updateData.salePrice = salePrice;
        if (stockQuantity !== undefined) updateData.stockQuantity = stockQuantity;
        if (minStockLevel !== undefined) updateData.minStockLevel = minStockLevel;
        if (batchNumber !== undefined) updateData.batchNumber = batchNumber;
        if (serialNumber !== undefined) updateData.serialNumber = serialNumber;
        if (expiryDate !== undefined) updateData.expiryDate = expiryDate ? new Date(expiryDate) : null;
        if (tvaRate !== undefined) updateData.tvaRate = tvaRate;
        if (isActive !== undefined) updateData.isActive = isActive;

        const product = await prisma.product.update({
            where: { id: req.params.id },
            data: updateData
        });

        res.json(product);
    } catch (error) {
        next(error);
    }
};

// @desc    Delete a product
// @route   DELETE /api/v1/products/:id
// @access  Private/Admin
const deleteProduct = async (req, res, next) => {
    try {
        await prisma.product.delete({
            where: { id: req.params.id }
        });
        res.json({ message: 'Product removed' });
    } catch (error) {
        next(error);
    }
};

// @desc    Get product by barcode
// @route   GET /api/v1/products/barcode/:code
// @access  Private
const getProductByBarcode = async (req, res, next) => {
    try {
        const product = await prisma.product.findUnique({
            where: { barcode: req.params.code },
            include: { category: true }
        });

        if (product) {
            res.json(product);
        } else {
            res.status(404);
            throw new Error('Product not found');
        }
    } catch (error) {
        next(error);
    }
};

// @desc    Adjust stock quantity
// @route   POST /api/v1/products/:id/adjust-stock
// @access  Private/Admin
const adjustStock = async (req, res, next) => {
    try {
        const { adjustment, reason } = req.body;

        const product = await prisma.product.findUnique({
            where: { id: req.params.id }
        });

        if (!product) {
            res.status(404);
            throw new Error('Product not found');
        }

        const newQuantity = product.stockQuantity + adjustment;
        if (newQuantity < 0) {
            res.status(400);
            throw new Error('Stock cannot be negative');
        }

        // Update product and create stock movement
        const [updatedProduct, stockMovement] = await prisma.$transaction([
            prisma.product.update({
                where: { id: req.params.id },
                data: { stockQuantity: newQuantity }
            }),
            prisma.stockMovement.create({
                data: {
                    productId: req.params.id,
                    type: adjustment > 0 ? 'in' : 'out',
                    quantity: Math.abs(adjustment),
                    notes: reason,
                    userId: req.user?.id
                }
            })
        ]);

        res.json(updatedProduct);
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct,
    getProductByBarcode,
    getExpiringProducts,
    getLowStockProducts,
    adjustStock
};

