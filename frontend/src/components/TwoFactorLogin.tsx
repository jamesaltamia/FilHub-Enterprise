import React, { useState } from 'react';
import { TwoFactorAuthService } from '../utils/twoFactorAuth';

interface TwoFactorLoginProps {
  userEmail: string;
  onSuccess: () => void;
  onCancel: () => void;
}

const TwoFactorLogin: React.FC<TwoFactorLoginProps> = ({ userEmail, onSuccess, onCancel }) => {
  const [verificationCode, setVerificationCode] = useState('');
  const [backupCode, setBackupCode] = useState('');
  const [useBackupCode, setUseBackupCode] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleVerifyCode = async () => {
    if (!verificationCode.trim()) {
      setError('Please enter a verification code');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const twoFactorData = TwoFactorAuthService.get2FAData(userEmail);
      if (!twoFactorData) {
        setError('Two-factor authentication is not set up for this account');
        return;
      }

      const verification = TwoFactorAuthService.verifyToken(verificationCode, twoFactorData.secret);
      
      if (verification.isValid) {
        onSuccess();
      } else {
        setError('Invalid verification code. Please try again.');
      }
    } catch (error) {
      setError('An error occurred during verification');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyBackupCode = async () => {
    if (!backupCode.trim()) {
      setError('Please enter a backup code');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const twoFactorData = TwoFactorAuthService.get2FAData(userEmail);
      if (!twoFactorData) {
        setError('Two-factor authentication is not set up for this account');
        return;
      }

      const verification = TwoFactorAuthService.verifyBackupCode(backupCode, twoFactorData.backupCodes);
      
      if (verification.isValid) {
        // Use the backup code (remove it from available codes)
        TwoFactorAuthService.useBackupCode(userEmail, backupCode);
        onSuccess();
      } else {
        setError('Invalid backup code. Please check and try again.');
      }
    } catch (error) {
      setError('An error occurred during verification');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (useBackupCode) {
      handleVerifyBackupCode();
    } else {
      handleVerifyCode();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Two-Factor Authentication
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            {useBackupCode 
              ? 'Enter one of your backup codes to continue'
              : 'Enter the 6-digit code from your authenticator app'
            }
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!useBackupCode ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Verification Code
              </label>
              <input
                type="text"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-center text-lg font-mono focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                maxLength={6}
                autoComplete="one-time-code"
                autoFocus
              />
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Backup Code
              </label>
              <input
                type="text"
                value={backupCode}
                onChange={(e) => setBackupCode(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ''))}
                placeholder="Enter backup code"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-center font-mono focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                autoFocus
              />
            </div>
          )}

          {error && (
            <div className="text-red-600 dark:text-red-400 text-sm text-center">
              {error}
            </div>
          )}

          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 bg-gray-500 text-white py-2 px-4 rounded-md hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || (!useBackupCode && verificationCode.length !== 6) || (useBackupCode && !backupCode.trim())}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Verifying...' : 'Verify'}
            </button>
          </div>

          <div className="text-center">
            <button
              type="button"
              onClick={() => {
                setUseBackupCode(!useBackupCode);
                setVerificationCode('');
                setBackupCode('');
                setError('');
              }}
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              {useBackupCode ? 'Use authenticator app instead' : 'Use backup code instead'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TwoFactorLogin;
