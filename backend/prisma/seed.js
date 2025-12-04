const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

const wilayas = [
    { id: 1, code: '01', nameFr: 'Adrar', nameAr: 'أدرار' },
    { id: 2, code: '02', nameFr: 'Chlef', nameAr: 'الشلف' },
    { id: 16, code: '16', nameFr: 'Alger', nameAr: 'الجزائر' },
    { id: 31, code: '31', nameFr: 'Oran', nameAr: 'وهران' },
    { id: 25, code: '25', nameFr: 'Constantine', nameAr: 'قسنطينة' },
    { id: 19, code: '19', nameFr: 'Sétif', nameAr: 'سطيف' },
];

const products = [
    {
        sku: 'IPHONE15PM',
        barcode: '6191234567890',
        name: 'iPhone 15 Pro Max',
        description: 'Apple iPhone 15 Pro Max 256GB',
        costPrice: 250000.00,
        salePrice: 285000.00,
        stockQuantity: 12,
        minStockLevel: 3,
        tvaRate: 19.0
    },
    {
        sku: 'SAMS24U',
        barcode: '6191234567891',
        name: 'Samsung Galaxy S24 Ultra',
        description: 'Samsung Galaxy S24 Ultra 512GB',
        costPrice: 230000.00,
        salePrice: 265000.00,
        stockQuantity: 8,
        minStockLevel: 2,
        tvaRate: 19.0
    },
    {
        sku: 'MACBOOKM3',
        barcode: '6191234567892',
        name: 'MacBook Pro M3',
        description: 'Apple MacBook Pro 14" M3 Pro',
        costPrice: 400000.00,
        salePrice: 450000.00,
        stockQuantity: 5,
        minStockLevel: 2,
        tvaRate: 19.0
    },
    {
        sku: 'IPADPRO12',
        barcode: '6191234567893',
        name: 'iPad Pro 12.9"',
        description: 'Apple iPad Pro 12.9" M2 256GB',
        costPrice: 150000.00,
        salePrice: 180000.00,
        stockQuantity: 10,
        minStockLevel: 3,
        tvaRate: 19.0
    },
    {
        sku: 'AIRPODSP2',
        barcode: '6191234567894',
        name: 'AirPods Pro 2',
        description: 'Apple AirPods Pro 2ème génération',
        costPrice: 35000.00,
        salePrice: 45000.00,
        stockQuantity: 25,
        minStockLevel: 5,
        tvaRate: 19.0
    },
    {
        sku: 'SONYWH1000',
        barcode: '6191234567895',
        name: 'Casque Sony WH-1000XM5',
        description: 'Sony Casque Bluetooth à réduction de bruit',
        costPrice: 42000.00,
        salePrice: 55000.00,
        stockQuantity: 15,
        minStockLevel: 3,
        tvaRate: 19.0
    },
    {
        sku: 'DELLXPS15',
        barcode: '6191234567896',
        name: 'Dell XPS 15',
        description: 'Dell XPS 15 Intel Core i7 32GB RAM',
        costPrice: 320000.00,
        salePrice: 380000.00,
        stockQuantity: 4,
        minStockLevel: 2,
        tvaRate: 19.0
    },
    {
        sku: 'LG27UK4K',
        barcode: '6191234567897',
        name: 'Écran LG 27" 4K',
        description: 'LG 27UK850-W 27" UHD IPS',
        costPrice: 65000.00,
        salePrice: 85000.00,
        stockQuantity: 7,
        minStockLevel: 2,
        tvaRate: 19.0
    },
    {
        sku: 'LOGIMXKEYS',
        barcode: '6191234567898',
        name: 'Clavier Logitech MX Keys',
        description: 'Logitech MX Keys Advanced Wireless',
        costPrice: 18000.00,
        salePrice: 25000.00,
        stockQuantity: 20,
        minStockLevel: 5,
        tvaRate: 19.0
    },
    {
        sku: 'APPLEMOUSE',
        barcode: '6191234567899',
        name: 'Souris Apple Magic Mouse',
        description: 'Apple Magic Mouse Surface Multi-Touch',
        costPrice: 12000.00,
        salePrice: 18000.00,
        stockQuantity: 30,
        minStockLevel: 5,
        tvaRate: 19.0
    }
];

const customers = [
    {
        customerType: 'company',
        fullName: 'Mohamed Benali',
        companyName: 'SARL Import Export Algérie',
        phone: '0550123456',
        addressLine1: '123 Rue Didouche Mourad',
        wilaya: 'Alger',
        nif: '000111222333444',
        nis: '123456789012345',
        rc: 'RC-16B-2020-12345',
        loyaltyTier: 'Gold',
        loyaltyPoints: 1250,
        totalSpent: 500000.00
    },
    {
        customerType: 'company',
        fullName: 'Karim Hadj',
        companyName: 'Boutique El Baraka',
        phone: '0661987654',
        addressLine1: '45 Boulevard de la Révolution',
        wilaya: 'Oran',
        nif: '000555666777888',
        loyaltyTier: 'Silver',
        loyaltyPoints: 450,
        totalSpent: 150000.00
    },
    {
        customerType: 'company',
        fullName: 'Fatima Zerhouni',
        companyName: 'Pharmacie Centrale',
        phone: '0770112233',
        addressLine1: '78 Avenue de France',
        wilaya: 'Constantine',
        nif: '000999000111222',
        nis: '987654321098765',
        loyaltyTier: 'Platinum',
        loyaltyPoints: 3400,
        totalSpent: 1200000.00
    },
    {
        customerType: 'company',
        fullName: 'Youcef Boudiaf',
        companyName: 'Superette El Amel',
        phone: '0555443322',
        addressLine1: '12 Rue des Martyrs',
        wilaya: 'Sétif',
        nif: '000333444555666',
        loyaltyTier: 'Bronze',
        loyaltyPoints: 120,
        totalSpent: 50000.00
    }
];

async function main() {
    console.log('🌱 Start seeding database...');

    // Clear existing data (in reverse order of dependencies)
    console.log('🧹 Clearing existing data...');
    try {
        await prisma.invoiceItem.deleteMany();
        await prisma.payment.deleteMany();
        await prisma.invoice.deleteMany();
        await prisma.stockMovement.deleteMany();
        await prisma.product.deleteMany();
        await prisma.category.deleteMany();
        await prisma.delivery.deleteMany();
        await prisma.customer.deleteMany();
        await prisma.userSession.deleteMany();
        await prisma.activityLog.deleteMany();
        await prisma.user.deleteMany();
        await prisma.commune.deleteMany();
        await prisma.wilaya.deleteMany();
    } catch (e) {
        console.log('Some tables might not exist yet, continuing...');
    }

    // Seed Wilayas
    console.log('📍 Seeding wilayas...');
    for (const w of wilayas) {
        await prisma.wilaya.create({ data: w });
    }
    console.log(`   ✓ Created ${wilayas.length} wilayas`);

    // Seed Admin User
    console.log('👤 Creating admin user...');
    const hashedPassword = await bcrypt.hash('admin123', 10);
    const adminUser = await prisma.user.create({
        data: {
            username: 'admin',
            email: 'admin@logisoft360.com',
            passwordHash: hashedPassword,
            fullName: 'Admin Logisoft',
            role: 'admin',
            isActive: true
        }
    });
    console.log(`   ✓ Created admin: ${adminUser.email}`);

    // Create regular user
    const userPassword = await bcrypt.hash('user123', 10);
    const regularUser = await prisma.user.create({
        data: {
            username: 'user',
            email: 'user@logisoft360.com',
            passwordHash: userPassword,
            fullName: 'Utilisateur Test',
            role: 'cashier',
            isActive: true
        }
    });
    console.log(`   ✓ Created user: ${regularUser.email}`);

    // Seed Products
    console.log('📦 Seeding products...');
    const createdProducts = [];
    for (const p of products) {
        const product = await prisma.product.create({ data: p });
        createdProducts.push(product);
    }
    console.log(`   ✓ Created ${createdProducts.length} products`);

    // Seed Customers
    console.log('👥 Seeding customers...');
    const createdCustomers = [];
    for (const c of customers) {
        const customer = await prisma.customer.create({ data: c });
        createdCustomers.push(customer);
    }
    console.log(`   ✓ Created ${createdCustomers.length} customers`);

    // Seed Invoices
    console.log('🧾 Creating sample invoices...');
    const invoiceStatuses = ['draft', 'sent', 'paid', 'cancelled'];
    const paymentStatuses = ['pending', 'partial', 'paid', 'overdue'];

    for (let i = 0; i < 8; i++) {
        const customer = createdCustomers[i % createdCustomers.length];
        const invoiceStatus = invoiceStatuses[i % invoiceStatuses.length];
        const paymentStatus = paymentStatuses[i % paymentStatuses.length];
        const daysAgo = Math.floor(Math.random() * 30);
        const invoiceDate = new Date();
        invoiceDate.setDate(invoiceDate.getDate() - daysAgo);

        // Random products for this invoice (1-3 items)
        const numItems = Math.floor(Math.random() * 3) + 1;
        const selectedProducts = [];
        for (let j = 0; j < numItems; j++) {
            const randomProduct = createdProducts[Math.floor(Math.random() * createdProducts.length)];
            if (!selectedProducts.find(p => p.id === randomProduct.id)) {
                selectedProducts.push({
                    product: randomProduct,
                    quantity: Math.floor(Math.random() * 3) + 1
                });
            }
        }

        // Calculate totals
        let subtotal = 0;
        const items = selectedProducts.map(item => {
            const lineTotal = Number(item.product.salePrice) * item.quantity;
            subtotal += lineTotal;
            return {
                productId: item.product.id,
                productName: item.product.name,
                productSku: item.product.sku,
                quantity: item.quantity,
                unitPrice: item.product.salePrice,
                tvaRate: item.product.tvaRate
            };
        });

        const tvaAmount = subtotal * 0.19;
        const total = subtotal + tvaAmount;
        const paidAmount = paymentStatus === 'paid' ? total : (paymentStatus === 'partial' ? total * 0.5 : 0);

        const invoice = await prisma.invoice.create({
            data: {
                invoiceNumber: `FAC-2025-${String(i + 1).padStart(4, '0')}`,
                customerId: customer.id,
                invoiceDate: invoiceDate,
                dueDate: new Date(invoiceDate.getTime() + 30 * 24 * 60 * 60 * 1000),
                subtotal,
                tvaAmount,
                totalAmount: total,
                paidAmount,
                status: invoiceStatus,
                paymentStatus: paymentStatus,
                notes: `Facture pour ${customer.companyName || customer.fullName}`,
                createdBy: adminUser.id,
                items: {
                    create: items
                }
            }
        });
        console.log(`   ✓ Created invoice: ${invoice.invoiceNumber} (${paymentStatus})`);
    }

    console.log('\n✅ Seeding completed successfully!');
    console.log('\n📋 Summary:');
    console.log(`   - ${wilayas.length} wilayas`);
    console.log(`   - 2 users`);
    console.log(`     • admin@logisoft360.com / admin123 (admin)`);
    console.log(`     • user@logisoft360.com / user123 (cashier)`);
    console.log(`   - ${products.length} products`);
    console.log(`   - ${customers.length} customers`);
    console.log(`   - 8 invoices`);
}

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error('❌ Seeding failed:', e);
        await prisma.$disconnect();
        process.exit(1);
    });
