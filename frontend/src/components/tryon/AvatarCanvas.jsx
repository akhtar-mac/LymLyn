import { useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { renderAvatar } from '@/lib/tryon/compositor';

export default function AvatarCanvas({ config, onReset }) {
  const canvasRef = useRef(null);
  const [rendering, setRendering] = useState(true);

  useEffect(() => {
    let active = true;

    const draw = async () => {
      if (!canvasRef.current || !config.avatarSvgUrl) return;
      
      setRendering(true);
      try {
        await renderAvatar(canvasRef.current, config);
      } catch (err) {
        console.error("Failed to render avatar:", err);
      } finally {
        if (active) setRendering(false);
      }
    };

    draw();
    
    return () => { active = false; };
  }, [config]);

  return (
    <div className="w-full flex flex-col items-center animate-fade-in">
      <h2 className="text-2xl font-display font-bold text-ink mb-6">Your Look</h2>
      
      <div className="relative w-full max-w-[300px] aspect-[2/5] bg-surface border border-border overflow-hidden">
        {rendering && (
          <div className="absolute inset-0 bg-surface/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center">
            <Loader2 size={32} className="text-ink animate-spin mb-2" />
            <span className="text-xs font-medium">Stitching it together...</span>
          </div>
        )}
        
        <canvas
          ref={canvasRef}
          width={600} // High res internal canvas
          height={1500}
          className="w-full h-full object-contain"
        />
      </div>

      <button
        onClick={onReset}
        className="mt-8 text-sm font-medium text-muted hover:text-ink transition-colors underline"
      >
        Start over with a different photo
      </button>
    </div>
  );
}
