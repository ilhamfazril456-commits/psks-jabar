import React, { useState } from 'react';
import { TurnstileWidget } from './TurnstileWidget';

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
 * Cloudflare Turnstile Security Gate
 * Replaces legacy distorted text captcha with one-tap responsive human verification
 */
export const CaptchaWidget: React.FC<CaptchaWidgetProps> = ({
  userInput,
  setUserInput,
  onCaptchaCodeChange,
  isError = false,
}) => {
  const [isVerified, setIsVerified] = useState<boolean>(userInput === 'TURNSTILE_VERIFIED');

  const handleVerify = (token: string) => {
    setIsVerified(true);
    setUserInput('TURNSTILE_VERIFIED');
    if (onCaptchaCodeChange) {
      onCaptchaCodeChange('TURNSTILE_VERIFIED');
    }
  };

  const handleExpire = () => {
    setIsVerified(false);
    setUserInput('');
    if (onCaptchaCodeChange) {
      onCaptchaCodeChange('');
    }
  };

  return (
    <div className="w-full">
      <TurnstileWidget
        onVerify={handleVerify}
        onExpire={handleExpire}
        onError={handleExpire}
        isVerified={isVerified}
      />
      {isError && !isVerified && (
        <div className="p-1.5 mt-1.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-[10.5px] font-bold text-center animate-shake">
          ⚠️ Mohon centang kotak verifikasi Cloudflare Turnstile di atas terlebih dahulu.
        </div>
      )}
    </div>
  );
};
