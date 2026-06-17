import { useState, useRef } from 'react';
import { Camera, Upload, Loader2, AlertCircle } from 'lucide-react';
import { detectFace } from '@/lib/tryon/faceDetect';
import { extractSkinTone as doExtractSkinTone, createFaceCrop as doCreateFaceCrop } from '@/lib/tryon/skinTone';

export default function SelfieUpload({ onComplete, onBack }) {
  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('');
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const compressImage = async (file, maxSizeMB = 1) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let { width, height } = img;

          // Resize if too large
          const MAX_DIM = 1024;
          if (width > MAX_DIM || height > MAX_DIM) {
            if (width > height) {
              height = Math.round(height * MAX_DIM / width);
              width = MAX_DIM;
            } else {
              width = Math.round(width * MAX_DIM / height);
              height = MAX_DIM;
            }
          }

          canvas.width = width;
          canvas.height = height;
          canvas.getContext('2d').drawImage(img, 0, 0, width, height);

          // Compress to JPEG at 80% quality
          canvas.toBlob((blob) => {
            resolve(new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now(),
            }));
          }, 'image/jpeg', 0.8);
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });
  };

  const processImage = async (file) => {
    if (!file) return;
    
    // File size validation (Max 10MB)
    const MAX_MB = 10;
    if (file.size > MAX_MB * 1024 * 1024) {
      setError(`Photo is too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Please use a photo under ${MAX_MB}MB.`);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }
    
    setLoading(true);
    setLoadingText('Compressing photo...');
    setError(null);
    
    try {
      // Compress the file client-side before processing/upload
      const compressedFile = await compressImage(file);

      setLoadingText('Uploading...');
      const reader = new FileReader();
      reader.onload = (e) => {
        // Return the compressed raw image data to the orchestrator for TryOn
        onComplete({ fullBodyUrl: e.target.result });
      };
      reader.onerror = () => {
        setError("Failed to read the compressed image file.");
        setLoading(false);
      };
      reader.readAsDataURL(compressedFile);
    } catch (err) {
      console.error("Image processing failed:", err);
      setError("Something went wrong. Please try another photo.");
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      processImage(e.target.files[0]);
    }
  };

  return (
    <div className="animate-fade-in w-full max-w-md mx-auto flex flex-col items-center">
      <h2 className="text-2xl font-display font-bold text-ink text-center mb-2">Upload a Photo</h2>
      <p className="text-sm text-muted text-center mb-8">
        We need a clear photo of yourself standing, facing the camera. For privacy, this photo is processed locally on your device and is never stored on our servers.
      </p>

      {error && (
        <div className="bg-accent/10 border border-accent/20 p-4 w-full mb-6 flex items-start gap-3">
          <AlertCircle size={18} className="text-accent shrink-0 mt-0.5" />
          <p className="text-sm text-ink">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-12 space-y-4">
          <Loader2 size={40} className="text-ink animate-spin" />
          <p className="text-sm font-medium animate-pulse">{loadingText}</p>
        </div>
      ) : (
        <div className="w-full space-y-4">
          {/* File Input */}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            ref={fileInputRef}
            onChange={handleFileChange}
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full aspect-square border-2 border-dashed border-border hover:border-ink/50 bg-surface flex flex-col items-center justify-center gap-4 transition-colors group"
          >
            <div className="w-16 h-16 rounded-full bg-border/30 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Upload size={24} className="text-ink" />
            </div>
            <div className="text-center">
              <p className="font-medium text-ink">Choose from device</p>
              <p className="text-xs text-muted mt-1">JPEG or PNG</p>
            </div>
          </button>
          
          <button
            onClick={onBack}
            className="w-full py-3 text-sm text-muted hover:text-ink transition-colors"
          >
            Back to body settings
          </button>
        </div>
      )}
    </div>
  );
}
