'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push('/board');
      router.refresh();
    }
  }

  return (
    <div
      style={{
        background: '#090b10',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: "'DM Sans', system-ui, sans-serif",
      }}
    >
      <div
        style={{
          background: '#0e1220',
          border: '1px solid #1a2035',
          borderRadius: 14,
          padding: '36px 40px',
          width: 400,
          boxShadow: '0 20px 60px rgba(0,0,0,.6)',
        }}
      >
        {/* Logo area */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>🎮</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: '#dde3f0', letterSpacing: '-.3px' }}>
            Match&thinsp;3 <span style={{ color: '#4a90d9' }}>Build 1.2</span>
          </div>
          <div style={{ fontSize: 11, color: '#3c4870', marginTop: 4 }}>
            Sprint Task Board · Sign in to continue
          </div>
        </div>

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label
              style={{
                display: 'block',
                fontSize: 10,
                fontWeight: 700,
                color: '#3c5070',
                textTransform: 'uppercase',
                letterSpacing: 0.8,
                marginBottom: 5,
              }}
            >
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              style={{
                width: '100%',
                background: '#090b12',
                border: '1px solid #1a2035',
                borderRadius: 7,
                padding: '9px 12px',
                color: '#dde3f0',
                fontSize: 13,
                fontFamily: 'inherit',
                outline: 'none',
                transition: 'border-color .15s',
              }}
              onFocus={e => (e.target.style.borderColor = '#3a6acc')}
              onBlur={e => (e.target.style.borderColor = '#1a2035')}
            />
          </div>

          <div>
            <label
              style={{
                display: 'block',
                fontSize: 10,
                fontWeight: 700,
                color: '#3c5070',
                textTransform: 'uppercase',
                letterSpacing: 0.8,
                marginBottom: 5,
              }}
            >
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              style={{
                width: '100%',
                background: '#090b12',
                border: '1px solid #1a2035',
                borderRadius: 7,
                padding: '9px 12px',
                color: '#dde3f0',
                fontSize: 13,
                fontFamily: 'inherit',
                outline: 'none',
                transition: 'border-color .15s',
              }}
              onFocus={e => (e.target.style.borderColor = '#3a6acc')}
              onBlur={e => (e.target.style.borderColor = '#1a2035')}
            />
          </div>

          {error && (
            <div
              style={{
                background: '#1a0808',
                border: '1px solid #f0506040',
                borderRadius: 6,
                padding: '8px 12px',
                fontSize: 12,
                color: '#f07070',
              }}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: 4,
              padding: '10px',
              background: loading ? '#0e1a30' : '#1a4a8a',
              border: '1px solid #2a6acc',
              borderRadius: 7,
              color: '#80b8f8',
              fontSize: 13,
              fontWeight: 700,
              fontFamily: 'inherit',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all .15s',
              opacity: loading ? 0.6 : 1,
            }}
          >
            {loading ? 'Signing in…' : 'Sign In →'}
          </button>
        </form>

        <div
          style={{
            marginTop: 20,
            paddingTop: 16,
            borderTop: '1px solid #141828',
            fontSize: 10,
            color: '#2a3a5a',
            textAlign: 'center',
          }}
        >
          Access restricted to team members. Contact admin to get credentials.
        </div>
      </div>
    </div>
  );
}
