import React, { useId } from 'react';

interface EmblemProps {
  className?: string;
}

/**
 * 1. Pahlawan Nasional — Lencana Bintang Kehormatan Adipurna & Padi Kapas
 * Perisai oktagonal lapis navy dengan bingkai emas 24K, sinar kehormatan,
 * rangkaian padi-kapas, dan Bintang Jasa lima sudut berfaset tiga dimensi.
 */
export const PahlawanNasionalEmblem: React.FC<EmblemProps> = ({ className = 'w-12 h-12' }) => {
  const uid = useId().replace(/:/g, '');
  const navyGrad = `pn-navy-${uid}`;
  const goldGrad = `pn-gold-${uid}`;
  const goldDarkGrad = `pn-gold-dark-${uid}`;
  const rubyGrad = `pn-ruby-${uid}`;
  const sheenGrad = `pn-sheen-${uid}`;

  return (
    <svg
      viewBox="0 0 96 96"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={navyGrad} x1="16" y1="10" x2="80" y2="88" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#1e4287" />
          <stop offset="52%" stopColor="#0f2b5c" />
          <stop offset="100%" stopColor="#071633" />
        </linearGradient>
        <linearGradient id={goldGrad} x1="18" y1="12" x2="78" y2="84" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#fef3c7" />
          <stop offset="28%" stopColor="#f5c451" />
          <stop offset="68%" stopColor="#d4af37" />
          <stop offset="100%" stopColor="#926811" />
        </linearGradient>
        <linearGradient id={goldDarkGrad} x1="48" y1="22" x2="48" y2="74" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#d97706" />
          <stop offset="100%" stopColor="#78350f" />
        </linearGradient>
        <radialGradient id={rubyGrad} cx="50%" cy="45%" r="55%">
          <stop offset="0%" stopColor="#ef4444" />
          <stop offset="60%" stopColor="#b91c1c" />
          <stop offset="100%" stopColor="#7f1d1d" />
        </radialGradient>
        <linearGradient id={sheenGrad} x1="20" y1="12" x2="64" y2="56" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.32" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Top Crown Ring Clasp */}
      <circle cx="48" cy="11.5" r="4.5" stroke={`url(#${goldGrad})`} strokeWidth="2.4" fill="#0f2b5c" />
      <rect x="43" y="14.5" width="10" height="4" rx="1.5" fill={`url(#${goldGrad})`} />

      {/* Outer Gilded Shield Frame */}
      <path
        d="M48 16.5L78 24.5V48.5C78 66.2 64.9 78.6 48 85C31.1 78.6 18 66.2 18 48.5V24.5L48 16.5Z"
        fill={`url(#${goldGrad})`}
      />

      {/* Inner Lapis Navy Crest Field */}
      <path
        d="M48 19.5L74.8 26.7V48.5C74.8 64.4 63 75.5 48 81.4C33 75.5 21.2 64.4 21.2 48.5V26.7L48 19.5Z"
        fill={`url(#${navyGrad})`}
      />

      {/* Subtle Specular Glaze */}
      <path
        d="M48 19.5L74.8 26.7V39C62 43 37 46 21.2 39V26.7L48 19.5Z"
        fill={`url(#${sheenGrad})`}
      />

      {/* Fine Inner Gold Hairline Ring */}
      <circle cx="48" cy="48.5" r="20.5" stroke={`url(#${goldGrad})`} strokeWidth="0.9" strokeOpacity="0.55" strokeDasharray="2.2 2" />

      {/* Subtle Honor Sunburst Rays */}
      <g stroke={`url(#${goldGrad})`} strokeWidth="1.2" strokeLinecap="round" strokeOpacity="0.45">
        <line x1="48" y1="24" x2="48" y2="28" />
        <line x1="48" y1="69" x2="48" y2="73" />
        <line x1="25" y1="48.5" x2="29" y2="48.5" />
        <line x1="67" y1="48.5" x2="71" y2="48.5" />
        <line x1="31.5" y1="32" x2="34.5" y2="35" />
        <line x1="61.5" y1="62" x2="64.5" y2="65" />
        <line x1="64.5" y1="32" x2="61.5" y2="35" />
        <line x1="34.5" y1="62" x2="31.5" y2="65" />
      </g>

      {/* Left Laurel / Padi Wreath */}
      <path
        d="M34 65.5C27.5 60 25.2 50 28.5 39.5"
        stroke={`url(#${goldGrad})`}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <g fill={`url(#${goldGrad})`}>
        <ellipse cx="26.5" cy="44" rx="2.6" ry="1.4" transform="rotate(-35 26.5 44)" />
        <ellipse cx="25.8" cy="50.5" rx="2.8" ry="1.5" transform="rotate(-15 25.8 50.5)" />
        <ellipse cx="27.3" cy="57" rx="2.8" ry="1.5" transform="rotate(15 27.3 57)" />
        <ellipse cx="30.8" cy="62.5" rx="2.7" ry="1.4" transform="rotate(35 30.8 62.5)" />
      </g>

      {/* Right Laurel / Padi Wreath */}
      <path
        d="M62 65.5C68.5 60 70.8 50 67.5 39.5"
        stroke={`url(#${goldGrad})`}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <g fill={`url(#${goldGrad})`}>
        <ellipse cx="69.5" cy="44" rx="2.6" ry="1.4" transform="rotate(35 69.5 44)" />
        <ellipse cx="70.2" cy="50.5" rx="2.8" ry="1.5" transform="rotate(15 70.2 50.5)" />
        <ellipse cx="68.7" cy="57" rx="2.8" ry="1.5" transform="rotate(-15 68.7 57)" />
        <ellipse cx="65.2" cy="62.5" rx="2.7" ry="1.4" transform="rotate(-35 65.2 62.5)" />
      </g>

      {/* Ruby Seal Behind Center Star */}
      <circle cx="48" cy="48.5" r="10.5" fill={`url(#${rubyGrad})`} stroke={`url(#${goldGrad})`} strokeWidth="1.3" />

      {/* 5-Pointed Faceted Bintang Jasa Utama */}
      {/* Base Star Silhouette */}
      <path
        d="M48 31.5L52.6 42.1L64 43.3L55.5 51L57.9 62.2L48 56.3L38.1 62.2L40.5 51L32 43.3L43.4 42.1L48 31.5Z"
        fill={`url(#${goldGrad})`}
      />
      {/* Shaded 3D Star Facets */}
      <path d="M48 31.5V48.5L52.6 42.1L48 31.5Z" fill={`url(#${goldDarkGrad})`} fillOpacity="0.45" />
      <path d="M64 43.3L48 48.5L55.5 51L64 43.3Z" fill={`url(#${goldDarkGrad})`} fillOpacity="0.55" />
      <path d="M57.9 62.2L48 48.5V56.3L57.9 62.2Z" fill={`url(#${goldDarkGrad})`} fillOpacity="0.65" />
      <path d="M38.1 62.2L48 48.5L40.5 51L38.1 62.2Z" fill={`url(#${goldDarkGrad})`} fillOpacity="0.4" />
      <circle cx="48" cy="48.5" r="2.6" fill="#fef3c7" stroke="#926811" strokeWidth="0.8" />

      {/* Bottom Honor Ribbon Scroll */}
      <path
        d="M36 69.5C40 72 56 72 60 69.5L58 74.2C53 76 43 76 38 74.2L36 69.5Z"
        fill={`url(#${goldGrad})`}
      />
    </svg>
  );
};

/**
 * 2. PKRI (Perintis Kemerdekaan Republik Indonesia)
 * Lencana Merah Merdeka dengan Bambu Runcing bersilang, Obor Kemerdekaan menyala,
 * Pita Merah Putih, dan Bintang Perintis di puncaknya.
 */
export const PkriEmblem: React.FC<EmblemProps> = ({ className = 'w-12 h-12' }) => {
  const uid = useId().replace(/:/g, '');
  const crimsonGrad = `pk-crimson-${uid}`;
  const goldGrad = `pk-gold-${uid}`;
  const flameGrad = `pk-flame-${uid}`;
  const sheenGrad = `pk-sheen-${uid}`;

  return (
    <svg
      viewBox="0 0 96 96"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={crimsonGrad} x1="18" y1="12" x2="78" y2="86" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#be123c" />
          <stop offset="50%" stopColor="#881337" />
          <stop offset="100%" stopColor="#4c0519" />
        </linearGradient>
        <linearGradient id={goldGrad} x1="16" y1="14" x2="80" y2="82" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#fef3c7" />
          <stop offset="30%" stopColor="#fbbf24" />
          <stop offset="70%" stopColor="#d4af37" />
          <stop offset="100%" stopColor="#92400e" />
        </linearGradient>
        <linearGradient id={flameGrad} x1="48" y1="20" x2="48" y2="44" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#fef9c3" />
          <stop offset="45%" stopColor="#fbbf24" />
          <stop offset="100%" stopColor="#ea580c" />
        </linearGradient>
        <linearGradient id={sheenGrad} x1="20" y1="14" x2="70" y2="46" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.28" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Outer Medallion Gold Rim */}
      <circle cx="48" cy="48" r="36" fill={`url(#${goldGrad})`} />
      {/* Inner Crimson Field */}
      <circle cx="48" cy="48" r="32.5" fill={`url(#${crimsonGrad})`} />
      {/* Top Glaze */}
      <path d="M18 36C24 22 36 16 48 16C60 16 72 22 78 36C65 42 31 42 18 36Z" fill={`url(#${sheenGrad})`} />
      {/* Inner Engraved Circle */}
      <circle cx="48" cy="48" r="28.5" stroke={`url(#${goldGrad})`} strokeWidth="1" strokeOpacity="0.55" />

      {/* Crossed Twin Bambu Runcing Spears */}
      <g stroke={`url(#${goldGrad})`} strokeWidth="2.8" strokeLinecap="round">
        <line x1="28" y1="68" x2="66" y2="28" />
        <line x1="68" y1="68" x2="30" y2="28" />
      </g>
      {/* Sharp Spear Tips */}
      <path d="M68 26L62.5 29L65.5 32L68 26Z" fill="#fef3c7" />
      <path d="M28 26L33.5 29L30.5 32L28 26Z" fill="#fef3c7" />

      {/* Sang Saka Merah Putih Unfurling Ribbon */}
      <path d="M23 56C34 51 62 51 73 56L70 61.5C60 57.5 36 57.5 26 61.5L23 56Z" fill="#dc2626" stroke={`url(#${goldGrad})`} strokeWidth="0.9" />
      <path d="M26 61.5C36 57.5 60 57.5 70 61.5L68 66.5C59 63 37 63 28 66.5L26 61.5Z" fill="#f8fafc" stroke={`url(#${goldGrad})`} strokeWidth="0.9" />

      {/* Central Obor Kemerdekaan (Independence Torch) */}
      <path
        d="M44 43H52L50.2 69C50 70.5 46 70.5 45.8 69L44 43Z"
        fill={`url(#${goldGrad})`}
        stroke="#78350f"
        strokeWidth="0.8"
      />
      {/* Torch Crown Bowl */}
      <path d="M40.5 39.5H55.5L53 44H43L40.5 39.5Z" fill={`url(#${goldGrad})`} stroke="#78350f" strokeWidth="0.7" />
      <rect x="44.2" y="48.5" width="7.6" height="2" rx="1" fill="#92400e" />

      {/* Sculpted Eternal Independence Flame */}
      <path
        d="M48 21C51.5 25.5 54.5 29.8 53.5 34.5C52.9 37.3 50.8 39.2 48 39.2C45.2 39.2 43.1 37.3 42.5 34.5C41.5 29.8 44.5 25.5 48 21Z"
        fill={`url(#${flameGrad})`}
      />
      <path
        d="M48 27C49.9 29.8 51 32.3 50.4 35C49.9 36.8 49 38 48 38C47 38 46.1 36.8 45.6 35C45 32.3 46.1 29.8 48 27Z"
        fill="#fffbeb"
      />

      {/* Top Vanguard Star */}
      <path
        d="M48 11.5L49.4 14.8L53 15.1L50.3 17.4L51.1 20.9L48 19L44.9 20.9L45.7 17.4L43 15.1L46.6 14.8L48 11.5Z"
        fill="#fef3c7"
        stroke="#92400e"
        strokeWidth="0.6"
      />
    </svg>
  );
};

/**
 * 3. Janda PKRI — Lencana Bakti Pertiwi & Melati Abadi
 * Medali perunggu-emas hangat bertatahkan perisai hati kehormatan,
 * pelita abadi menyala, serta kalungan melati kemerdekaan.
 */
export const JandaPkriEmblem: React.FC<EmblemProps> = ({ className = 'w-12 h-12' }) => {
  const uid = useId().replace(/:/g, '');
  const bronzeGrad = `jp-bronze-${uid}`;
  const goldGrad = `jp-gold-${uid}`;
  const pearlGrad = `jp-pearl-${uid}`;
  const sheenGrad = `jp-sheen-${uid}`;

  return (
    <svg
      viewBox="0 0 96 96"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={bronzeGrad} x1="16" y1="14" x2="80" y2="84" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#b45309" />
          <stop offset="52%" stopColor="#78350f" />
          <stop offset="100%" stopColor="#451a03" />
        </linearGradient>
        <linearGradient id={goldGrad} x1="18" y1="14" x2="78" y2="82" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#fef3c7" />
          <stop offset="32%" stopColor="#f5c451" />
          <stop offset="72%" stopColor="#d4af37" />
          <stop offset="100%" stopColor="#854d0e" />
        </linearGradient>
        <linearGradient id={pearlGrad} x1="48" y1="26" x2="48" y2="66" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#fffbeb" />
          <stop offset="100%" stopColor="#fde68a" />
        </linearGradient>
        <linearGradient id={sheenGrad} x1="20" y1="12" x2="66" y2="48" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Scalloped 12-Lobe Ceremonial Gold Badge */}
      <path
        d="M48 11L55.2 15.5L63.5 14.5L68 21.8L76.1 24.4L77.1 32.8L83.4 38.4L81 46.5L84.5 54.1L79.2 60.7L79.3 69.1L71.7 72.7L68.1 80.3L59.7 80.2L53.1 85.5L45.5 82L37.4 84.4L31.8 78.1L23.4 77.1L20.8 69L13.5 64.5L14.5 56.2L10 49L14.2 41.7L13.2 33.4L20.2 28.8L22.5 20.7L30.8 19.6L35.7 12.8L44 13.7L48 11Z"
        fill={`url(#${goldGrad})`}
      />

      {/* Inner Deep Bronze Medallion */}
      <circle cx="48" cy="48.5" r="30" fill={`url(#${bronzeGrad})`} stroke="#fef3c7" strokeWidth="1" strokeOpacity="0.45" />
      <path d="M22 37C27 24 37 19 48 19C59 19 69 24 74 37C61 42 35 42 22 37Z" fill={`url(#${sheenGrad})`} />

      {/* Twin Golden Jasmine / Laurel Arcs */}
      <path d="M31 66C24 58 23.5 45 29 34.5" stroke={`url(#${goldGrad})`} strokeWidth="2" strokeLinecap="round" />
      <path d="M65 66C72 58 72.5 45 67 34.5" stroke={`url(#${goldGrad})`} strokeWidth="2" strokeLinecap="round" />
      <g fill={`url(#${pearlGrad})`}>
        <circle cx="27" cy="42" r="2.1" />
        <circle cx="26" cy="50" r="2.3" />
        <circle cx="28.5" cy="58" r="2.1" />
        <circle cx="69" cy="42" r="2.1" />
        <circle cx="70" cy="50" r="2.3" />
        <circle cx="67.5" cy="58" r="2.1" />
      </g>

      {/* Protective Heart-Shield of Devotion */}
      <path
        d="M48 68C48 68 32.5 58.2 32.5 45.2C32.5 39.2 37.2 35 42.5 35C45.4 35 47.2 36.6 48 38.2C48.8 36.6 50.6 35 53.5 35C58.8 35 63.5 39.2 63.5 45.2C63.5 58.2 48 68 48 68Z"
        fill={`url(#${goldGrad})`}
        stroke="#451a03"
        strokeWidth="0.9"
      />

      {/* Inner Pearl Heart & Eternal Flame (Pelita Kesetiaan) */}
      <path
        d="M48 63.2C48 63.2 36 55.4 36 45.5C36 41.3 39.3 38.3 43 38.3C45.3 38.3 47 39.7 48 41.2C49 39.7 50.7 38.3 53 38.3C56.7 38.3 60 41.3 60 45.5C60 55.4 48 63.2 48 63.2Z"
        fill="#7f1d1d"
      />
      <path
        d="M48 41.5C50.6 45 52.3 48 51.6 51.3C51.1 53.5 49.6 54.8 48 54.8C46.4 54.8 44.9 53.5 44.4 51.3C43.7 48 45.4 45 48 41.5Z"
        fill={`url(#${pearlGrad})`}
      />

      {/* Top Crown Star */}
      <path
        d="M48 22.5L49.9 26.8L54.5 27.3L51 30.4L52 34.9L48 32.5L44 34.9L45 30.4L41.5 27.3L46.1 26.8L48 22.5Z"
        fill={`url(#${goldGrad})`}
        stroke="#451a03"
        strokeWidth="0.7"
      />

      {/* Base Honor Clasp */}
      <rect x="39" y="70.5" width="18" height="4.2" rx="2.1" fill={`url(#${goldGrad})`} stroke="#451a03" strokeWidth="0.7" />
    </svg>
  );
};

/**
 * 4. Keluarga Pahlawan — Perisai Silsilah & Pengayoman Nusantara
 * Perisai hijau zamrud kerajaan berbingkai emas dengan atap pengayoman,
 * tiga pilar silsilah keluarga penerus, serta bintang penuntun di puncak.
 */
export const KeluargaPahlawanEmblem: React.FC<EmblemProps> = ({ className = 'w-12 h-12' }) => {
  const uid = useId().replace(/:/g, '');
  const emeraldGrad = `kp-emerald-${uid}`;
  const goldGrad = `kp-gold-${uid}`;
  const ivoryGrad = `kp-ivory-${uid}`;
  const sheenGrad = `kp-sheen-${uid}`;

  return (
    <svg
      viewBox="0 0 96 96"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={emeraldGrad} x1="16" y1="12" x2="80" y2="86" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#059669" />
          <stop offset="50%" stopColor="#065f46" />
          <stop offset="100%" stopColor="#022c22" />
        </linearGradient>
        <linearGradient id={goldGrad} x1="18" y1="12" x2="78" y2="84" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#fef3c7" />
          <stop offset="32%" stopColor="#f5c451" />
          <stop offset="72%" stopColor="#d4af37" />
          <stop offset="100%" stopColor="#854d0e" />
        </linearGradient>
        <linearGradient id={ivoryGrad} x1="48" y1="32" x2="48" y2="66" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#fde68a" />
        </linearGradient>
        <linearGradient id={sheenGrad} x1="20" y1="14" x2="66" y2="48" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.28" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Outer Gilded Royal Shield with Top Crest */}
      <path
        d="M48 12L57 17.5L79 21.5V48C79 66 65.5 79 48 85.5C30.5 79 17 66 17 48V21.5L39 17.5L48 12Z"
        fill={`url(#${goldGrad})`}
      />

      {/* Inner Emerald Nusantara Field */}
      <path
        d="M48 15.6L55.8 20.5L75.6 24.1V48C75.6 64 63.4 75.5 48 81.6C32.6 75.5 20.4 64 20.4 48V24.1L40.2 20.5L48 15.6Z"
        fill={`url(#${emeraldGrad})`}
      />

      {/* Specular Top Sheen */}
      <path
        d="M48 15.6L55.8 20.5L75.6 24.1V38C60 43 36 43 20.4 38V24.1L40.2 20.5L48 15.6Z"
        fill={`url(#${sheenGrad})`}
      />

      {/* Inner Protective Nusantara Roof Arch */}
      <path
        d="M27 42.5L48 28.5L69 42.5"
        stroke={`url(#${goldGrad})`}
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Guiding Heritage Star Above Family Roof */}
      <path
        d="M48 19.5L49.6 23.1L53.5 23.5L50.5 26L51.4 29.8L48 27.8L44.6 29.8L45.5 26L42.5 23.5L46.4 23.1L48 19.5Z"
        fill={`url(#${goldGrad})`}
      />

      {/* Three Unified Generational Figures (Silsilah Keluarga Pahlawan) */}
      {/* Center Guardian Figure */}
      <circle cx="48" cy="41.5" r="4.2" fill={`url(#${ivoryGrad})`} />
      <path
        d="M40.5 61V52.5C40.5 48.6 43.8 46.5 48 46.5C52.2 46.5 55.5 48.6 55.5 52.5V61H40.5Z"
        fill={`url(#${goldGrad})`}
      />

      {/* Left Family Pillar */}
      <circle cx="34.5" cy="45.5" r="3.2" fill={`url(#${ivoryGrad})`} />
      <path
        d="M28.5 61V54C28.5 50.8 31.1 49.2 34.5 49.2C37.2 49.2 39 50.2 39.7 52V61H28.5Z"
        fill={`url(#${ivoryGrad})`}
        fillOpacity="0.9"
      />

      {/* Right Family Pillar */}
      <circle cx="61.5" cy="45.5" r="3.2" fill={`url(#${ivoryGrad})`} />
      <path
        d="M56.3 61V52C57 50.2 58.8 49.2 61.5 49.2C64.9 49.2 67.5 50.8 67.5 54V61H56.3Z"
        fill={`url(#${ivoryGrad})`}
        fillOpacity="0.9"
      />

      {/* Foundation Heritage Bar & Laurel Base */}
      <path
        d="M28 65.5C35 69.5 61 69.5 68 65.5"
        stroke={`url(#${goldGrad})`}
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <rect x="27" y="61" width="42" height="2.4" rx="1.2" fill={`url(#${goldGrad})`} />
    </svg>
  );
};
