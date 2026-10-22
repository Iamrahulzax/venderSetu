import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  ChevronDown,
  Sparkles,
  ShoppingBag,
  CheckCircle2,
  Filter,
  Star,
  Store as StoreIcon,
  Clock,
  Bike,
  ArrowRightLeft,
  MapPin,
  Flame,
  Check
} from 'lucide-react';
import { apiRequest } from '../../services/api';
import { ProductCard, ProductItem } from '../../components/ProductCard';

// 5 Official Campus Partner Stores fallback/static definition
const DEFAULT_CAMPUS_STORES = [
  {
    _id: 'store-canteen',
    name: 'College Canteen',
    slug: 'college-canteen',
    storeType: 'food',
    description: 'Main campus canteen offering fresh chai in kullhad, crispy samosas, cooked Maggi, snacks, and chilled beverages.',
    location: 'Student Activity Centre (SAC), Ground Floor',
    isOpen: true,
    estimatedPrepTime: '10-15 mins',
    offersDelivery: true,
    deliveryFee: 10,
    bannerImage: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80'
  },
  {
    _id: 'store-durga',
    name: 'Durga Fast Food',
    slug: 'durga-fast-food',
    storeType: 'food',
    description: 'Popular campus corner famous for crispy aloo tikki burgers, veg & paneer kathi rolls, steamed momos, and spicy chowmein.',
    location: 'North Gate Commercial Complex, Shop 3',
    isOpen: true,
    estimatedPrepTime: '15-20 mins',
    offersDelivery: true,
    deliveryFee: 15,
    bannerImage: 'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=800&q=80'
  },
  {
    _id: 'store-monal',
    name: 'Monal Fast Food',
    slug: 'monal-fast-food',
    storeType: 'food',
    description: 'Speciality Himalayan fast food, spicy fried rice, hot hakka noodles, cheese corn sandwiches, and chocolate shakes.',
    location: 'Hostel Block 4 Plaza, Shop 1',
    isOpen: true,
    estimatedPrepTime: '12-18 mins',
    offersDelivery: false,
    deliveryFee: 0,
    bannerImage: '/stores/monal.png'
  },
  {
    _id: 'store-bhandari',
    name: 'Bhandari General Store',
    slug: 'bhandari-general-store',
    storeType: 'general',
    description: 'Campus stationery hub and snack pantry with spiral notebooks, pens, Kurkure, Cadbury chocolates, biscuits, and batteries.',
    location: 'Central Library Pathway, Shop 5',
    isOpen: true,
    estimatedPrepTime: '5-10 mins',
    offersDelivery: true,
    deliveryFee: 10,
    bannerImage: 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=800&q=80'
  },
  {
    _id: 'store-devbhoomi',
    name: 'Devbhoomi General Store',
    slug: 'devbhoomi-general-store',
    storeType: 'general',
    description: 'All-in-one store for hostel daily essentials, bath soaps, toiletries, packaged dairy, and instant foods.',
    location: 'Boys Hostel Road, Sector 2',
    isOpen: true,
    estimatedPrepTime: '10-15 mins',
    offersDelivery: true,
    deliveryFee: 10,
    bannerImage: '/stores/devbhoomi.jpg'
  }
];

// Rich combined catalogue: Campus favourites + Fresh supermarket items with Indian Rupees (₹)
const CAMPUS_CATALOGUE_PRODUCTS: ProductItem[] = [
  // Campus Canteen / Fast Food & Stationery Items
  {
    _id: 'campus-1',
    name: 'Special Masala Maggi (Cooked Hot with Veggies)',
    brand: 'Maggi',
    category: 'Maggi & Noodles',
    unit: '1 Plate',
    sellingPrice: 30,
    badge: 'Campus Favorite',
    rating: 4.9,
    stock: 40,
    lowStockThreshold: 5,
    imageUrl: 'https://images.unsplash.com/photo-1612927601601-6638404737ce?auto=format&fit=crop&w=600&q=80',
    description: 'Steaming hot Maggi cooked with butter, chopped onions, tomatoes, and extra masala.',
    isVeg: true,
    store: {
      _id: 'store-canteen',
      name: 'College Canteen',
      slug: 'college-canteen',
      isOpen: true,
      estimatedPrepTime: '10 mins'
    }
  },
  {
    _id: 'campus-2',
    name: 'Desi Kullhad Masala Chai (Cardamom & Ginger)',
    brand: 'Canteen Special',
    category: 'Chai & Cold Drinks',
    unit: '1 Kullhad',
    sellingPrice: 15,
    badge: 'Best Sale',
    rating: 4.9,
    stock: 100,
    lowStockThreshold: 10,
    imageUrl: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=600&q=80',
    description: 'Freshly brewed aromatic campus tea served in an earthen clay kullhad cup.',
    isVeg: true,
    store: {
      _id: 'store-canteen',
      name: 'College Canteen',
      slug: 'college-canteen',
      isOpen: true,
      estimatedPrepTime: '5 mins'
    }
  },
  {
    _id: 'campus-3',
    name: 'Crispy Paneer Kathi Roll (Double Cheese)',
    brand: 'Durga Special',
    category: 'Fast Food',
    unit: '1 Roll',
    sellingPrice: 80,
    originalPrice: 95,
    badge: '15% OFF',
    rating: 4.8,
    stock: 25,
    lowStockThreshold: 5,
    imageUrl: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?auto=format&fit=crop&w=600&q=80',
    description: 'Spiced cottage cheese cubes with mint chutney and fresh onions wrapped in flaky paratha.',
    isVeg: true,
    store: {
      _id: 'store-durga',
      name: 'Durga Fast Food',
      slug: 'durga-fast-food',
      isOpen: true,
      estimatedPrepTime: '15 mins'
    }
  },
  {
    _id: 'campus-4',
    name: 'Steamed Himalayan Veg Momos (8 Pieces + Spicy Dip)',
    brand: 'Monal Tibetan',
    category: 'Fast Food',
    unit: '8 pcs',
    sellingPrice: 60,
    badge: 'Popular',
    rating: 4.9,
    stock: 35,
    lowStockThreshold: 6,
    imageUrl: 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?auto=format&fit=crop&w=600&q=80',
    description: 'Soft thin-crust steamed momos served with signature fiery red chili garlic sauce.',
    isVeg: true,
    store: {
      _id: 'store-monal',
      name: 'Monal Fast Food',
      slug: 'monal-fast-food',
      isOpen: true,
      estimatedPrepTime: '12 mins'
    }
  },
  {
    _id: 'campus-5',
    name: 'Kurkure Masala Munch Crispy Snack (90g Pack)',
    brand: 'Kurkure',
    category: 'Chips & Crisps',
    unit: '90g',
    sellingPrice: 20,
    rating: 4.8,
    stock: 75,
    lowStockThreshold: 15,
    imageUrl: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?auto=format&fit=crop&w=600&q=80',
    description: 'Crunchy savory collets packed with classic Indian chatpata masala flavor.',
    isVeg: true,
    store: {
      _id: 'store-bhandari',
      name: 'Bhandari General Store',
      slug: 'bhandari-general-store',
      isOpen: true
    }
  },
  {
    _id: 'campus-6',
    name: 'Classmate Hardbound Spiral Register (300 Pages)',
    brand: 'Classmate',
    category: 'Stationery',
    unit: '1 Register',
    sellingPrice: 75,
    badge: 'Study Essential',
    rating: 4.8,
    stock: 30,
    lowStockThreshold: 5,
    imageUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80',
    description: 'Premium bright white ruled paper for lecture notes, assignments, and exam prep.',
    isVeg: true,
    store: {
      _id: 'store-bhandari',
      name: 'Bhandari General Store',
      slug: 'bhandari-general-store',
      isOpen: true
    }
  },
  {
    _id: 'campus-7',
    name: 'Dettol Original Germ Protection Bath Soap (Combo 3-Pack)',
    brand: 'Dettol',
    category: 'Daily Essentials',
    unit: '3 x 125g',
    sellingPrice: 95,
    originalPrice: 120,
    badge: '20% OFF',
    rating: 4.7,
    stock: 22,
    lowStockThreshold: 4,
    imageUrl: 'https://images.unsplash.com/photo-1607006314644-2454a8616186?auto=format&fit=crop&w=600&q=80',
    description: 'Antibacterial daily bathing bar ensuring freshness and hygiene in campus hostels.',
    isVeg: true,
    store: {
      _id: 'store-devbhoomi',
      name: 'Devbhoomi General Store',
      slug: 'devbhoomi-general-store',
      isOpen: true
    }
  },
  // Fresh Supermarket Produce & Grocery Items
  {
    _id: 'ref-1',
    name: 'Organic Green Big Sweet Pepper Seeds - Capsicum',
    brand: 'Organic Harvest',
    category: 'Groceries',
    unit: '1000gm',
    sellingPrice: 80,
    badge: 'Best Sale',
    secondaryBadge: 'FROZEN',
    rating: 4.8,
    stock: 25,
    lowStockThreshold: 5,
    imageUrl: 'https://images.unsplash.com/photo-1563565375-f3fdfdbefa83?auto=format&fit=crop&w=600&q=80',
    description: 'Crisp, premium greenhouse bell peppers rich in vitamin C and natural crunch.',
    isVeg: true,
    store: {
      _id: 'store-devbhoomi',
      name: 'Devbhoomi General Store',
      slug: 'devbhoomi-general-store',
      isOpen: true
    }
  },
  {
    _id: 'ref-2',
    name: 'Seoul Yopokki Spicy 4 Flavors of Korean Topokki',
    brand: 'Seoul Yopokki',
    category: 'Maggi & Noodles',
    unit: '1pack',
    sellingPrice: 149,
    rating: 4.6,
    stock: 50,
    lowStockThreshold: 10,
    imageUrl: 'https://images.unsplash.com/photo-1612927601601-6638404737ce?auto=format&fit=crop&w=600&q=80',
    description: 'Authentic Korean rice cakes in savory, sweet & spicy gochujang chili sauce.',
    isVeg: true,
    store: {
      _id: 'store-canteen',
      name: 'College Canteen',
      slug: 'college-canteen',
      isOpen: true
    }
  },
  {
    _id: 'ref-3',
    name: 'The banana cavendish fruit is very popular in Malaysia',
    brand: 'Cavendish Gold',
    category: 'Groceries',
    unit: '6pc',
    sellingPrice: 40,
    rating: 4.8,
    stock: 40,
    lowStockThreshold: 8,
    imageUrl: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?auto=format&fit=crop&w=600&q=80',
    description: 'Naturally ripened, sun-kissed Cavendish bananas packed with potassium and natural sweetness.',
    isVeg: true,
    store: {
      _id: 'store-devbhoomi',
      name: 'Devbhoomi General Store',
      slug: 'devbhoomi-general-store',
      isOpen: true
    }
  },
  {
    _id: 'ref-4',
    name: 'Organic 100% Italian hass 100% natural Avocado',
    brand: 'Italian Bio',
    category: 'Groceries',
    unit: '1000gm',
    sellingPrice: 199,
    originalPrice: 249,
    badge: '20% OFF',
    rating: 4.8,
    stock: 18,
    lowStockThreshold: 4,
    imageUrl: 'https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?auto=format&fit=crop&w=600&q=80',
    description: 'Creamy Hass avocados imported fresh from certified organic Italian orchards.',
    isVeg: true,
    store: {
      _id: 'store-devbhoomi',
      name: 'Devbhoomi General Store',
      slug: 'devbhoomi-general-store',
      isOpen: true
    }
  },
  {
    _id: 'ref-5',
    name: 'Mahin Brand, Extra Long Grain Basmati Rice',
    brand: 'Mahin Brand',
    category: 'Groceries',
    unit: '4pack',
    sellingPrice: 240,
    originalPrice: 299,
    badge: '15% OFF',
    rating: 4.7,
    stock: 30,
    lowStockThreshold: 5,
    imageUrl: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=600&q=80',
    description: 'Aged Himalayan long grain basmati rice with royal aroma and slender fluffy grains.',
    isVeg: true,
    store: {
      _id: 'store-devbhoomi',
      name: 'Devbhoomi General Store',
      slug: 'devbhoomi-general-store',
      isOpen: true
    }
  },
  {
    _id: 'ref-6',
    name: 'Lemon Big imported from South Africa',
    brand: 'Cape Citrus',
    category: 'Groceries',
    unit: '1000gm',
    sellingPrice: 50,
    rating: 4.9,
    stock: 45,
    lowStockThreshold: 10,
    imageUrl: 'https://images.unsplash.com/photo-1533082879395-3641888a500f?auto=format&fit=crop&w=600&q=80',
    description: 'Juicy, fragrant large yellow lemons freshly harvested from South African sun valleys.',
    isVeg: true,
    store: {
      _id: 'store-devbhoomi',
      name: 'Devbhoomi General Store',
      slug: 'devbhoomi-general-store',
      isOpen: true
    }
  },
  {
    _id: 'ref-7',
    name: 'Lipton Lemon Green Tea from china',
    brand: 'Lipton',
    category: 'Chai & Cold Drinks',
    unit: '200gm',
    sellingPrice: 160,
    originalPrice: 210,
    badge: '20% OFF',
    secondaryBadge: 'ORGANIC',
    rating: 4.8,
    stock: 22,
    lowStockThreshold: 5,
    imageUrl: 'https://images.unsplash.com/photo-1556881286-fc6915169721?auto=format&fit=crop&w=600&q=80',
    description: 'Refreshing pure green tea leaves blended with natural lemon citrus zest.',
    isVeg: true,
    store: {
      _id: 'store-bhandari',
      name: 'Bhandari General Store',
      slug: 'bhandari-general-store',
      isOpen: true
    }
  },
  {
    _id: 'ref-8',
    name: "Lay's Tomato Ketchup Chips 12 pack",
    brand: "Lay's",
    category: 'Chips & Crisps',
    unit: '12 pack',
    sellingPrice: 30,
    rating: 4.8,
    stock: 60,
    lowStockThreshold: 12,
    imageUrl: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?auto=format&fit=crop&w=600&q=80',
    description: 'Crispy fried potato chips with signature tangy tomato ketchup seasoning.',
    isVeg: true,
    store: {
      _id: 'store-bhandari',
      name: 'Bhandari General Store',
      slug: 'bhandari-general-store',
      isOpen: true
    }
  },
  {
    _id: 'ref-9',
    name: 'Arabian best Beef Meat Kirkland Signature Roast',
    brand: 'Kirkland Signature',
    category: 'Fast Food',
    unit: '1200g',
    sellingPrice: 380,
    badge: 'Best Sale',
    secondaryBadge: 'FROZEN',
    rating: 4.9,
    stock: 14,
    lowStockThreshold: 3,
    imageUrl: 'https://images.unsplash.com/photo-1603048588665-791ca8aea617?auto=format&fit=crop&w=600&q=80',
    description: 'Premium choice tender beef roast cut, vacuum sealed and flash frozen for gourmet dining.',
    isVeg: false,
    store: {
      _id: 'store-durga',
      name: 'Durga Fast Food',
      slug: 'durga-fast-food',
      isOpen: true
    }
  },
  {
    _id: 'ref-10',
    name: 'APILIFE - Flavorful & Nutritious! Black Seed Honey',
    brand: 'APILIFE',
    category: 'Daily Essentials',
    unit: '500g',
    sellingPrice: 350,
    rating: 4.9,
    stock: 19,
    lowStockThreshold: 4,
    imageUrl: 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?auto=format&fit=crop&w=600&q=80',
    description: 'Pure wildflower raw honey infused with nigella sativa black seed essence.',
    isVeg: true,
    store: {
      _id: 'store-devbhoomi',
      name: 'Devbhoomi General Store',
      slug: 'devbhoomi-general-store',
      isOpen: true
    }
  },
  {
    _id: 'ref-11',
    name: 'Noor Sunflower 100% Fresh Oil 1.5 Litres',
    brand: 'Noor',
    category: 'Groceries',
    unit: '1.5 Litres',
    sellingPrice: 175,
    rating: 4.8,
    stock: 35,
    lowStockThreshold: 6,
    imageUrl: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=600&q=80',
    description: 'Triple-refined pure sunflower cooking oil with Vitamin A & D for healthy meals.',
    isVeg: true,
    store: {
      _id: 'store-devbhoomi',
      name: 'Devbhoomi General Store',
      slug: 'devbhoomi-general-store',
      isOpen: true
    }
  },
  {
    _id: 'ref-12',
    name: 'Garden Frozen Chicken Leg Cuts Skinless',
    brand: 'Garden Fresh',
    category: 'Fast Food',
    unit: '1000gm',
    sellingPrice: 220,
    originalPrice: 280,
    badge: '20% OFF',
    secondaryBadge: 'FROZEN',
    rating: 4.8,
    stock: 28,
    lowStockThreshold: 5,
    imageUrl: 'https://images.unsplash.com/photo-1587593810167-a84920ea0781?auto=format&fit=crop&w=600&q=80',
    description: 'Tender skinless chicken drumsticks and thighs, frozen at peak freshness.',
    isVeg: false,
    store: {
      _id: 'store-durga',
      name: 'Durga Fast Food',
      slug: 'durga-fast-food',
      isOpen: true
    }
  },
  {
    _id: 'ref-13',
    name: 'Amul Taaza Full Cream Fresh Milk',
    brand: 'Amul',
    category: 'Daily Essentials',
    unit: '4pack',
    sellingPrice: 64,
    badge: 'Best Sale',
    rating: 4.8,
    stock: 40,
    lowStockThreshold: 8,
    imageUrl: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=600&q=80',
    description: 'Homogenized, farm-fresh pasteurized full cream milk rich in calcium.',
    isVeg: true,
    store: {
      _id: 'store-devbhoomi',
      name: 'Devbhoomi General Store',
      slug: 'devbhoomi-general-store',
      isOpen: true
    }
  }
];

export const HomePage: React.FC = () => {
  const [stores, setStores] = useState<any[]>(DEFAULT_CAMPUS_STORES);
  const [apiProducts, setApiProducts] = useState<ProductItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStore, setSelectedStore] = useState<string>('all');
  const [selectedPriceRange, setSelectedPriceRange] = useState<string>('all');
  const [selectedRating, setSelectedRating] = useState<string>('all');
  const [selectedVegFilter, setSelectedVegFilter] = useState<string>('all');
  const [selectedOffer, setSelectedOffer] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('default');

  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  const toggleDropdown = (name: string) => {
    setOpenDropdown(openDropdown === name ? null : name);
  };

  const categories = [
    { id: 'all', name: 'All Categories' },
    { id: 'maggi & noodles', name: 'Maggi & Noodles' },
    { id: 'fast food', name: 'Burgers, Rolls & Momos' },
    { id: 'chai & cold drinks', name: 'Chai & Cold Drinks' },
    { id: 'chips & crisps', name: 'Kurkure, Chips & Biscuits' },
    { id: 'stationery', name: 'Stationery & Registers' },
    { id: 'daily essentials', name: 'Hostel Daily Essentials' },
    { id: 'groceries', name: 'Fresh Supermarket Groceries' }
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [storesData, productsData] = await Promise.all([
          apiRequest('/stores').catch(() => ({ success: false })),
          apiRequest('/products?limit=150').catch(() => ({ success: false }))
        ]);

        if (storesData && storesData.success && storesData.stores && storesData.stores.length > 0) {
          setStores(storesData.stores);
        }
        if (productsData && productsData.success && productsData.products && productsData.products.length > 0) {
          setApiProducts(productsData.products);
        }
      } catch (err) {
        console.error('Failed to load dynamic store data', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Merge catalogue products
  const allProducts = useMemo(() => {
    if (apiProducts.length === 0) {
      return CAMPUS_CATALOGUE_PRODUCTS;
    }
    const combined = [...CAMPUS_CATALOGUE_PRODUCTS];
    apiProducts.forEach((p) => {
      if (!combined.some((c) => c._id === p._id || c.name.toLowerCase() === p.name.toLowerCase())) {
        combined.push(p);
      }
    });
    return combined;
  }, [apiProducts]);

  // Filter and sort items
  const filteredProducts = useMemo(() => {
    return allProducts
      .filter((p) => {
        // Search filter
        const matchesSearch =
          searchTerm === '' ||
          p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (p.description && p.description.toLowerCase().includes(searchTerm.toLowerCase()));

        // Category filter
        const matchesCategory =
          selectedCategory === 'all' ||
          p.category.toLowerCase().includes(selectedCategory.toLowerCase());

        // Store filter
        const matchesStore =
          selectedStore === 'all' ||
          p.store._id === selectedStore ||
          p.store.slug === selectedStore;

        // Price range filter
        let matchesPrice = true;
        if (selectedPriceRange === 'under_50') matchesPrice = p.sellingPrice < 50;
        else if (selectedPriceRange === '50_to_150') matchesPrice = p.sellingPrice >= 50 && p.sellingPrice <= 150;
        else if (selectedPriceRange === '150_to_300') matchesPrice = p.sellingPrice > 150 && p.sellingPrice <= 300;
        else if (selectedPriceRange === 'above_300') matchesPrice = p.sellingPrice > 300;

        // Review filter
        let matchesRating = true;
        if (selectedRating === '4.8_plus') matchesRating = (p.rating || 4.5) >= 4.8;
        else if (selectedRating === '4.5_plus') matchesRating = (p.rating || 4.5) >= 4.5;
        else if (selectedRating === '4.0_plus') matchesRating = (p.rating || 4.5) >= 4.0;

        // Diet / Veg filter
        let matchesVeg = true;
        if (selectedVegFilter === 'veg') matchesVeg = p.isVeg === true;
        else if (selectedVegFilter === 'nonveg') matchesVeg = p.isVeg === false;

        // Offers filter
        let matchesOffer = true;
        if (selectedOffer === 'discounted') matchesOffer = !!p.badge || !!p.originalPrice;

        return matchesSearch && matchesCategory && matchesStore && matchesPrice && matchesRating && matchesVeg && matchesOffer;
      })
      .sort((a, b) => {
        if (sortBy === 'price_asc') return a.sellingPrice - b.sellingPrice;
        if (sortBy === 'price_desc') return b.sellingPrice - a.sellingPrice;
        if (sortBy === 'rating') return (b.rating || 4) - (a.rating || 4);
        return 0; // Default order
      });
  }, [allProducts, searchTerm, selectedCategory, selectedStore, selectedPriceRange, selectedRating, selectedVegFilter, selectedOffer, sortBy]);

  const activeCategoryName = categories.find((c) => c.id === selectedCategory)?.name || 'All Categories';
  const activeStoreName = stores.find((s) => s.slug === selectedStore || s._id === selectedStore)?.name || 'All Campus Stores';

  return (
    <div className="space-y-8 pb-16">
      {/* 1. Hero Promo Banner: College Campus Marketplace */}
      <section className="relative overflow-hidden rounded-[24px] sm:rounded-[32px] bg-[#0d5435] text-white p-6 sm:p-10 md:p-12 shadow-lg">
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-12 items-center gap-6 sm:gap-8">
          {/* Left Text Column */}
          <div className="md:col-span-7 space-y-4 max-w-xl">
            {/* Campus Tag */}
            <div className="inline-flex items-center space-x-2 bg-emerald-500/25 text-emerald-200 border border-emerald-400/30 px-3.5 py-1 rounded-full text-xs font-semibold backdrop-blur-sm">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Official Campus Marketplace & Mart</span>
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight leading-[1.15] text-white">
              Your Campus, Your Stores, <br className="hidden sm:inline" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 via-teal-200 to-amber-200">
                Connected in Real-Time.
              </span>
            </h1>

            <p className="text-emerald-100/90 text-xs sm:text-sm md:text-base leading-relaxed max-w-lg font-normal">
              Order directly from the College Canteen, Durga & Monal Fast Food, Bhandari and
              Devbhoomi General Stores with live inventory sync, multi-store checkout, and 15-minute
              hostel room delivery. Free delivery on orders above ₹200!
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-3">
              <a
                href="#campus-stores-section"
                className="inline-flex items-center space-x-2 bg-[#facc15] hover:bg-[#eab308] text-slate-900 font-bold px-6 py-2.5 sm:py-3 rounded-full text-xs sm:text-sm transition-all transform hover:scale-105 active:scale-95 shadow-md shadow-black/10"
              >
                <span>Explore 5 Campus Stores</span>
                <ArrowRight className="w-4 h-4 stroke-[2.5]" />
              </a>

              <Link
                to="/compare"
                className="inline-flex items-center space-x-2 bg-white/10 hover:bg-white/20 text-white font-semibold px-5 py-2.5 sm:py-3 rounded-full text-xs sm:text-sm transition-colors border border-white/20 backdrop-blur-sm"
              >
                <ArrowRightLeft className="w-4 h-4 text-amber-300" />
                <span>Compare Prices</span>
              </Link>
            </div>
          </div>

          {/* Right Basket Image Column */}
          <div className="md:col-span-5 flex justify-center md:justify-end">
            <div className="relative w-full max-w-[340px] sm:max-w-[400px]">
              <img
                src="/hero_basket.jpg"
                alt="Basket of fresh campus groceries and snacks"
                className="w-full h-auto object-contain rounded-2xl drop-shadow-2xl transform hover:scale-[1.02] transition-transform duration-300"
              />
            </div>
          </div>
        </div>

        {/* Ambient Glow */}
        <div className="absolute top-0 right-1/4 w-80 h-80 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none" />
      </section>

      {/* 2. 5 Official Campus Partner Stores Grid (Detailed College Campus Section) */}
      <section id="campus-stores-section" className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Official Campus Partner Stores
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                5 Active Stores
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Live operational status, preparation times, and hostel delivery fees
            </p>
          </div>

          <Link
            to="/stores"
            className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center space-x-1"
          >
            <span>View All Details</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 sm:gap-4">
          {stores.map((store) => (
            <Link
              key={store._id}
              to={`/stores/${store.slug}`}
              className="bg-white rounded-2xl border border-slate-200 hover:border-emerald-500 hover:shadow-md transition-all group flex flex-col justify-between overflow-hidden p-4"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-xs group-hover:scale-105 transition-transform">
                    <StoreIcon className="w-4 h-4" />
                  </div>
                  <span
                    className={`text-[9.5px] font-bold px-2 py-0.5 rounded-full ${
                      store.isOpen ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {store.isOpen ? 'Open Now' : 'Closed'}
                  </span>
                </div>

                <h3 className="font-bold text-slate-900 text-sm group-hover:text-emerald-700 transition-colors line-clamp-1">
                  {store.name}
                </h3>
                <p className="text-[11px] text-slate-500 line-clamp-2 mt-1 leading-snug">
                  {store.description}
                </p>
                <div className="mt-2 text-[10px] text-slate-400 flex items-center gap-1 line-clamp-1">
                  <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                  <span>{store.location}</span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5 text-[11px] text-slate-600">
                <div className="flex items-center justify-between">
                  <span className="flex items-center space-x-1 text-slate-400">
                    <Clock className="w-3 h-3" />
                    <span>Prep Time</span>
                  </span>
                  <span className="font-semibold text-slate-700">
                    {store.estimatedPrepTime || '10-15 mins'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center space-x-1 text-slate-400">
                    <Bike className="w-3 h-3" />
                    <span>Delivery</span>
                  </span>
                  <span className="font-semibold text-emerald-700">
                    {store.offersDelivery ? `₹${store.deliveryFee}` : 'Pickup Only'}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 3. Catalogue Header & Filters Section */}
      <section id="catalogue-section" className="space-y-4 pt-2">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              All Products & Campus Catalogue
            </h2>
            <p className="text-xs text-slate-500">
              Synchronized live with College Canteen, Durga, Monal, Bhandari & Devbhoomi
            </p>
          </div>
          <span className="text-xs text-slate-500 font-medium hidden sm:inline">
            Showing {filteredProducts.length} items
          </span>
        </div>

        {/* Filter Bar with detailed campus filters */}
        <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1 scrollbar-none">
          {/* Left Filter Buttons Group */}
          <div className="flex items-center space-x-2">
            {/* All Categories Dropdown Button (Dark Green Active Button) */}
            <div className="relative">
              <button
                type="button"
                onClick={() => toggleDropdown('category')}
                className="flex items-center space-x-1.5 bg-[#0d5435] text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold hover:bg-[#073c24] transition-colors whitespace-nowrap shadow-xs"
              >
                <span>{activeCategoryName}</span>
                <ChevronDown className="w-3.5 h-3.5" />
              </button>

              {openDropdown === 'category' && (
                <div
                  className="absolute left-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-40"
                  onMouseLeave={() => setOpenDropdown(null)}
                >
                  {categories.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => {
                        setSelectedCategory(c.id);
                        setOpenDropdown(null);
                      }}
                      className={`w-full text-left px-3.5 py-2 text-xs flex items-center justify-between hover:bg-emerald-50 ${
                        selectedCategory === c.id ? 'font-bold text-emerald-800 bg-emerald-50/70' : 'text-slate-700'
                      }`}
                    >
                      <span>{c.name}</span>
                      {selectedCategory === c.id && <span className="text-emerald-700">✓</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Filter by Campus Store Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => toggleDropdown('store')}
                className={`flex items-center space-x-1 border px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                  selectedStore !== 'all'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-800 font-semibold'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                <StoreIcon className="w-3.5 h-3.5 text-slate-400" />
                <span>{activeStoreName}</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {openDropdown === 'store' && (
                <div
                  className="absolute left-0 mt-2 w-60 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-40"
                  onMouseLeave={() => setOpenDropdown(null)}
                >
                  <button
                    onClick={() => {
                      setSelectedStore('all');
                      setOpenDropdown(null);
                    }}
                    className={`w-full text-left px-3.5 py-2 text-xs hover:bg-emerald-50 ${
                      selectedStore === 'all' ? 'text-emerald-800 font-bold bg-emerald-50/70' : 'text-slate-700'
                    }`}
                  >
                    All Campus Stores
                  </button>
                  {stores.map((s) => (
                    <button
                      key={s._id}
                      onClick={() => {
                        setSelectedStore(s.slug);
                        setOpenDropdown(null);
                      }}
                      className={`w-full text-left px-3.5 py-2 text-xs hover:bg-emerald-50 ${
                        selectedStore === s.slug ? 'text-emerald-800 font-bold bg-emerald-50/70' : 'text-slate-700'
                      }`}
                    >
                      {s.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Price Filter Dropdown (in Rupees) */}
            <div className="relative">
              <button
                type="button"
                onClick={() => toggleDropdown('price')}
                className={`flex items-center space-x-1 border px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                  selectedPriceRange !== 'all'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-800 font-semibold'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span>Price</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {openDropdown === 'price' && (
                <div
                  className="absolute left-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-40"
                  onMouseLeave={() => setOpenDropdown(null)}
                >
                  {[
                    { id: 'all', label: 'All Prices' },
                    { id: 'under_50', label: 'Under ₹50' },
                    { id: '50_to_150', label: '₹50 to ₹150' },
                    { id: '150_to_300', label: '₹150 to ₹300' },
                    { id: 'above_300', label: 'Above ₹300' }
                  ].map((p) => (
                    <button
                      key={p.id}
                      onClick={() => {
                        setSelectedPriceRange(p.id);
                        setOpenDropdown(null);
                      }}
                      className={`w-full text-left px-3.5 py-1.5 text-xs hover:bg-emerald-50 ${
                        selectedPriceRange === p.id ? 'text-emerald-700 font-bold bg-emerald-50/50' : 'text-slate-700'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Diet / Veg Filter Dropdown */}
            <div className="relative hidden sm:block">
              <button
                type="button"
                onClick={() => toggleDropdown('veg')}
                className={`flex items-center space-x-1 border px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                  selectedVegFilter !== 'all'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-800 font-semibold'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span>Diet</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {openDropdown === 'veg' && (
                <div
                  className="absolute left-0 mt-2 w-44 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-40"
                  onMouseLeave={() => setOpenDropdown(null)}
                >
                  {[
                    { id: 'all', label: 'All Diets' },
                    { id: 'veg', label: '🌱 100% Vegetarian' },
                    { id: 'nonveg', label: '🍗 Non-Vegetarian' }
                  ].map((v) => (
                    <button
                      key={v.id}
                      onClick={() => {
                        setSelectedVegFilter(v.id);
                        setOpenDropdown(null);
                      }}
                      className={`w-full text-left px-3.5 py-1.5 text-xs hover:bg-emerald-50 ${
                        selectedVegFilter === v.id ? 'text-emerald-700 font-bold bg-emerald-50/50' : 'text-slate-700'
                      }`}
                    >
                      {v.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Offers / Deals Dropdown */}
            <div className="relative hidden md:block">
              <button
                type="button"
                onClick={() => toggleDropdown('offer')}
                className={`flex items-center space-x-1 border px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                  selectedOffer !== 'all'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-800 font-semibold'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Flame className="w-3.5 h-3.5 text-amber-500" />
                <span>Special Offers</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {openDropdown === 'offer' && (
                <div
                  className="absolute left-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-40"
                  onMouseLeave={() => setOpenDropdown(null)}
                >
                  <button
                    onClick={() => {
                      setSelectedOffer('all');
                      setOpenDropdown(null);
                    }}
                    className="w-full text-left px-3.5 py-1.5 text-xs text-slate-700 hover:bg-emerald-50"
                  >
                    All Items
                  </button>
                  <button
                    onClick={() => {
                      setSelectedOffer('discounted');
                      setOpenDropdown(null);
                    }}
                    className="w-full text-left px-3.5 py-1.5 text-xs text-slate-700 hover:bg-emerald-50 font-semibold text-emerald-800"
                  >
                    🔥 Campus Discounts & Combos
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Right Sort By Dropdown */}
          <div className="relative shrink-0">
            <button
              type="button"
              onClick={() => toggleDropdown('sort')}
              className="flex items-center space-x-1.5 border border-slate-200 bg-white px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors whitespace-nowrap shadow-2xs"
            >
              <span>Sort by</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {openDropdown === 'sort' && (
              <div
                className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-40"
                onMouseLeave={() => setOpenDropdown(null)}
              >
                {[
                  { id: 'default', label: 'Default / Popular' },
                  { id: 'price_asc', label: 'Price: Low to High' },
                  { id: 'price_desc', label: 'Price: High to Low' },
                  { id: 'rating', label: 'Highest Rated' }
                ].map((s) => (
                  <button
                    key={s.id}
                    onClick={() => {
                      setSortBy(s.id);
                      setOpenDropdown(null);
                    }}
                    className={`w-full text-left px-3.5 py-1.5 text-xs hover:bg-emerald-50 ${
                      sortBy === s.id ? 'text-emerald-700 font-bold bg-emerald-50/50' : 'text-slate-700'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Active Filters Pill Row if any filter is set */}
        {(selectedCategory !== 'all' ||
          selectedStore !== 'all' ||
          selectedPriceRange !== 'all' ||
          selectedRating !== 'all' ||
          selectedVegFilter !== 'all' ||
          selectedOffer !== 'all') && (
          <div className="flex items-center space-x-2 pt-1 text-xs">
            <span className="text-slate-400 font-medium">Active filters:</span>
            <button
              onClick={() => {
                setSelectedCategory('all');
                setSelectedStore('all');
                setSelectedPriceRange('all');
                setSelectedRating('all');
                setSelectedVegFilter('all');
                setSelectedOffer('all');
              }}
              className="text-xs font-semibold text-rose-600 hover:underline"
            >
              Reset all filters
            </button>
          </div>
        )}
      </section>

      {/* 4. Product Cards Grid (Matching reference 4-column desktop, 2-column mobile layout in Rupees) */}
      <section>
        {filteredProducts.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-3">
            <ShoppingBag className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="text-base font-bold text-slate-800">No campus items match your criteria</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Try adjusting your search query, store selection, or category pills.
            </p>
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory('all');
                setSelectedStore('all');
                setSelectedPriceRange('all');
                setSelectedRating('all');
                setSelectedVegFilter('all');
                setSelectedOffer('all');
              }}
              className="text-xs font-semibold text-emerald-700 hover:underline pt-2"
            >
              Reset all filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-5">
            {filteredProducts.map((product) => (
              <ProductCard key={product._id} product={product} currencySymbol="₹" />
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
