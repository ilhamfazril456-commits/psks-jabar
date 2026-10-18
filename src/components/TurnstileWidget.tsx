import React from 'react';
import { SmartSecurityGate } from './SmartSecurityGate';

export interface TurnstileWidgetProps {
  onVerify: (token: string) => void;
  onExpire?: () => void;
  onError?: () => void;
  isVerified?: boolean;
}

export const CLOUDFLARE_SITE_KEY = '0x4AAAAAAFYHSeNPeQmA14PB';

/**
 * PSKS Security Gate
 * Re-exported as TurnstileWidget for drop-in zero-lag replacement across the system
 */
export const TurnstileWidget: React.FC<TurnstileWidgetProps> = (props) => {
  return <SmartSecurityGate {...props} />;
};

export default TurnstileWidget;
