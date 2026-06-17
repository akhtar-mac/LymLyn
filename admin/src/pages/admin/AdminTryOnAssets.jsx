import { useState } from 'react';
import { Wand2, AlertTriangle } from 'lucide-react';
import useAdminAuth from '@/hooks/useAdminAuth';

export default function AdminTryOnAssets() {
  useAdminAuth();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-white">Try-On Assets</h1>
        <p className="text-sm text-white/40 mt-0.5">Manage avatar templates and product cutouts</p>
      </div>

      <div className="bg-[#1A1A1A] border border-amber-500/20 rounded-xl p-5 flex items-start gap-3">
        <AlertTriangle size={16} className="text-amber-400 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-white">Phase 5 — Coming Soon</p>
          <p className="text-xs text-white/50 mt-1 leading-relaxed">
            Avatar template management and product cutout uploads will be built during Phase 5 (Virtual Try-On) of the main project plan.
            The database tables (<code className="text-accent">avatar_templates</code>, <code className="text-accent">product_images</code>) are already in place — this UI is the management interface for them.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-[#1A1A1A] border border-white/5 rounded-xl p-5">
          <Wand2 size={24} className="text-accent mb-3" />
          <h2 className="text-base font-semibold text-white mb-1">Avatar Templates</h2>
          <p className="text-xs text-white/40 leading-relaxed">
            The 12–16 parametric SVG silhouettes (2 genders × 3 body types × 2–3 sizes) with front/back/side views and anchor-point JSON.
            Will allow re-upload and anchor editing without code changes.
          </p>
        </div>
        <div className="bg-[#1A1A1A] border border-white/5 rounded-xl p-5">
          <Wand2 size={24} className="text-white/30 mb-3" />
          <h2 className="text-base font-semibold text-white mb-1">Product Cutouts</h2>
          <p className="text-xs text-white/40 leading-relaxed">
            Per-product flat/cutout images (background-removed via rembg) used as the garment overlay in the try-on canvas.
            Will flag products missing a cutout so they can be completed before launching try-on.
          </p>
        </div>
      </div>
    </div>
  );
}
