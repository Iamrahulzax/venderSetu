import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Store as StoreIcon,
  Clock,
  Bike,
  Phone,
  Search,
  ArrowLeft,
  AlertCircle,
  FileText,
  Eye,
  Filter,
  CheckCircle2,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { apiRequest } from '../../services/api';
import { ProductCard, ProductItem } from '../../components/ProductCard';
import { useSocket } from '../../context/SocketContext';
import { Button } from '../../components/ui/Button';
import { Badge, Chip, VegBadge } from '../../components/ui/Badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/Dialog';

export const StoreDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { joinStoreRoom, leaveStoreRoom } = useSocket();

  const [store, setStore] = useState<any>(null);
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [vegOnly, setVegOnly] = useState<boolean>(false);
  const [menuModalOpen, setMenuModalOpen] = useState<boolean>(false);
  const [activeMenuDoc, setActiveMenuDoc] = useState<any>(null);

  useEffect(() => {
    const fetchStoreAndProducts = async () => {
      try {
        setLoading(true);
        const [storeRes, productsRes] = await Promise.all([
          apiRequest(`/stores/${slug}`),
          apiRequest(`/products?storeId=${slug}&limit=150`)
        ]);

        if (storeRes.success && storeRes.store) {
          setStore(storeRes.store);
          joinStoreRoom(storeRes.store._id);
          if (storeRes.store.menuDocuments && storeRes.store.menuDocuments.length > 0) {
            setActiveMenuDoc(storeRes.store.menuDocuments[0]);
          }
        }

        if (productsRes.success) {
          setProducts(productsRes.products);
        }
      } catch (err) {
        console.error('Error loading store details', err);
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchStoreAndProducts();
    }

    return () => {
      if (store?._id) {
        leaveStoreRoom(store._id);
      }
    };
  }, [slug]);

  const categories = ['all', ...Array.from(new Set(products.map((p) => p.category)))];

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      searchTerm === '' ||
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCategory =
      selectedCategory === 'all' || p.category.toLowerCase() === selectedCategory.toLowerCase();

    const matchesVeg = !vegOnly || p.isVeg !== false;

    return matchesSearch && matchesCategory && matchesVeg;
  });

  const isFoodStore =
    store?.storeType === 'food' ||
    ['college-canteen', 'durga-fast-food', 'monal-fast-food'].includes(store?.slug);

  if (loading) {
    return (
      <div className="py-24 text-center space-y-3">
        <div className="inline-block w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-stone-500 font-medium">Loading store profile and live catalogue...</p>
      </div>
    );
  }

  if (!store) {
    return (
      <div className="bg-white rounded-3xl border border-stone-200 p-12 text-center space-y-4">
        <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
        <h2 className="text-lg font-bold text-stone-800">Store Not Found</h2>
        <p className="text-xs text-stone-500">The store you requested does not exist or has been relocated.</p>
        <Link to="/stores">
          <Button variant="solid" size="sm" withArrow>
            Back to Stores
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      {/* Top back navigation */}
      <div className="flex items-center justify-between">
        <Link
          to="/stores"
          className="inline-flex items-center space-x-1.5 text-xs font-semibold text-stone-600 hover:text-emerald-700 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to All Campus Stores</span>
        </Link>

        {/* View Physical Menu button if documents uploaded */}
        {store.menuDocuments && store.menuDocuments.length > 0 && (
          <Button
            variant="solid"
            size="sm"
            onClick={() => setMenuModalOpen(true)}
            className="text-xs font-semibold"
          >
            <FileText className="w-3.5 h-3.5 mr-1 text-amber-400" />
            <span>View Store Menu Card</span>
          </Button>
        )}
      </div>

      {/* Hero Store Profile Banner */}
      <div className="relative rounded-3xl border border-stone-200/90 overflow-hidden bg-white shadow-sm">
        {store.bannerImage && (
          <div className="h-44 sm:h-52 w-full overflow-hidden relative">
            <img
              src={store.bannerImage}
              alt={store.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-stone-950/80 via-stone-950/30 to-transparent" />
          </div>
        )}

        <div className="p-6 sm:p-8 relative">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-bold text-xl shadow-md">
                  <StoreIcon className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h1 className="text-xl sm:text-2xl font-bold text-stone-900 brand-font">
                      {store.name}
                    </h1>
                    <span
                      className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                        store.isOpen
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {store.isOpen ? 'Open Now' : 'Closed'}
                    </span>
                  </div>
                  <p className="text-xs text-stone-500 mt-0.5">{store.location}</p>
                </div>
              </div>

              <p className="text-xs sm:text-sm text-stone-600 max-w-2xl leading-relaxed">
                {store.description}
              </p>

              <div className="flex flex-wrap gap-4 pt-1 text-xs text-stone-600">
                <div className="flex items-center space-x-1.5">
                  <Clock className="w-3.5 h-3.5 text-stone-400" />
                  <span>{store.openingHours}</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <Bike className="w-3.5 h-3.5 text-emerald-600" />
                  <span>
                    {store.offersDelivery
                      ? `Hostel Delivery (₹${store.deliveryFee}) • Prep: ${store.estimatedPrepTime}`
                      : 'Counter Pickup Only'}
                  </span>
                </div>
                {store.contactPhone && (
                  <div className="flex items-center space-x-1.5">
                    <Phone className="w-3.5 h-3.5 text-stone-400" />
                    <span>{store.contactPhone}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Quick store facts pill */}
            <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200/80 text-xs text-stone-600 space-y-1.5 shrink-0 min-w-[210px]">
              <p className="font-bold text-stone-900 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Store Summary</span>
              </p>
              <p>• Catalogue: <strong>{products.length} live items</strong></p>
              <p>• Min Order: <strong>₹{store.minimumOrder || 0}</strong></p>
              <p>• Multi-Store Cart Enabled</p>
              {isFoodStore && (
                <p className="text-emerald-700 font-semibold">• Live Fast Food Digital Menu</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Filters, Veg Toggle & In-Store Search Bar */}
      <div className="sticky top-16 z-30 bg-stone-50/95 backdrop-blur-md py-3 -my-3 space-y-2">
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          {/* Search box */}
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={`Search in ${store.name}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-white border border-stone-200 rounded-xl text-xs placeholder:text-stone-400 focus:outline-none focus:border-stone-900 focus:ring-1 focus:ring-stone-900/10 shadow-sm"
            />
          </div>

          {/* Controls: Veg Only Toggle & Results Count */}
          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
            {isFoodStore && (
              <label className="flex items-center gap-2 cursor-pointer bg-white px-3 py-1.5 rounded-xl border border-stone-200 shadow-sm text-xs font-semibold text-stone-800 select-none">
                <VegBadge isVeg={true} />
                <span>Veg Only</span>
                <input
                  type="checkbox"
                  checked={vegOnly}
                  onChange={(e) => setVegOnly(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer ml-1"
                />
              </label>
            )}

            <span className="text-xs text-stone-500 font-medium whitespace-nowrap">
              Showing <strong>{filteredProducts.length}</strong> items
            </span>
          </div>
        </div>

        {/* Categories scroll row */}
        <div className="flex items-center space-x-1.5 overflow-x-auto w-full pb-1 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold capitalize whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-white text-stone-600 border border-stone-200/80 hover:bg-stone-100 hover:text-stone-900'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Product / Menu Grid */}
      {filteredProducts.length === 0 ? (
        <div className="bg-white rounded-3xl border border-stone-200 p-12 text-center text-xs text-stone-500 space-y-2">
          <p className="font-semibold text-stone-800 text-sm">No items match your filter.</p>
          <p>Try clearing your search keyword or switching category tabs.</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSearchTerm('');
              setSelectedCategory('all');
              setVegOnly(false);
            }}
          >
            Reset Filters
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredProducts.map((product) => (
            <ProductCard key={product._id} product={product} />
          ))}
        </div>
      )}

      {/* Store Menu Card Viewer Modal */}
      {store.menuDocuments && store.menuDocuments.length > 0 && (
        <Dialog open={menuModalOpen} onOpenChange={setMenuModalOpen}>
          <DialogContent onClose={() => setMenuModalOpen(false)} className="max-w-3xl max-h-[90vh] p-0 overflow-hidden">
            <DialogHeader className="p-5 pb-3 border-b border-stone-100 flex flex-row items-center justify-between">
              <div>
                <DialogTitle className="text-base font-bold text-stone-900">
                  {store.name} — Official Menu Card
                </DialogTitle>
                <p className="text-xs text-stone-500">
                  Seller verified physical store menu card
                </p>
              </div>

              {/* Document switcher if multiple */}
              {store.menuDocuments.length > 1 && (
                <div className="flex gap-1.5">
                  {store.menuDocuments.map((doc: any, idx: number) => (
                    <Button
                      key={idx}
                      variant={activeMenuDoc?.fileUrl === doc.fileUrl ? 'solid' : 'outline'}
                      size="sm"
                      onClick={() => setActiveMenuDoc(doc)}
                      className="text-xs"
                    >
                      Menu {idx + 1}
                    </Button>
                  ))}
                </div>
              )}
            </DialogHeader>

            <div className="p-4 overflow-y-auto max-h-[72vh] flex flex-col items-center justify-center bg-stone-900/5">
              {activeMenuDoc && activeMenuDoc.fileType === 'pdf' ? (
                <iframe
                  src={activeMenuDoc.fileUrl}
                  title="Store Menu PDF"
                  className="w-full h-[65vh] rounded-2xl border border-stone-200"
                />
              ) : activeMenuDoc ? (
                <img
                  src={activeMenuDoc.fileUrl}
                  alt={activeMenuDoc.title || 'Store Menu Card'}
                  className="max-h-[65vh] w-auto object-contain rounded-2xl shadow-md border border-stone-200"
                />
              ) : null}
            </div>

            <div className="p-3 bg-stone-50 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500">
              <span>You can order any item directly using the digital menu cards below.</span>
              {activeMenuDoc && (
                <a
                  href={activeMenuDoc.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald-700 hover:text-emerald-800 font-semibold flex items-center gap-1"
                >
                  <span>Open Full Screen</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};
