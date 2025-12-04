const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const { errorHandler } = require('./middleware/errorMiddleware');

// Import routes
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const invoiceRoutes = require('./routes/invoiceRoutes');
const deliveryRoutes = require('./routes/deliveryRoutes');
const customerRoutes = require('./routes/customerRoutes');
// Add credit note routes when ready

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Logging
if (process.env.NODE_ENV === 'development') {
    // app.use(morgan('dev')); 
}

// Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/products', productRoutes);
app.use('/api/v1/invoices', invoiceRoutes);
app.use('/api/v1/deliveries', deliveryRoutes);
app.use('/api/v1/customers', customerRoutes);

// Health check
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', message: 'Logisoft360 API is running' });
});

// Error handling
app.use(errorHandler);

module.exports = app;

