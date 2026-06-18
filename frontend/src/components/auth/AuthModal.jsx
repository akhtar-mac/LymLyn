import { useState } from 'react';
import { X, Loader, Phone, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '@/store/authStore';

export default function AuthModal() {
  const { authModal, setAuthModal, dummySignIn, fetchProfile } = useAuthStore();
  const [step, setStep] = useState('phone'); // 'phone' | 'otp' | 'success'
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  if (!authModal) return null;

  const handleClose = () => {
    setAuthModal(false);
    setTimeout(() => {
      setStep('phone');
      setPhone('');
      setOtp('');
      setError('');
    }, 300);
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (phone.length !== 10) {
      setError('Please enter exactly 10 digits');
      return;
    }
    setError('');
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 800));
    setStep('otp');
    setLoading(false);
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (otp.length !== 6) {
      setError('Please enter a 6-digit code');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await dummySignIn('+91' + phone, otp);
      setStep('success');
      
      // Wait a moment for the user state to sync, then check profile
      setTimeout(async () => {
        const currentUserId = useAuthStore.getState().user?.id;
        if (currentUserId) {
          await fetchProfile(currentUserId);
          const currentProfile = useAuthStore.getState().profile;
          
          handleClose();
          
          // Auto redirect to Account page if profile is incomplete
          if (!currentProfile?.full_name || currentProfile.full_name === 'Guest User' || !currentProfile?.address || !currentProfile?.tryon_photo_url) {
            navigate('/account?tab=profile');
          }
        } else {
          handleClose();
        }
      }, 1200);

    } catch (err) {
      setError(err.message || 'Verification failed');
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="absolute inset-0 bg-ink/60 backdrop-blur-sm animate-fade-in" onClick={handleClose} />

      <div className="relative bg-bg w-full max-w-md animate-scale-in shadow-2xl overflow-hidden rounded-2xl">
        <div className="h-1" style={{ background: 'linear-gradient(90deg, #A23B33, #C4564D)' }} />

        <div className="flex items-center px-6 py-4 border-b border-border relative">
          <div className="flex items-center gap-2.5 z-10">
            <img src="/logo.svg" alt="LYM|LYN" className="h-9 w-9 shrink-0" />
            <span className="font-display font-black tracking-tighter text-ink" style={{ fontSize: '22px', letterSpacing: '-0.04em' }}>
              LYM<span className="text-accent">|</span>LYN
            </span>
          </div>
          <div className="absolute left-0 right-0 text-center pointer-events-none px-[100px]">
            <span className="text-xs font-medium tracking-[0.16em] uppercase text-muted">
              {step === 'phone' && 'Sign In'}
              {step === 'otp' && 'Verify Code'}
              {step === 'success' && 'Success'}
            </span>
          </div>
          <button onClick={handleClose} className="ml-auto z-10 p-1.5 rounded-full text-muted hover:text-ink hover:bg-black/5 transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="px-8 py-8">
          {step === 'phone' && (
            <div className="animate-fade-in">
              <h2 className="font-display text-2xl font-bold text-ink mb-1" style={{ letterSpacing: '-0.02em' }}>Welcome back</h2>
              <p className="text-sm text-muted mb-7">Sign in or create an account with your phone.</p>

              <form onSubmit={handleSendOtp} className="space-y-4">
                <div>
                  <label htmlFor="auth-phone" className="input-label">Phone Number</label>
                  <div className="flex rounded-md border border-border focus-within:border-ink transition-colors bg-white overflow-hidden">
                    <div className="flex items-center justify-center bg-surface px-4 border-r border-border text-ink font-medium shrink-0">
                      +91
                    </div>
                    <input
                      id="auth-phone"
                      type="tel"
                      required
                      autoFocus
                      maxLength={10}
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                      className="w-full bg-transparent px-4 py-3 text-ink outline-none"
                      placeholder="99999 99999"
                    />
                  </div>
                </div>

                {error && <p className="text-xs text-accent animate-fade-in">{error}</p>}

                <button type="submit" disabled={loading || phone.length !== 10} className="btn-primary w-full py-3.5 mt-2">
                  {loading ? <Loader size={16} className="animate-spin" /> : null}
                  {loading ? 'Sending…' : 'Send Login Code'}
                </button>

                <p className="text-xs text-muted text-center pt-2">
                  We'll send a one-time code to your phone.<br/>No password needed.
                </p>
              </form>
            </div>
          )}

          {step === 'otp' && (
            <div className="animate-fade-in">
              <h2 className="font-display text-2xl font-bold text-ink mb-1" style={{ letterSpacing: '-0.02em' }}>Check your phone</h2>
              <p className="text-sm text-muted mb-7">Enter the code sent to +91 {phone}</p>

              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div>
                  <label htmlFor="auth-otp" className="input-label">
                    6-Digit Code <span className="normal-case tracking-normal font-normal opacity-70 ml-1 text-accent">(Demo: Enter 123456)</span>
                  </label>
                  <input
                    id="auth-otp"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]{6}"
                    maxLength={6}
                    required
                    autoFocus
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    className="input text-center text-2xl tracking-[0.3em] font-display"
                    placeholder="000000"
                  />
                </div>

                {error && <p className="text-xs text-accent animate-fade-in">{error}</p>}

                <button type="submit" disabled={loading || otp.length !== 6} className="btn-primary w-full py-3.5">
                  {loading ? <Loader size={16} className="animate-spin" /> : null}
                  {loading ? 'Verifying…' : 'Verify & Sign In'}
                </button>

                <button type="button" onClick={() => { setStep('phone'); setOtp(''); setError(''); }} className="btn-ghost w-full text-xs mt-2">
                  ← Back to phone
                </button>
              </form>
            </div>
          )}

          {step === 'success' && (
            <div className="flex flex-col items-center justify-center py-10 animate-scale-in">
              <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mb-6">
                <CheckCircle2 size={40} className="text-green-600" />
              </div>
              <h2 className="font-display text-2xl font-bold text-ink mb-2">Verified successfully</h2>
              <p className="text-sm text-muted">Preparing your account...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
