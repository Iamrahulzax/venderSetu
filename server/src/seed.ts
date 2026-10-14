import mongoose from 'mongoose';
import { ENV } from './config/env.js';
import { User } from './models/User.js';
import { Store } from './models/Store.js';
import { Product } from './models/Product.js';
import { InventoryMovement } from './models/InventoryMovement.js';

const seedDatabase = async () => {
  try {
    console.log('[Seed] Connecting to MongoDB...');
    await mongoose.connect(ENV.MONGODB_URI);
    console.log('[Seed] Connected.');

    // Clear existing data for clean seed
    console.log('[Seed] Cleaning old collections...');
    await Promise.all([
      User.deleteMany({}),
      Store.deleteMany({}),
      Product.deleteMany({}),
      InventoryMovement.deleteMany({})
    ]);

    // 1. Create 5 Official Stores
    console.log('[Seed] Creating 5 Official Stores...');
    const storesData = [
      {
        name: 'College Canteen',
        slug: 'college-canteen',
        description: 'Main campus canteen offering fresh chai, samosas, Maggi, snacks, and chilled beverages.',
        location: 'Student Activity Centre (SAC), Ground Floor',
        contactPhone: '+91 98765 43210',
        isOpen: true,
        openingHours: '08:00 AM - 09:30 PM',
        offersDelivery: true,
        deliveryFee: 10,
        minimumOrder: 40,
        estimatedPrepTime: '10-15 mins',
        categoryTags: ['snacks', 'maggi', 'beverages', 'chai', 'kurkure']
      },
      {
        name: 'Durga Fast Food',
        slug: 'durga-fast-food',
        description: 'Popular campus corner famous for crispy burgers, veg/paneer rolls, momos, and chowmein.',
        location: 'North Gate Commercial Complex, Shop 3',
        contactPhone: '+91 98765 43211',
        isOpen: true,
        openingHours: '11:00 AM - 10:30 PM',
        offersDelivery: true,
        deliveryFee: 15,
        minimumOrder: 80,
        estimatedPrepTime: '15-20 mins',
        categoryTags: ['fast food', 'burgers', 'rolls', 'momos', 'noodles']
      },
      {
        name: 'Monal Fast Food',
        slug: 'monal-fast-food',
        description: 'Speciality Himalayan fast food, spicy fried rice, hot noodles, cheese sandwiches, and shakes.',
        location: 'Hostel Block 4 Plaza, Shop 1',
        contactPhone: '+91 98765 43212',
        isOpen: true,
        openingHours: '10:30 AM - 11:00 PM',
        offersDelivery: false,
        deliveryFee: 0,
        minimumOrder: 50,
        estimatedPrepTime: '12-18 mins',
        categoryTags: ['fast food', 'sandwiches', 'noodles', 'cold drinks', 'shakes']
      },
      {
        name: 'Bhandari General Store',
        slug: 'bhandari-general-store',
        description: 'Campus stationary hub and snack pantry with notebooks, pens, Kurkure, biscuits, and batteries.',
        location: 'Central Library Pathway, Shop 5',
        contactPhone: '+91 98765 43213',
        isOpen: true,
        openingHours: '09:00 AM - 09:00 PM',
        offersDelivery: true,
        deliveryFee: 10,
        minimumOrder: 50,
        estimatedPrepTime: '5-10 mins',
        categoryTags: ['stationery', 'biscuits', 'chocolates', 'chips', 'daily essentials']
      },
      {
        name: 'Devbhoomi General Store',
        slug: 'devbhoomi-general-store',
        description: 'All-in-one store for hostel daily essentials, soaps, toiletries, packaged food, and dairy.',
        location: 'Boys Hostel Road, Sector 2',
        contactPhone: '+91 98765 43214',
        isOpen: true,
        openingHours: '08:30 AM - 10:00 PM',
        offersDelivery: true,
        deliveryFee: 10,
        minimumOrder: 60,
        estimatedPrepTime: '10-15 mins',
        categoryTags: ['groceries', 'daily essentials', 'biscuits', 'cold drinks', 'stationery']
      }
    ];

    const createdStores = await Store.create(storesData);
    const storeMap = new Map(createdStores.map((s) => [s.slug, s]));

    // 2. Create Users (Admin, 5 Sellers, 1 Student)
    console.log('[Seed] Creating Users...');
    const admin = await User.create({
      name: 'Campus Administrator',
      email: 'admin@vendersetu.edu.in',
      password: 'Admin@123',
      role: 'admin',
      phone: '+91 99999 88888',
      isApproved: true,
      status: 'active'
    });

    const canteenSeller = await User.create({
      name: 'Rameshwar Dayal (Canteen)',
      email: 'canteen@vendersetu.edu.in',
      password: 'Seller@123',
      role: 'seller',
      phone: '+91 98765 43210',
      assignedStoreId: storeMap.get('college-canteen')!._id,
      isApproved: true,
      status: 'active'
    });

    const durgaSeller = await User.create({
      name: 'Durga Prasad',
      email: 'durga@vendersetu.edu.in',
      password: 'Seller@123',
      role: 'seller',
      phone: '+91 98765 43211',
      assignedStoreId: storeMap.get('durga-fast-food')!._id,
      isApproved: true,
      status: 'active'
    });

    const monalSeller = await User.create({
      name: 'Monal Negi',
      email: 'monal@vendersetu.edu.in',
      password: 'Seller@123',
      role: 'seller',
      phone: '+91 98765 43212',
      assignedStoreId: storeMap.get('monal-fast-food')!._id,
      isApproved: true,
      status: 'active'
    });

    const bhandariSeller = await User.create({
      name: 'Mahesh Bhandari',
      email: 'bhandari@vendersetu.edu.in',
      password: 'Seller@123',
      role: 'seller',
      phone: '+91 98765 43213',
      assignedStoreId: storeMap.get('bhandari-general-store')!._id,
      isApproved: true,
      status: 'active'
    });

    const devbhoomiSeller = await User.create({
      name: 'Harish Rawat (Devbhoomi)',
      email: 'devbhoomi@vendersetu.edu.in',
      password: 'Seller@123',
      role: 'seller',
      phone: '+91 98765 43214',
      assignedStoreId: storeMap.get('devbhoomi-general-store')!._id,
      isApproved: true,
      status: 'active'
    });

    const student = await User.create({
      name: 'Rahul Sharma',
      email: 'student@vendersetu.edu.in',
      password: 'Student@123',
      role: 'student',
      phone: '+91 91234 56789',
      studentId: 'CS2023-048',
      hostelRoom: 'Aryabhatta Hostel, Room B-312',
      isApproved: true,
      status: 'active'
    });

    // Update store owners
    await Store.updateOne({ slug: 'college-canteen' }, { ownerId: canteenSeller._id });
    await Store.updateOne({ slug: 'durga-fast-food' }, { ownerId: durgaSeller._id });
    await Store.updateOne({ slug: 'monal-fast-food' }, { ownerId: monalSeller._id });
    await Store.updateOne({ slug: 'bhandari-general-store' }, { ownerId: bhandariSeller._id });
    await Store.updateOne({ slug: 'devbhoomi-general-store' }, { ownerId: devbhoomiSeller._id });

    // 3. Seed Products across categories with realistic campus pricing and comparability
    console.log('[Seed] Seeding Products...');

    const productsData = [
      // === Store 1: College Canteen ===
      {
        storeSlug: 'college-canteen',
        sellerId: canteenSeller._id,
        name: 'Kurkure Masala Munch (90g)',
        brand: 'PepsiCo',
        category: 'kurkure',
        unit: '90g pack',
        variant: 'Standard',
        sellingPrice: 20,
        costPrice: 16,
        stock: 45,
        lowStockThreshold: 10,
        isComparable: true,
        comparableGroupKey: 'kurkure-masala-munch-90g',
        description: 'Classic crunchy and spicy tedha-medha corn puffs.',
        image: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?auto=format&fit=crop&w=400&q=80'
      },
      {
        storeSlug: 'college-canteen',
        sellerId: canteenSeller._id,
        name: 'Maggi 2-Minute Masala Noodles',
        brand: 'Nestle',
        category: 'maggi',
        unit: '70g pack (cooked)',
        variant: 'Freshly Prepared',
        sellingPrice: 35,
        costPrice: 20,
        stock: 30,
        lowStockThreshold: 8,
        isComparable: true,
        comparableGroupKey: 'maggi-masala-noodles',
        description: 'Hot piping Maggi cooked with butter, spices and diced veggies.',
        image: 'https://images.unsplash.com/photo-1612927601601-6638404737ce?auto=format&fit=crop&w=400&q=80'
      },
      {
        storeSlug: 'college-canteen',
        sellerId: canteenSeller._id,
        name: 'Coca-Cola (500ml Pet Bottle)',
        brand: 'Coca-Cola',
        category: 'cold drinks',
        unit: '500ml',
        variant: 'Chilled',
        sellingPrice: 40,
        costPrice: 32,
        stock: 25,
        lowStockThreshold: 6,
        isComparable: true,
        comparableGroupKey: 'coca-cola-500ml',
        description: 'Ice-cold refreshing carbonated soft drink.',
        image: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=400&q=80'
      },
      {
        storeSlug: 'college-canteen',
        sellerId: canteenSeller._id,
        name: 'Crispy Samosa with Mint Chutney',
        brand: 'In-House Canteen',
        category: 'fast food',
        unit: '2 pcs',
        variant: 'Fresh Fried',
        sellingPrice: 25,
        costPrice: 14,
        stock: 18,
        lowStockThreshold: 5,
        isComparable: false,
        description: 'Golden fried potato samosas served with tangy green chutney.',
        image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=400&q=80'
      },
      {
        storeSlug: 'college-canteen',
        sellerId: canteenSeller._id,
        name: 'Lays American Style Cream & Onion',
        brand: 'Lays',
        category: 'chips',
        unit: '50g pack',
        variant: 'Green',
        sellingPrice: 20,
        costPrice: 16.5,
        stock: 40,
        lowStockThreshold: 8,
        isComparable: true,
        comparableGroupKey: 'lays-cream-onion-50g',
        description: 'Classic savory potato chips with rich sour cream and herbs.',
        image: 'https://images.unsplash.com/photo-1527842891421-42eec6e703ea?auto=format&fit=crop&w=400&q=80'
      },

      // === Store 2: Durga Fast Food ===
      {
        storeSlug: 'durga-fast-food',
        sellerId: durgaSeller._id,
        name: 'Crispy Veg Aloo Tikki Burger',
        brand: 'Durga Kitchen',
        category: 'fast food',
        unit: '1 piece',
        variant: 'With Mayo & Herbs',
        sellingPrice: 50,
        costPrice: 28,
        stock: 25,
        lowStockThreshold: 6,
        isComparable: false,
        description: 'Toasted sesame bun with spiced aloo tikki patty and cabbage slaw.',
        image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=400&q=80'
      },
      {
        storeSlug: 'durga-fast-food',
        sellerId: durgaSeller._id,
        name: 'Paneer Kathi Roll',
        brand: 'Durga Kitchen',
        category: 'fast food',
        unit: '1 roll',
        variant: 'Grilled Paneer',
        sellingPrice: 70,
        costPrice: 42,
        stock: 15,
        lowStockThreshold: 4,
        isComparable: false,
        description: 'Flaky paratha rolled with tandoori spiced cottage cheese chunks and onions.',
        image: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?auto=format&fit=crop&w=400&q=80'
      },
      {
        storeSlug: 'durga-fast-food',
        sellerId: durgaSeller._id,
        name: 'Desi Veg Hakka Chowmein',
        brand: 'Durga Kitchen',
        category: 'noodles',
        unit: 'Full Plate',
        variant: 'Spicy',
        sellingPrice: 60,
        costPrice: 32,
        stock: 20,
        lowStockThreshold: 5,
        isComparable: false,
        description: 'Wok tossed noodles loaded with crunchy capsicum, carrots, and soy sauce.',
        image: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&w=400&q=80'
      },
      {
        storeSlug: 'durga-fast-food',
        sellerId: durgaSeller._id,
        name: 'Coca-Cola (500ml Pet Bottle)',
        brand: 'Coca-Cola',
        category: 'cold drinks',
        unit: '500ml',
        variant: 'Chilled',
        sellingPrice: 42, // Comparable check: ₹42 here vs ₹40 at Canteen!
        costPrice: 32,
        stock: 35,
        lowStockThreshold: 6,
        isComparable: true,
        comparableGroupKey: 'coca-cola-500ml',
        description: 'Chilled pet bottle of Coca-Cola.',
        image: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=400&q=80'
      },

      // === Store 3: Monal Fast Food ===
      {
        storeSlug: 'monal-fast-food',
        sellerId: monalSeller._id,
        name: 'Steamed Veg Momos (8 pcs)',
        brand: 'Monal Kitchen',
        category: 'fast food',
        unit: 'Plate (8 pcs)',
        variant: 'Steamed with Red Chutney',
        sellingPrice: 50,
        costPrice: 26,
        stock: 30,
        lowStockThreshold: 5,
        isComparable: false,
        description: 'Thin-skinned juicy vegetable dumplings with spicy garlic red dip.',
        image: 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?auto=format&fit=crop&w=400&q=80'
      },
      {
        storeSlug: 'monal-fast-food',
        sellerId: monalSeller._id,
        name: 'Cheese Corn Grilled Sandwich',
        brand: 'Monal Kitchen',
        category: 'fast food',
        unit: '1 whole sandwich',
        variant: 'Mozzarella Grilled',
        sellingPrice: 65,
        costPrice: 36,
        stock: 12,
        lowStockThreshold: 4,
        isComparable: false,
        description: 'Golden grilled jumbo bread stuffed with sweet corn and melted cheese.',
        image: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=400&q=80'
      },
      {
        storeSlug: 'monal-fast-food',
        sellerId: monalSeller._id,
        name: 'Maggi 2-Minute Masala Noodles',
        brand: 'Nestle',
        category: 'maggi',
        unit: '70g pack (cooked)',
        variant: 'Double Cheese',
        sellingPrice: 40, // ₹40 here vs ₹35 at Canteen
        costPrice: 22,
        stock: 16,
        lowStockThreshold: 5,
        isComparable: true,
        comparableGroupKey: 'maggi-masala-noodles',
        description: 'Special cheesy vegetable prepared Maggi.',
        image: 'https://images.unsplash.com/photo-1612927601601-6638404737ce?auto=format&fit=crop&w=400&q=80'
      },
      {
        storeSlug: 'monal-fast-food',
        sellerId: monalSeller._id,
        name: 'Kurkure Masala Munch (90g)',
        brand: 'PepsiCo',
        category: 'kurkure',
        unit: '90g pack',
        variant: 'Standard',
        sellingPrice: 20,
        costPrice: 16,
        stock: 22,
        lowStockThreshold: 5,
        isComparable: true,
        comparableGroupKey: 'kurkure-masala-munch-90g',
        description: 'Spicy Kurkure Masala Munch.',
        image: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?auto=format&fit=crop&w=400&q=80'
      },

      // === Store 4: Bhandari General Store ===
      {
        storeSlug: 'bhandari-general-store',
        sellerId: bhandariSeller._id,
        name: 'Classmate Spiral Notebook A4 (160 Pages)',
        brand: 'Classmate',
        category: 'stationery',
        unit: '1 notebook',
        variant: 'Single Ruled',
        sellingPrice: 80,
        costPrice: 62,
        stock: 50,
        lowStockThreshold: 10,
        isComparable: true,
        comparableGroupKey: 'classmate-notebook-a4',
        description: 'Premium quality ozone-treated paper spiral bound campus notebook.',
        image: 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?auto=format&fit=crop&w=400&q=80'
      },
      {
        storeSlug: 'bhandari-general-store',
        sellerId: bhandariSeller._id,
        name: 'Reynolds 045 Fine Carbure Ball Pen (Pack of 5)',
        brand: 'Reynolds',
        category: 'stationery',
        unit: 'Pack of 5',
        variant: 'Blue Ink',
        sellingPrice: 50,
        costPrice: 38,
        stock: 60,
        lowStockThreshold: 15,
        isComparable: true,
        comparableGroupKey: 'reynolds-ball-pen-5pack',
        description: 'Laser tip smooth writing blue ballpoint pens for exams and notes.',
        image: 'https://images.unsplash.com/photo-1585336261026-415f7421964b?auto=format&fit=crop&w=400&q=80'
      },
      {
        storeSlug: 'bhandari-general-store',
        sellerId: bhandariSeller._id,
        name: 'Cadbury Dairy Milk Silk Chocolate (60g)',
        brand: 'Cadbury',
        category: 'chocolates',
        unit: '60g bar',
        variant: 'Silk Classic',
        sellingPrice: 85,
        costPrice: 70,
        stock: 35,
        lowStockThreshold: 8,
        isComparable: true,
        comparableGroupKey: 'cadbury-silk-60g',
        description: 'Creamy and velvet smooth milk chocolate bar.',
        image: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=400&q=80'
      },
      {
        storeSlug: 'bhandari-general-store',
        sellerId: bhandariSeller._id,
        name: 'Parle-G Gold Glucose Biscuits (1kg)',
        brand: 'Parle',
        category: 'biscuits',
        unit: '1 kg family pack',
        variant: 'Gold',
        sellingPrice: 90,
        costPrice: 78,
        stock: 28,
        lowStockThreshold: 5,
        isComparable: false,
        description: 'Original Indian glucose biscuit family pack for tea breaks.',
        image: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&w=400&q=80'
      },
      {
        storeSlug: 'bhandari-general-store',
        sellerId: bhandariSeller._id,
        name: 'Kurkure Masala Munch (90g)',
        brand: 'PepsiCo',
        category: 'kurkure',
        unit: '90g pack',
        variant: 'Standard',
        sellingPrice: 20,
        costPrice: 16,
        stock: 4, // Intentionally low stock (4 <= threshold 5) to test alerts!
        lowStockThreshold: 5,
        isComparable: true,
        comparableGroupKey: 'kurkure-masala-munch-90g',
        description: 'Packaged snack - Kurkure Masala Munch.',
        image: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?auto=format&fit=crop&w=400&q=80'
      },

      // === Store 5: Devbhoomi General Store ===
      {
        storeSlug: 'devbhoomi-general-store',
        sellerId: devbhoomiSeller._id,
        name: 'Classmate Spiral Notebook A4 (160 Pages)',
        brand: 'Classmate',
        category: 'stationery',
        unit: '1 notebook',
        variant: 'Single Ruled',
        sellingPrice: 75, // ₹75 here vs ₹80 at Bhandari!
        costPrice: 60,
        stock: 40,
        lowStockThreshold: 8,
        isComparable: true,
        comparableGroupKey: 'classmate-notebook-a4',
        description: 'A4 ruled spiral notebook.',
        image: 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?auto=format&fit=crop&w=400&q=80'
      },
      {
        storeSlug: 'devbhoomi-general-store',
        sellerId: devbhoomiSeller._id,
        name: 'Cadbury Dairy Milk Silk Chocolate (60g)',
        brand: 'Cadbury',
        category: 'chocolates',
        unit: '60g bar',
        variant: 'Silk Classic',
        sellingPrice: 80, // ₹80 here vs ₹85 at Bhandari!
        costPrice: 68,
        stock: 20,
        lowStockThreshold: 6,
        isComparable: true,
        comparableGroupKey: 'cadbury-silk-60g',
        description: 'Silk chocolate bar.',
        image: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=400&q=80'
      },
      {
        storeSlug: 'devbhoomi-general-store',
        sellerId: devbhoomiSeller._id,
        name: 'Dettol Original Germ Protection Bathing Soap (Pack of 3)',
        brand: 'Dettol',
        category: 'daily essentials',
        unit: 'Pack of 3 x 75g',
        variant: 'Original',
        sellingPrice: 110,
        costPrice: 92,
        stock: 25,
        lowStockThreshold: 5,
        isComparable: false,
        description: 'Antibacterial bath soap pack for everyday hostel hygiene.',
        image: 'https://images.unsplash.com/photo-1607006314605-7264a4b4bbcd?auto=format&fit=crop&w=400&q=80'
      },
      {
        storeSlug: 'devbhoomi-general-store',
        sellerId: devbhoomiSeller._id,
        name: 'Amul Taaza Homogenised Toned Milk (1 Litre Tetra Pak)',
        brand: 'Amul',
        category: 'groceries',
        unit: '1 Litre',
        variant: 'Tetra Pak',
        sellingPrice: 72,
        costPrice: 64,
        stock: 18,
        lowStockThreshold: 5,
        isComparable: false,
        description: 'Long life UHT toned milk carton, ready to consume without boiling.',
        image: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=400&q=80'
      },
      {
        storeSlug: 'devbhoomi-general-store',
        sellerId: devbhoomiSeller._id,
        name: 'Colgate MaxFresh Spicy Fresh Toothpaste (150g)',
        brand: 'Colgate',
        category: 'daily essentials',
        unit: '150g tube',
        variant: 'Red Gel',
        sellingPrice: 95,
        costPrice: 78,
        stock: 0, // Intentionally Out of Stock (0) to test out of stock badge!
        lowStockThreshold: 5,
        isComparable: false,
        description: 'Cooling crystal gel toothpaste for intense freshness.',
        image: 'https://images.unsplash.com/photo-1559591937-e62fb330bc1f?auto=format&fit=crop&w=400&q=80'
      }
    ];

    for (const item of productsData) {
      const store = storeMap.get(item.storeSlug)!;
      const product = await Product.create({
        name: item.name,
        storeId: store._id,
        brand: item.brand,
        category: item.category as any,
        unit: item.unit,
        variant: item.variant,
        sellingPrice: item.sellingPrice,
        costPrice: item.costPrice,
        stock: item.stock,
        lowStockThreshold: item.lowStockThreshold,
        isComparable: item.isComparable,
        comparableGroupKey: item.comparableGroupKey,
        description: item.description,
        image: item.image,
        isActive: true
      });

      // Record initial inventory movement
      if (item.stock > 0) {
        await InventoryMovement.create({
          productId: product._id,
          storeId: store._id,
          userId: item.sellerId,
          userName: 'Seed Initializer',
          type: 'initial',
          delta: item.stock,
          stockBefore: 0,
          stockAfter: item.stock,
          reason: 'Initial store inventory onboarded from supplier catalog'
        });
      }
    }

    console.log('[Seed] Database successfully seeded with 5 Stores, 7 Users, and 18 Products!');
    console.log('---------------------------------------------------------');
    console.log('Demo Credentials:');
    console.log('Admin:       admin@vendersetu.edu.in     / Admin@123');
    console.log('Student:     student@vendersetu.edu.in   / Student@123');
    console.log('Canteen:     canteen@vendersetu.edu.in   / Seller@123');
    console.log('Durga FF:    durga@vendersetu.edu.in     / Seller@123');
    console.log('Monal FF:    monal@vendersetu.edu.in     / Seller@123');
    console.log('Bhandari:    bhandari@vendersetu.edu.in  / Seller@123');
    console.log('Devbhoomi:   devbhoomi@vendersetu.edu.in / Seller@123');
    console.log('---------------------------------------------------------');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('[Seed Error]', error);
    process.exit(1);
  }
};

seedDatabase();
