const API_URL = 'http://localhost:3000/api/v1';

const api = {
    // Auth
    async login(email, password) {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        if (!response.ok) throw new Error('Login failed');
        const data = await response.json();
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data));
        return data;
    },

    async register(userData) {
        const response = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData)
        });
        if (!response.ok) throw new Error('Registration failed');
        return await response.json();
    },

    // Products
    async getProducts() {
        return this.request('/products');
    },

    async getProductByBarcode(code) {
        return this.request(`/products/barcode/${code}`);
    },

    // Invoices
    async getInvoices() {
        return this.request('/invoices');
    },

    async createInvoice(invoiceData) {
        return this.request('/invoices', 'POST', invoiceData);
    },

    async recordPayment(invoiceId, paymentData) {
        return this.request(`/invoices/${invoiceId}/pay`, 'POST', paymentData);
    },

    // Deliveries
    async createDelivery(deliveryData) {
        return this.request('/deliveries', 'POST', deliveryData);
    },

    async getDeliveryLabel(deliveryId) {
        return this.request(`/deliveries/${deliveryId}/label`, 'POST');
    },

    // Helper
    async request(endpoint, method = 'GET', body = null) {
        const token = localStorage.getItem('token');
        const headers = {
            'Content-Type': 'application/json',
            'Authorization': token ? `Bearer ${token}` : ''
        };

        const config = { method, headers };
        if (body) config.body = JSON.stringify(body);

        const response = await fetch(`${API_URL}${endpoint}`, config);
        if (response.status === 401) {
            // Token expired or invalid
            localStorage.removeItem('token');
            window.location.reload();
            throw new Error('Unauthorized');
        }
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'API request failed');
        }
        return await response.json();
    }
};

// Expose to window
window.api = api;
