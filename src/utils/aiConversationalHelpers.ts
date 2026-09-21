export type ConversationalFillerType = 'ack' | 'gratitude' | 'praise' | 'follow_up';

export interface ConversationalFillerResult {
  isFiller: boolean;
  fillerType: ConversationalFillerType | null;
}

/**
 * Normalizes input text and checks if it is a conversational filler,
 * acknowledgement, gratitude, or praise rather than an information query.
 */
export function checkConversationalFiller(input: string): ConversationalFillerResult {
  if (!input || typeof input !== 'string') {
    return { isFiller: false, fillerType: null };
  }

  // Strip punctuation and extra spaces
  const norm = input
    .toLowerCase()
    .trim()
    .replace(/[.,!?:;~_()\-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!norm) return { isFiller: false, fillerType: null };

  // Strip conversational opener prefixes (e.g. "oke sekarang", "oke siap sekarang", "nah sekarang", "baiklah", "jadi", "oh begitu", dll.)
  const strippedOpener = norm.replace(/^((oke|ok|siap|baik|baiklah|nah|jadi|trus|terus|sekarang|yaudah|yowes|mangga|atuh|punten|oh\s+begitu|oh\s+gitu|halo|hai|min|kang|teh|admin)\s+)+/i, '').trim();

  // Helper tester for string candidates (testing both raw stripped and opener-stripped forms)
  const testCandidate = (s: string) => {
    return s.replace(/\s+(dong|deh|ya|nih|atuh|min|kang|teh|admin|kak|bang|gan|bro|boss|bos)+$/i, '').trim();
  };

  const c1 = testCandidate(norm);
  const c2 = testCandidate(strippedOpener);

  // 1. Gratitude / Ucapan Terima Kasih
  if (
    /^(terima\s*kasih|makasih|makasi|mksh|trims|tq|thanks|thank\s*you|thx|matur\s*nuwun|hatur\s*nuhun|nuhun)(\s+(banyak|banget|pisan|ya|min|kang|teh|admin|kak|atas\s+infonya|infonya|bantuannya|bantuan|infona))*$/i.test(c1) ||
    /^(terima\s*kasih|makasih|makasi|mksh|trims|tq|thanks|thank\s*you|thx|matur\s*nuwun|hatur\s*nuhun|nuhun)(\s+(banyak|banget|pisan|ya|min|kang|teh|admin|kak|atas\s+infonya|infonya|bantuannya|bantuan|infona))*$/i.test(c2)
  ) {
    return { isFiller: true, fillerType: 'gratitude' };
  }

  // 2. Conversational Fillers, Acknowledgments & Confirmations ("ohh", "oke", "siap", "paham", "ngerti", dll.)
  if (
    /^(o+h+|o+h+m+|o+h+i+c+|o+a+l+a+h+|o+w+a+l+a+h+|o+k+e+|o+k+|o+k+a+y+|o+k+e+y+|o+c+e+|s+i+p+|s+i+a+p+|s+i+i+a+p+|n+o+t+e+d+|y+o+i+|y+u+p+|y+a+p+|y+a+|i+y+a+|i+y+e+s+s*|i+y+o+|y+o+|b+a+i+k+|b+a+i+k+l+a+h+|p+a+h+a+m+|n+g+e+r+t+i+|m+e+n+g+e+r+t+i+|j+e+l+a+s+|m+u+h+u+n+|e+n+y+a+|h+e+u+e+u+h+|l+e+r+e+s+|s+a+e+)(\s+(ya|min|kang|teh|admin|kak|bang|paham|siap|oke|deh|dong|gan|bro|boss|bos))*$/i.test(c1) ||
    /^(oke\s+siap|oke\s+baik|siap\s+min|siap\s+kak|siap\s+kang|siap\s+admin|siap\s+komandan|siap\s+paham|oke\s+paham|cukup\s+jelas|sudah\s+paham|sudah\s+jelas|udah\s+paham|udah\s+jelas|ngerti\s+min|paham\s+min|baik\s+terima\s+kasih|oke\s+makasih|siap\s+nuhun|oke\s+nuhun|muhun\s+mangga|mangga\s+atuh)$/i.test(c1) ||
    /^(oh\s+gitu|oh\s+begitu|gitu\s+ya|begitu\s+ya|oh\s+jadi\s+gitu|oh\s+gitu\s+ya|oh\s+begitu\s+toh|gitu\s+toh|oh\s+gitu\s+min|oh\s+begitu\s+min|jadi\s+begitu|jadi\s+gitu|oh\s+jadi\s+begitu|baru\s+tahu|baru\s+tau)$/i.test(c1)
  ) {
    return { isFiller: true, fillerType: 'ack' };
  }

  // 3. Follow-up Preamble / Intention to ask more questions ("oke sekarang saya ingin tanyakan 1 hal lagi", "ada 1 hal lagi", dll.)
  const isFollowUpPrompt = (s: string) => {
    return (
      /^(saya\s+|abdi\s+|urang\s+|aku\s+)?(ingin|mau|bade|hoyong|pengen)?\s*(menanyakan|tanyakan|nanya|bertanya|naros|taros)\s*(\d+|satu|hiji)?\s*(hal|perkara|perkawis|soal|pertanyaan)?(\s+lagi|\s+deui)?$/i.test(s) ||
      /^(ada\s+|aya\s+)?(\d+|satu|hiji)?\s*(hal|perkara|perkawis|pertanyaan|tarosan|anu\s+bade\s+ditaroskeun|yang\s+ingin\s+ditanyakan)\s*(lagi|deui)?$/i.test(s) ||
      /^(satu\s+hal\s+lagi|1\s+hal\s+lagi|ada\s+1\s+hal\s+lagi|ada\s+satu\s+hal\s+lagi|hiji\s+perkawis\s+deui|hiji\s+deui|1\s+deui|pertanyaan\s+terakhir)$/i.test(s) ||
      /^(saya|abdi|urang|aku)?\s*(ingin|mau|bade|hoyong|pengen)?\s*(nanya|tanya|bertanya|menanyakan|tanyakan)\s*(lagi|deui)$/i.test(s) ||
      /\b(ingin|mau|bade|hoyong|pengen)\s+(menanyakan|tanyakan|nanya|bertanya|naros|taros)\s+(\d+|satu|hiji)?\s*(hal|perkara|perkawis|soal|pertanyaan)?\s*(lagi|deui)\b/i.test(s) ||
      /\b(ada|aya)\s+(\d+|satu|hiji)\s+(hal|perkara|pertanyaan)\s*(lagi|deui)\b/i.test(s)
    );
  };

  if (isFollowUpPrompt(c1) || isFollowUpPrompt(c2)) {
    return { isFiller: true, fillerType: 'follow_up' };
  }

  // 4. Praise / Appreciation ("mantap", "keren", "bagus", "hebat", dll.)
  if (
    /^(mantap|mantul|keren|bagus|hebat|salut|top|jos|joss|gokil|sae\s+pisan|alus\s+pisan|luar\s+biasa|patut\s+diacungi\s+jempol|edun)(\s+(banget|sekali|min|kang|teh|admin|ya|pisan|euy|infonya|infona))*$/i.test(c1) ||
    /^(mantap|mantul|keren|bagus|hebat|salut|top|jos|joss|gokil|sae\s+pisan|alus\s+pisan|luar\s+biasa|patut\s+diacungi\s+jempol|edun)(\s+(banget|sekali|min|kang|teh|admin|ya|pisan|euy|infonya|infona))*$/i.test(c2)
  ) {
    return { isFiller: true, fillerType: 'praise' };
  }

  return { isFiller: false, fillerType: null };
}

/**
 * Generates an empathetic, natural conversational reply for fillers
 * that smoothly connects to previous context (multi-turn continuity).
 */
export function formatConversationalFillerReply(
  fillerType: ConversationalFillerType,
  isDeveloperUser: boolean,
  previousContext?: string,
  _userName?: string
): string {
  const normPrev = (previousContext || '').toLowerCase();
  let topicContext = '';

  if (normPrev.includes('tagana') || normPrev.includes('taruna siaga')) topicContext = 'TAGANA (Taruna Siaga Bencana)';
  else if (normPrev.includes('psm') || normPrev.includes('sosial masyarakat')) topicContext = 'PSM (Pekerja Sosial Masyarakat)';
  else if (normPrev.includes('tksk') || normPrev.includes('kecamatan')) topicContext = 'TKSK (Tenaga Kesejahteraan Sosial Kecamatan)';
  else if (normPrev.includes('karang taruna') || normPrev.includes('katar')) topicContext = 'Karang Taruna';
  else if (normPrev.includes('peksos') || normPrev.includes('pksp')) topicContext = 'PEKSOS (Pekerja Sosial Profesional)';
  else if (normPrev.includes('lks') || normPrev.includes('panti')) topicContext = 'LKS (Lembaga Kesejahteraan Sosial)';
  else if (normPrev.includes('lk3')) topicContext = 'LK3 (Lembaga Konsultasi Kesejahteraan Keluarga)';
  else if (normPrev.includes('pensos') || normPrev.includes('penyuluh')) topicContext = 'Penyuluh Sosial';
  else if (normPrev.includes('kube') || normPrev.includes('badan usaha')) topicContext = 'KUBE & Badan Usaha Sosial';
  else if (normPrev.includes('slrt') || normPrev.includes('puskesos')) topicContext = 'SLRT / Puskesos';
  else if (normPrev.includes('alur pendaftaran') || normPrev.includes('pendaftaran') || normPrev.includes('verifikasi berkas')) topicContext = 'alur pendaftaran & verifikasi berkas';
  else if (normPrev.includes('ilham fazril') || normPrev.includes('ilham') || normPrev.includes('developer') || normPrev.includes('pembuat')) topicContext = 'pengembang sistem (Ilham Fazril)';
  else if (normPrev.includes('psks') || normPrev.includes('potensi dan sumber kesejahteraan')) topicContext = 'PSKS Jawa Barat';

  // Sapaan khusus Developer (Ilham Fazril)
  if (isDeveloperUser) {
    if (fillerType === 'gratitude') {
      return `Sama-sama santai Kang **Ilham Fazril**! Ada arsitektur, query, atau modul kodingan apa lagi yang mau kita bahas atau oprek bareng? Gas! 🚀💻`;
    }
    if (fillerType === 'praise') {
      return `Hehe nuhun pujianna Kang **Ilham Fazril**! Arsitektur full-stack sistem PSKS JABAR buatan maneh emang patut diacungi jempol. Mau bahas atau kembangin fitur apa lagi nih? 😎⚡`;
    }
    if (fillerType === 'follow_up') {
      return `Mangga atuh Kang **Ilham Fazril**, sampaikan saja! Mau nanya atau bahas hal apa lagi nih? Urang siap jawab tuntas! 🚀⚡`;
    }
    return `Siap santai Kang **Ilham Fazril**! Kodingan dan sistem AI udah sinkron mantap. Ada hal atau fitur apa lagi yang mau kita eksekusi? 🚀⚡`;
  }

  // Follow-up Preamble ("saya ingin menanyakan 1 hal lagi", "ada 1 hal lagi", dll.)
  if (fillerType === 'follow_up') {
    if (topicContext) {
      return `Tentu saja, silakan sampaikan apa yang ingin Anda tanyakan lebih lanjut seputar **${topicContext}** atau topik lainnya! Saya siap membantu menjawab dengan senang hati 😊.`;
    }
    return `Tentu saja, silakan sampaikan pertanyaan Anda! Saya siap membantu menjawab informasi seputar 10 Pilar PSKS, pendaftaran anggota, maupun layanan Dinas Sosial Jawa Barat 😊.`;
  }

  // Ucapan Terima Kasih
  if (fillerType === 'gratitude') {
    return `Sama-sama! Senang bisa membantu Anda 😊. Jika ada hal lain seputar 10 Pilar PSKS atau layanan Dinas Sosial Provinsi Jawa Barat yang ingin Anda tanyakan, silakan langsung sampaikan ya. Tetap semangat!`;
  }

  // Pujian & Apresiasi
  if (fillerType === 'praise') {
    return `Terima kasih banyak atas apresiasi positifnya 😊! Semoga informasinya bermanfaat. Apakah ada informasi lain seputar ${topicContext ? `**${topicContext}**` : '10 Pilar PSKS dan layanan sosial Jawa Barat'} yang bisa saya bantu jelaskan?`;
  }

  // Conversational Filler / Ack ("ohh", "oke", "siap", "paham", "ngerti", "oh gitu", dll.)
  if (topicContext) {
    return `Iya betul, semoga penjelasannya bermanfaat dan mudah dipahami 😊. Apakah ada hal lain yang ingin Anda ketahui lebih lanjut seputar **${topicContext}** atau layanan sosial lainnya di Jawa Barat? Saya siap membantu!`;
  }

  return `Iya, betul 😊. Ada yang ingin ditanyakan lagi seputar 10 Pilar PSKS atau layanan Dinas Sosial Provinsi Jawa Barat? Saya siap membantu memberikan panduan yang Anda butuhkan!`;
}
