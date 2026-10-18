import React, { useState, useCallback, useEffect } from 'react';
import { SmartSecurityGate } from './SmartSecurityGate';

interface CaptchaWidgetProps {
  userInput: string;
  setUserInput: (val: string) => void;
  onCaptchaCodeChange?: (code: string) => void;
  isError?: boolean;
  refreshTrigger?: number;
  inputRef?: React.RefObject<HTMLInputElement | null>;
}

export function generateCaptchaCode(): string {
  return 'TURNSTILE_VERIFIED';
}

/**
 * PSKS Smart Security Gate
 * One-tap responsive human verification with zero external dependency
 */
export const CaptchaWidget: React.FC<CaptchaWidgetProps> = ({
  userInput,
  setUserInput,
  onCaptchaCodeChange,
  isError = false,
  refreshTrigger = 0,
}) => {
  const [isVerified, setIsVerified] = useState<boolean>(
    userInput === 'TURNSTILE_VERIFIED' || userInput.startsWith('psks_sec_')
  );

  // Reset saat ada refreshTrigger (misal percobaan login salah)
  useEffect(() => {
    if (refreshTrigger > 0) {
      setIsVerified(false);
      setUserInput('');
      if (onCaptchaCodeChange) onCaptchaCodeChange('');
    }
  }, [refreshTrigger]);

  useEffect(() => {
    setIsVerified(userInput === 'TURNSTILE_VERIFIED' || userInput.startsWith('psks_sec_'));
  }, [userInput]);

  const handleVerify = useCallback((token: string) => {
    setIsVerified(true);
    setUserInput(token || 'TURNSTILE_VERIFIED');
    if (onCaptchaCodeChange) {
      onCaptchaCodeChange(token || 'TURNSTILE_VERIFIED');
    }
  }, [setUserInput, onCaptchaCodeChange]);

  const handleExpire = useCallback(() => {
    setIsVerified(false);
    setUserInput('');
    if (onCaptchaCodeChange) {
      onCaptchaCodeChange('');
    }
  }, [setUserInput, onCaptchaCodeChange]);

  return (
    <div className="w-full">
      <SmartSecurityGate
        onVerify={handleVerify}
        onExpire={handleExpire}
        isVerified={isVerified}
      />
      {isError && !isVerified && (
        <div className="p-2 mt-1.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-[11px] font-bold text-center animate-shake flex items-center justify-center gap-1.5 shadow-2xs">
          <span>⚠️ Mohon centang kotak verifikasi di atas terlebih dahulu.</span>
        </div>
      )}
    </div>
  );
};

export default CaptchaWidget;
