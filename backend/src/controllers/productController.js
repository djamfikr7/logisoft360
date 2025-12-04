const prisma = require('../utils/prisma');

// @desc    Get all products
// @route   GET /api/v1/products
// @access  Private
const getProducts = async (req, res, next) => {
    try {
        const products = await prisma.product.findMany({
            orderBy: { createdAt: 'desc' }
        });
        res.json(products);
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
            where: { id: req.params.id }
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
            costPrice, salePrice, stockQuantity, minStockLevel
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
                stockQuantity,
                minStockLevel
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
            stockQuantity, minStockLevel
        } = req.body;

        const product = await prisma.product.update({
            where: { id: req.params.id },
            data: {
                name,
                description,
                costPrice,
                salePrice,
                stockQuantity,
                minStockLevel
            }
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
            where: { barcode: req.params.code }
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

module.exports = {
    getProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct,
    getProductByBarcode
};
