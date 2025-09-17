import React, { useState } from 'react';
import { TwoFactorAuthService } from '../utils/twoFactorAuth';

interface TwoFactorVerificationProps {
  userEmail: string;
  onSuccess: () => void;
  onCancel: () => void;
}

const TwoFactorVerification: React.FC<TwoFactorVerificationProps> = ({ 
  userEmail, 
  onSuccess, 
  onCancel 
}) => {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [useBackupCode, setUseBackupCode] = useState(false);

  const handleVerify = async () => {
    if (!code.trim()) {
      setError('Please enter a verification code');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const twoFactorData = TwoFactorAuthService.get2FAData(userEmail);
      if (!twoFactorData) {
        setError('2FA not set up for this account');
        return;
      }

      let isValid = false;

      if (useBackupCode) {
        // Verify backup code
        const verification = TwoFactorAuthService.verifyBackupCode(code, twoFactorData.backupCodes);
        if (verification.isValid) {
          // Use the backup code (remove it from available codes)
          TwoFactorAuthService.useBackupCode(userEmail, code);
          isValid = true;
        }
      } else {
        // Verify TOTP token
        const verification = TwoFactorAuthService.verifyToken(code, twoFactorData.secret);
        isValid = verification.isValid;
      }

      if (isValid) {
        onSuccess();
      } else {
        setError(useBackupCode ? 'Invalid backup code' : 'Invalid verification code');
      }
    } catch (err) {
      setError('Verification failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleVerify();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Two-Factor Authentication
        </h3>
        
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            {useBackupCode 
              ? 'Enter one of your backup codes:'
              : 'Enter the 6-digit code from your authenticator app:'
            }
          </p>

          <div>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, useBackupCode ? 8 : 6))}
              onKeyPress={handleKeyPress}
              placeholder={useBackupCode ? "abcd1234" : "000000"}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-center text-lg font-mono"
              maxLength={useBackupCode ? 8 : 6}
              disabled={isLoading}
            />
          </div>

          {error && (
            <div className="text-red-600 dark:text-red-400 text-sm text-center">
              {error}
            </div>
          )}

          <div className="flex space-x-3">
            <button
              onClick={onCancel}
              disabled={isLoading}
              className="flex-1 bg-gray-500 text-white py-2 px-4 rounded-md hover:bg-gray-600 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleVerify}
              disabled={isLoading || !code.trim()}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Verifying...' : 'Verify'}
            </button>
          </div>

          <div className="text-center">
            <button
              onClick={() => {
                setUseBackupCode(!useBackupCode);
                setCode('');
                setError('');
              }}
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              {useBackupCode ? 'Use authenticator code instead' : 'Use backup code instead'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TwoFactorVerification;
