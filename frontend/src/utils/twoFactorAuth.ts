import { authenticator } from 'otplib';
import QRCode from 'qrcode';

export interface TwoFactorSetup {
  secret: string;
  qrCodeUrl: string;
  backupCodes: string[];
  manualEntryKey: string;
}

export interface TwoFactorVerification {
  isValid: boolean;
  error?: string;
}

export class TwoFactorAuthService {
  private static readonly SERVICE_NAME = 'FilHub Enterprise';
  private static readonly ISSUER = 'FilHub';

  /**
   * Generate a new 2FA secret and setup data
   */
  static async generateSetup(userEmail: string): Promise<TwoFactorSetup> {
    // Generate a random secret
    const secret = authenticator.generateSecret();
    
    // Create the service URL for authenticator apps
    const serviceUrl = authenticator.keyuri(
      userEmail,
      this.SERVICE_NAME,
      secret
    );

    // Generate QR code
    const qrCodeUrl = await QRCode.toDataURL(serviceUrl);

    // Generate backup codes
    const backupCodes = this.generateBackupCodes();

    // Format manual entry key (groups of 4 characters)
    const manualEntryKey = secret.match(/.{1,4}/g)?.join(' ') || secret;

    return {
      secret,
      qrCodeUrl,
      backupCodes,
      manualEntryKey
    };
  }

  /**
   * Verify a TOTP token against a secret
   */
  static verifyToken(token: string, secret: string): TwoFactorVerification {
    try {
      // Remove any spaces from the token
      const cleanToken = token.replace(/\s/g, '');
      
      // Verify the token
      const isValid = authenticator.verify({
        token: cleanToken,
        secret: secret
      });

      return { isValid };
    } catch (error) {
      return {
        isValid: false,
        error: 'Invalid token format'
      };
    }
  }

  /**
   * Verify a backup code
   */
  static verifyBackupCode(code: string, backupCodes: string[]): TwoFactorVerification {
    const cleanCode = code.replace(/\s/g, '').toLowerCase();
    const isValid = backupCodes.some(backupCode => 
      backupCode.toLowerCase() === cleanCode
    );

    return { isValid };
  }

  /**
   * Generate secure backup codes
   */
  private static generateBackupCodes(): string[] {
    const codes: string[] = [];
    const characters = 'abcdefghijklmnopqrstuvwxyz0123456789';
    
    for (let i = 0; i < 10; i++) {
      let code = '';
      for (let j = 0; j < 8; j++) {
        code += characters.charAt(Math.floor(Math.random() * characters.length));
      }
      codes.push(code);
    }
    
    return codes;
  }

  /**
   * Check if 2FA is enabled for a user
   */
  static is2FAEnabled(userEmail: string): boolean {
    const twoFactorData = localStorage.getItem(`2fa_${userEmail}`);
    return !!twoFactorData;
  }

  /**
   * Save 2FA setup data
   */
  static save2FASetup(userEmail: string, secret: string, backupCodes: string[]): void {
    const data = {
      secret,
      backupCodes,
      enabled: true,
      setupDate: new Date().toISOString()
    };
    localStorage.setItem(`2fa_${userEmail}`, JSON.stringify(data));
  }

  /**
   * Get 2FA data for a user
   */
  static get2FAData(userEmail: string): any {
    const data = localStorage.getItem(`2fa_${userEmail}`);
    return data ? JSON.parse(data) : null;
  }

  /**
   * Disable 2FA for a user
   */
  static disable2FA(userEmail: string): void {
    localStorage.removeItem(`2fa_${userEmail}`);
  }

  /**
   * Use a backup code (remove it from available codes)
   */
  static useBackupCode(userEmail: string, usedCode: string): boolean {
    const data = this.get2FAData(userEmail);
    if (!data) return false;

    const cleanUsedCode = usedCode.replace(/\s/g, '').toLowerCase();
    const codeIndex = data.backupCodes.findIndex((code: string) => 
      code.toLowerCase() === cleanUsedCode
    );

    if (codeIndex === -1) return false;

    // Remove the used code
    data.backupCodes.splice(codeIndex, 1);
    localStorage.setItem(`2fa_${userEmail}`, JSON.stringify(data));
    
    return true;
  }
}
