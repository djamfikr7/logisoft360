# Logisoft360 - ERP for Algeria 🇩🇿

A modern, neomorphic-styled Enterprise Resource Planning (ERP) application designed specifically for Algerian businesses, featuring TVA compliance, Wilaya-based delivery tracking, and multi-language support (French, Arabic, English).

## Features

### Core Modules
- 📊 **Dashboard** - Real-time business insights
- 📦 **Inventory** - Product management with barcode support
- 💰 **Sales & Invoicing** - DGI-compliant invoicing with 19% TVA
- 👥 **Customer Management** - CRM with loyalty tiers
- 🚚 **Delivery Tracking** - Integration with Algerian carriers (Yalidine, ZR Express)
- 📱 **POS Mobile** - Barcode scanner for quick sales

### Technical Highlights
- **Neomorphic UI** - Modern neumorphism design system
- **Role-Based Access Control** - Admin, Manager, Cashier, Viewer roles
- **Multi-language** - French, Arabic, English
- **DGI Compliance** - TVA reports for tax authorities
- **Offline-ready** - Service Worker support (planned)

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Vanilla JS, CSS (Neomorphic) |
| Backend | Node.js, Express.js |
| Database | PostgreSQL, Prisma ORM |
| Auth | JWT Tokens |

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL 14+

### Installation

1. Clone the repository:
```bash
git clone https://github.com/YOUR_USERNAME/logisoft360.git
cd logisoft360
```

2. Install backend dependencies:
```bash
cd backend
npm install
```

3. Configure environment:
```bash
cp .env.example .env
# Edit .env with your database credentials
```

4. Initialize database:
```bash
npx prisma generate
npx prisma db push
npx prisma db seed
```

5. Start the server:
```bash
npm run dev
```

6. Open `index.html` in your browser or serve the frontend:
```bash
# From project root
npx serve .
```

## Environment Variables

Create a `.env` file in the `backend/` directory:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/logisoft360"
JWT_SECRET="your-super-secret-key"
NODE_ENV="development"
PORT=3000
```

## API Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/v1/auth/register` | Register user | Public |
| POST | `/api/v1/auth/login` | Login | Public |
| GET | `/api/v1/products` | List products | Protected |
| POST | `/api/v1/products` | Create product | Admin |
| GET | `/api/v1/invoices` | List invoices | Protected |
| POST | `/api/v1/invoices` | Create invoice | Protected |
| PUT | `/api/v1/invoices/:id` | Update invoice | Protected |

## Project Structure

```
logisoft360/
├── index.html          # Main HTML entry
├── app.js              # Frontend application logic
├── api.js              # API client
├── styles.css          # Neomorphic styling
├── backend/
│   ├── src/
│   │   ├── controllers/    # Route handlers
│   │   ├── middleware/     # Auth, error handling
│   │   ├── routes/         # API routes
│   │   └── utils/          # Prisma client
│   └── prisma/
│       ├── schema.prisma   # Database schema
│       └── seed.js         # Seed data
└── README.md
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Acknowledgments

- Designed for Algerian businesses with DGI compliance
- Neomorphic UI inspired by modern design trends
- Built with ❤️ in Algeria
