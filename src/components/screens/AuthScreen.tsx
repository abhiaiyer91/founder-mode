import { useState } from 'react';
import { Terminal, Box, Input } from '../tui';
import { signIn, signUp } from '../../lib/auth';
import './AuthScreen.css';

interface AuthScreenProps {
  onSuccess: () => void;
  onSkip: () => void;
}

export function AuthScreen({ onSuccess, onSkip }: AuthScreenProps) {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === 'signup') {
        const result = await signUp.email({
          email,
          password,
          name: name || email.split('@')[0],
        });
        
        if (result.error) {
          setError(result.error.message || 'Signup failed');
        } else {
          onSuccess();
        }
      } else {
        const result = await signIn.email({
          email,
          password,
        });
        
        if (result.error) {
          setError(result.error.message || 'Login failed');
        } else {
          onSuccess();
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Terminal title="FOUNDER MODE - AUTHENTICATION" showControls>
      <div className="auth-screen">
        <div className="auth-logo">
          <pre className="ascii-logo">{`
  ███████╗ ██████╗ ██╗   ██╗███╗   ██╗██████╗ ███████╗██████╗ 
  ██╔════╝██╔═══██╗██║   ██║████╗  ██║██╔══██╗██╔════╝██╔══██╗
  █████╗  ██║   ██║██║   ██║██╔██╗ ██║██║  ██║█████╗  ██████╔╝
  ██╔══╝  ██║   ██║██║   ██║██║╚██╗██║██║  ██║██╔══╝  ██╔══██╗
  ██║     ╚██████╔╝╚██████╔╝██║ ╚████║██████╔╝███████╗██║  ██║
  ╚═╝      ╚═════╝  ╚═════╝ ╚═╝  ╚═══╝╚═════╝ ╚══════╝╚═╝  ╚═╝
          `}</pre>
          <div className="tagline">Build a real startup. Ship real code.</div>
        </div>

        <Box title={mode === 'login' ? '🔐 LOGIN' : '📝 CREATE ACCOUNT'} className="auth-box">
          <form onSubmit={handleSubmit}>
            {mode === 'signup' && (
              <div className="form-field">
                <label>Founder Name</label>
                <Input
                  value={name}
                  onChange={setName}
                  placeholder="Enter your name"
                />
              </div>
            )}
            
            <div className="form-field">
              <label>Email</label>
              <Input
                value={email}
                onChange={setEmail}
                placeholder="founder@startup.com"
              />
            </div>
            
            <div className="form-field">
              <label>Password</label>
              <Input
                value={password}
                onChange={setPassword}
                placeholder="••••••••"
                // Note: Input component would need type="password" support
              />
            </div>

            {error && (
              <div className="auth-error">
                ⚠️ {error}
              </div>
            )}

            <div className="auth-actions">
              <button 
                type="submit" 
                className="auth-btn primary"
                disabled={loading || !email || !password}
              >
                {loading ? 'Loading...' : mode === 'login' ? '🚀 Login' : '🚀 Create Account'}
              </button>
            </div>
          </form>

          <div className="auth-toggle">
            {mode === 'login' ? (
              <>
                New founder?{' '}
                <button className="link-btn" onClick={() => setMode('signup')}>
                  Create account
                </button>
              </>
            ) : (
              <>
                Already have an account?{' '}
                <button className="link-btn" onClick={() => setMode('login')}>
                  Login
                </button>
              </>
            )}
          </div>
        </Box>

        <div className="auth-skip">
          <button className="skip-btn" onClick={onSkip}>
            Skip for now → Play as guest
          </button>
          <p className="skip-note">
            Guest progress is saved locally only
          </p>
        </div>

        <div className="auth-features">
          <div className="feature">☁️ Cloud saves</div>
          <div className="feature">📊 Leaderboards</div>
          <div className="feature">🤝 Multiplayer</div>
        </div>
      </div>
    </Terminal>
  );
}

export default AuthScreen;
