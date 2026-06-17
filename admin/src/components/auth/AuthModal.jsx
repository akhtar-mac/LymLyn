import { useState } from 'react';
import { X, Loader, Mail } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import useAuthStore from '@/store/authStore';

/**
 * OTP-based auth flow:
 * Step 1: enter email → sends OTP
 * Step 2: enter OTP → verifies → creates session
 */
export default function AuthModal() {
  const { authModal, setAuthModal } = useAuthStore();
  const [step, setStep] = useState('email'); // 'email' | 'otp'
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!authModal) return null;

  const handleClose = () => {
    setAuthModal(false);
    setStep('email');
    setEmail('');
    setOtp('');
    setError('');
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { error: err } = await supabase.auth.signInWithOtp({ email: email.trim() });

    if (err) {
      setError(err.message);
    } else {
      setStep('otp');
    }
    setLoading(false);
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { error: err } = await supabase.auth.verifyOtp({
      email: email.trim(),
      token: otp.trim(),
      type: 'email',
    });

    if (err) {
      setError(err.message);
    } else {
      handleClose();
    }
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

      {/* Modal */}
      <div className="relative bg-bg w-full max-w-md p-8 animate-scale-in">
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-muted hover:text-ink transition-colors"
          aria-label="Close"
        >
          <X size={20} />
        </button>

        <div className="mb-8">
          <p className="font-display text-4xl font-bold text-ink mb-1">
            LYM<span className="text-accent">|</span>LYN
          </p>
          <p className="text-sm text-muted">
            {step === 'email' ? 'Sign in or create an account' : `Enter the code sent to ${email}`}
          </p>
        </div>

        {step === 'email' ? (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <div>
              <label htmlFor="auth-email" className="input-label">Email Address</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                <input
                  id="auth-email"
                  type="email"
                  required
                  autoFocus
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input pl-9"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            {error && <p className="text-xs text-accent animate-fade-in">{error}</p>}

            <button type="submit" disabled={loading} className="btn-primary w-full py-3.5">
              {loading ? <Loader size={16} className="animate-spin" /> : null}
              {loading ? 'Sending...' : 'Send Login Code'}
            </button>

            <p className="text-xs text-muted text-center">
              We'll send a one-time code to your email. No password needed.
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
                className="input text-center text-2xl tracking-widest font-mono"
                placeholder="000000"
              />
            </div>

            {error && <p className="text-xs text-accent animate-fade-in">{error}</p>}

            <button type="submit" disabled={loading} className="btn-primary w-full py-3.5">
              {loading ? <Loader size={16} className="animate-spin" /> : null}
              {loading ? 'Verifying...' : 'Verify & Sign In'}
            </button>

            <button
              type="button"
              onClick={() => { setStep('email'); setOtp(''); setError(''); }}
              className="btn-ghost w-full text-xs"
            >
              ← Back to email
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
