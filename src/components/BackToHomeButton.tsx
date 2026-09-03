import React from 'react';
import { ArrowLeft } from 'lucide-react';

interface BackToHomeButtonProps {
  onClick: () => void;
  className?: string;
  variant?: 'light' | 'dark' | 'gold' | 'glass';
  label?: string;
  id?: string;
}

/**
 * Standardized "Kembali ke Beranda" button for all module pages.
 * Ensures uniform size (h-11), font, icon spacing, and responsive behavior.
 */
export const BackToHomeButton: React.FC<BackToHomeButtonProps> = ({
  onClick,
  className = '',
  variant = 'light',
  label = 'Kembali ke Beranda',
  id,
}) => {
  const baseClasses =
    'inline-flex items-center justify-center gap-1.5 sm:gap-2 h-9 sm:h-11 px-3 sm:px-4 py-1.5 sm:py-2.5 rounded-lg sm:rounded-xl font-black text-xs sm:text-sm transition-all duration-200 cursor-pointer active:scale-95 shadow-xs hover:shadow-md shrink-0 group select-none';

  let colorClasses =
    'bg-white hover:bg-emerald-50 text-[#043e2e] hover:text-[#065f46] border-2 border-emerald-900/20 hover:border-emerald-800';

  if (variant === 'gold') {
    colorClasses =
      'bg-[#b8901c] hover:bg-[#d4af37] text-[#043e2e] border-2 border-[#d4af37] shadow-md hover:shadow-lg font-black';
  } else if (variant === 'dark') {
    colorClasses =
      'bg-slate-900 hover:bg-slate-800 text-amber-300 border-2 border-[#d4af37]/70 hover:border-[#d4af37]';
  } else if (variant === 'glass') {
    colorClasses =
      'bg-white/15 hover:bg-white/25 text-white border-2 border-white/30 hover:border-[#d4af37] backdrop-blur-sm';
  }

  return (
    <button
      id={id}
      type="button"
      onClick={onClick}
      className={`${baseClasses} ${colorClasses} ${className}`}
      title="Kembali ke Beranda Utama PSKS JABAR"
    >
      <ArrowLeft className="w-4 h-4 shrink-0 transition-transform duration-200 group-hover:-translate-x-1 text-inherit" />
      <span className="whitespace-nowrap">{label}</span>
    </button>
  );
};
