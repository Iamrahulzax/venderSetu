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
        storeType: 'food' as const,
        description: 'Main campus canteen offering fresh chai in kullhad, crispy samosas, cooked Maggi, snacks, and chilled beverages.',
        location: 'Student Activity Centre (SAC), Ground Floor',
        contactPhone: '+91 98765 43210',
        isOpen: true,
        openingHours: '08:00 AM - 09:30 PM',
        offersDelivery: true,
        deliveryFee: 10,
        minimumOrder: 40,
        estimatedPrepTime: '10-15 mins',
        bannerImage: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1200&q=80',
        categoryTags: ['snacks', 'maggi and noodles', 'tea and coffee', 'cold drinks', 'fast food'],
        menuDocuments: [
          {
            title: 'College Canteen Official Food & Beverage Menu (2026)',
            fileUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1200&q=80',
            fileType: 'image' as const,
            uploadedAt: new Date()
          }
        ]
      },
      {
        name: 'Durga Fast Food',
        slug: 'durga-fast-food',
        storeType: 'food' as const,
        description: 'Popular campus corner famous for crispy aloo tikki burgers, veg & paneer kathi rolls, steamed momos, and spicy chowmein.',
        location: 'North Gate Commercial Complex, Shop 3',
        contactPhone: '+91 98765 43211',
        isOpen: true,
        openingHours: '11:00 AM - 10:30 PM',
        offersDelivery: true,
        deliveryFee: 15,
        minimumOrder: 80,
        estimatedPrepTime: '15-20 mins',
        bannerImage: 'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=1200&q=80',
        categoryTags: ['burgers', 'momos', 'sandwiches', 'maggi and noodles', 'fries and snacks'],
        menuDocuments: [
          {
            title: 'Durga Fast Food Menu Card (Special Student Combos)',
            fileUrl: 'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=1200&q=80',
            fileType: 'image' as const,
            uploadedAt: new Date()
          }
        ]
      },
      {
        name: 'Monal Fast Food',
        slug: 'monal-fast-food',
        storeType: 'food' as const,
        description: 'Speciality Himalayan fast food, spicy fried rice, hot hakka noodles, cheese corn sandwiches, and chocolate shakes.',
        location: 'Hostel Block 4 Plaza, Shop 1',
        contactPhone: '+91 98765 43212',
        isOpen: true,
        openingHours: '10:30 AM - 11:00 PM',
        offersDelivery: false,
        deliveryFee: 0,
        minimumOrder: 50,
        estimatedPrepTime: '12-18 mins',
        bannerImage: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80',
        categoryTags: ['momos', 'sandwiches', 'chinese', 'combos', 'cold drinks'],
        menuDocuments: [
          {
            title: 'Monal Fast Food Authentic Tibetan & Fast Food Card',
            fileUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80',
            fileType: 'image' as const,
            uploadedAt: new Date()
          }
        ]
      },
      {
        name: 'Bhandari General Store',
        slug: 'bhandari-general-store',
        storeType: 'general' as const,
        description: 'Campus stationery hub and snack pantry with spiral notebooks, pens, Kurkure, Cadbury chocolates, biscuits, and batteries.',
        location: 'Central Library Pathway, Shop 5',
        contactPhone: '+91 98765 43213',
        isOpen: true,
        openingHours: '09:00 AM - 09:00 PM',
        offersDelivery: true,
        deliveryFee: 10,
        minimumOrder: 50,
        estimatedPrepTime: '5-10 mins',
        bannerImage: 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=1200&q=80',
        categoryTags: ['stationery', 'biscuits', 'chocolates', 'chips', 'daily essentials']
      },
      {
        name: 'Devbhoomi General Store',
        slug: 'devbhoomi-general-store',
        storeType: 'general' as const,
        description: 'All-in-one store for hostel daily essentials, bath soaps, toiletries, packaged dairy, and instant foods.',
        location: 'Boys Hostel Road, Sector 2',
        contactPhone: '+91 98765 43214',
        isOpen: true,
        openingHours: '08:30 AM - 10:00 PM',
        offersDelivery: true,
        deliveryFee: 10,
        minimumOrder: 60,
        estimatedPrepTime: '10-15 mins',
        bannerImage: 'https://images.unsplash.com/photo-1583258292688-d0213dc5a3a8?auto=format&fit=crop&w=1200&q=80',
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
      name: 'Devendra Rawat',
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

    // 3. Seed Products across categories with realistic campus pricing, variants, and real photography
    console.log('[Seed] Seeding Products...');

    const productsData = [
      // === Store 1: College Canteen ===
      {
        storeSlug: 'college-canteen',
        sellerId: canteenSeller._id,
        name: 'Crispy Samosa with Mint Chutney',
        brand: 'Canteen Kitchen',
        category: 'fast food',
        unit: '2 pcs',
        servingSize: 'Plate of 2 samosas with green & tamarind chutney',
        variant: 'Standard',
        variants: [
          { name: 'Standard (2 pcs)', price: 25, inStock: true },
          { name: 'Samosa Chaat (Curd & Chutneys)', price: 45, inStock: true }
        ],
        addons: [
          { name: 'Extra Mint Chutney', price: 5 },
          { name: 'Fried Salted Green Chilli', price: 5 }
        ],
        isVeg: true,
        prepTime: '5-10 mins',
        isAvailable: true,
        sellingPrice: 25,
        costPrice: 14,
        stock: 35,
        lowStockThreshold: 8,
        isComparable: false,
        description: 'Freshly fried hot potato-pea samosas with crispy golden crust, served with spiced mint-coriander and saunth chutneys.',
        image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=600&q=80'
      },
      {
        storeSlug: 'college-canteen',
        sellerId: canteenSeller._id,
        name: 'Maggi 2-Minute Masala Noodles',
        brand: 'Nestle',
        category: 'maggi and noodles',
        unit: '1 bowl',
        servingSize: 'Piping hot 1 regular bowl (cooked with butter & spices)',
        variant: 'Butter Masala',
        variants: [
          { name: 'Classic Masala', price: 30, inStock: true },
          { name: 'Butter Tadka Masala', price: 35, inStock: true },
          { name: 'Double Cheese Maggi', price: 50, inStock: true }
        ],
        addons: [
          { name: 'Extra Amul Butter', price: 10 },
          { name: 'Extra Processed Cheese', price: 15 },
          { name: 'Spicy Diced Green Chillies & Onions', price: 5 }
        ],
        isVeg: true,
        prepTime: '10-12 mins',
        isAvailable: true,
        sellingPrice: 35,
        costPrice: 20,
        stock: 40,
        lowStockThreshold: 10,
        isComparable: true,
        comparableGroupKey: 'maggi-masala-noodles',
        description: 'Hot piping Maggi cooked with butter, spices, diced carrots, and peas. The undisputed collegiate comfort food.',
        image: 'https://images.unsplash.com/photo-1612927601601-6638404737ce?auto=format&fit=crop&w=600&q=80'
      },
      {
        storeSlug: 'college-canteen',
        sellerId: canteenSeller._id,
        name: 'Desi Masala Cutting Chai',
        brand: 'Canteen Kitchen',
        category: 'tea and coffee',
        unit: '1 glass',
        servingSize: '150ml brewed Indian cutting tea in glass',
        variant: 'Cutting Glass',
        variants: [
          { name: 'Regular Cutting (150ml)', price: 12, inStock: true },
          { name: 'Full Kulhad Chai (220ml)', price: 20, inStock: true }
        ],
        addons: [
          { name: 'Extra Adrak (Ginger)', price: 2 },
          { name: 'Cardamom (Elaichi) Kick', price: 3 }
        ],
        isVeg: true,
        prepTime: '5-8 mins',
        isAvailable: true,
        sellingPrice: 12,
        costPrice: 6,
        stock: 100,
        lowStockThreshold: 20,
        isComparable: false,
        description: 'Aromatic strong Assam tea brewed with crushed ginger, green cardamom, and rich milk. Authentic campus fuel.',
        image: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=600&q=80'
      },
      {
        storeSlug: 'college-canteen',
        sellerId: canteenSeller._id,
        name: 'Kurkure Masala Munch (90g)',
        brand: 'PepsiCo',
        category: 'chips',
        unit: '90g pouch',
        variant: 'Masala Munch',
        isVeg: true,
        prepTime: 'Instant',
        isAvailable: true,
        sellingPrice: 20,
        costPrice: 16,
        stock: 50,
        lowStockThreshold: 10,
        isComparable: true,
        comparableGroupKey: 'kurkure-masala-munch-90g',
        description: 'Classic crunchy, spicy tedha-medha corn puffs flavored with authentic Indian masalas.',
        image: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?auto=format&fit=crop&w=600&q=80'
      },
      {
        storeSlug: 'college-canteen',
        sellerId: canteenSeller._id,
        name: 'Coca-Cola (500ml Pet Bottle)',
        brand: 'Coca-Cola',
        category: 'cold drinks',
        unit: '500ml',
        variant: 'Chilled Bottle',
        isVeg: true,
        prepTime: 'Instant',
        isAvailable: true,
        sellingPrice: 40,
        costPrice: 32,
        stock: 30,
        lowStockThreshold: 6,
        isComparable: true,
        comparableGroupKey: 'coca-cola-500ml',
        description: 'Ice-cold carbonated refreshing soft drink.',
        image: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=600&q=80'
      },
      {
        storeSlug: 'college-canteen',
        sellerId: canteenSeller._id,
        name: 'Lays American Style Cream & Onion',
        brand: 'Lays',
        category: 'chips',
        unit: '50g pack',
        variant: 'Green Pack',
        isVeg: true,
        prepTime: 'Instant',
        isAvailable: true,
        sellingPrice: 20,
        costPrice: 16.5,
        stock: 45,
        lowStockThreshold: 8,
        isComparable: true,
        comparableGroupKey: 'lays-cream-onion-50g',
        description: 'Classic savory potato chips coated in creamy sour cream and fine aromatic herbs.',
        image: 'https://images.unsplash.com/photo-1527842891421-42eec6e703ea?auto=format&fit=crop&w=600&q=80'
      },

      // === Store 2: Durga Fast Food ===
      {
        storeSlug: 'durga-fast-food',
        sellerId: durgaSeller._id,
        name: 'Crispy Veg Aloo Tikki Burger',
        brand: 'Durga Kitchen',
        category: 'burgers',
        unit: '1 burger',
        servingSize: '1 burger with sesame bun and fresh coleslaw',
        variant: 'Single Patty',
        variants: [
          { name: 'Single Crispy Patty', price: 50, inStock: true },
          { name: 'Double Patty Deluxe', price: 75, inStock: true },
          { name: 'Paneer Lava Supreme', price: 90, inStock: true }
        ],
        addons: [
          { name: 'Cheddar Cheese Slice', price: 15 },
          { name: 'Tandoori Garlic Dip', price: 10 },
          { name: 'Extra Crispy Jalapenos', price: 10 }
        ],
        isVeg: true,
        prepTime: '12-15 mins',
        isAvailable: true,
        sellingPrice: 50,
        costPrice: 28,
        stock: 30,
        lowStockThreshold: 6,
        isComparable: false,
        description: 'Toasted sesame burger bun layered with crispy spiced potato patty, sliced tomatoes, onions, lettuce, and secret creamy herb mayo.',
        image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80'
      },
      {
        storeSlug: 'durga-fast-food',
        sellerId: durgaSeller._id,
        name: 'Tandoori Paneer Kathi Roll',
        brand: 'Durga Kitchen',
        category: 'fast food',
        unit: '1 roll',
        servingSize: '1 jumbo wrapped paratha roll',
        variant: 'Regular Roll',
        variants: [
          { name: 'Single Paneer Roll', price: 70, inStock: true },
          { name: 'Double Filling Roll', price: 100, inStock: true }
        ],
        addons: [
          { name: 'Melted Mozzarella Inside', price: 20 },
          { name: 'Extra Mint Onion Salad', price: 5 }
        ],
        isVeg: true,
        prepTime: '15-18 mins',
        isAvailable: true,
        sellingPrice: 70,
        costPrice: 42,
        stock: 22,
        lowStockThreshold: 5,
        isComparable: false,
        description: 'Flaky crisp paratha wrapped around char-grilled tandoori cottage cheese cubes, bell peppers, crisp pickled onions, and mint chutney.',
        image: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?auto=format&fit=crop&w=600&q=80'
      },
      {
        storeSlug: 'durga-fast-food',
        sellerId: durgaSeller._id,
        name: 'Desi Veg Hakka Chowmein',
        brand: 'Durga Kitchen',
        category: 'maggi and noodles',
        unit: 'Full Plate',
        servingSize: 'Full plate wok-tossed desi noodles',
        variant: 'Regular Spicy',
        variants: [
          { name: 'Half Plate', price: 40, inStock: true },
          { name: 'Full Plate', price: 60, inStock: true }
        ],
        addons: [
          { name: 'Extra Spicy Schezwan Toss', price: 10 },
          { name: 'Toasted Paneer Cubes', price: 20 }
        ],
        isVeg: true,
        prepTime: '12-15 mins',
        isAvailable: true,
        sellingPrice: 60,
        costPrice: 32,
        stock: 25,
        lowStockThreshold: 6,
        isComparable: false,
        description: 'Wok tossed street-style noodles packed with shredded cabbage, crunchy capsicum, carrots, spring onions, and dark soy sauce.',
        image: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&w=600&q=80'
      },
      {
        storeSlug: 'durga-fast-food',
        sellerId: durgaSeller._id,
        name: 'Steamed Veg Momos (Plate of 8)',
        brand: 'Durga Kitchen',
        category: 'momos',
        unit: 'Plate (8 pcs)',
        servingSize: '8 juicy steamed dumplings with spicy red dip & mayo',
        variant: 'Steamed',
        variants: [
          { name: 'Classic Steamed (8 pcs)', price: 50, inStock: true },
          { name: 'Crispy Deep Fried (8 pcs)', price: 60, inStock: true },
          { name: 'Kurkure Crunchy Momos (8 pcs)', price: 80, inStock: true }
        ],
        addons: [
          { name: 'Extra Fiery Garlic Chilli Chutney', price: 5 },
          { name: 'Thick Veg Mayonnaise Dip', price: 10 }
        ],
        isVeg: true,
        prepTime: '10-15 mins',
        isAvailable: true,
        sellingPrice: 50,
        costPrice: 28,
        stock: 30,
        lowStockThreshold: 6,
        isComparable: false,
        description: 'Handcrafted thin-skin dumplings stuffed with fresh minced cabbage, carrots, onions, and mountain herbs. Served with blazing red garlic chutney.',
        image: 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?auto=format&fit=crop&w=600&q=80'
      },
      {
        storeSlug: 'durga-fast-food',
        sellerId: durgaSeller._id,
        name: 'Crispy French Fries (Peri-Peri)',
        brand: 'Durga Kitchen',
        category: 'fries and snacks',
        unit: '1 basket',
        servingSize: 'Large basket of golden fries dusted with spicy peri-peri',
        variant: 'Peri-Peri',
        variants: [
          { name: 'Salted Classic', price: 50, inStock: true },
          { name: 'Peri-Peri Masala', price: 60, inStock: true },
          { name: 'Cheesy Loaded Fries', price: 85, inStock: true }
        ],
        addons: [
          { name: 'Warm Cheese Sauce Drizzle', price: 20 },
          { name: 'Smoky BBQ Dip', price: 10 }
        ],
        isVeg: true,
        prepTime: '10-12 mins',
        isAvailable: true,
        sellingPrice: 60,
        costPrice: 30,
        stock: 35,
        lowStockThreshold: 8,
        isComparable: false,
        description: 'Golden fried potato batons shaken with zesty African peri-peri spice blend. Crisp on the outside, fluffy inside.',
        image: 'https://images.unsplash.com/photo-1576107232684-1279f3908594?auto=format&fit=crop&w=600&q=80'
      },
      {
        storeSlug: 'durga-fast-food',
        sellerId: durgaSeller._id,
        name: 'Coca-Cola (500ml Pet Bottle)',
        brand: 'Coca-Cola',
        category: 'cold drinks',
        unit: '500ml',
        variant: 'Chilled Bottle',
        isVeg: true,
        prepTime: 'Instant',
        isAvailable: true,
        sellingPrice: 42,
        costPrice: 32,
        stock: 25,
        lowStockThreshold: 6,
        isComparable: true,
        comparableGroupKey: 'coca-cola-500ml',
        description: 'Chilled pet bottle of Coca-Cola.',
        image: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=600&q=80'
      },

      // === Store 3: Monal Fast Food ===
      {
        storeSlug: 'monal-fast-food',
        sellerId: monalSeller._id,
        name: 'Steamed Veg Momos (Plate of 8)',
        brand: 'Monal Kitchen',
        category: 'momos',
        unit: 'Plate (8 pcs)',
        servingSize: '8 authentic Himalayan steamed momos with spicy red dip',
        variant: 'Steamed Classic',
        variants: [
          { name: 'Steamed Veg (8 pcs)', price: 50, inStock: true },
          { name: 'Fried Veg (8 pcs)', price: 60, inStock: true },
          { name: 'Tandoori Momos with Chaat Masala', price: 85, inStock: true }
        ],
        addons: [
          { name: 'Extra Schezwan Chilli Dip', price: 5 },
          { name: 'Melted Butter Glaze', price: 10 }
        ],
        isVeg: true,
        prepTime: '12-16 mins',
        isAvailable: true,
        sellingPrice: 50,
        costPrice: 26,
        stock: 35,
        lowStockThreshold: 8,
        isComparable: false,
        description: 'Authentic Tibetan style steamed vegetable momos made fresh daily. Served with spicy charred red chili chutney and soup.',
        image: 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?auto=format&fit=crop&w=600&q=80'
      },
      {
        storeSlug: 'monal-fast-food',
        sellerId: monalSeller._id,
        name: 'Cheese Corn Grilled Sandwich',
        brand: 'Monal Kitchen',
        category: 'sandwiches',
        unit: '1 jumbo sandwich',
        servingSize: 'Jumbo 3-layer toasted sandwich cut into 4 triangular bites',
        variant: 'Grilled',
        variants: [
          { name: 'Regular Grilled', price: 65, inStock: true },
          { name: 'Double Cheese Overload', price: 85, inStock: true },
          { name: 'Paneer Makhani Sandwich', price: 95, inStock: true }
        ],
        addons: [
          { name: 'Extra Mozzarella Melt', price: 20 },
          { name: 'Side Crispy Chips', price: 10 }
        ],
        isVeg: true,
        prepTime: '12-15 mins',
        isAvailable: true,
        sellingPrice: 65,
        costPrice: 36,
        stock: 20,
        lowStockThreshold: 5,
        isComparable: false,
        description: 'Crispy golden toasted jumbo white bread stuffed with sweet American corn, diced bell peppers, oregano, and oozing melted mozzarella cheese.',
        image: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=600&q=80'
      },
      {
        storeSlug: 'monal-fast-food',
        sellerId: monalSeller._id,
        name: 'Creamy White Sauce Penne Pasta',
        brand: 'Monal Kitchen',
        category: 'chinese',
        unit: '1 bowl',
        servingSize: 'Full bowl tossed with béchamel cream, garlic, and herbs',
        variant: 'White Sauce Penne',
        variants: [
          { name: 'White Sauce (Alfredo Style)', price: 90, inStock: true },
          { name: 'Red Sauce (Arrabbiata)', price: 85, inStock: true },
          { name: 'Pink Sauce (Mixed)', price: 95, inStock: true }
        ],
        addons: [
          { name: 'Extra Grated Parmesan', price: 20 },
          { name: 'Toasted Garlic Bread (2 slices)', price: 30 }
        ],
        isVeg: true,
        prepTime: '15-18 mins',
        isAvailable: true,
        sellingPrice: 90,
        costPrice: 50,
        stock: 18,
        lowStockThreshold: 4,
        isComparable: false,
        description: 'Italian penne pasta cooked al dente and smothered in rich garlic butter cream sauce, black olives, sweet corn, and dried basil.',
        image: 'https://images.unsplash.com/photo-1621996346565-e3d5d6281290?auto=format&fit=crop&w=600&q=80'
      },
      {
        storeSlug: 'monal-fast-food',
        sellerId: monalSeller._id,
        name: 'Cold Coffee with Vanilla Ice Cream',
        brand: 'Monal Kitchen',
        category: 'cold drinks',
        unit: '350ml glass',
        servingSize: 'Thick iced blended coffee topped with 1 scoop vanilla',
        variant: 'With Ice Cream',
        variants: [
          { name: 'Classic Iced Blend', price: 50, inStock: true },
          { name: 'With Vanilla Scoop', price: 70, inStock: true },
          { name: 'Brownie Cold Coffee Frappe', price: 95, inStock: true }
        ],
        addons: [
          { name: 'Hershey’s Chocolate Drizzle', price: 10 },
          { name: 'Extra Vanilla Scoop', price: 20 }
        ],
        isVeg: true,
        prepTime: '5-8 mins',
        isAvailable: true,
        sellingPrice: 70,
        costPrice: 38,
        stock: 25,
        lowStockThreshold: 6,
        isComparable: false,
        description: 'Frothy and decadent blended cold coffee swirled with chocolate fudge syrup and topped with a creamy scoop of vanilla ice cream.',
        image: 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?auto=format&fit=crop&w=600&q=80'
      },
      {
        storeSlug: 'monal-fast-food',
        sellerId: monalSeller._id,
        name: 'Maggi 2-Minute Masala Noodles',
        brand: 'Nestle',
        category: 'maggi and noodles',
        unit: '1 bowl',
        servingSize: 'Cooked Maggi with double cheddar cheese',
        variant: 'Double Cheese',
        isVeg: true,
        prepTime: '10-15 mins',
        isAvailable: true,
        sellingPrice: 40,
        costPrice: 22,
        stock: 20,
        lowStockThreshold: 5,
        isComparable: true,
        comparableGroupKey: 'maggi-masala-noodles',
        description: 'Special cheesy vegetable prepared Maggi.',
        image: 'https://images.unsplash.com/photo-1612927601601-6638404737ce?auto=format&fit=crop&w=600&q=80'
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
        sku: 'STA-NOTE-A4-160',
        isVeg: true,
        prepTime: 'Instant',
        isAvailable: true,
        sellingPrice: 80,
        costPrice: 62,
        stock: 50,
        lowStockThreshold: 10,
        isComparable: true,
        comparableGroupKey: 'classmate-notebook-a4',
        description: 'Premium ozone-treated smooth white paper spiral notebook with protective poly cover for lecture notes and assignments.',
        image: 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?auto=format&fit=crop&w=600&q=80'
      },
      {
        storeSlug: 'bhandari-general-store',
        sellerId: bhandariSeller._id,
        name: 'Reynolds 045 Fine Carbure Ball Pen (Pack of 5)',
        brand: 'Reynolds',
        category: 'stationery',
        unit: 'Pack of 5',
        variant: 'Blue Ink',
        sku: 'STA-PEN-REY-05',
        isVeg: true,
        prepTime: 'Instant',
        isAvailable: true,
        sellingPrice: 50,
        costPrice: 38,
        stock: 60,
        lowStockThreshold: 15,
        isComparable: true,
        comparableGroupKey: 'reynolds-ball-pen-5pack',
        description: 'Laser tip fine writing 0.7mm blue ballpoint pens engineered for continuous smooth exam and class writing.',
        image: 'https://images.unsplash.com/photo-1585336261026-415f7421964b?auto=format&fit=crop&w=600&q=80'
      },
      {
        storeSlug: 'bhandari-general-store',
        sellerId: bhandariSeller._id,
        name: 'Cadbury Dairy Milk Silk Chocolate (60g)',
        brand: 'Cadbury',
        category: 'chocolates',
        unit: '60g bar',
        variant: 'Silk Classic',
        sku: 'SNC-CAD-SLK-60',
        isVeg: true,
        prepTime: 'Instant',
        isAvailable: true,
        sellingPrice: 85,
        costPrice: 70,
        stock: 35,
        lowStockThreshold: 8,
        isComparable: true,
        comparableGroupKey: 'cadbury-silk-60g',
        description: 'Velvety smooth milk chocolate that melts luxuriously on your tongue. The perfect sweet study break reward.',
        image: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=600&q=80'
      },
      {
        storeSlug: 'bhandari-general-store',
        sellerId: bhandariSeller._id,
        name: 'Parle-G Gold Glucose Biscuits (1kg)',
        brand: 'Parle',
        category: 'biscuits',
        unit: '1 kg family pack',
        variant: 'Gold Pack',
        sku: 'SNC-PRL-GLD-1K',
        isVeg: true,
        prepTime: 'Instant',
        isAvailable: true,
        sellingPrice: 90,
        costPrice: 78,
        stock: 28,
        lowStockThreshold: 5,
        isComparable: false,
        description: 'The definitive Indian glucose biscuit enriched with wheat, milk, and essential minerals for endless chai dunking.',
        image: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&w=600&q=80'
      },
      {
        storeSlug: 'bhandari-general-store',
        sellerId: bhandariSeller._id,
        name: 'Kurkure Masala Munch (90g)',
        brand: 'PepsiCo',
        category: 'chips',
        unit: '90g pack',
        variant: 'Standard',
        sku: 'SNC-KUR-MCH-90',
        isVeg: true,
        prepTime: 'Instant',
        isAvailable: true,
        sellingPrice: 20,
        costPrice: 16,
        stock: 4, // Intentionally low stock (4 <= threshold 5) to trigger inventory alert!
        lowStockThreshold: 5,
        isComparable: true,
        comparableGroupKey: 'kurkure-masala-munch-90g',
        description: 'Packaged snack - Kurkure Masala Munch.',
        image: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?auto=format&fit=crop&w=600&q=80'
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
        sku: 'STA-NOTE-A4-160',
        isVeg: true,
        prepTime: 'Instant',
        isAvailable: true,
        sellingPrice: 75, // ₹75 here vs ₹80 at Bhandari!
        costPrice: 60,
        stock: 40,
        lowStockThreshold: 8,
        isComparable: true,
        comparableGroupKey: 'classmate-notebook-a4',
        description: 'A4 ruled spiral notebook.',
        image: 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?auto=format&fit=crop&w=600&q=80'
      },
      {
        storeSlug: 'devbhoomi-general-store',
        sellerId: devbhoomiSeller._id,
        name: 'Cadbury Dairy Milk Silk Chocolate (60g)',
        brand: 'Cadbury',
        category: 'chocolates',
        unit: '60g bar',
        variant: 'Silk Classic',
        sku: 'SNC-CAD-SLK-60',
        isVeg: true,
        prepTime: 'Instant',
        isAvailable: true,
        sellingPrice: 80, // ₹80 here vs ₹85 at Bhandari!
        costPrice: 68,
        stock: 20,
        lowStockThreshold: 6,
        isComparable: true,
        comparableGroupKey: 'cadbury-silk-60g',
        description: 'Silk chocolate bar.',
        image: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=600&q=80'
      },
      {
        storeSlug: 'devbhoomi-general-store',
        sellerId: devbhoomiSeller._id,
        name: 'Dettol Original Germ Protection Bathing Soap (Pack of 3)',
        brand: 'Dettol',
        category: 'daily essentials',
        unit: 'Pack of 3 x 75g',
        variant: 'Original Antiseptic',
        sku: 'HYG-DET-SOP-03',
        isVeg: true,
        prepTime: 'Instant',
        isAvailable: true,
        sellingPrice: 110,
        costPrice: 92,
        stock: 25,
        lowStockThreshold: 5,
        isComparable: false,
        description: 'Classic trusted pine antibacterial bar soap pack for daily student and hostel personal hygiene.',
        image: 'https://images.unsplash.com/photo-1600857544200-b2f666a9a2ec?auto=format&fit=crop&w=600&q=80'
      },
      {
        storeSlug: 'devbhoomi-general-store',
        sellerId: devbhoomiSeller._id,
        name: 'Amul Taaza Homogenised Toned Milk (1 Litre Tetra Pak)',
        brand: 'Amul',
        category: 'groceries',
        unit: '1 Litre',
        variant: 'Tetra Pak',
        sku: 'GRO-AML-MLK-1L',
        isVeg: true,
        prepTime: 'Instant',
        isAvailable: true,
        sellingPrice: 72,
        costPrice: 64,
        stock: 18,
        lowStockThreshold: 5,
        isComparable: false,
        description: 'Fresh UHT treated toned milk from Amul. Requires no boiling, perfect for hostel cereal and cold milk.',
        image: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=600&q=80'
      },
      {
        storeSlug: 'devbhoomi-general-store',
        sellerId: devbhoomiSeller._id,
        name: 'Amul Salted Butter (100g Pack)',
        brand: 'Amul',
        category: 'groceries',
        unit: '100g block',
        variant: 'Salted',
        sku: 'GRO-AML-BTR-10',
        isVeg: true,
        prepTime: 'Instant',
        isAvailable: true,
        sellingPrice: 58,
        costPrice: 50,
        stock: 15,
        lowStockThreshold: 4,
        isComparable: false,
        description: 'The taste of India - delicious pasteurised creamy salted table butter block.',
        image: 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?auto=format&fit=crop&w=600&q=80'
      },
      {
        storeSlug: 'devbhoomi-general-store',
        sellerId: devbhoomiSeller._id,
        name: 'Colgate MaxFresh Spicy Fresh Toothpaste (150g)',
        brand: 'Colgate',
        category: 'daily essentials',
        unit: '150g tube',
        variant: 'Red Cooling Gel',
        sku: 'HYG-CLG-MXF-15',
        isVeg: true,
        prepTime: 'Instant',
        isAvailable: true,
        sellingPrice: 95,
        costPrice: 78,
        stock: 0, // Intentionally Out of Stock (0) to test out of stock badge!
        lowStockThreshold: 5,
        isComparable: false,
        description: 'Cooling crystal gel toothpaste with intense spicy freshness that powers 10x longer fresh breath.',
        image: 'https://images.unsplash.com/photo-1559599101-f09722fb4948?auto=format&fit=crop&w=600&q=80'
      }
    ];

    for (const item of productsData) {
      const store = storeMap.get(item.storeSlug)!;
      const product = await Product.create({
        name: item.name,
        storeId: store._id,
        brand: item.brand,
        category: item.category,
        unit: item.unit,
        variant: item.variant,
        variants: item.variants || [],
        addons: item.addons || [],
        isVeg: item.isVeg !== undefined ? item.isVeg : true,
        servingSize: item.servingSize || '',
        prepTime: item.prepTime || '',
        isAvailable: item.isAvailable !== undefined ? item.isAvailable : true,
        sellingPrice: item.sellingPrice,
        costPrice: item.costPrice,
        stock: item.stock,
        lowStockThreshold: item.lowStockThreshold,
        isComparable: item.isComparable,
        comparableGroupKey: item.comparableGroupKey,
        sku: item.sku,
        description: item.description,
        image: item.image,
        images: [item.image],
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

    console.log('[Seed] Database successfully seeded with 5 Stores, 7 Users, and 23 Products with real photography & digital menus!');
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
