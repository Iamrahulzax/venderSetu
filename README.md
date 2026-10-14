# VenderSetu (वेंडरसेतु)
### *Your Campus, Your Stores, Connected.*

**VenderSetu** is a production-ready, real-time college marketplace web application designed for campus ecosystems. It bridges college students directly with on-campus canteens, fast-food spots, and general stores—featuring multi-store shopping carts, atomic stock updates, real-time inventory synchronization via Socket.IO, independent seller dashboards, and an administrator console.

---

## 🏬 1. Onboarded Campus Stores

VenderSetu launches with five independent campus stores:

| Store Name | Category Focus | Default Fulfillment | Prep Time |
| :--- | :--- | :--- | :--- |
| **College Canteen** | Fresh Chai, Samosas, Cooked Maggi, Lays, Kurkure | Pickup & Delivery (₹10) | 10–15 mins |
| **Durga Fast Food** | Crispy Veg Burgers, Kathi Rolls, Chowmein | Pickup & Delivery (₹15) | 15–20 mins |
| **Monal Fast Food** | Steamed Veg Momos, Cheese Grilled Sandwiches | Counter Pickup | 12–18 mins |
| **Bhandari General Store** | Classmate Notebooks, Pens, Cadbury Chocolates, Biscuits | Pickup & Delivery (₹10) | 5–10 mins |
| **Devbhoomi General Store** | Hostel Essentials, Soaps, Amul Dairy, Toothpaste | Pickup & Delivery (₹10) | 10–15 mins |

> **Store Isolation Guarantee**: Every store has an isolated seller account and private dashboard. Sellers can only view and manage their assigned store's catalog, stock, and suborders.

---

## 🚀 2. System Architecture & Tech Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS, Lucide React, Socket.IO Client, React Router DOM.
- **Backend**: Node.js, Express, TypeScript, Mongoose, Socket.IO, JWT Auth, Bcrypt.js.
- **Database**: MongoDB (Local or MongoDB Atlas) with atomic decrement operations (`$inc`) and optimistic stock locking.
- **Real-Time Engine**: WebSocket via Socket.IO for instant live stock updates and order alerts.
- **Payments**: Razorpay test mode / sandbox simulation with signature verification, plus Cash on Pickup and Pay at Store.
- **Testing**: Vitest + Supertest integration test suite with automated test coverage.

---

## ⚡ 3. Key Capabilities

### 🎓 Student Marketplace
- **Single Campus Portal**: Browse all 5 stores simultaneously or visit store-specific pages.
- **Real-Time Stock Reflection**: Inventory changes made by merchants reflect on the student marketplace immediately without page refreshes.
- **Cross-Store Price Comparison**: Compare identical items (e.g., Kurkure, Maggi, Coca-Cola, Classmate notebooks) across shops side-by-side to find the lowest price.
- **Multi-Store Shopping Cart**: Add items from multiple shops in one cart; persisted in database for authenticated users.
- **Parent Checkout & Suborders**: A single checkout creates 1 master order with separate, independent suborders routed to each respective seller.
- **Order Tracking & Digital Receipts**: Live preparation status tracking (`Pending` → `Accepted` → `Preparing` → `Ready for Pickup / Out for Delivery` → `Completed`).
- **Stock Release on Cancellation**: Cancellations automatically restore items to store inventory and generate audit entries.
- **Dispute Resolution**: Direct complaint filing to the campus administrator desk.

### 🏪 Seller Dashboard (Store-Specific)
- **Isolated Multi-Tenancy**: Sellers only see and edit data for their assigned store.
- **Live Order Queue**: Real-time sound notification and alert when a new order arrives.
- **Suborder Management**: One-click Accept or Reject (with mandatory rejection reason that automatically releases reserved stock).
- **Preparation Tracking**: Progression from Accepted to Preparing, Ready for Counter Pickup, or Out for Hostel Delivery.
- **Inventory Control**:
  - Add, edit, and deactivate products.
  - Track selling price and private supplier cost price.
  - Supplier Restock, Physical Count Adjustment, or Wastage/Expired records with mandatory reason.
  - Low-stock and out-of-stock threshold warnings.
  - Comprehensive inventory valuation (total units, recorded cost value, retail value, estimated gross profit).
  - One-click CSV inventory export.
- **Store Configuration**: Toggle shop Open/Closed, adjust opening hours, configure delivery fees and minimum order amounts.

### 🛡️ Administrator Console
- **Campus-Wide Overview**: Total student buyers, registered merchants, active stores, and gross platform volume.
- **Seller Management**: Approve new merchant applications, suspend fraudulent sellers, re-assign store ownership.
- **Stock Discrepancy & Alert Monitor**: Campus-wide radar of all low-stock and out-of-stock products across all stores.
- **Complaints Desk**: Review student complaints, set investigation status, attach admin resolution notes.
- **Audit Logs**: Immutable log of sensitive operational actions.
- **Platform Sales Report**: Downloadable CSV report of all campus transactions.

---

## 🔑 4. Pre-Seeded Demo Accounts

VenderSetu includes a **1-Click Demo Persona Switcher** directly in the top navigation bar. You can also log in manually using these credentials:

| Persona | Role | Email | Password |
| :--- | :--- | :--- | :--- |
| **Platform Administrator** | `admin` | `admin@vendersetu.edu.in` | `Admin@123` |
| **Student (Rahul Sharma)** | `student` | `student@vendersetu.edu.in` | `Student@123` |
| **College Canteen Seller** | `seller` | `canteen@vendersetu.edu.in` | `Seller@123` |
| **Durga Fast Food Seller** | `seller` | `durga@vendersetu.edu.in` | `Seller@123` |
| **Monal Fast Food Seller** | `seller` | `monal@vendersetu.edu.in` | `Seller@123` |
| **Bhandari General Store** | `seller` | `bhandari@vendersetu.edu.in` | `Seller@123` |
| **Devbhoomi General Store** | `seller` | `devbhoomi@vendersetu.edu.in` | `Seller@123` |

---

## 🛠️ 5. Installation & Local Setup

### Prerequisites
- [Node.js](https://nodejs.org/) v18+ (tested on Node v22.18.0)
- [MongoDB](https://www.mongodb.com/) running locally on port 27017 or a MongoDB Atlas URI

### Step 1: Install Dependencies
```bash
# In the root project directory:
npm install

# In the server directory:
cd server
npm install

# In the client directory:
cd ../client
npm install
cd ..
```

### Step 2: Seed the Database
Populates the 5 official campus stores, demo users, and demo products across snacks, beverages, fast food, stationery, and groceries:
```bash
npm run seed
# Or directly from server directory:
cd server && npm run seed
```

### Step 3: Run the Application
Start both the backend API server (`http://localhost:5000`) and the Vite frontend (`http://localhost:5173`):
```bash
npm run dev
```

Alternatively, run them in separate terminals:
- **Server**: `cd server && npm run dev`
- **Client**: `cd client && npm run dev`

Open `http://localhost:5173` in your browser.

---

## 🧪 6. Running Automated Tests

Run the integration test suite covering store isolation, multi-store checkout, atomic inventory decrements, and cancellation stock restorations:
```bash
cd server
npm test
```

---

## 💳 7. Payment Integration Setup

VenderSetu is pre-configured with **Razorpay Sandbox / Test Mode**.

To use real Razorpay credentials:
1. Create a free account at [Razorpay Dashboard](https://dashboard.razorpay.com/).
2. Navigate to **Settings → API Keys** and generate Test Key ID and Key Secret.
3. Update `server/.env`:
   ```env
   RAZORPAY_KEY_ID=rzp_test_your_real_key_id
   RAZORPAY_KEY_SECRET=your_real_key_secret
   ```
4. Restart the server.

---

## 📦 8. Production Build

To compile both client and server for production deployment:
```bash
# Build frontend
cd client && npm run build

# Build backend
cd ../server && npm run build
```

---

## 📄 9. License & Campus Use
Built for collegiate and university commercial infrastructure.
*VenderSetu — Your Campus, Your Stores, Connected.*
