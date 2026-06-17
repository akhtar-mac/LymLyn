import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import useAuthStore from '@/store/authStore';

export default function Login() {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState('email'); // 'email' | 'otp'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { initialize, dummySignIn } = useAuthStore();

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (email.includes('123456')) {
      await new Promise(resolve => setTimeout(resolve, 800));
      setStep('otp');
      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.signInWithOtp({ email });
    if (error) {
      setError(error.message);
    } else {
      setStep('otp');
    }
    setLoading(false);
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (email.includes('123456')) {
      await new Promise(resolve => setTimeout(resolve, 800));
      dummySignIn();
      await initialize();
      navigate('/admin');
      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.verifyOtp({ email, token: otp, type: 'email' });
    if (error) {
      setError(error.message);
    } else {
      await initialize();
      navigate('/admin');
    }
    setLoading(false);
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#EBE8DF',
      }}
    >
      {/* ── Top Header Bar: Logo left · Name center ── */}
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 32px',
          height: '64px',
          backgroundColor: '#EBE8DF',
          borderBottom: '1px solid #D9D6CE',
          position: 'relative',
        }}
      >
        {/* Logo — left */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <img src="/logo.svg" alt="LYM|LYN Logo" style={{ height: '36px', width: '36px' }} />
          <span
            style={{
              fontFamily: '"Fraunces", Georgia, serif',
              fontWeight: 900,
              fontSize: '20px',
              letterSpacing: '-0.04em',
              color: '#141414',
            }}
          >
            LYM<span style={{ color: '#A23B33', padding: '0 2px' }}>|</span>LYN
          </span>
        </div>

        {/* Center title — absolutely centered */}
        <div
          style={{
            position: 'absolute',
            left: '50%',
            transform: 'translateX(-50%)',
            textAlign: 'center',
          }}
        >
          <span
            style={{
              fontFamily: '"Inter", system-ui, sans-serif',
              fontSize: '12px',
              fontWeight: 600,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: '#8C8980',
            }}
          >
            Admin Portal
          </span>
        </div>

        {/* Right spacer (mirrors logo width) */}
        <div style={{ width: '110px' }} />
      </header>

      {/* ── Page Content — card centered on page ── */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '32px 16px',
        }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: '380px',
            backgroundColor: '#F5F3EF',
            border: '1px solid #D9D6CE',
            borderRadius: '16px',
            boxShadow: '0 8px 40px rgba(20,20,20,0.10)',
            overflow: 'hidden',
          }}
        >
          {/* Card top accent line */}
          <div style={{ height: '3px', background: 'linear-gradient(90deg, #A23B33, #C4564D)' }} />

          {/* Card body */}
          <div style={{ padding: '36px 32px 32px' }}>
            {/* Step heading */}
            <h1
              style={{
                fontFamily: '"Fraunces", Georgia, serif',
                fontSize: '24px',
                fontWeight: 700,
                color: '#141414',
                marginBottom: '6px',
                letterSpacing: '-0.02em',
              }}
            >
              {step === 'email' ? 'Sign in to continue' : 'Check your inbox'}
            </h1>
            <p
              style={{
                fontFamily: '"Inter", system-ui, sans-serif',
                fontSize: '13px',
                color: '#8C8980',
                marginBottom: '28px',
              }}
            >
              {step === 'email'
                ? 'Enter your admin email or demo code below.'
                : 'Enter the 6-digit code sent to your email.'}
            </p>

            {error && (
              <div
                style={{
                  marginBottom: '20px',
                  padding: '12px 14px',
                  backgroundColor: 'rgba(162,59,51,0.08)',
                  border: '1px solid rgba(162,59,51,0.2)',
                  borderRadius: '8px',
                  color: '#A23B33',
                  fontSize: '13px',
                  fontFamily: '"Inter", system-ui, sans-serif',
                }}
              >
                {error}
              </div>
            )}

            {step === 'email' ? (
              <form onSubmit={handleSendOtp}>
                <label
                  style={{
                    display: 'block',
                    fontFamily: '"Inter", system-ui, sans-serif',
                    fontSize: '10px',
                    fontWeight: 600,
                    letterSpacing: '0.16em',
                    textTransform: 'uppercase',
                    color: '#8C8980',
                    marginBottom: '8px',
                  }}
                >
                  Admin Email or Code
                </label>
                <input
                  type="text"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com or 123456"
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    backgroundColor: '#EBE8DF',
                    border: '1px solid #D9D6CE',
                    borderRadius: '8px',
                    padding: '13px 16px',
                    color: '#141414',
                    fontSize: '14px',
                    fontFamily: '"Inter", system-ui, sans-serif',
                    outline: 'none',
                    marginBottom: '16px',
                    transition: 'border-color 0.2s',
                  }}
                  onFocus={e => (e.target.style.borderColor = '#141414')}
                  onBlur={e => (e.target.style.borderColor = '#D9D6CE')}
                />
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    width: '100%',
                    backgroundColor: '#141414',
                    color: '#EBE8DF',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '14px 16px',
                    fontSize: '14px',
                    fontWeight: 500,
                    fontFamily: '"Inter", system-ui, sans-serif',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    opacity: loading ? 0.5 : 1,
                    letterSpacing: '0.01em',
                    transition: 'background-color 0.2s',
                  }}
                  onMouseEnter={e => { if (!loading) e.target.style.backgroundColor = '#A23B33'; }}
                  onMouseLeave={e => { if (!loading) e.target.style.backgroundColor = '#141414'; }}
                >
                  {loading ? 'Sending…' : 'Send Login Code →'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp}>
                <label
                  style={{
                    display: 'block',
                    fontFamily: '"Inter", system-ui, sans-serif',
                    fontSize: '10px',
                    fontWeight: 600,
                    letterSpacing: '0.16em',
                    textTransform: 'uppercase',
                    color: '#8C8980',
                    marginBottom: '8px',
                  }}
                >
                  Verification Code
                </label>
                <input
                  type="text"
                  required
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="000000"
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    backgroundColor: '#EBE8DF',
                    border: '1px solid #D9D6CE',
                    borderRadius: '8px',
                    padding: '14px 16px',
                    color: '#141414',
                    fontSize: '24px',
                    fontFamily: '"Fraunces", Georgia, serif',
                    textAlign: 'center',
                    letterSpacing: '0.3em',
                    outline: 'none',
                    marginBottom: '16px',
                    transition: 'border-color 0.2s',
                  }}
                  onFocus={e => (e.target.style.borderColor = '#141414')}
                  onBlur={e => (e.target.style.borderColor = '#D9D6CE')}
                />
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    width: '100%',
                    backgroundColor: '#141414',
                    color: '#EBE8DF',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '14px 16px',
                    fontSize: '14px',
                    fontWeight: 500,
                    fontFamily: '"Inter", system-ui, sans-serif',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    opacity: loading ? 0.5 : 1,
                    letterSpacing: '0.01em',
                    transition: 'background-color 0.2s',
                    marginBottom: '10px',
                  }}
                  onMouseEnter={e => { if (!loading) e.target.style.backgroundColor = '#A23B33'; }}
                  onMouseLeave={e => { if (!loading) e.target.style.backgroundColor = '#141414'; }}
                >
                  {loading ? 'Verifying…' : 'Sign In →'}
                </button>
                <button
                  type="button"
                  onClick={() => setStep('email')}
                  style={{
                    width: '100%',
                    background: 'none',
                    border: 'none',
                    padding: '8px',
                    fontSize: '13px',
                    color: '#8C8980',
                    fontFamily: '"Inter", system-ui, sans-serif',
                    cursor: 'pointer',
                    transition: 'color 0.2s',
                  }}
                  onMouseEnter={e => (e.target.style.color = '#141414')}
                  onMouseLeave={e => (e.target.style.color = '#8C8980')}
                >
                  ← Back to email
                </button>
              </form>
            )}
          </div>

          {/* Card footer */}
          <div
            style={{
              borderTop: '1px solid #D9D6CE',
              padding: '14px 32px',
              textAlign: 'center',
              fontFamily: '"Inter", system-ui, sans-serif',
              fontSize: '11px',
              color: '#8C8980',
              backgroundColor: '#EBE8DF',
            }}
          >
            🔒 Secure · Role-Based Access Control
          </div>
        </div>
      </div>
    </div>
  );
}
