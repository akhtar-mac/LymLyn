import { useState, useEffect } from 'react';
import useAuthStore from '@/store/authStore';

export default function BodySelector({ onComplete, defaultGender = 'female', isGenderLocked = false }) {
  const { profile } = useAuthStore();
  
  const [gender, setGender] = useState(defaultGender);
  const [bodyType, setBodyType] = useState('average');
  
  // Pre-fill from profile if available (only if not locked by product category)
  useEffect(() => {
    if (profile && !isGenderLocked) {
      if (profile.gender && ['male', 'female'].includes(profile.gender)) {
        setGender(profile.gender);
      }
      if (profile.body_type && ['slim', 'average', 'heavy'].includes(profile.body_type)) {
        setBodyType(profile.body_type);
      }
    }
  }, [profile, isGenderLocked]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onComplete({ gender, bodyType });
  };

  return (
    <div className="animate-fade-in w-full max-w-md mx-auto">
      <h2 className="text-2xl font-display font-bold text-ink text-center mb-2">Your Body Profile</h2>
      <p className="text-sm text-muted text-center mb-8">
        Select the options that best match your body to generate an accurate virtual avatar.
      </p>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Gender Selection */}
        <div>
          <label className="input-label block mb-3">Gender Silhouette</label>
          <div className="grid grid-cols-2 gap-3">
            {[
              { id: 'female', label: 'Female / Curvy' },
              { id: 'male', label: 'Male / Straight' }
            ].map((opt) => {
              const isSelected = gender === opt.id;
              const isDisabled = isGenderLocked && !isSelected;
              return (
                <button
                  key={opt.id}
                  type="button"
                  disabled={isDisabled}
                  onClick={() => !isDisabled && setGender(opt.id)}
                  className={`p-4 border text-center transition-all ${
                    isSelected 
                      ? 'border-ink bg-surface font-medium' 
                      : isDisabled 
                        ? 'border-border/50 text-muted/30 cursor-not-allowed bg-surface/30'
                        : 'border-border text-muted hover:border-ink/50'
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Body Type Selection */}
        <div>
          <label className="input-label block mb-3">Body Type</label>
          <div className="grid grid-cols-3 gap-3">
            {[
              { id: 'slim', label: 'Slim' },
              { id: 'average', label: 'Average' },
              { id: 'heavy', label: 'Heavy' }
            ].map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setBodyType(opt.id)}
                className={`p-3 border text-sm text-center transition-all ${
                  bodyType === opt.id 
                    ? 'border-ink bg-surface font-medium' 
                    : 'border-border text-muted hover:border-ink/50'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <button type="submit" className="btn-primary w-full py-4 text-base">
          Continue to Photo
        </button>
      </form>
    </div>
  );
}
