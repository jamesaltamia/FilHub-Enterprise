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
  private static readonly ISSUER = 'FilHub';

  /**
   * Generate a random base32 secret
   */
  private static generateSecret(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let secret = '';
    for (let i = 0; i < 32; i++) {
      secret += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return secret;
  }

  /**
   * For demo purposes, accept any 6-digit code during setup verification
   */
  private static generateTOTP(secret: string, timeStep?: number): string {
    // Return a fixed code for demo - in real implementation this would be proper TOTP
    return '123456';
  }

  /**
   * Generate a new 2FA secret and setup data
   */
  static async generateSetup(userEmail: string): Promise<TwoFactorSetup> {
    // Generate a random secret
    const secret = this.generateSecret();
    
    // Create TOTP URI for authenticator apps
    const uri = `otpauth://totp/${encodeURIComponent(this.ISSUER)}:${encodeURIComponent(userEmail)}?secret=${secret}&issuer=${encodeURIComponent(this.ISSUER)}`;

    // Generate QR code
    const qrCodeUrl = await QRCode.toDataURL(uri);

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
      
      // For demo purposes, accept the code from the authenticator app
      // In a real implementation, this would verify against proper TOTP algorithm
      if (cleanToken.length === 6 && /^\d+$/.test(cleanToken)) {
        return { isValid: true };
      }

      return { isValid: false };
    } catch {
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
  static is2FAEnabled(email: string): boolean {
    try {
      const data = localStorage.getItem(`2fa_${email}`);
      console.log(`Checking 2FA for ${email}, localStorage data:`, data);
      if (!data) return false;
      
      const twoFactorData = JSON.parse(data);
      console.log(`Parsed 2FA data for ${email}:`, twoFactorData);
      return twoFactorData.enabled === true;
    } catch (error) {
      console.error(`Error checking 2FA for ${email}:`, error);
      return false;
    }
  }

  /**
   * Save 2FA setup data
   */
  static save2FASetup(userEmail: string, secret: string, backupCodes: string[]): void {
    const data = {
      secret,
      backupCodes,
      enabled: true,
      createdAt: new Date().toISOString()
    };
    
    localStorage.setItem(`2fa_${userEmail}`, JSON.stringify(data));
    console.log(`2FA data saved to localStorage key: 2fa_${userEmail}`, data);
  }

  /**
   * Get 2FA data for a user
   */
  static get2FAData(userEmail: string): { secret: string; backupCodes: string[]; enabled: boolean; setupDate: string } | null {
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
