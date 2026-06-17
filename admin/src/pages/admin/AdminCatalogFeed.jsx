import { useState, useEffect, useRef } from 'react';
import { Globe, Package, TrendingUp, TrendingDown, RotateCcw, Zap } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

function EventPill({ event }) {
  const icons = {
    price_drop: <TrendingDown size={13} className="text-emerald-400 shrink-0" />,
    restock: <RotateCcw size={13} className="text-blue-400 shrink-0" />,
    new_product: <Package size={13} className="text-accent shrink-0" />,
    back_in_stock: <Zap size={13} className="text-amber-400 shrink-0" />,
    update: <TrendingUp size={13} className="text-white/40 shrink-0" />,
  };
  const labels = {
    price_drop: 'Price Drop',
    restock: 'Restock',
    new_product: 'New Product',
    back_in_stock: 'Back In Stock',
    update: 'Updated',
  };

  return (
    <div className="flex items-start gap-3 p-4 bg-[#1A1A1A] border border-white/5 rounded-xl hover:border-white/10 transition-colors animate-fade-in">
      <div className="mt-0.5">{icons[event.type] || icons.update}</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-bold text-white/70 uppercase tracking-wider">{labels[event.type] || 'Event'}</p>
          <span className="text-[11px] text-white/25 shrink-0">{new Date(event.created_at || Date.now()).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
        <p className="text-sm font-medium text-white mt-0.5 truncate">{event.product_name || 'Unknown Product'}</p>
        <p className="text-xs text-white/40 mt-0.5">{event.detail}</p>
      </div>
    </div>
  );
}

export default function AdminCatalogFeed() {
  const [events, setEvents] = useState([
    // Seed with some demo events while real-time loads
    { id: 'demo1', type: 'new_product', product_name: "Men's T-Shirt - Style 1", detail: 'Added to catalogue', created_at: new Date().toISOString() },
    { id: 'demo2', type: 'restock', product_name: "Women's Pants - Style 5", detail: 'Restocked: +50 units (S, M, L)', created_at: new Date(Date.now() - 120000).toISOString() },
    { id: 'demo3', type: 'back_in_stock', product_name: "Men's Pants - Style 3", detail: 'Previously out of stock — now available', created_at: new Date(Date.now() - 300000).toISOString() },
  ]);
  const [connected, setConnected] = useState(false);
  const channelRef = useRef(null);

  useEffect(() => {
    // Subscribe to Supabase Realtime for product/stock changes
    const channel = supabase
      .channel('catalog-feed-marketing')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'products' }, (payload) => {
        setEvents((prev) => [{
          id: `prod-${payload.new.id}`,
          type: 'new_product',
          product_name: payload.new.name,
          detail: `Base price: ₹${payload.new.base_price}`,
          created_at: payload.new.created_at || new Date().toISOString(),
        }, ...prev].slice(0, 50));
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'products' }, (payload) => {
        setEvents((prev) => [{
          id: `prod-upd-${payload.new.id}-${Date.now()}`,
          type: payload.new.base_price < payload.old?.base_price ? 'price_drop' : 'update',
          product_name: payload.new.name,
          detail: payload.new.base_price < payload.old?.base_price
            ? `Price dropped from ₹${payload.old?.base_price} → ₹${payload.new.base_price}`
            : 'Product details updated',
          created_at: new Date().toISOString(),
        }, ...prev].slice(0, 50));
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'product_variants' }, (payload) => {
        if (payload.new.stock_qty > 0 && payload.old?.stock_qty === 0) {
          setEvents((prev) => [{
            id: `var-back-${payload.new.id}-${Date.now()}`,
            type: 'back_in_stock',
            product_name: `Variant SKU: ${payload.new.sku}`,
            detail: `Now has ${payload.new.stock_qty} units`,
            created_at: new Date().toISOString(),
          }, ...prev].slice(0, 50));
        }
      })
      .subscribe((status) => {
        setConnected(status === 'SUBSCRIBED');
      });

    channelRef.current = channel;
    return () => supabase.removeChannel(channel);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-white flex items-center gap-2">
            <Globe size={22} className="text-accent" /> Live Catalog Feed
          </h1>
          <p className="text-sm text-white/40 mt-0.5">Real-time product, price, and stock events</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${connected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
          <span className="text-xs text-white/40">{connected ? 'Live' : 'Connecting...'}</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'New Products (today)', value: events.filter((e) => e.type === 'new_product').length, color: 'text-accent' },
          { label: 'Price Drops', value: events.filter((e) => e.type === 'price_drop').length, color: 'text-emerald-400' },
          { label: 'Back In Stock', value: events.filter((e) => e.type === 'back_in_stock').length, color: 'text-amber-400' },
        ].map((s) => (
          <div key={s.label} className="bg-[#1A1A1A] border border-white/5 rounded-xl p-4 text-center">
            <p className={`text-2xl font-display font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-white/40 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="space-y-2">
        <p className="text-xs font-bold text-white/30 uppercase tracking-wider">Event Stream (newest first)</p>
        {events.length === 0 ? (
          <p className="text-sm text-white/30 text-center py-12">Listening for catalog events...</p>
        ) : (
          events.map((event) => <EventPill key={event.id} event={event} />)
        )}
      </div>
    </div>
  );
}
