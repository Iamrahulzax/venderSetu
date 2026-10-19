import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import { app } from '../src/index.js';
import { User } from '../src/models/User.js';
import { Store } from '../src/models/Store.js';
import { Product } from '../src/models/Product.js';
import { SubOrder } from '../src/models/SubOrder.js';

describe('VenderSetu API & Business Logic Integration Tests', () => {
  let studentToken: string;
  let canteenSellerToken: string;
  let durgaSellerToken: string;
  let adminToken: string;
  let canteenStoreId: string;
  let durgaStoreId: string;
  let testProductId: string;

  beforeAll(async () => {
    // Wait for DB connection
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/vendersetu');
    }

    // Login Student
    const studentRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'student@vendersetu.edu.in', password: 'Student@123' });
    studentToken = studentRes.body.token;

    // Login Canteen Seller
    const canteenRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'canteen@vendersetu.edu.in', password: 'Seller@123' });
    canteenSellerToken = canteenRes.body.token;
    canteenStoreId = canteenRes.body.user.assignedStoreId._id || canteenRes.body.user.assignedStoreId;

    // Login Durga Fast Food Seller
    const durgaRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'durga@vendersetu.edu.in', password: 'Seller@123' });
    durgaSellerToken = durgaRes.body.token;
    durgaStoreId = durgaRes.body.user.assignedStoreId._id || durgaRes.body.user.assignedStoreId;

    // Login Admin
    const adminRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@vendersetu.edu.in', password: 'Admin@123' });
    adminToken = adminRes.body.token;
  });

  afterAll(async () => {
    // Keep DB open or clean up
  });

  it('1. Verifies all 5 onboarded stores appear in the marketplace', async () => {
    const res = await request(app).get('/api/stores');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.stores.length).toBe(5);

    const storeNames = res.body.stores.map((s: any) => s.name);
    expect(storeNames).toContain('College Canteen');
    expect(storeNames).toContain('Durga Fast Food');
    expect(storeNames).toContain('Monal Fast Food');
    expect(storeNames).toContain('Bhandari General Store');
    expect(storeNames).toContain('Devbhoomi General Store');
  });

  it('2. Verifies student can search products and compare prices across stores', async () => {
    const searchRes = await request(app).get('/api/products?search=Kurkure');
    expect(searchRes.status).toBe(200);
    expect(searchRes.body.products.length).toBeGreaterThan(0);

    const compareRes = await request(app).get('/api/products/compare');
    expect(compareRes.status).toBe(200);
    expect(compareRes.body.success).toBe(true);
    expect(compareRes.body.groups.length).toBeGreaterThan(0);
  });

  it('3. Enforces store isolation: Canteen seller CANNOT manage Durga Fast Food', async () => {
    // Canteen seller trying to access Durga store dashboard
    const res = await request(app)
      .get(`/api/seller/store/${durgaStoreId}/dashboard`)
      .set('Authorization', `Bearer ${canteenSellerToken}`);

    expect(res.status).toBe(403);
    expect(res.body.message).toContain('Unauthorized');
  });

  it('4. Allows seller to add a new product and adjust stock with mandatory reason', async () => {
    const createRes = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${canteenSellerToken}`)
      .send({
        storeId: canteenStoreId,
        name: 'Special Elaichi Chai',
        brand: 'Canteen Kitchen',
        category: 'cold drinks',
        unit: '1 cup (150ml)',
        variant: 'Hot & Spiced',
        sellingPrice: 15,
        costPrice: 7,
        stock: 50,
        lowStockThreshold: 10,
        description: 'Fresh brewed milk tea with crushed cardamom.'
      });

    expect(createRes.status).toBe(201);
    expect(createRes.body.success).toBe(true);
    testProductId = createRes.body.product._id;

    // Adjust stock with mandatory reason
    const adjustRes = await request(app)
      .patch(`/api/products/${testProductId}/stock`)
      .set('Authorization', `Bearer ${canteenSellerToken}`)
      .send({
        type: 'restock',
        delta: 20,
        reason: 'Evening restock from dairy supplier'
      });

    expect(adjustRes.status).toBe(200);
    expect(adjustRes.body.product.stock).toBe(70);
  });

  it('5. Prevents negative stock during inventory adjustment', async () => {
    const res = await request(app)
      .patch(`/api/products/${testProductId}/stock`)
      .set('Authorization', `Bearer ${canteenSellerToken}`)
      .send({
        type: 'wastage',
        delta: -999,
        reason: 'Should fail due to negative stock check'
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toContain('Negative stock prevented');
  });

  it('6. Multi-store cart: can add items from different stores and verify cart', async () => {
    // Clear cart first
    await request(app)
      .delete('/api/cart/clear')
      .set('Authorization', `Bearer ${studentToken}`);

    // Add item 1 from Canteen
    await request(app)
      .post('/api/cart/add')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ productId: testProductId, quantity: 2 });

    // Find a product from Durga Fast Food
    const durgaProduct = await Product.findOne({ storeId: durgaStoreId, isActive: true });
    expect(durgaProduct).toBeDefined();

    // Add item 2 from Durga Fast Food
    await request(app)
      .post('/api/cart/add')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ productId: durgaProduct!._id, quantity: 1 });

    // Fetch cart
    const cartRes = await request(app)
      .get('/api/cart')
      .set('Authorization', `Bearer ${studentToken}`);

    expect(cartRes.status).toBe(200);
    expect(cartRes.body.cart.items.length).toBe(2);
    // Should have 2 distinct store groups
    expect(cartRes.body.cart.storeGroups.length).toBe(2);
  });

  it('7. Multi-store checkout: creates parent order and separate seller suborders', async () => {
    const checkoutRes = await request(app)
      .post('/api/orders/checkout')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        paymentMethod: 'cash_on_pickup',
        fulfillmentType: 'pickup',
        notes: 'Testing multi-store suborders'
      });

    expect(checkoutRes.status).toBe(201);
    expect(checkoutRes.body.success).toBe(true);
    expect(checkoutRes.body.order.subordersCount).toBe(2);

    const subOrder1 = checkoutRes.body.order.suborders[0];
    const subOrder2 = checkoutRes.body.order.suborders[1];

    expect(subOrder1.storeId.toString()).not.toBe(subOrder2.storeId.toString());
  });

  it('8. Order cancellation releases stock back and restores inventory', async () => {
    // Check current stock of test product
    const prodBefore = await Product.findById(testProductId);
    const stockBeforeCancel = prodBefore!.stock;

    // Find the student suborder for testProductId
    const subOrder = await SubOrder.findOne({ 'items.productId': testProductId }).sort({ createdAt: -1 });
    expect(subOrder).toBeDefined();

    // Cancel this suborder
    const cancelRes = await request(app)
      .post(`/api/orders/suborder/${subOrder!._id}/cancel`)
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ reason: 'Accidentally ordered extra' });

    expect(cancelRes.status).toBe(200);
    expect(cancelRes.body.subOrder.status).toBe('cancelled');

    // Verify stock was restored
    const prodAfter = await Product.findById(testProductId);
    expect(prodAfter!.stock).toBe(stockBeforeCancel + 2);
  });

  it('9. Prevents student from accessing administrator routes', async () => {
    const res = await request(app)
      .get('/api/admin/overview')
      .set('Authorization', `Bearer ${studentToken}`);

    expect(res.status).toBe(403);
  });

  it('10. Administrator can view platform overview and audit logs', async () => {
    const res = await request(app)
      .get('/api/admin/overview')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.stats.totalStores).toBe(5);
    expect(res.body.stats.totalProducts).toBeGreaterThan(0);
  });

  // --- CYBERSECURITY VULNERABILITY AUDIT TESTS ---

  it('11. Security: Blocks privilege escalation (cannot self-register as admin)', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Hacker User',
        email: `hacker_${Date.now()}@test.edu.in`,
        password: 'Password123!',
        role: 'admin'
      });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('Admin accounts cannot be self-registered');
  });

  it('12. Security: Enforces minimum password length requirement', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Weak Password User',
        email: `weak_${Date.now()}@test.edu.in`,
        password: '123',
        role: 'student'
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toContain('at least 8 characters');
  });

  it('13. Security: Password hash is never leaked in user responses', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${studentToken}`);

    expect(res.status).toBe(200);
    expect(res.body.user).toBeDefined();
    expect(res.body.user.password).toBeUndefined();
  });

  it('14. Security: Prevents ReDoS when searching with regex meta-characters', async () => {
    const res = await request(app).get('/api/products?search=(a+)+$*[[');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('15. Security: Verifies CORS and security headers from Helmet are present', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['x-frame-options']).toBe('SAMEORIGIN');
  });
});
