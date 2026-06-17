import { useState, useEffect } from 'react';
import { X, Loader2, AlertCircle } from 'lucide-react';
import BodySelector from './BodySelector';
import SelfieUpload from './SelfieUpload';
import AvatarCanvas from './AvatarCanvas';
import { generateTryon } from '@/lib/tryonApi';

export default function TryOnModal({ isOpen, onClose, product, selectedColor }) {
  const [step, setStep] = useState(1); // 1: Body, 2: Upload, 3: Generating, 4: Result
  
  // Try-on State
  const [bodySpecs, setBodySpecs] = useState(null);
  const [faceData, setFaceData] = useState(null); // Actually fullBodyUrl now
  const [avatarAnchors, setAvatarAnchors] = useState(null);
  const [aiResultUrl, setAiResultUrl] = useState(null);
  const [useFallback, setUseFallback] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  
  // Reset when opened
  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setAiResultUrl(null);
      setUseFallback(false);
      setErrorMsg(null);
    }
  }, [isOpen]);

  // Load anchors for fallback
  useEffect(() => {
    if (bodySpecs) {
      const { gender, bodyType } = bodySpecs;
      const loadAnchors = async () => {
        try {
          const res = await fetch(`/tryon/avatars/${gender}-${bodyType}.json`);
          const data = await res.json();
          setAvatarAnchors(data);
        } catch (e) {
          console.error("Failed to load avatar anchors", e);
        }
      };
      loadAnchors();
    }
  }, [bodySpecs]);

  if (!isOpen) return null;

  const handleBodyComplete = (specs) => {
    setBodySpecs(specs);
    setStep(2);
  };

  const handleUploadComplete = async (data) => {
    setFaceData(data);
    setStep(3); // Start generation
    setErrorMsg(null);
    
    try {
      let garmentUrl = '/tryon/product-cutouts/essential-tee.jpg'; // fallback
      if (product?.product_images?.length > 0) {
        // Find cutout image if it exists, otherwise fallback to the first available image
        const cutoutImg = product.product_images.find(img => img.image_type === 'cutout') || product.product_images[0];
        garmentUrl = cutoutImg.image_url;
      } else if (product?.garment_type === 'lower') {
        garmentUrl = '/tryon/product-cutouts/pants.jpg';
      }
      
      const desc = `${product?.name || 'clothing item'}, ${product?.garment_type || 'tshirt'}`;
      
      const result = await generateTryon(data.fullBodyUrl, garmentUrl, desc);
      setAiResultUrl(result.image);
      setStep(4);
    } catch (err) {
      console.error(err);
      if (err.code === 'model_loading') {
        setErrorMsg('AI is warming up. Retrying in 30 seconds...');
        // Stay on step 3 (loading)
        setTimeout(() => handleUploadComplete(data), 30000);
        return;
      }
      
      setErrorMsg(err.message || "AI Try-On failed. Please try again later.");
      setStep(2);
    }
  };
  
  const handleReset = () => {
    setStep(1);
    setFaceData(null);
    setAiResultUrl(null);
    setUseFallback(false);
  };

  let garmentUrl = null;
  if (product && step >= 3) {
    if (product.product_images?.length > 0) {
      const cutoutImg = product.product_images.find(img => img.image_type === 'cutout') || product.product_images[0];
      garmentUrl = cutoutImg.image_url;
    } else if (product.garment_type === 'lower') {
      garmentUrl = '/tryon/product-cutouts/pants.jpg';
    } else {
      garmentUrl = '/tryon/product-cutouts/essential-tee.jpg';
    }
  }

  // Construct config for fallback compositor
  const compositorConfig = {
    avatarSvgUrl: bodySpecs ? `/tryon/avatars/${bodySpecs.gender}-${bodySpecs.bodyType}.svg` : null,
    avatarAnchors: avatarAnchors,
    faceCropUrl: faceData?.fullBodyUrl, // the face detector is gone, so this acts as the "face crop" in fallback which will look weird but it's a fallback
    skinToneHex: null,
    garmentUrl: garmentUrl,
    garmentType: product?.garment_type || 'tshirt'
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-12">
      <div className="absolute inset-0 bg-ink/40 backdrop-blur-sm animate-fade-in" onClick={onClose} />
      
      <div className="relative w-full max-w-2xl bg-white shadow-2xl rounded-xl overflow-hidden flex flex-col max-h-full animate-slide-up">
        
        <div className="flex items-center justify-between p-4 border-b border-border shrink-0">
          <div className="flex items-center gap-2">
            <span className="font-display font-bold text-ink text-lg tracking-tight">Virtual Try-On</span>
            <span className="px-2 py-0.5 bg-accent/10 text-accent text-xs font-bold uppercase tracking-wider rounded-full">AI Powered</span>
          </div>
          <button onClick={onClose} className="p-2 text-muted hover:text-ink hover:bg-surface rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 md:p-10 overflow-y-auto">
          {errorMsg && (
            <div className="mb-6 p-3 bg-accent/10 border border-accent/20 text-accent text-sm rounded-lg flex items-center gap-2">
              <AlertCircle size={16} /> {errorMsg}
            </div>
          )}

          {step === 1 && (() => {
            let defaultGender = 'female';
            let isGenderLocked = false;
            
            const catName = product?.categories?.name?.toLowerCase() || '';
            if (catName.includes('men') && !catName.includes('women')) {
              defaultGender = 'male';
              isGenderLocked = true;
            } else if (catName.includes('women')) {
              defaultGender = 'female';
              isGenderLocked = true;
            }
            return <BodySelector onComplete={handleBodyComplete} defaultGender={defaultGender} isGenderLocked={isGenderLocked} />;
          })()}
          
          {step === 2 && <SelfieUpload onComplete={handleUploadComplete} onBack={() => setStep(1)} />}
          
          {step === 3 && (
            <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-in">
              <div className="relative mb-8">
                <div className="absolute inset-0 bg-accent/20 blur-xl rounded-full" />
                <Loader2 size={64} className="text-accent animate-spin relative z-10" />
              </div>
              <h3 className="text-2xl font-display font-bold text-ink mb-3">Generating your Try-On...</h3>
              <p className="text-muted max-w-sm mx-auto">
                Our Kolors AI is analyzing your photo and stitching the garment perfectly to your body. This usually takes 20-60 seconds. Hang tight!
              </p>
            </div>
          )}
          
          {step === 4 && !useFallback && aiResultUrl && (
            <div className="flex flex-col items-center animate-fade-in">
              <h2 className="text-2xl font-display font-bold text-ink mb-6">Your Look</h2>
              <div className="w-full max-w-[400px] bg-surface border border-border overflow-hidden rounded-xl shadow-lg">
                <img src={aiResultUrl} alt="AI Generated Try-On" className="w-full h-auto object-cover" />
              </div>
              <div className="flex flex-col items-center gap-4 mt-8">
                <a 
                  href={aiResultUrl} 
                  download="my_kolors_look.jpg"
                  className="bg-ink text-white px-8 py-3 rounded-full font-bold uppercase tracking-widest text-sm hover:bg-accent transition-colors text-center"
                >
                  Download Result
                </a>
                <button onClick={handleReset} className="text-sm font-medium text-muted hover:text-ink transition-colors underline">
                  Start over with a different photo
                </button>
              </div>
            </div>
          )}

          {step === 4 && useFallback && (
            <AvatarCanvas config={compositorConfig} onReset={handleReset} />
          )}
        </div>
        
        {step < 3 && (
          <div className="p-4 bg-surface text-center text-xs text-muted border-t border-border mt-auto">
            Your photos are processed entirely on your device and are never uploaded to our servers permanently.
          </div>
        )}
      </div>
    </div>
  );
}
