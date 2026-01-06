/**
 * Auth Screen - Login / Signup
 * 
 * Clean, modern design matching the landing page aesthetic
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { signIn, signUp } from '../../lib/auth';
import './AuthScreen.css';

interface AuthScreenProps {
  mode?: 'login' | 'signup';
  onSuccess: () => void;
  onSkip: () => void;
}

export function AuthScreen({ mode = 'login', onSuccess, onSkip }: AuthScreenProps) {
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

  const isValid = email && password && (mode === 'login' || name);

  return (
    <div className="auth-screen">
      {/* Header */}
      <header className="auth-header">
        <Link to="/" className="nav-logo">
          <span className="logo-icon">⌘</span>
          <span className="logo-text">Founder Mode</span>
        </Link>
      </header>

      {/* Main Content */}
      <main className="auth-main">
        <div className="auth-content">
          <div className="auth-badge">
            {mode === 'login' ? 'Welcome Back' : 'Get Started'}
          </div>
          
          <h1>{mode === 'login' ? 'Log in to your account' : 'Create your account'}</h1>
          <p className="auth-subtitle">
            {mode === 'login' 
              ? 'Continue building your startup' 
              : 'Start building real products with AI'}
          </p>

          <form onSubmit={handleSubmit} className="auth-form">
            {mode === 'signup' && (
              <div className="form-field">
                <label>Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Your name"
                  autoFocus
                />
              </div>
            )}
            
            <div className="form-field">
              <label>Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="founder@startup.com"
                autoFocus={mode === 'login'}
              />
            </div>
            
            <div className="form-field">
              <label>Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="auth-error">
                {error}
              </div>
            )}

            <button 
              type="submit" 
              className={`auth-btn ${isValid ? 'active' : ''}`}
              disabled={loading || !isValid}
            >
              {loading ? 'Loading...' : mode === 'login' ? 'Log In →' : 'Create Account →'}
            </button>
          </form>

          <div className="auth-toggle">
            {mode === 'login' ? (
              <>
                Don't have an account?{' '}
                <Link to="/signup">Sign up</Link>
              </>
            ) : (
              <>
                Already have an account?{' '}
                <Link to="/login">Log in</Link>
              </>
            )}
          </div>

          <div className="auth-divider">
            <span>or</span>
          </div>

          <button className="skip-btn" onClick={onSkip}>
            Continue as guest
          </button>
          <p className="skip-note">Guest progress is saved locally only</p>
        </div>
      </main>
    </div>
  );
}

export default AuthScreen;
