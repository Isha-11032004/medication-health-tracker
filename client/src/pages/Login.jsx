import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api, { getApiErrorMessage } from '../services/api';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [serverOk, setServerOk] = useState(null);
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    api
      .get('/health')
      .then(() => setServerOk(true))
      .catch(() => setServerOk(false));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email.trim(), password);
      navigate('/');
    } catch (err) {
      setError(getApiErrorMessage(err, 'Login failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-medical-50 to-medical-100 dark:from-slate-900 dark:to-slate-800">
      <div className="card w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-4xl mb-2">💊</div>
          <h1 className="text-2xl font-bold text-medical-800 dark:text-medical-200">
            Medication & Health Tracker
          </h1>
          <p className="text-slate-500 text-sm mt-1">Sign in to your account</p>
        </div>

        {serverOk === false && (
          <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200 rounded-lg text-sm">
            <strong>Backend is offline.</strong> Open a terminal and run:
            <pre className="mt-2 text-xs bg-black/10 p-2 rounded overflow-x-auto">
              cd C:\Users\HP\medication-health-tracker\server{'\n'}npm run dev
            </pre>
            Wait for &quot;MongoDB connected&quot; and &quot;Server running on port 5000&quot;, then refresh this page.
          </div>
        )}

        {serverOk === true && (
          <p className="mb-4 text-xs text-green-600 dark:text-green-400 text-center">
            Server connected
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg text-sm">
              {error}
            </div>
          )}
          <div>
            <label className="label">Email</label>
            <input
              type="email"
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>
          <div>
            <label className="label">Password</label>
            <input
              type="password"
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>
          <button type="submit" className="btn-primary w-full" disabled={loading || serverOk === false}>
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
        <p className="text-center text-sm mt-6 text-slate-600 dark:text-slate-400">
          No account?{' '}
          <Link to="/register" className="text-medical-600 font-medium hover:underline">
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}
