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

    async forgotPassword(email) {
        const response = await fetch(`${API_URL}/auth/forgot-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });
        if (!response.ok) throw new Error('Password reset request failed');
        return await response.json();
    },

    async resetPassword(token, newPassword) {
        const response = await fetch(`${API_URL}/auth/reset-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token, newPassword })
        });
        if (!response.ok) throw new Error('Password reset failed');
        return await response.json();
    },

    // Products
    async getProducts() {
        return this.request('/products');
    },

    async getProductByBarcode(code) {
        return this.request(`/products/barcode/${code}`);
    },

    async getExpiringProducts(days = 30) {
        return this.request(`/products/expiring?days=${days}`);
    },

    async getLowStockProducts() {
        return this.request('/products/low-stock');
    },

    async createProduct(productData) {
        return this.request('/products', 'POST', productData);
    },

    async updateProduct(id, productData) {
        return this.request(`/products/${id}`, 'PUT', productData);
    },

    async deleteProduct(id) {
        return this.request(`/products/${id}`, 'DELETE');
    },

    async adjustStock(id, adjustment, reason) {
        return this.request(`/products/${id}/adjust-stock`, 'POST', { adjustment, reason });
    },

    // Customers
    async getCustomers() {
        return this.request('/customers');
    },

    async getCustomerById(id) {
        return this.request(`/customers/${id}`);
    },

    async getCustomersWithDebt() {
        return this.request('/customers/with-debt');
    },

    async createCustomer(customerData) {
        return this.request('/customers', 'POST', customerData);
    },

    async updateCustomer(id, customerData) {
        return this.request(`/customers/${id}`, 'PUT', customerData);
    },

    async deleteCustomer(id) {
        return this.request(`/customers/${id}`, 'DELETE');
    },

    async getCustomerHistory(id) {
        return this.request(`/customers/${id}/history`);
    },

    async updateLoyaltyPoints(id, points, action) {
        return this.request(`/customers/${id}/points`, 'POST', { points, action });
    },

    // Invoices
    async getInvoices() {
        return this.request('/invoices');
    },

    async getInvoiceById(id) {
        return this.request(`/invoices/${id}`);
    },

    async createInvoice(invoiceData) {
        return this.request('/invoices', 'POST', invoiceData);
    },

    async updateInvoice(id, invoiceData) {
        return this.request(`/invoices/${id}`, 'PUT', invoiceData);
    },

    async deleteInvoice(id) {
        return this.request(`/invoices/${id}`, 'DELETE');
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
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.reload();
            throw new Error('Session expirée. Veuillez vous reconnecter.');
        }

        if (response.status === 403) {
            throw new Error('Accès refusé. Vous n\'avez pas les permissions nécessaires.');
        }

        if (!response.ok) {
            const error = await response.json().catch(() => ({ message: 'API request failed' }));
            throw new Error(error.message || 'API request failed');
        }

        return await response.json();
    }
};

// Expose to window
window.api = api;


