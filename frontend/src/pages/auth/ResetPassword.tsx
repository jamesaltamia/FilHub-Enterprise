import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const ResetPassword: React.FC = () => {
  const [params] = useSearchParams();
  const defaultEmail = params.get('email') || '';

  const [email, setEmail] = useState(defaultEmail);
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const { verifyOtp, resetPassword } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setIsLoading(true);

    try {
      await verifyOtp(email, otp);
      await resetPassword(email, otp, password, passwordConfirmation);
      setMessage('Password reset successful. Redirecting to login...');
      setTimeout(() => navigate('/login'), 1000);
    } catch (err: any) {
      setError(err.message || 'Password reset failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">Reset password</h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Remembered your password?{' '}
          <Link to="/login" className="font-medium text-primary-600 hover:text-primary-500">Sign in</Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="card py-8 px-4 sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {message && <div className="bg-success-50 border border-success-200 text-success-700 px-4 py-3 rounded-lg">{message}</div>}
            {error && <div className="bg-danger-50 border border-danger-200 text-danger-700 px-4 py-3 rounded-lg">{error}</div>}

            <div className="form-group">
              <label className="form-label">Email address</label>
              <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>

            <div className="form-group">
              <label className="form-label">OTP</label>
              <input className="input" value={otp} onChange={(e) => setOtp(e.target.value)} required />
            </div>

            <div className="form-group">
              <label className="form-label">New password</label>
              <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>

            <div className="form-group">
              <label className="form-label">Confirm password</label>
              <input className="input" type="password" value={passwordConfirmation} onChange={(e) => setPasswordConfirmation(e.target.value)} required />
            </div>

            <div>
              <button type="submit" disabled={isLoading} className="btn-primary w-full flex justify-center py-3">
                {isLoading ? 'Resetting...' : 'Reset password'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
