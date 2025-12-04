// ============================================
// LOGISOFT360 ALGÉRIE - MAIN APPLICATION
// ============================================

class Logisoft360App {
    constructor() {
        this.currentPage = 'dashboard';
        this.currentLang = localStorage.getItem('lang') || 'fr';
        this.mockData = this.initMockData();
        this.translations = this.initTranslations();
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.applyLanguage(this.currentLang);

        // Check Auth
        const token = localStorage.getItem('token');
        this.currentUser = JSON.parse(localStorage.getItem('user') || 'null');

        if (!token) {
            this.showLoginModal();
        } else {
            this.loadInitialData().then(() => {
                this.loadPage('dashboard');
                this.initAlertSystem();
                this.checkAllAlerts();
            });
        }
    }

    setupEventListeners() {
        // Navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const page = e.currentTarget.dataset.page;

                // Update active state
                document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
                e.currentTarget.classList.add('active');

                this.loadPage(page);
            });
        });
    }

    async loadInitialData() {
        try {
            // Show loading state
            const content = document.getElementById('mainContent');
            if (content) content.innerHTML = '<div class="loading" style="text-align:center; padding: 2rem;">Chargement...</div>';

            const [productsData, invoicesData] = await Promise.all([
                api.getProducts(),
                api.getInvoices()
            ]);

            // Transform product fields from backend format to frontend format
            const products = (productsData || []).map(p => ({
                ...p,
                price: Number(p.salePrice) || 0,
                stock: p.stockQuantity || 0,
                minStock: p.minStockLevel || 0,
                category: p.category?.name || p.description?.split(' ')[0] || 'Électronique',
                status: p.stockQuantity <= p.minStockLevel ? 'Stock Faible' : 'En Stock'
            }));

            // Transform invoice fields from backend format to frontend format
            const invoices = (invoicesData || []).map(inv => ({
                ...inv,
                id: inv.invoiceNumber || inv.id,
                client: inv.customer?.companyName || inv.customer?.fullName || 'Client',
                date: new Date(inv.invoiceDate).toLocaleDateString('fr-FR'),
                amount: Number(inv.subtotal) || 0,
                tva: Number(inv.tvaAmount) || 0,
                total: Number(inv.totalAmount) || 0,
                status: this.translateStatus(inv.paymentStatus || inv.status)
            }));

            this.data = {
                products,
                recentInvoices: invoices,
                customers: this.mockData.customers, // Keep mock customers for now until API ready
                stats: this.calculateStats(products, invoices)
            };

            // Fallback if empty (for demo)
            if (this.data.products.length === 0) {
                console.log('API returned empty, using mock data');
                this.data = this.initMockData();
            }
        } catch (error) {
            console.error('Failed to load data:', error);
            this.showToast('Erreur de chargement des données', 'danger');
            this.data = this.initMockData();
        }
    }

    translateStatus(status) {
        const statusMap = {
            'pending': 'En attente',
            'partial': 'Partiel',
            'paid': 'Payée',
            'overdue': 'En retard',
            'cancelled': 'Annulée',
            'draft': 'Brouillon',
            'sent': 'Envoyée'
        };
        return statusMap[status] || status;
    }


    calculateStats(products, invoices) {
        const totalRevenue = invoices.reduce((sum, inv) => sum + (Number(inv.total) || 0), 0);
        const pendingDebt = invoices
            .filter(inv => inv.status === 'En retard' || inv.status === 'En attente')
            .reduce((sum, inv) => sum + (Number(inv.total) || 0), 0);

        return {
            totalRevenue,
            pendingDebt,
            totalInvoices: invoices.length,
            productsCount: products.length
        };
    }

    showLoginModal() {
        const modalHtml = `
            <div class="login-container" style="max-width: 400px; margin: 100px auto; padding: 2rem; background: var(--bg-base); border-radius: 20px; box-shadow: 8px 8px 16px var(--shadow-dark);">
                <h2 style="text-align: center; margin-bottom: 2rem; color: var(--accent-primary);">Connexion</h2>
                <form id="loginForm">
                    <div class="form-group" style="margin-bottom: 1rem;">
                        <label style="display: block; margin-bottom: 0.5rem;">Email</label>
                        <input type="email" id="email" class="form-control" style="width: 100%; padding: 0.8rem; border-radius: 10px; border: none; background: var(--bg-inset); box-shadow: inset 2px 2px 5px var(--shadow-dark), inset -2px -2px 5px var(--shadow-light);" required>
                    </div>
                    <div class="form-group" style="margin-bottom: 1rem;">
                        <label style="display: block; margin-bottom: 0.5rem;">Mot de passe</label>
                        <input type="password" id="password" class="form-control" style="width: 100%; padding: 0.8rem; border-radius: 10px; border: none; background: var(--bg-inset); box-shadow: inset 2px 2px 5px var(--shadow-dark), inset -2px -2px 5px var(--shadow-light);" required>
                    </div>
                    <p style="text-align: right; margin-bottom: 1rem;">
                        <a href="#" onclick="app.showForgotPasswordModal(); return false;" style="font-size: 0.875rem;">Mot de passe oublié ?</a>
                    </p>
                    <button type="submit" class="btn btn-primary" style="width: 100%;">Se connecter</button>
                </form>
                <p style="text-align: center; margin-top: 1rem;">
                    <a href="#" onclick="app.showRegisterModal(); return false;">Créer un compte</a>
                </p>
            </div>
        `;
        document.getElementById('mainContent').innerHTML = modalHtml;

        document.getElementById('loginForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            try {
                const data = await api.login(email, password);
                this.currentUser = data; // Store user data including role
                await this.loadInitialData();
                this.loadPage('dashboard');
                this.initAlertSystem();
                this.checkAllAlerts();
            } catch (error) {
                this.showToast('Échec de connexion: ' + error.message, 'danger');
            }
        });
    }

    showForgotPasswordModal() {
        const modalHtml = `
            <div class="login-container" style="max-width: 400px; margin: 100px auto; padding: 2rem; background: var(--bg-base); border-radius: 20px; box-shadow: 8px 8px 16px var(--shadow-dark);">
                <h2 style="text-align: center; margin-bottom: 2rem; color: var(--accent-primary);">Réinitialiser le mot de passe</h2>
                <form id="forgotPasswordForm">
                    <div class="form-group" style="margin-bottom: 1.5rem;">
                        <label style="display: block; margin-bottom: 0.5rem;">Email</label>
                        <input type="email" id="resetEmail" class="form-control" style="width: 100%; padding: 0.8rem; border-radius: 10px; border: none; background: var(--bg-inset); box-shadow: inset 2px 2px 5px var(--shadow-dark), inset -2px -2px 5px var(--shadow-light);" required>
                    </div>
                    <button type="submit" class="btn btn-primary" style="width: 100%;">Envoyer le lien</button>
                </form>
                <p style="text-align: center; margin-top: 1rem;">
                    <a href="#" onclick="app.showLoginModal(); return false;">Retour à la connexion</a>
                </p>
            </div>
        `;
        document.getElementById('mainContent').innerHTML = modalHtml;

        document.getElementById('forgotPasswordForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('resetEmail').value;

            try {
                const result = await api.forgotPassword(email);
                this.showToast('Un lien de réinitialisation a été envoyé à votre email.', 'success');

                // For demo: show the reset token
                if (result.resetToken) {
                    this.showResetPasswordModal(result.resetToken);
                }
            } catch (error) {
                this.showToast('Erreur: ' + error.message, 'danger');
            }
        });
    }

    showResetPasswordModal(token) {
        const modalHtml = `
            <div class="login-container" style="max-width: 400px; margin: 100px auto; padding: 2rem; background: var(--bg-base); border-radius: 20px; box-shadow: 8px 8px 16px var(--shadow-dark);">
                <h2 style="text-align: center; margin-bottom: 2rem; color: var(--accent-primary);">Nouveau mot de passe</h2>
                <form id="resetPasswordForm">
                    <input type="hidden" id="resetToken" value="${token}">
                    <div class="form-group" style="margin-bottom: 1rem;">
                        <label style="display: block; margin-bottom: 0.5rem;">Nouveau mot de passe</label>
                        <input type="password" id="newPassword" class="form-control" style="width: 100%; padding: 0.8rem; border-radius: 10px; border: none; background: var(--bg-inset); box-shadow: inset 2px 2px 5px var(--shadow-dark), inset -2px -2px 5px var(--shadow-light);" required minlength="6">
                    </div>
                    <div class="form-group" style="margin-bottom: 1.5rem;">
                        <label style="display: block; margin-bottom: 0.5rem;">Confirmer le mot de passe</label>
                        <input type="password" id="confirmPassword" class="form-control" style="width: 100%; padding: 0.8rem; border-radius: 10px; border: none; background: var(--bg-inset); box-shadow: inset 2px 2px 5px var(--shadow-dark), inset -2px -2px 5px var(--shadow-light);" required>
                    </div>
                    <button type="submit" class="btn btn-primary" style="width: 100%;">Réinitialiser</button>
                </form>
            </div>
        `;
        document.getElementById('mainContent').innerHTML = modalHtml;

        document.getElementById('resetPasswordForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const token = document.getElementById('resetToken').value;
            const newPassword = document.getElementById('newPassword').value;
            const confirmPassword = document.getElementById('confirmPassword').value;

            if (newPassword !== confirmPassword) {
                this.showToast('Les mots de passe ne correspondent pas', 'danger');
                return;
            }

            try {
                await api.resetPassword(token, newPassword);
                this.showToast('Mot de passe réinitialisé avec succès !', 'success');
                this.showLoginModal();
            } catch (error) {
                this.showToast('Erreur: ' + error.message, 'danger');
            }
        });
    }

    showRegisterModal() {
        const modalHtml = `
            <div class="login-container" style="max-width: 400px; margin: 100px auto; padding: 2rem; background: var(--bg-base); border-radius: 20px; box-shadow: 8px 8px 16px var(--shadow-dark);">
                <h2 style="text-align: center; margin-bottom: 2rem; color: var(--accent-primary);">Créer un compte</h2>
                <form id="registerForm">
                    <div class="form-group" style="margin-bottom: 1rem;">
                        <label style="display: block; margin-bottom: 0.5rem;">Nom complet</label>
                        <input type="text" id="regName" class="form-control" style="width: 100%; padding: 0.8rem; border-radius: 10px; border: none; background: var(--bg-inset); box-shadow: inset 2px 2px 5px var(--shadow-dark), inset -2px -2px 5px var(--shadow-light);" required>
                    </div>
                    <div class="form-group" style="margin-bottom: 1rem;">
                        <label style="display: block; margin-bottom: 0.5rem;">Email</label>
                        <input type="email" id="regEmail" class="form-control" style="width: 100%; padding: 0.8rem; border-radius: 10px; border: none; background: var(--bg-inset); box-shadow: inset 2px 2px 5px var(--shadow-dark), inset -2px -2px 5px var(--shadow-light);" required>
                    </div>
                    <div class="form-group" style="margin-bottom: 1rem;">
                        <label style="display: block; margin-bottom: 0.5rem;">Mot de passe</label>
                        <input type="password" id="regPassword" class="form-control" style="width: 100%; padding: 0.8rem; border-radius: 10px; border: none; background: var(--bg-inset); box-shadow: inset 2px 2px 5px var(--shadow-dark), inset -2px -2px 5px var(--shadow-light);" required>
                    </div>
                    <div class="form-group" style="margin-bottom: 1rem;">
                        <label style="display: block; margin-bottom: 0.5rem;">Rôle</label>
                        <select id="regRole" class="form-control" style="width: 100%; padding: 0.8rem; border-radius: 10px; border: none; background: var(--bg-inset); box-shadow: inset 2px 2px 5px var(--shadow-dark), inset -2px -2px 5px var(--shadow-light);" onchange="document.getElementById('adminCodeGroup').style.display = this.value === 'admin' ? 'block' : 'none'">
                            <option value="user">Utilisateur</option>
                            <option value="admin">Administrateur</option>
                        </select>
                    </div>
                    <div class="form-group" id="adminCodeGroup" style="margin-bottom: 1.5rem; display: none;">
                        <label style="display: block; margin-bottom: 0.5rem;">Code Admin</label>
                        <input type="password" id="regAdminCode" class="form-control" style="width: 100%; padding: 0.8rem; border-radius: 10px; border: none; background: var(--bg-inset); box-shadow: inset 2px 2px 5px var(--shadow-dark), inset -2px -2px 5px var(--shadow-light);">
                    </div>
                    <button type="submit" class="btn btn-primary" style="width: 100%;">S'inscrire</button>
                </form>
                <p style="text-align: center; margin-top: 1rem;">
                    <a href="#" onclick="app.showLoginModal(); return false;">Déjà un compte ?</a>
                </p>
            </div>
        `;
        document.getElementById('mainContent').innerHTML = modalHtml;

        document.getElementById('registerForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = document.getElementById('regName').value;
            const email = document.getElementById('regEmail').value;
            const password = document.getElementById('regPassword').value;
            const role = document.getElementById('regRole').value;
            const adminCode = document.getElementById('regAdminCode').value;

            if (role === 'admin' && adminCode !== 'LOGISOFT_ADMIN') {
                this.showToast('Code Admin incorrect', 'danger');
                return;
            }

            try {
                await api.register({ name, email, password, role });
                this.showToast('Compte créé ! Veuillez vous connecter.', 'success');
                this.showLoginModal();
            } catch (error) {
                this.showToast('Échec inscription: ' + error.message, 'danger');
            }
        });
    }

    showPaymentModal(invoiceId) {
        const invoice = this.data.recentInvoices.find(inv => inv.id === invoiceId);
        if (!invoice) return;

        const remainingAmount = Number(invoice.totalAmount || invoice.total || 0) - Number(invoice.paidAmount || 0);

        const modalHtml = `
            < div class="login-container" style = "max-width: 500px; margin: 50px auto; padding: 2rem; background: var(--bg-base); border-radius: 20px; box-shadow: 8px 8px 16px var(--shadow-dark);" >
                <h2 style="text-align: center; margin-bottom: 1.5rem; color: var(--accent-primary);">Enregistrer un Paiement</h2>
                <div style="margin-bottom: 1.5rem; padding: 1rem; background: var(--bg-inset); border-radius: 10px;">
                    <p><strong>Facture:</strong> ${invoice.invoiceNumber || invoice.id}</p>
                    <p><strong>Client:</strong> ${invoice.client || invoice.customer?.fullName || 'Client'}</p>
                    <p><strong>Reste à payer:</strong> ${this.formatCurrency(remainingAmount)}</p>
                </div>
                <form id="paymentForm">
                    <div class="form-group" style="margin-bottom: 1rem;">
                        <label style="display: block; margin-bottom: 0.5rem;">Montant (DA)</label>
                        <input type="number" id="payAmount" class="form-control" value="${remainingAmount}" max="${remainingAmount}" style="width: 100%; padding: 0.8rem; border-radius: 10px; border: none; background: var(--bg-inset); box-shadow: inset 2px 2px 5px var(--shadow-dark), inset -2px -2px 5px var(--shadow-light);" required>
                    </div>
                    <div class="form-group" style="margin-bottom: 1rem;">
                        <label style="display: block; margin-bottom: 0.5rem;">Mode de Paiement</label>
                        <select id="payMethod" class="form-control" style="width: 100%; padding: 0.8rem; border-radius: 10px; border: none; background: var(--bg-base); box-shadow: 3px 3px 6px var(--shadow-dark), -3px -3px 6px var(--shadow-light);">
                            <option value="cash">Espèces</option>
                            <option value="check">Chèque</option>
                            <option value="bank_transfer">Virement Bancaire</option>
                            <option value="card">Carte CIB/Edahabia</option>
                        </select>
                    </div>
                    <div class="form-group" style="margin-bottom: 1.5rem;">
                        <label style="display: block; margin-bottom: 0.5rem;">Référence / Note</label>
                        <input type="text" id="payRef" class="form-control" placeholder="N° Chèque ou Note optionnelle" style="width: 100%; padding: 0.8rem; border-radius: 10px; border: none; background: var(--bg-inset); box-shadow: inset 2px 2px 5px var(--shadow-dark), inset -2px -2px 5px var(--shadow-light);">
                    </div>
                    <div style="display: flex; gap: 1rem;">
                        <button type="button" onclick="document.getElementById('modal').closest('.modal-overlay').style.display='none'" class="btn" style="flex: 1;">Annuler</button>
                        <button type="submit" class="btn btn-primary" style="flex: 1;">Confirmer</button>
                    </div>
                </form>
            </div >
            `;
        this.showModal(modalHtml);

        document.getElementById('paymentForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const amount = Number(document.getElementById('payAmount').value);
            const method = document.getElementById('payMethod').value;
            const reference = document.getElementById('payRef').value;

            try {
                await api.recordPayment(invoiceId, { amount, paymentMethod: method, referenceNumber: reference });
                this.showToast('Paiement enregistré avec succès !', 'success');
                document.getElementById('modal').closest('.modal-overlay').style.display = 'none';
                await this.loadInitialData(); // Refresh data
                this.loadPage('sales'); // Reload sales page
            } catch (error) {
                this.showToast('Erreur: ' + error.message, 'danger');
            }
        });
    }

    showDeliveryModal(invoiceId) {
        const invoice = this.data.recentInvoices.find(inv => inv.id === invoiceId);
        if (!invoice) return;

        const wilayas = [
            { code: '16', name: 'Alger' },
            { code: '31', name: 'Oran' },
            { code: '25', name: 'Constantine' },
            { code: '06', name: 'Béjaïa' },
            { code: '19', name: 'Sétif' },
            { code: '13', name: 'Tlemcen' },
            { code: '15', name: 'Tizi Ouzou' },
            { code: '09', name: 'Blida' }
        ];

        const modalHtml = `
            <div class="login-container" style="max-width: 500px; margin: 50px auto; padding: 2rem; background: var(--bg-base); border-radius: 20px; box-shadow: 8px 8px 16px var(--shadow-dark);">
                <h2 style="text-align: center; margin-bottom: 1.5rem; color: var(--accent-primary);">Créer Expédition</h2>
                <div style="margin-bottom: 1.5rem; padding: 1rem; background: var(--bg-inset); border-radius: 10px;">
                    <p><strong>Facture:</strong> ${invoice.invoiceNumber || invoice.id}</p>
                    <p><strong>Client:</strong> ${invoice.client || invoice.customer?.fullName || 'Client'}</p>
                </div>
                <form id="deliveryForm">
                    <div class="form-group" style="margin-bottom: 1rem;">
                        <label style="display: block; margin-bottom: 0.5rem;">Wilaya</label>
                        <select id="delWilaya" class="form-control" style="width: 100%; padding: 0.8rem; border-radius: 10px; border: none; background: var(--bg-base); box-shadow: 3px 3px 6px var(--shadow-dark), -3px -3px 6px var(--shadow-light);">
                            ${wilayas.map(w => `<option value="${w.name}">${w.code} - ${w.name}</option>`).join('')}
                        </select>
                    </div>
                    <div class="form-group" style="margin-bottom: 1rem;">
                        <label style="display: block; margin-bottom: 0.5rem;">Adresse Complète</label>
                        <input type="text" id="delAddress" class="form-control" placeholder="Cité, Rue, Bâtiment..." style="width: 100%; padding: 0.8rem; border-radius: 10px; border: none; background: var(--bg-inset); box-shadow: inset 2px 2px 5px var(--shadow-dark), inset -2px -2px 5px var(--shadow-light);" required>
                    </div>
                    <div class="form-group" style="margin-bottom: 1rem;">
                        <label style="display: block; margin-bottom: 0.5rem;">Montant COD (Contre Remboursement)</label>
                        <input type="number" id="delCOD" class="form-control" value="${invoice.totalAmount || invoice.total || 0}" style="width: 100%; padding: 0.8rem; border-radius: 10px; border: none; background: var(--bg-inset); box-shadow: inset 2px 2px 5px var(--shadow-dark), inset -2px -2px 5px var(--shadow-light);">
                    </div>
                    <div class="form-group" style="margin-bottom: 1.5rem;">
                        <label style="display: block; margin-bottom: 0.5rem;">Transporteur</label>
                        <select id="delCarrier" class="form-control" style="width: 100%; padding: 0.8rem; border-radius: 10px; border: none; background: var(--bg-base); box-shadow: 3px 3px 6px var(--shadow-dark), -3px -3px 6px var(--shadow-light);">
                            <option value="yalidine">Yalidine Express</option>
                            <option value="zr_express">ZR Express</option>
                            <option value="algerie_poste">Algérie Poste</option>
                        </select>
                    </div>
                    <div style="display: flex; gap: 1rem;">
                        <button type="button" onclick="document.getElementById('modal').closest('.modal-overlay').style.display='none'" class="btn" style="flex: 1;">Annuler</button>
                        <button type="submit" class="btn btn-primary" style="flex: 1;">Générer Étiquette</button>
                    </div>
                </form>
            </div>
        `;
        this.showModal(modalHtml);

        document.getElementById('deliveryForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const wilaya = document.getElementById('delWilaya').value;
            const address = document.getElementById('delAddress').value;
            const codAmount = Number(document.getElementById('delCOD').value);
            const carrier = document.getElementById('delCarrier').value;

            try {
                // 1. Create Delivery
                const delivery = await api.createDelivery({
                    invoiceId: invoice.id,
                    customerId: invoice.customerId || invoice.customer?.id,
                    wilaya,
                    deliveryAddress: address,
                    codAmount,
                    deliveryMethod: carrier
                });

                // 2. Get Label (simulated PDF view for now)
                this.showDeliveryLabel(delivery);

                document.getElementById('modal').closest('.modal-overlay').style.display = 'none';
                this.showToast('Expédition créée avec succès !', 'success');
            } catch (error) {
                this.showToast('Erreur: ' + error.message, 'danger');
            }
        });
    }

    showDeliveryLabel(delivery) {
        const labelHtml = `
            <div style="background: white; color: black; padding: 2rem; max-width: 400px; margin: 20px auto; border: 2px solid black; font-family: monospace;">
                <div style="text-align: center; border-bottom: 2px solid black; padding-bottom: 1rem; margin-bottom: 1rem;">
                    <h2 style="margin: 0;">LOGISOFT360</h2>
                    <p style="margin: 0.5rem 0;">Expédition Express</p>
                </div>
                
                <div style="display: flex; justify-content: space-between; margin-bottom: 1rem;">
                    <div>
                        <strong>DATE:</strong><br>
                        ${new Date().toLocaleDateString()}
                    </div>
                    <div>
                        <strong>POIDS:</strong><br>
                        1.5 KG
                    </div>
                </div>

                <div style="border: 1px solid black; padding: 1rem; margin-bottom: 1rem;">
                    <strong>DESTINATAIRE:</strong><br>
                    ${delivery.customer?.fullName || 'Client'}<br>
                    ${delivery.deliveryAddress}<br>
                    <strong>${delivery.wilaya}</strong>
                </div>

                <div style="text-align: center; margin-bottom: 1rem;">
                    <div style="font-size: 3rem; font-weight: bold; letter-spacing: 5px;">${delivery.wilaya.substring(0, 2)}</div>
                </div>

                <div style="border: 2px solid black; padding: 1rem; text-align: center; margin-bottom: 1rem;">
                    <strong>MONTANT COD</strong><br>
                    <span style="font-size: 1.5rem; font-weight: bold;">${this.formatCurrency(delivery.codAmount)}</span>
                </div>

                <div style="text-align: center;">
                    <div style="background: black; height: 50px; width: 80%; margin: 0 auto 0.5rem;"></div>
                    <small>${delivery.trackingNumber}</small>
                </div>
            </div>
            <div style="text-align: center; margin-top: 1rem;">
                <button class="btn btn-primary" onclick="window.print()">Imprimer</button>
                <button class="btn" onclick="document.getElementById('modal').closest('.modal-overlay').style.display='none'">Fermer</button>
            </div>
        `;
        this.showModal(labelHtml);
    }

    initTranslations() {
        return {
            fr: {
                'nav.dashboard': 'Tableau de Bord',
                'nav.inventory': 'Inventaire',
                'nav.sales': 'Ventes',
                'nav.customers': 'Clients',
                'nav.debt': 'Créances',
                'nav.pos': 'POS Mobile',
                'dash.title': 'Ventes & Factures',
                'dash.subtitle': 'Gestion TVA conforme DGI',
                'inv.title': 'Gestion d\'Inventaire',
                'inv.subtitle': 'Gérez vos produits et stocks',
                'inv.new': 'Nouveau Produit',
                'sales.title': 'Ventes & Factures',
                'sales.subtitle': 'Gestion des factures et devis',
                'sales.new': 'Nouvelle Facture',
                'sales.quote': 'Devis',
                'cust.title': 'Gestion Clients',
                'cust.subtitle': 'Base de données et fidélité',
                'cust.new': 'Nouveau Client',
                'btn.export': 'Exporter DGI',
                'btn.book': 'Livre Recettes',
                'btn.route': 'Bon de Route',
                'table.invoice': 'N° Facture',
                'table.client': 'Client',
                'table.date': 'Date',
                'table.amount': 'Montant HT',
                'table.tva': 'TVA 19%',
                'table.total': 'Total TTC',
                'table.status': 'Statut',
                'table.actions': 'Actions'
            },
            ar: {
                'nav.dashboard': 'لوحة القيادة',
                'nav.inventory': 'المخزون',
                'nav.sales': 'المبيعات',
                'nav.customers': 'الزبائن',
                'nav.debt': 'الديون',
                'nav.pos': 'نقطة البيع',
                'dash.title': 'المبيعات والفواتير',
                'dash.subtitle': 'تسيير متوافق مع الضرائب',
                'inv.title': 'تسيير المخزون',
                'inv.subtitle': 'إدارة المنتجات والمخزون',
                'inv.new': 'منتج جديد',
                'sales.title': 'المبيعات والفواتير',
                'sales.subtitle': 'إدارة الفواتير وعروض الأسعار',
                'sales.new': 'فاتورة جديدة',
                'sales.quote': 'عرض سعر',
                'cust.title': 'تسيير الزبائن',
                'cust.subtitle': 'قاعدة البيانات والولاء',
                'cust.new': 'زبون جديد',
                'btn.export': 'تصدير للضرائب',
                'btn.book': 'سجل الإيرادات',
                'btn.route': 'ورقة الطريق',
                'table.invoice': 'رقم الفاتورة',
                'table.client': 'الزبون',
                'table.date': 'التاريخ',
                'table.amount': 'المبلغ الخام',
                'table.tva': 'الرسم 19%',
                'table.total': 'المجموع',
                'table.status': 'الحالة',
                'table.actions': 'إجراءات'
            },
            en: {
                'nav.dashboard': 'Dashboard',
                'nav.inventory': 'Inventory',
                'nav.sales': 'Sales',
                'nav.customers': 'Customers',
                'nav.debt': 'Debt',
                'nav.pos': 'Mobile POS',
                'dash.title': 'Sales & Invoices',
                'dash.subtitle': 'Tax Compliant Management',
                'inv.title': 'Inventory Management',
                'inv.subtitle': 'Manage products and stock',
                'inv.new': 'New Product',
                'sales.title': 'Sales & Invoices',
                'sales.subtitle': 'Manage invoices and quotes',
                'sales.new': 'New Invoice',
                'sales.quote': 'Quote',
                'cust.title': 'Customer Management',
                'cust.subtitle': 'Database and Loyalty',
                'cust.new': 'New Customer',
                'btn.export': 'Tax Export',
                'btn.book': 'Revenue Book',
                'btn.route': 'Waybill',
                'table.invoice': 'Invoice #',
                'table.client': 'Client',
                'table.date': 'Date',
                'table.amount': 'Amount HT',
                'table.tva': 'VAT 19%',
                'table.total': 'Total TTC',
                'table.status': 'Status',
                'table.actions': 'Actions'
            }
        };
    }

    // RBAC Helper method
    isAdmin() {
        return this.currentUser && this.currentUser.role === 'admin';
    }

    loadPage(pageName) {
        this.currentPage = pageName;
        const content = document.getElementById('mainContent');

        // Simple router
        switch (pageName) {
            case 'dashboard':
                content.innerHTML = this.renderDashboard();
                break;
            case 'inventory':
                content.innerHTML = this.renderInventory();
                break;
            case 'sales':
                content.innerHTML = this.renderSales();
                break;
            case 'customers':
                content.innerHTML = this.renderCustomers();
                break;
            case 'debt':
                content.innerHTML = this.renderComingSoon('Suivi des Créances');
                break;
            case 'reports':
                content.innerHTML = this.renderReports();
                break;
            case 'pos':
                content.innerHTML = this.renderPOSScanner();
                this.initScanner();
                break;
        }
    }

    renderDashboard() {
        return `
            <div class="dashboard-header animate-fade-in">
                <h1>${this.t('dashboard.title')}</h1>
                <p class="text-muted">${new Date().toLocaleDateString('fr-DZ', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>

            <!-- Stats Grid -->
            <div class="grid grid-4 mb-3 animate-fade-in">
                <div class="stat-card">
                    <div class="stat-icon" style="color: var(--accent-success);">💰</div>
                    <div class="stat-value">${this.formatCurrency(this.data.stats.totalRevenue)}</div>
                    <div class="stat-label">Chiffre d'Affaires</div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon" style="color: var(--accent-warning);">⏳</div>
                    <div class="stat-value">${this.formatCurrency(this.data.stats.pendingDebt)}</div>
                    <div class="stat-label">Créances en Attente</div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon" style="color: var(--accent-primary);">📦</div>
                    <div class="stat-value">${this.data.stats.productsCount || this.data.products.length}</div>
                    <div class="stat-label">Produits</div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon" style="color: var(--accent-secondary);">👥</div>
                    <div class="stat-value">${this.data.customers?.length || 0}</div>
                    <div class="stat-label">Clients</div>
                </div>
            </div>

            <!-- Quick Actions -->
            <div class="neo-outset p-4 mb-3 animate-fade-in" style="padding: 2rem; margin-bottom: 2rem;">
                <h2 style="margin-bottom: 1rem;">Actions Rapides</h2>
                <div style="display: flex; gap: 1rem; flex-wrap: wrap;">
                    <button class="btn btn-primary" onclick="app.loadPage('sales')">📝 Nouvelle Facture</button>
                    <button class="btn" onclick="app.loadPage('inventory')">📦 Inventaire</button>
                    <button class="btn" onclick="app.loadPage('customers')">👥 Clients</button>
                    <button class="btn" onclick="app.loadPage('reports')">📊 Rapports</button>
                </div>
            </div>

            <!-- Recent Products -->
            <div class="neo-outset p-4 animate-fade-in" style="padding: 2rem;">
                <h2 style="margin-bottom: 1rem;">Produits Récents</h2>
                <div class="grid grid-4">
                    ${this.data.products.slice(0, 4).map(product => `
                        <div class="stat-card" style="padding: 1rem;">
                            <h4 style="margin-bottom: 0.5rem;">${product.name}</h4>
                            <p class="text-muted" style="font-size: 0.875rem;">${product.category || 'Non catégorisé'}</p>
                            <div style="display: flex; justify-content: space-between; margin-top: 0.5rem;">
                                <span style="font-weight: 700; color: var(--accent-secondary);">${this.formatCurrency(product.price)}</span>
                                <span class="badge ${product.stock <= product.minStock ? 'badge-warning' : 'badge-success'}">${product.stock} en stock</span>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    renderInventory() {
        return `
            <div class="dashboard-header animate-fade-in">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <h1>Gestion d'Inventaire</h1>
                        <p class="text-muted">Gérez vos produits et stocks</p>
                    </div>
                    ${this.isAdmin() ? `
                    <button class="btn btn-primary">
                        <span>➕</span> Nouveau Produit
                    </button>
                    ` : ''}
                </div>
            </div>

            <!-- Filters -->
            <div class="neo-inset p-3 mb-3 animate-fade-in" style="padding: 1.5rem; margin-bottom: 2rem; display: flex; gap: 1rem; align-items: center;">
                <input type="text" placeholder="Rechercher un produit..." style="border: none; background: transparent; padding: 0.5rem; width: 300px; outline: none; color: var(--text-primary); font-family: var(--font-primary);">
                <select style="border: none; background: transparent; padding: 0.5rem; outline: none; color: var(--text-primary); cursor: pointer;">
                    <option>Toutes les catégories</option>
                    <option>Électronique</option>
                    <option>Informatique</option>
                    <option>Accessoires</option>
                </select>
                <select style="border: none; background: transparent; padding: 0.5rem; outline: none; color: var(--text-primary); cursor: pointer;">
                    <option>Tous les statuts</option>
                    <option>En Stock</option>
                    <option>Stock Faible</option>
                </select>
            </div>

            <!-- Product Grid -->
            <div class="grid grid-3 animate-fade-in">
                ${this.data.products.map(product => `
                    <div class="stat-card" style="display: flex; flex-direction: column; gap: 1rem;">
                        <div style="display: flex; justify-content: space-between; align-items: start;">
                            <div class="badge ${product.stock <= product.minStock ? 'badge-warning' : 'badge-success'}">${product.status || 'En Stock'}</div>
                            ${this.isAdmin() ? `
                            <button class="btn" style="padding: 0.25rem; border-radius: 50%; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; box-shadow: 3px 3px 6px var(--shadow-dark), -3px -3px 6px var(--shadow-light);">⋮</button>
                            ` : ''}
                        </div>
                        
                        <div>
                            <h3 style="font-size: 1.25rem; font-weight: 700; margin-bottom: 0.25rem;">${product.name}</h3>
                            <p class="text-muted" style="font-size: 0.875rem;">${product.category || 'Non catégorisé'}</p>
                        </div>

                        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: auto;">
                            <div>
                                <div class="text-muted" style="font-size: 0.75rem; text-transform: uppercase; letter-spacing: 1px;">Prix</div>
                                <div style="font-weight: 800; font-size: 1.1rem; color: var(--accent-secondary);">${this.formatCurrency(product.price)}</div>
                            </div>
                            <div style="text-align: right;">
                                <div class="text-muted" style="font-size: 0.75rem; text-transform: uppercase; letter-spacing: 1px;">Stock</div>
                                <div style="font-weight: 800; font-size: 1.1rem;">${product.stock}</div>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    renderSales() {
        return `
            <div class="dashboard-header animate-fade-in">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <h1>${this.t('sales.title')}</h1>
                        <p class="text-muted">${this.t('sales.subtitle')}</p>
                    </div>
                    <div style="display: flex; gap: 1rem;">
                        <button class="btn" onclick="app.renderBonDeRoute()" style="background: var(--bg-base); box-shadow: 3px 3px 6px var(--shadow-dark), -3px -3px 6px var(--shadow-light);">
                            🚚 ${this.t('btn.route')}
                        </button>
                        <button class="btn" style="background: var(--bg-base); box-shadow: 3px 3px 6px var(--shadow-dark), -3px -3px 6px var(--shadow-light);">
                            📄 ${this.t('sales.quote')}
                        </button>
                        <button class="btn btn-primary">
                            <span>➕</span> ${this.t('sales.new')}
                        </button>
                    </div>
                </div>
            </div>

            <!-- Sales Stats -->
            <div class="grid grid-4 mb-3 animate-fade-in">
                <div class="stat-card">
                    <div class="stat-icon" style="color: var(--accent-success);">💰</div>
                    <div class="stat-value">${this.formatCurrency(this.data.stats.totalRevenue)}</div>
                    <div class="stat-label">Chiffre d'Affaires</div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon" style="color: var(--accent-warning);">⏳</div>
                    <div class="stat-value">${this.formatCurrency(this.data.stats.pendingDebt)}</div>
                    <div class="stat-label">En Attente</div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon" style="color: var(--accent-info);">🧾</div>
                    <div class="stat-value">${this.data.stats.totalInvoices}</div>
                    <div class="stat-label">Factures Totales</div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon" style="color: var(--accent-danger);">📉</div>
                    <div class="stat-value">12</div>
                    <div class="stat-label">Factures Annulées</div>
                </div>
            </div>

            <!-- Invoices Table -->
            <div class="neo-outset p-4 animate-fade-in" style="padding: 2rem;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 1.5rem;">
                    <div style="display: flex; gap: 1rem; align-items: center;">
                        <h2 style="font-size: 1.5rem; color: var(--text-primary);">Historique des Factures</h2>
                        <span class="badge badge-secondary">2025</span>
                    </div>
                    <div style="display: flex; gap: 1rem;">
                        <input type="text" placeholder="Rechercher facture..." class="neo-inset" style="border: none; background: var(--bg-inset); padding: 0.75rem 1rem; border-radius: 10px; width: 200px; outline: none; color: var(--text-primary);">
                    </div>
                </div>

                <div class="table-container">
                    <table class="table">
                        <thead>
                            <tr>
                                <th>${this.t('table.invoice')}</th>
                                <th>${this.t('table.client')}</th>
                                <th>${this.t('table.date')}</th>
                                <th>${this.t('table.amount')}</th>
                                <th>${this.t('table.tva')}</th>
                                <th>${this.t('table.total')}</th>
                                <th>${this.t('table.status')}</th>
                                <th>${this.t('table.actions')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${this.data.recentInvoices.map(inv => `
                                <tr>
                                    <td><strong>${inv.id}</strong></td>
                                    <td>${inv.client}</td>
                                    <td>${inv.date}</td>
                                    <td>${this.formatCurrency(inv.amount)}</td>
                                    <td>${this.formatCurrency(inv.tva)}</td>
                                    <td style="font-weight: 700; color: var(--text-primary);">${this.formatCurrency(inv.total)}</td>
                                    <td><span class="badge ${this.getStatusBadge(inv.status)}">${inv.status}</span></td>
                                    <td>
                                        <div style="display: flex; gap: 0.5rem;">
                                            ${(inv.paymentStatus || inv.status) !== 'Payée' && (inv.paymentStatus || inv.status) !== 'paid' ?
                `<button class="btn" onclick="app.showEditInvoiceModal('${inv.id}')" title="Modifier Facture" style="padding: 0.25rem; border-radius: 50%; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; box-shadow: 3px 3px 6px var(--shadow-dark), -3px -3px 6px var(--shadow-light); color: var(--accent-warning);">✏️</button>
                                                <button class="btn" onclick="app.showPaymentModal('${inv.id}')" title="Enregistrer Paiement" style="padding: 0.25rem; border-radius: 50%; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; box-shadow: 3px 3px 6px var(--shadow-dark), -3px -3px 6px var(--shadow-light); color: var(--accent-success);">💵</button>` : ''
            }
                                            <button class="btn" onclick="app.showDeliveryModal('${inv.id}')" title="Générer Étiquette" style="padding: 0.25rem; border-radius: 50%; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; box-shadow: 3px 3px 6px var(--shadow-dark), -3px -3px 6px var(--shadow-light);">🏷️</button>
                                            <button class="btn" onclick="app.generateBonDeLivraison('${inv.id}')" title="Bon de Livraison" style="padding: 0.25rem; border-radius: 50%; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; box-shadow: 3px 3px 6px var(--shadow-dark), -3px -3px 6px var(--shadow-light);">📦</button>
                                            <button class="btn" onclick="app.generateFactureProforma('${inv.id}')" title="Facture Proforma" style="padding: 0.25rem; border-radius: 50%; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; box-shadow: 3px 3px 6px var(--shadow-dark), -3px -3px 6px var(--shadow-light);">📄</button>
                                            <button class="btn" onclick="app.shareViaWhatsApp('Facture', '${inv.id}')" title="Partager WhatsApp" style="padding: 0.25rem; border-radius: 50%; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; box-shadow: 3px 3px 6px var(--shadow-dark), -3px -3px 6px var(--shadow-light); color: #25D366;">📱</button>
                                        </div>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }

    renderCustomers() {
        return `
            <div class="dashboard-header animate-fade-in">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <h1>Gestion Clients</h1>
                        <p class="text-muted">Base de données et fidélité</p>
                    </div>
                    <button class="btn btn-primary">
                        <span>➕</span> Nouveau Client
                    </button>
                </div>
            </div>

            <!-- Customer Stats -->
            <div class="grid grid-4 mb-3 animate-fade-in">
                <div class="stat-card">
                    <div class="stat-icon" style="color: var(--accent-primary);">👥</div>
                    <div class="stat-value">${this.mockData.customers.length}</div>
                    <div class="stat-label">Clients Actifs</div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon" style="color: #FFD700;">🏆</div>
                    <div class="stat-value">2</div>
                    <div class="stat-label">Clients Platinum</div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon" style="color: var(--accent-info);">💎</div>
                    <div class="stat-value">40 150</div>
                    <div class="stat-label">Points Fidélité</div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon" style="color: var(--accent-success);">📈</div>
                    <div class="stat-value">+15%</div>
                    <div class="stat-label">Croissance Mensuelle</div>
                </div>
            </div>

            <!-- Customers Grid -->
            <div class="grid grid-2 animate-fade-in">
                ${this.mockData.customers.map(customer => `
                    <div class="neo-outset p-4" style="padding: 1.5rem; display: flex; gap: 1.5rem; align-items: center;">
                        <div style="width: 60px; height: 60px; border-radius: 50%; background: var(--gradient-info); display: flex; align-items: center; justify-content: center; font-size: 1.5rem; color: white; box-shadow: 4px 4px 8px var(--shadow-dark), -4px -4px 8px var(--shadow-light);">
                            ${customer.fullName.charAt(0)}
                        </div>
                        <div style="flex: 1;">
                            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 0.5rem;">
                                <h3 style="font-size: 1.1rem; font-weight: 700;">${customer.fullName}</h3>
                                <span class="badge" style="background: ${this.getTierColor(customer.tier)}; color: white;">${customer.tier}</span>
                            </div>
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; font-size: 0.85rem; color: var(--text-secondary);">
                                <div>📞 ${customer.phone}</div>
                                <div>🆔 NIF: ${customer.nif}</div>
                                <div>💰 ${this.formatCurrency(customer.totalSpent)}</div>
                                <div>⭐ ${customer.points} pts</div>
                            </div>
                        </div>
                        <button class="btn" style="padding: 0.5rem; border-radius: 50%; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; box-shadow: 3px 3px 6px var(--shadow-dark), -3px -3px 6px var(--shadow-light);">
                            📞
                        </button>
                    </div>
                `).join('')}
            </div>
        `;
    }

    // ============================================
    // POS SCANNER MODULE
    // ============================================

    renderPOSScanner() {
        return `
    <div class="dashboard-header animate-fade-in">
        <h1>📱 POS Mobile - Scanner</h1>
        <p class="text-muted">Scan products and process sales</p>
    </div>

    <div class="grid grid-2 animate-fade-in" style="gap: 2rem;">
        <!-- Scanner Section -->
        <div class="neo-outset p-4" style="padding: 2rem;">
            <h3 style="margin-bottom: 1.5rem;">📷 Scanner</h3>
            
            <!-- Camera Preview -->
            <div id="qr-reader" style="width: 100%; max-width: 500px; margin: 0 auto 1.5rem;"></div>
            
            <!-- Manual Entry -->
            <div style="margin-top: 1.5rem;">
                <label style="display: block; margin-bottom: 0.5rem; font-weight: 600;">Saisie Manuelle:</label>
                <div style="display: flex; gap: 0.5rem;">
                    <input type="text" id="manualBarcode" placeholder="Code-barres..." 
                        style="flex: 1; padding: 0.8rem; border-radius: 10px; border: none; background: var(--bg-inset); box-shadow: inset 2px 2px 5px var(--shadow-dark), inset -2px -2px 5px var(--shadow-light);">
                    <button class="btn btn-primary" onclick="app.handleManualBarcode()">Ajouter</button>
                </div>
            </div>

            <!-- Test Buttons -->
            <div style="margin-top: 1.5rem; display: flex; gap: 0.5rem; flex-wrap: wrap;">
                <button class="btn" onclick="app.simulateScan('PROD001')">Test: Laptop HP</button>
                <button class="btn" onclick="app.simulateScan('PROD002')">Test: iPhone 14</button>
            </div>
        </div>

        <!-- Cart Section -->
        <div class="neo-outset p-4" style="padding: 2rem;">
            <h3 style="margin-bottom: 1.5rem;">🛒 Panier</h3>
            <div id="posCart"></div>
            <div id="posTotal" style="margin-top: 1.5rem; padding-top: 1.5rem; border-top: 2px solid var(--shadow-dark);"></div>
            <button class="btn btn-primary" onclick="app.processPOSSale()" style="width: 100%; margin-top: 1.5rem;">
                💳 Finaliser la Vente
            </button>
        </div>
    </div>
    `;
    }

    initScanner() {
        this.posCart = [];
        this.renderCart();

        // Initialize html5-qrcode scanner
        if (typeof Html5QrcodeScanner !== 'undefined') {
            const config = {
                fps: 10,
                qrbox: { width: 250, height: 250 }
                // supportedScanTypes removed to use default (all) or specify fewer if needed
            };

            const html5QrcodeScanner = new Html5QrcodeScanner("qr-reader", config);
            html5QrcodeScanner.render(
                (decodedText) => {
                    this.scanProduct(decodedText);
                },
                (errorMessage) => {
                    // Silent error handling for continuous scanning
                }
            );
        }

        // USB Scanner Detection (keypress events)
        this.barcodeBuffer = '';
        this.barcodeTimeout = null;

        document.addEventListener('keypress', (e) => {
            if (this.currentPage !== 'pos') return;

            if (e.key === 'Enter' && this.barcodeBuffer.length > 0) {
                this.scanProduct(this.barcodeBuffer);
                this.barcodeBuffer = '';
                clearTimeout(this.barcodeTimeout);
            } else {
                this.barcodeBuffer += e.key;
                clearTimeout(this.barcodeTimeout);
                this.barcodeTimeout = setTimeout(() => {
                    this.barcodeBuffer = '';
                }, 100); // Reset if too slow (human typing)
            }
        });
    }

    async scanProduct(code) {
        try {
            const product = await api.getProductByBarcode(code);
            this.addToCart(product);
            this.showToast(`✅ ${product.name} ajouté au panier`, 'success');
        } catch (error) {
            this.showToast(`❌ Produit non trouvé: ${code}`, 'danger');
        }
    }

    handleManualBarcode() {
        const input = document.getElementById('manualBarcode');
        if (input && input.value) {
            this.scanProduct(input.value);
            input.value = '';
        }
    }

    simulateScan(code) {
        this.scanProduct(code);
    }

    addToCart(product) {
        const existing = this.posCart.find(item => item.id === product.id);
        if (existing) {
            existing.quantity++;
        } else {
            this.posCart.push({ ...product, quantity: 1 });
        }
        this.renderCart();
    }

    removeFromCart(productId) {
        this.posCart = this.posCart.filter(item => item.id !== productId);
        this.renderCart();
    }

    renderCart() {
        const cartEl = document.getElementById('posCart');
        const totalEl = document.getElementById('posTotal');

        if (!cartEl || !totalEl) return;

        if (this.posCart.length === 0) {
            cartEl.innerHTML = '<p class="text-muted" style="text-align: center;">Panier vide</p>';
            totalEl.innerHTML = '';
            return;
        }

        const total = this.posCart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const tva = total * 0.19;

        cartEl.innerHTML = this.posCart.map(item => `
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem 0; border-bottom: 1px solid var(--shadow-light);">
            <div style="flex: 1;">
                <div style="font-weight: 600;">${item.name}</div>
                <div class="text-muted" style="font-size: 0.875rem;">${item.barcode || item.code}</div>
            </div>
            <div style="display: flex; align-items: center; gap: 0.5rem;">
                <span>${item.quantity} x ${this.formatCurrency(item.price)}</span>
                <button class="btn" onclick="app.removeFromCart('${item.id}')" 
                    style="padding: 0.25rem; width: 24px; height: 24px; border-radius: 50%; color: var(--accent-danger);">
                    ✕
                </button>
            </div>
        </div>
    `).join('');

        totalEl.innerHTML = `
        <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
            <span>Sous-total HT:</span>
            <strong>${this.formatCurrency(total)}</strong>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
            <span>TVA (19%):</span>
            <strong>${this.formatCurrency(tva)}</strong>
        </div>
        <div style="display: flex; justify-content: space-between; font-size: 1.25rem; color: var(--accent-primary);">
            <span>Total TTC:</span>
            <strong>${this.formatCurrency(total + tva)}</strong>
        </div>
    `;
    }

    async processPOSSale() {
        if (this.posCart.length === 0) {
            this.showToast('Panier vide', 'danger');
            return;
        }

        try {
            const total = this.posCart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
            const invoiceData = {
                customerId: this.data.customers[0]?.id, // Anonymous customer for now
                items: this.posCart.map(item => ({
                    productId: item.id,
                    quantity: item.quantity,
                    unitPrice: item.price
                })),
                totalAmount: total,
                tvaAmount: total * 0.19
            };

            await api.createInvoice(invoiceData);
            this.showToast('✅ Vente enregistrée avec succès!', 'success');
            this.posCart = [];
            this.renderCart();
            await this.loadInitialData();
        } catch (error) {
            this.showToast('Erreur: ' + error.message, 'danger');
        }
    }

    // ============================================
    // REPORTS MODULE
    // ============================================

    renderReports() {
        const salesByDay = this.calculateDailySales();
        const topProducts = this.getTopProducts();
        const lowStock = this.data.products.filter(p => p.stock <= p.minStock);

        return `
    <div class="dashboard-header animate-fade-in">
        <h1>📊 Rapports & Analyses</h1>
        <p class="text-muted">Insights financiers et inventaire</p>
    </div>

    <!-- Financial Summary -->
    <div class="neo-outset p-4 mb-3 animate-fade-in" style="padding: 2rem; margin-bottom: 2rem;">
        <h2 style="margin-bottom: 1.5rem;">💰 Résumé Financier</h2>
        <div class="grid grid-4">
            <div class="stat-card">
                <div class="stat-icon" style="color: var(--accent-success);">📈</div>
                <div class="stat-value">${this.formatCurrency(this.data.stats.totalRevenue)}</div>
                <div class="stat-label">Chiffre d'Affaires Total</div>
            </div>
            <div class="stat-card">
                <div class="stat-icon" style="color: var(--accent-warning);">⏳</div>
                <div class="stat-value">${this.formatCurrency(this.data.stats.pendingDebt)}</div>
                <div class="stat-label">Créances en Attente</div>
            </div>
            <div class="stat-card">
                <div class="stat-icon" style="color: var(--accent-info);">🧾</div>
                <div class="stat-value">${this.data.stats.totalInvoices}</div>
                <div class="stat-label">Factures Émises</div>
            </div>
            <div class="stat-card">
                <div class="stat-icon" style="color: var(--accent-info);">📦</div>
                <div class="stat-value">${this.data.stats.productsCount}</div>
                <div class="stat-label">Produits en Stock</div>
            </div>
        </div>
    </div>

    <!-- Top Products -->
    <div class="grid grid-2 animate-fade-in" style="gap: 2rem;">
        <div class="neo-outset p-4" style="padding: 2rem;">
            <h3 style="margin-bottom: 1.5rem;">🏆 Top Produits</h3>
            <table class="table">
                <thead>
                    <tr>
                        <th>Produit</th>
                        <th>Ventes</th>
                        <th>Revenus</th>
                    </tr>
                </thead>
                <tbody>
                    ${topProducts.map(p => `
                        <tr>
                            <td><strong>${p.name}</strong></td>
                            <td>${p.sales} unités</td>
                            <td>${this.formatCurrency(p.revenue)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>

        <!-- Low Stock Alert -->
        <div class="neo-outset p-4" style="padding: 2rem;">
            <h3 style="margin-bottom: 1.5rem;">⚠️ Stock Faible</h3>
            <table class="table">
                <thead>
                    <tr>
                        <th>Produit</th>
                        <th>Stock Actuel</th>
                        <th>Stock Min</th>
                    </tr>
                </thead>
                <tbody>
                    ${lowStock.map(p => `
                        <tr>
                            <td><strong>${p.name}</strong></td>
                            <td><span class="badge badge-danger">${p.stock}</span></td>
                            <td>${p.minStock}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    </div>
    `;
    }

    calculateDailySales() {
        // Simulate daily sales data
        return [
            { date: '2025-01-01', revenue: 125000 },
            { date: '2025-01-02', revenue: 98000 },
            { date: '2025-01-03', revenue: 145000 }
        ];
    }

    getTopProducts() {
        // Simulate top products based on mock data
        return this.data.products.slice(0, 5).map((p, idx) => ({
            name: p.name,
            sales: 50 - (idx * 10),
            revenue: p.price * (50 - (idx * 10))
        }));
    }

    // End of new methods

    t(key) {
        return this.translations[this.currentLang][key] || key;
    }

    applyLanguage(lang) {
        this.currentLang = lang;
        localStorage.setItem('lang', lang);
        document.documentElement.lang = lang;
        document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';

        // Update UI text
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.dataset.i18n;
            if (key) el.textContent = this.t(key);
        });
    }

    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast toast - ${type} animate - fade -in `;
        toast.style.background = 'var(--bg-base)';
        toast.style.padding = '1rem';
        toast.style.borderRadius = '10px';
        toast.style.boxShadow = '5px 5px 10px var(--shadow-dark)';
        toast.style.marginTop = '1rem';
        toast.style.borderLeft = `4px solid var(--accent - ${type === 'danger' ? 'danger' : 'success'})`;
        toast.textContent = message;

        const container = document.getElementById('toastContainer');
        if (container) container.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    getStockBadge(stock, minStock) {
        if (stock <= 0) return 'badge-danger';
        if (stock <= minStock) return 'badge-warning';
        return 'badge-success';
    }

    // Chat Bot Logic
    toggleChat() {
        const widget = document.getElementById('chatWidget');
        widget.classList.toggle('active');
        if (widget.classList.contains('active')) {
            document.getElementById('chatInput').focus();
        }
    }

    handleChatInput() {
        const input = document.getElementById('chatInput');
        const message = input.value.trim();
        if (!message) return;

        // Add User Message
        this.addChatMessage(message, 'user');
        input.value = '';

        // Bot Response Simulation
        setTimeout(() => {
            let response = "Je ne comprends pas encore cette commande.";
            const lowerMsg = message.toLowerCase();

            if (lowerMsg.includes('stock') || lowerMsg.includes('iphone')) {
                response = "Nous avons 12 iPhone 15 Pro Max en stock (Prix: 285,000 DA).";
            } else if (lowerMsg.includes('facture') || lowerMsg.includes('client')) {
                response = "La dernière facture pour SARL Import Export est de 505,750 DA (Payée).";
            } else if (lowerMsg.includes('bonjour') || lowerMsg.includes('salut')) {
                response = "Bonjour! Je suis votre assistant LogiBot. Demandez-moi des infos sur le stock ou les ventes.";
            }

            this.addChatMessage(response, 'bot');
        }, 1000);
    }

    addChatMessage(text, sender) {
        const body = document.getElementById('chatBody');
        const div = document.createElement('div');
        div.className = `chat - message ${sender} `;
        div.textContent = text;
        body.appendChild(div);
        body.scrollTop = body.scrollHeight;
    }

    // ============================================
    // ALERT SYSTEM
    // ============================================

    initAlertSystem() {
        this.alerts = [];
        this.alertsChecked = false;

        // Set up notification button click handler
        const notifBtn = document.getElementById('notifBtn');
        if (notifBtn) {
            notifBtn.addEventListener('click', () => this.showNotificationCenter());
        }
    }

    checkAllAlerts() {
        if (this.alertsChecked) return; // Only check once per session

        this.checkStockAlerts();
        this.checkDebtAlerts();
        this.checkExpiryAlerts();

        this.alertsChecked = true;
        this.updateNotificationBadge();

        // Show first alert as toast
        if (this.alerts.length > 0) {
            this.addBotNotification(this.alerts[0].message);
        }
    }

    checkStockAlerts() {
        const lowStock = this.data.products.filter(p => p.stock <= p.minStock);

        if (lowStock.length > 0) {
            this.alerts.push({
                id: `stock - ${Date.now()} `,
                type: 'stock',
                severity: 'warning',
                message: `⚠️ ${lowStock.length} produits en rupture de stock`,
                details: lowStock.map(p => `${p.name}: ${p.stock} unités restantes`).join(', '),
                timestamp: new Date()
            });
        }
    }

    checkDebtAlerts() {
        const overdueInvoices = this.data.recentInvoices.filter(inv => inv.status === 'En retard');

        if (overdueInvoices.length > 0) {
            const totalOverdue = overdueInvoices.reduce((sum, inv) => sum + inv.total, 0);
            this.alerts.push({
                id: `debt - ${Date.now()} `,
                type: 'debt',
                severity: 'danger',
                message: `🚨 ${overdueInvoices.length} factures en retard`,
                details: `Montant total: ${this.formatCurrency(totalOverdue)} `,
                timestamp: new Date()
            });
        }
    }

    checkExpiryAlerts() {
        // Simulate product expiry (for demo purposes, using random products)
        const expiringProducts = this.data.products.filter((p, idx) => idx === 2 || idx === 4);

        if (expiringProducts.length > 0) {
            this.alerts.push({
                id: `expiry - ${Date.now()} `,
                type: 'expiry',
                severity: 'info',
                message: `📅 ${expiringProducts.length} produits expirent bientôt`,
                details: expiringProducts.map(p => `${p.name} (Stock: ${p.stock})`).join(', '),
                timestamp: new Date()
            });
        }
    }

    updateNotificationBadge() {
        const badge = document.getElementById('notifBadge');
        if (badge && this.alerts.length > 0) {
            badge.style.display = 'flex';
            badge.textContent = this.alerts.length;
        }
    }

    showNotificationCenter() {
        const content = `
                <div class="notification-center">
                <div class="doc-header">
                    <h1>🔔 Centre de Notifications</h1>
                    <p>${this.alerts.length} alertes actives</p>
                </div>
                <div class="doc-body">
                    ${this.alerts.length === 0 ?
                '<p style="text-align: center; color: var(--text-muted);">Aucune alerte pour le moment</p>' :
                this.alerts.map(alert => `
                        <div class="alert-item alert-${alert.severity}">
                            <div class="alert-header">
                                <strong>${alert.message}</strong>
                                <span class="alert-time">${this.formatTimeAgo(alert.timestamp)}</span>
                            </div>
                            <div class="alert-details">${alert.details}</div>
                            <div class="alert-actions">
                                ${alert.type === 'stock' ? '<button class="btn btn-sm" onclick="app.loadPage(\'inventory\')">Voir Inventaire</button>' : ''}
                                ${alert.type === 'debt' ? '<button class="btn btn-sm" onclick="app.loadPage(\'debt\')">Voir Créances</button>' : ''}
                            </div>
                        </div>
                    `).join('')
            }
                </div>
                <div class="doc-footer">
                    <button onclick="app.clearAllAlerts()" class="btn">Effacer tout</button>
                    <button onclick="document.getElementById('modal').closest('.modal-overlay').style.display='none'" class="btn btn-primary">Fermer</button>
                </div>
            </div>
    `;
        this.showModal(content);
    }

    clearAllAlerts() {
        this.alerts = [];
        this.updateNotificationBadge();
        const badge = document.getElementById('notifBadge');
        if (badge) badge.style.display = 'none';
        this.showNotificationCenter();
    }

    formatTimeAgo(date) {
        const seconds = Math.floor((new Date() - date) / 1000);
        if (seconds < 60) return 'À l\'instant';
        if (seconds < 3600) return `Il y a ${Math.floor(seconds / 60)} min`;
        if (seconds < 86400) return `Il y a ${Math.floor(seconds / 3600)} h`;
        return `Il y a ${Math.floor(seconds / 86400)} jour(s)`;
    }

    addBotNotification(text) {
        const toast = document.createElement('div');
        toast.className = 'neo-flat';
        toast.style.padding = '1rem';
        toast.style.marginBottom = '1rem';
        toast.style.background = 'var(--bg-base)';
        toast.style.borderLeft = '4px solid var(--accent-primary)';
        toast.innerHTML = `<strong>🔔 Notification</strong><br>${text}`;

        const container = document.getElementById('toastContainer');
        if (container) container.appendChild(toast);

        setTimeout(() => toast.remove(), 5000);
    }

    // Social Features
    shareViaWhatsApp(type, id) {
        const text = encodeURIComponent(`Bonjour, voici le document ${type} #${id} de Logisoft360.`);
        window.open(`https://wa.me/?text=${text}`, '_blank');
    }

    renderBonDeRoute() {
        // Generate Bon de Route (Waybill) document
        const today = new Date().toLocaleDateString('fr-DZ');
        const routes = [
            { wilaya: 'Alger', invoices: ['F2025/00342', 'F2025/00341'], total: 658070 },
            { wilaya: 'Oran', invoices: ['F2025/00340'], total: 77350 }
        ];

        const content = `
                    <div class="document-preview">
                        <div class="doc-header">
                            <h1>🚚 BON DE ROUTE</h1>
                            <p>Date: ${today} | Chauffeur: Mohamed BENALI</p>
                        </div>
                        <div class="doc-body">
                            ${routes.map(route => `
                                <div class="route-section">
                                    <h3>📍 ${route.wilaya}</h3>
                                    <ul>
                                        ${route.invoices.map(inv => `<li>Facture ${inv}</li>`).join('')}
                                    </ul>
                                    <p><strong>Total: ${this.formatCurrency(route.total)}</strong></p>
                                </div>
                            `).join('')}
                        </div>
                        <div class="doc-footer">
                            <button onclick="window.print()" class="btn btn-primary">🖨️ Imprimer</button>
                            <button onclick="document.getElementById('modal').closest('.modal-overlay').style.display='none'" class="btn">Fermer</button>
                        </div>
                    </div>
                    `;
        this.showModal(content);
    }

    generateBonDeLivraison(invoiceId) {
        // Generate Bon de Livraison (Delivery Note)
        const invoice = this.data.recentInvoices.find(inv => inv.id === invoiceId);
        if (!invoice) return;

        const today = new Date().toLocaleDateString('fr-DZ');
        const content = `
                    <div class="document-preview">
                        <div class="doc-header">
                            <h1>📦 BON DE LIVRAISON</h1>
                            <p>N° ${invoiceId} | Date: ${today}</p>
                        </div>
                        <div class="doc-body">
                            <div style="margin-bottom: 2rem;">
                                <h3>Client:</h3>
                                <p><strong>${invoice.client || invoice.customer?.fullName || 'Client'}</strong></p>
                                <p>NIF: 001234567890123</p>
                            </div>
                            <table class="table">
                                <thead>
                                    <tr>
                                        <th>Produit</th>
                                        <th>Quantité</th>
                                        <th>Prix Unitaire</th>
                                        <th>Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td>${this.data.products[0]?.name || 'Produit Standard'}</td>
                                        <td>1</td>
                                        <td>${this.formatCurrency(invoice.amount || invoice.totalAmount || 0)}</td>
                                        <td>${this.formatCurrency(invoice.amount || invoice.totalAmount || 0)}</td>
                                    </tr>
                                </tbody>
                            </table>
                            <div style="margin-top: 2rem; text-align: right;">
                                <p>Total HT: ${this.formatCurrency(invoice.amount || invoice.totalAmount || 0)}</p>
                                <p>TVA (19%): ${this.formatCurrency(invoice.tva || 0)}</p>
                                <p><strong>Total TTC: ${this.formatCurrency(invoice.total || invoice.totalAmount || 0)}</strong></p>
                            </div>
                            <div style="margin-top: 3rem; display: flex; justify-content: space-between;">
                                <div>
                                    <p>Signature Livreur:</p>
                                    <div style="border-top: 1px solid #ccc; width: 150px; margin-top: 2rem;"></div>
                                </div>
                                <div>
                                    <p>Signature Client:</p>
                                    <div style="border-top: 1px solid #ccc; width: 150px; margin-top: 2rem;"></div>
                                </div>
                            </div>
                        </div>
                        <div class="doc-footer">
                            <button onclick="window.print()" class="btn btn-primary">🖨️ Imprimer</button>
                            <button onclick="document.getElementById('modal').closest('.modal-overlay').style.display='none'" class="btn">Fermer</button>
                        </div>
                    </div>
                    `;
        this.showModal(content);
    }

    showEditInvoiceModal(invoiceId) {
        const invoice = this.data.recentInvoices.find(inv => inv.id === invoiceId);
        if (!invoice) return;

        if (invoice.paymentStatus === 'paid' || invoice.status === 'Payée') {
            this.showToast('Impossible de modifier une facture payée', 'warning');
            return;
        }

        // Pre-fill items
        const itemsHtml = invoice.items ? invoice.items.map((item, index) => `
            <div class="invoice-item" id="item-${index}">
                <div class="grid grid-4" style="gap: 0.5rem; margin-bottom: 0.5rem;">
                    <select class="form-control item-select" onchange="app.updateItemPrice(this, ${index})">
                        <option value="">Sélectionner produit</option>
                        ${this.data.products.map(p => `<option value="${p.id}" ${p.id === item.productId ? 'selected' : ''} data-price="${p.price}">${p.name}</option>`).join('')}
                    </select>
                    <input type="number" class="form-control item-qty" value="${item.quantity}" min="1" onchange="app.calculateEditTotal()" placeholder="Qté">
                    <input type="number" class="form-control item-price" value="${item.unitPrice}" readonly placeholder="Prix">
                    <button type="button" class="btn btn-danger" onclick="this.closest('.invoice-item').remove(); app.calculateEditTotal()">🗑️</button>
                </div>
            </div>
        `).join('') : '';

        const modalHtml = `
            <div class="login-container" style="max-width: 800px; margin: 50px auto; padding: 2rem; background: var(--bg-base); border-radius: 20px; box-shadow: 8px 8px 16px var(--shadow-dark);">
                <h2 style="text-align: center; margin-bottom: 1.5rem; color: var(--accent-primary);">Modifier Facture ${invoice.invoiceNumber || invoice.id}</h2>
                
                <form id="editInvoiceForm">
                    <div class="form-group" style="margin-bottom: 1rem;">
                        <label style="display: block; margin-bottom: 0.5rem;">Client</label>
                        <select id="editCustomer" class="form-control" style="width: 100%; padding: 0.8rem; border-radius: 10px; border: none; background: var(--bg-base); box-shadow: 3px 3px 6px var(--shadow-dark), -3px -3px 6px var(--shadow-light);">
                            ${this.data.customers.map(c => `<option value="${c.id}" ${c.id === invoice.customerId ? 'selected' : ''}>${c.fullName}</option>`).join('')}
                        </select>
                    </div>

                    <div id="editItemsContainer" style="margin-bottom: 1.5rem; max-height: 300px; overflow-y: auto; padding: 1rem; background: var(--bg-inset); border-radius: 10px;">
                        ${itemsHtml}
                    </div>

                    <button type="button" class="btn btn-secondary" onclick="app.addEditItem()" style="width: 100%; margin-bottom: 1.5rem;">➕ Ajouter un produit</button>

                    <div style="text-align: right; margin-bottom: 1.5rem;">
                        <h3>Total: <span id="editTotal">${this.formatCurrency(invoice.totalAmount || 0)}</span></h3>
                    </div>

                    <div style="display: flex; gap: 1rem;">
                        <button type="button" onclick="document.getElementById('modal').closest('.modal-overlay').style.display='none'" class="btn" style="flex: 1;">Annuler</button>
                        <button type="submit" class="btn btn-primary" style="flex: 1;">Enregistrer Modifications</button>
                    </div>
                </form>
            </div>
        `;
        this.showModal(modalHtml);

        // Attach event listener
        document.getElementById('editInvoiceForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.submitEditInvoice(invoiceId);
        });
    }

    addEditItem() {
        const container = document.getElementById('editItemsContainer');
        const index = container.children.length;
        const itemHtml = `
            <div class="invoice-item" id="item-${index}">
                <div class="grid grid-4" style="gap: 0.5rem; margin-bottom: 0.5rem;">
                    <select class="form-control item-select" onchange="app.updateItemPrice(this, ${index})">
                        <option value="">Sélectionner produit</option>
                        ${this.data.products.map(p => `<option value="${p.id}" data-price="${p.price}">${p.name}</option>`).join('')}
                    </select>
                    <input type="number" class="form-control item-qty" value="1" min="1" onchange="app.calculateEditTotal()" placeholder="Qté">
                    <input type="number" class="form-control item-price" value="0" readonly placeholder="Prix">
                    <button type="button" class="btn btn-danger" onclick="this.closest('.invoice-item').remove(); app.calculateEditTotal()">🗑️</button>
                </div>
            </div>
        `;
        container.insertAdjacentHTML('beforeend', itemHtml);
    }

    updateItemPrice(select, index) {
        const price = select.options[select.selectedIndex].dataset.price || 0;
        select.closest('.invoice-item').querySelector('.item-price').value = price;
        this.calculateEditTotal();
    }

    calculateEditTotal() {
        let total = 0;
        document.querySelectorAll('.invoice-item').forEach(item => {
            const qty = Number(item.querySelector('.item-qty').value) || 0;
            const price = Number(item.querySelector('.item-price').value) || 0;
            total += qty * price;
        });
        const tva = total * 0.19;
        document.getElementById('editTotal').textContent = this.formatCurrency(total + tva);
        return { total, tva };
    }

    async submitEditInvoice(invoiceId) {
        try {
            const customerId = document.getElementById('editCustomer').value;
            const items = [];

            document.querySelectorAll('.invoice-item').forEach(row => {
                const select = row.querySelector('.item-select');
                if (select.value) {
                    items.push({
                        productId: select.value,
                        productName: select.options[select.selectedIndex].text,
                        quantity: Number(row.querySelector('.item-qty').value),
                        unitPrice: Number(row.querySelector('.item-price').value)
                    });
                }
            });

            if (items.length === 0) {
                this.showToast('Veuillez ajouter au moins un produit', 'warning');
                return;
            }

            await api.updateInvoice(invoiceId, { customerId, items });
            this.showToast('Facture modifiée avec succès', 'success');
            document.getElementById('modal').closest('.modal-overlay').style.display = 'none';
            await this.loadInitialData();
            this.loadPage('sales');
        } catch (error) {
            this.showToast('Erreur: ' + error.message, 'danger');
        }
    }
    // Generate Facture Proforma (Pro Forma Invoice)
    generateFactureProforma(invoiceId) {
        const invoice = this.data.recentInvoices.find(inv => inv.id === invoiceId);
        if (!invoice) return;

        const today = new Date().toLocaleDateString('fr-DZ');
        const validity = new Date();
        validity.setDate(validity.getDate() + 30);

        const content = `
            <div class="document-preview">
                <div class="doc-header">
                    <h1>📄 FACTURE PROFORMA</h1>
                    <p>N° ${invoiceId} | Date: ${today}</p>
                    <p>Valable jusqu'au: ${validity.toLocaleDateString('fr-DZ')}</p>
                </div>
                <div class="doc-body">
                    <div style="margin-bottom: 2rem;">
                        <h3>Client:</h3>
                        <p><strong>${invoice.client || invoice.customer?.fullName || 'Client'}</strong></p>
                    </div>
                    <table class="table">
                        <thead>
                            <tr>
                                <th>Désignation</th>
                                <th>Quantité</th>
                                <th>P.U. HT</th>
                                <th>Montant HT</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${invoice.items ? invoice.items.map(item => `
                                <tr>
                                    <td>${item.productName || 'Produit'}</td>
                                    <td>${item.quantity}</td>
                                    <td>${this.formatCurrency(item.unitPrice)}</td>
                                    <td>${this.formatCurrency(item.quantity * item.unitPrice)}</td>
                                </tr>
                            `).join('') : `
                                <tr>
                                    <td>${this.data.products[0]?.name || 'Service / Produit'}</td>
                                    <td>1</td>
                                    <td>${this.formatCurrency(invoice.amount || invoice.totalAmount || 0)}</td>
                                    <td>${this.formatCurrency(invoice.amount || invoice.totalAmount || 0)}</td>
                                </tr>
                            `}
                        </tbody>
                    </table>
                    <div style="margin-top: 2rem; text-align: right;">
                        <p><strong>Total TTC: ${this.formatCurrency(invoice.total || invoice.totalAmount || 0)}</strong></p>
                    </div>
                </div>
                <div class="doc-footer">
                    <button onclick="window.print()" class="btn btn-primary">🖨️ Imprimer</button>
                    <button onclick="app.shareViaWhatsApp('Proforma', '${invoiceId}')" class="btn" style="color: #25D366;">📱 WhatsApp</button>
                    <button onclick="document.getElementById('modal').closest('.modal-overlay').style.display='none'" class="btn">Fermer</button>
                </div>
            </div>
        `;
        this.showModal(content);
    }

    showModal(content) {
        const modal = document.getElementById('modal');
        const overlay = document.getElementById('modalOverlay');
        modal.innerHTML = content;
        overlay.style.display = 'flex';
    }

    renderComingSoon(title) {
        return `
                    <div style="text-align: center; padding: 4rem;">
                        <h1 style="margin-bottom: 1rem;">${title}</h1>
                        <p class="text-muted">Module en cours de développement...</p>
                    </div>
                    `;
    }

    formatCurrency(amount) {
        return new Intl.NumberFormat('fr-DZ', { style: 'currency', currency: 'DZD' }).format(amount).replace('DZD', 'DA');
    }

    getStatusBadge(status) {
        switch (status) {
            case 'Payée': return 'badge-success';
            case 'En attente': return 'badge-warning';
            case 'En retard': return 'badge-danger';
            default: return 'badge-secondary';
        }
    }

    getTierColor(tier) {
        switch (tier) {
            case 'Platinum': return 'linear-gradient(135deg, #a4b0be 0%, #747d8c 100%)';
            case 'Gold': return 'linear-gradient(135deg, #f1c40f 0%, #f39c12 100%)';
            case 'Silver': return 'linear-gradient(135deg, #bdc3c7 0%, #95a5a6 100%)';
            default: return 'linear-gradient(135deg, #cd6133 0%, #b33939 100%)'; // Bronze
        }
    }

    initMockData() {
        const mockData = {
            customers: [
                { id: 1, fullName: 'SARL Import Export Algérie', phone: '0550123456', wilaya: 'Alger', tier: 'Gold', points: 1250, totalSpent: 500000, nif: '000111222333444' },
                { id: 2, fullName: 'Boutique El Baraka', phone: '0661987654', wilaya: 'Oran', tier: 'Silver', points: 450, totalSpent: 150000, nif: '000555666777888' },
                { id: 3, fullName: 'Pharmacie Centrale', phone: '0770112233', wilaya: 'Constantine', tier: 'Platinum', points: 3400, totalSpent: 1200000, nif: '000999000111222' },
                { id: 4, fullName: 'Superette El Amel', phone: '0555443322', wilaya: 'Setif', tier: 'Bronze', points: 120, totalSpent: 50000, nif: '000333444555666' }
            ],
            products: [],
            invoices: []
        };

        mockData.stats = {
            totalRevenue: 0,
            pendingDebt: 0,
            totalInvoices: 0,
            productsCount: 0
        };

        return mockData;
    }

    initTranslations() {
        return {
            fr: {
                'nav.dashboard': 'Tableau de Bord',
                'nav.inventory': 'Inventaire',
                'nav.sales': 'Ventes',
                'nav.customers': 'Clients',
                'nav.debt': 'Créances',
                'nav.reports': 'Rapports',
                'nav.pos': 'POS Mobile',
                'dashboard.title': 'Tableau de Bord',
                'common.save': 'Enregistrer',
                'common.cancel': 'Annuler',
                'common.delete': 'Supprimer',
                'common.edit': 'Modifier',
                'common.actions': 'Actions'
            },
            ar: {
                'nav.dashboard': 'لوحة القيادة',
                'nav.inventory': 'المخزون',
                'nav.sales': 'المبيعات',
                'nav.customers': 'الزبائن',
                'nav.debt': 'الديون',
                'nav.reports': 'التقارير',
                'nav.pos': 'نقطة البيع',
                'dashboard.title': 'لوحة القيادة',
                'common.save': 'حفظ',
                'common.cancel': 'إلغاء',
                'common.delete': 'حذف',
                'common.edit': 'تعديل',
                'common.actions': 'إجراءات'
            },
            en: {
                'nav.dashboard': 'Dashboard',
                'nav.inventory': 'Inventory',
                'nav.sales': 'Sales',
                'nav.customers': 'Customers',
                'nav.debt': 'Debt',
                'nav.reports': 'Reports',
                'nav.pos': 'POS Mobile',
                'dashboard.title': 'Dashboard',
                'common.save': 'Save',
                'common.cancel': 'Cancel',
                'common.delete': 'Delete',
                'common.edit': 'Edit',
                'common.actions': 'Actions'
            }
        };
    }
}

// Initialize the application
window.app = new Logisoft360App();
