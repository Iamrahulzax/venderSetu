import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Store as StoreIcon, Clock, Bike, MapPin, Phone, ArrowRight, CheckCircle2 } from 'lucide-react';
import { apiRequest } from '../../services/api';

export const StoresPage: React.FC = () => {
  const [stores, setStores] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchStores = async () => {
      try {
        setLoading(true);
        const data = await apiRequest('/stores');
        if (data.success) {
          setStores(data.stores);
        }
      } catch (err) {
        console.error('Failed to load stores', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStores();
  }, []);

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200">
        <div className="max-w-2xl space-y-2">
          <div className="inline-flex items-center space-x-1.5 bg-emerald-50 text-emerald-800 text-xs font-semibold px-2.5 py-1 rounded-full">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>5 Authorized Campus Merchants</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 brand-font">
            Campus Stores & Canteens
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Every store operates its own independent inventory, order queue, and fulfillment
            timelines. Add items from multiple shops in one cart.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center space-y-3">
          <div className="inline-block w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-500 font-medium">Fetching participating campus stores...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {stores.map((store) => (
            <div
              key={store._id}
              className="bg-white rounded-3xl border border-slate-200 p-6 flex flex-col justify-between hover:shadow-lg hover:border-emerald-300 transition-all group"
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-lg group-hover:scale-105 transition-transform">
                    <StoreIcon className="w-6 h-6" />
                  </div>
                  <span
                    className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                      store.isOpen
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {store.isOpen ? 'Open Now' : 'Closed'}
                  </span>
                </div>

                <div>
                  <h2 className="text-lg font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                    {store.name}
                  </h2>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                    {store.description}
                  </p>
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-100 text-xs text-slate-600">
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                    <span className="truncate">{store.location}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>{store.openingHours}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Bike className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>
                      {store.offersDelivery
                        ? `Delivery available (₹${store.deliveryFee}) • Min order ₹${store.minimumOrder}`
                        : 'Self pickup only'}
                    </span>
                  </div>
                  {store.contactPhone && (
                    <div className="flex items-center space-x-2">
                      <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                      <span>{store.contactPhone}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">
                  {store.productCount} active items
                </span>

                <Link
                  to={`/stores/${store.slug}`}
                  className="inline-flex items-center space-x-1.5 bg-slate-900 hover:bg-emerald-600 text-white px-4 py-2 rounded-xl text-xs font-semibold transition-colors shadow-sm"
                >
                  <span>View Catalogue</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
