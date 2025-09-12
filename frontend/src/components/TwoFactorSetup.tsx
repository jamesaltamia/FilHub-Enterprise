import React, { useState, useEffect, useCallback } from 'react';
import { TwoFactorAuthService, type TwoFactorSetup } from '../utils/twoFactorAuth';
import { useAuth } from '../contexts/AuthContext';

interface TwoFactorSetupProps {
  onComplete: (enabled: boolean) => void;
  onCancel: () => void;
}

const TwoFactorSetupComponent: React.FC<TwoFactorSetupProps> = ({ onComplete, onCancel }) => {
  const { user } = useAuth();
  const [step, setStep] = useState<'setup' | 'verify' | 'backup'>('setup');
  const [setupData, setSetupData] = useState<TwoFactorSetup | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [backupCodesDownloaded, setBackupCodesDownloaded] = useState(false);

  const generateSetup = useCallback(async () => {
    if (!user?.email) return;
    
    setIsLoading(true);
    try {
      const setup = await TwoFactorAuthService.generateSetup(user.email);
      setSetupData(setup);
    } catch {
      setError('Failed to generate 2FA setup');
    } finally {
      setIsLoading(false);
    }
  }, [user?.email]);

  useEffect(() => {
    generateSetup();
  }, [generateSetup]);

  const handleVerifyCode = () => {
    if (!setupData || !verificationCode.trim()) {
      setError('Please enter a verification code');
      return;
    }

    const verification = TwoFactorAuthService.verifyToken(verificationCode, setupData.secret);
    
    if (verification.isValid) {
      setStep('backup');
      setError('');
    } else {
      setError('Invalid verification code. Please try again.');
    }
  };

  const handleComplete = () => {
    if (!user?.email || !setupData) return;

    // Save 2FA setup
    TwoFactorAuthService.save2FASetup(user.email, setupData.secret, setupData.backupCodes);
    onComplete(true);
  };

  const downloadBackupCodes = () => {
    if (!setupData) return;

    const codesText = setupData.backupCodes.join('\n');
    const blob = new Blob([
      `FilHub Enterprise - Two-Factor Authentication Backup Codes\n\n`,
      `Generated: ${new Date().toLocaleString()}\n`,
      `User: ${user?.email}\n\n`,
      `Backup Codes (use each code only once):\n\n`,
      codesText,
      `\n\nKeep these codes in a safe place. You can use them to access your account if you lose your authenticator device.`
    ], { type: 'text/plain' });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `filhub-backup-codes-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    setBackupCodesDownloaded(true);
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600 dark:text-gray-300">Setting up 2FA...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
        {step === 'setup' && setupData && (
          <>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Set Up Two-Factor Authentication
            </h3>
            
            <div className="space-y-4">
              <div className="text-sm text-gray-600 dark:text-gray-300">
                <p className="mb-2">1. Install an authenticator app on your phone:</p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>Google Authenticator</li>
                  <li>Microsoft Authenticator</li>
                  <li>Authy</li>
                  <li>1Password</li>
                </ul>
              </div>

              <div className="text-sm text-gray-600 dark:text-gray-300">
                <p className="mb-2">2. Scan this QR code with your authenticator app:</p>
              </div>

              <div className="flex justify-center bg-white p-4 rounded-lg">
                <img src={setupData.qrCodeUrl} alt="2FA QR Code" className="max-w-full h-auto" />
              </div>

              <div className="text-sm text-gray-600 dark:text-gray-300">
                <p className="mb-2">Or enter this code manually:</p>
                <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded font-mono text-sm break-all">
                  {setupData.manualEntryKey}
                </div>
              </div>

              <button
                onClick={() => setStep('verify')}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
              >
                Continue to Verification
              </button>
            </div>
          </>
        )}

        {step === 'verify' && (
          <>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Verify Your Setup
            </h3>
            
            <div className="space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Enter the 6-digit code from your authenticator app to verify the setup:
              </p>

              <div>
                <input
                  type="text"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-center text-lg font-mono"
                  maxLength={6}
                />
              </div>

              {error && (
                <div className="text-red-600 dark:text-red-400 text-sm">{error}</div>
              )}

              <div className="flex space-x-3">
                <button
                  onClick={() => setStep('setup')}
                  className="flex-1 bg-gray-500 text-white py-2 px-4 rounded-md hover:bg-gray-600 transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handleVerifyCode}
                  disabled={verificationCode.length !== 6}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Verify
                </button>
              </div>
            </div>
          </>
        )}

        {step === 'backup' && setupData && (
          <>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Save Your Backup Codes
            </h3>
            
            <div className="space-y-4">
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                <div className="flex items-start">
                  <svg className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">Important!</h4>
                    <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                      Save these backup codes in a secure location. You can use them to access your account if you lose your authenticator device.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg">
                <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Backup Codes:</h4>
                <div className="grid grid-cols-2 gap-2 font-mono text-sm">
                  {setupData.backupCodes.map((code, index) => (
                    <div key={index} className="bg-white dark:bg-gray-600 p-2 rounded text-center">
                      {code}
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={downloadBackupCodes}
                className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors"
              >
                Download Backup Codes
              </button>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="backup-confirm"
                  checked={backupCodesDownloaded}
                  onChange={(e) => setBackupCodesDownloaded(e.target.checked)}
                  className="mr-2"
                />
                <label htmlFor="backup-confirm" className="text-sm text-gray-600 dark:text-gray-300">
                  I have saved my backup codes in a secure location
                </label>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={onCancel}
                  className="flex-1 bg-gray-500 text-white py-2 px-4 rounded-md hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleComplete}
                  disabled={!backupCodesDownloaded}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Complete Setup
                </button>
              </div>
            </div>
          </>
        )}

        <button
          onClick={onCancel}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default TwoFactorSetupComponent;
