import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function AcceptInvite() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const { user } = useAuth();
  const navigate = useNavigate();
  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Invalid invitation link');
      return;
    }
    if (!user) {
      setStatus('needLogin');
      return;
    }

    const accept = async () => {
      setStatus('loading');
      try {
        const { data } = await api.post('/caregivers/accept', { token });
        setStatus('success');
        setMessage(data.message);
        setTimeout(() => navigate('/'), 2000);
      } catch (err) {
        setStatus('error');
        setMessage(err.response?.data?.message || 'Failed to accept invitation');
      }
    };
    accept();
  }, [token, user, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="card max-w-md text-center">
        {status === 'needLogin' && (
          <>
            <p className="mb-4">Please sign in with the email that received the invitation.</p>
            <Link to={`/login?redirect=/accept-invite?token=${token}`} className="btn-primary">
              Sign in
            </Link>
          </>
        )}
        {status === 'loading' && <p>Accepting invitation...</p>}
        {status === 'success' && <p className="text-medical-600">{message}</p>}
        {status === 'error' && <p className="text-red-600">{message}</p>}
      </div>
    </div>
  );
}
