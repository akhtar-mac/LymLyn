import { useState } from 'react';
import { X, Loader, Phone } from 'lucide-react';
import useAuthStore from '@/store/authStore';

/**
 * Dummy OTP-based auth flow:
 * Step 1: enter phone → simulates OTP send
 * Step 2: enter OTP → simulates verification → creates dummy session
 */
export default function AuthModal() {
  const { authModal, setAuthModal, dummySignIn } = useAuthStore();
  const [step, setStep] = useState('phone'); // 'phone' | 'otp'
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!authModal) return null;

  const handleClose = () => {
    setAuthModal(false);
    setStep('phone');
    setPhone('');
    setOtp('');
    setError('');
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    const digitsOnly = phone.replace(/\D/g, '');
    if (digitsOnly.length < 10 && !digitsOnly.includes('123456')) {
      setError('Please enter a valid phone number');
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
    await new Promise(resolve => setTimeout(resolve, 800));
    const isAdmin = phone.replace(/\D/g, '').includes('123456');
    dummySignIn(isAdmin);
    setLoading(false);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Sign in"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-ink/60 backdrop-blur-sm animate-fade-in"
        onClick={handleClose}
      />

      {/* Modal Card */}
      <div className="relative bg-bg w-full max-w-md animate-scale-in shadow-2xl overflow-hidden rounded-2xl">

        {/* Accent top bar */}
        <div className="h-1" style={{ background: 'linear-gradient(90deg, #A23B33, #C4564D)' }} />

        {/* ── Modal Header: Logo left · Name center ── */}
        <div
          className="flex items-center px-6 py-4 border-b border-border"
          style={{ position: 'relative' }}
        >
          {/* Logo left */}
          <div className="flex items-center gap-2.5 z-10">
            <img src="/logo.svg" alt="LYM|LYN" className="h-9 w-9 shrink-0" />
            <span
              className="font-display font-black tracking-tighter text-ink"
              style={{ fontSize: '22px', letterSpacing: '-0.04em' }}
            >
              LYM<span className="text-accent">|</span>LYN
            </span>
          </div>

          {/* Center title */}
          <div
            className="absolute left-0 right-0 text-center pointer-events-none"
            style={{ paddingLeft: '100px', paddingRight: '40px' }}
          >
            <span className="text-xs font-medium tracking-[0.16em] uppercase text-muted">
              {step === 'phone' ? 'Sign In' : 'Verify Code'}
            </span>
          </div>

          {/* Close button right */}
          <button
            onClick={handleClose}
            className="ml-auto z-10 p-1.5 rounded-full text-muted hover:text-ink hover:bg-black/5 transition-colors"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* ── Modal Body ── */}
        <div className="px-8 py-8">
          <h2 className="font-display text-2xl font-bold text-ink mb-1" style={{ letterSpacing: '-0.02em' }}>
            {step === 'phone' ? 'Welcome back' : 'Check your phone'}
          </h2>
          <p className="text-sm text-muted mb-7">
            {step === 'phone'
              ? 'Sign in or create an account with your phone.'
              : `Enter the code sent to ${phone}`}
          </p>

          {step === 'phone' ? (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div>
                <label htmlFor="auth-phone" className="input-label">Phone Number</label>
                <div className="relative">
                  <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                  <input
                    id="auth-phone"
                    type="tel"
                    required
                    autoFocus
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="input pl-9"
                    placeholder="+91 99999 99999"
                  />
                </div>
              </div>

              {error && <p className="text-xs text-accent animate-fade-in">{error}</p>}

              <button type="submit" disabled={loading} className="btn-primary w-full py-3.5">
                {loading ? <Loader size={16} className="animate-spin" /> : null}
                {loading ? 'Sending…' : 'Send Login Code'}
              </button>

              <p className="text-xs text-muted text-center">
                We'll send a one-time code to your phone. No password needed.
                <br /><span className="text-accent/70">(Demo: Enter any phone)</span>
              </p>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <label htmlFor="auth-otp" className="input-label">6-Digit Code</label>
                <input
                  id="auth-otp"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  required
                  autoFocus
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className="input text-center text-2xl tracking-[0.3em] font-display"
                  placeholder="000000"
                />
              </div>

              {error && <p className="text-xs text-accent animate-fade-in">{error}</p>}

              <button type="submit" disabled={loading} className="btn-primary w-full py-3.5">
                {loading ? <Loader size={16} className="animate-spin" /> : null}
                {loading ? 'Verifying…' : 'Verify & Sign In'}
              </button>

              <button
                type="button"
                onClick={() => { setStep('phone'); setOtp(''); setError(''); }}
                className="btn-ghost w-full text-xs"
              >
                ← Back to phone
              </button>
              <p className="text-xs text-muted text-center">
                <span className="text-accent/70">(Demo: Enter any 6 digits)</span>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
