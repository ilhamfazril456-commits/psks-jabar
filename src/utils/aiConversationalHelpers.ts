export type ConversationalFillerType = 'ack' | 'gratitude' | 'praise' | 'follow_up' | 'question_inquiry' | 'capability_inquiry' | 'closure';

export interface ConversationalFillerResult {
  isFiller: boolean;
  fillerType: ConversationalFillerType | null;
  extractedCount?: number | null;
  isAskingPermission?: boolean;
}

/**
 * Normalizes input text and checks if it is a conversational filler,
 * acknowledgement, gratitude, praise, question inquiry, or preamble.
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

  // 0. Question Inquiry / Preamble / Asking Permission to Ask Questions ("bertanya banyak boleh ga?", "saya memiliki 12 pertanyaan, bisakah anda menjawabnya?", "boleh tanya?", dll.)
  const isQuestionInquiry = (s: string): { matched: boolean; count?: number | null; isPerm?: boolean } => {
    // Check for explicit count of questions (e.g. "12 pertanyaan", "5 pertanyaan", "sepuluh pertanyaan", etc.)
    const countMatch = s.match(/\b(\d+)\s+(pertanyaan|tarosan)\b/i) || s.match(/(pertanyaan|tarosan)\s*(sebanyak\s*)?(\d+)/i);
    let extractedCount: number | null = null;
    if (countMatch && (countMatch[1] || countMatch[3])) {
      const parsed = parseInt(countMatch[1] || countMatch[3], 10);
      if (!isNaN(parsed) && parsed > 0) extractedCount = parsed;
    }

    // A. Asking permission or stating ability to ask questions ("bertanya banyak boleh ga?", "boleh nanya?", "bisa nanya?", etc.)
    const askingPermission =
      /\b(bertanya|nanya|tanya|naros|taros)\s+(banyak|beberapa|macam|hal|seueur)?\s*(boleh|bisa|kenging|tiasa)?\s*(ga|gak|nggak|teu|kah)?\b/i.test(s) ||
      /\b(boleh|bisa|kenging|tiasa)\s*(kah)?\s*(saya|aku|abdi|urang)?\s*(bertanya|nanya|tanya|naros|taros)\b/i.test(s) ||
      /\b(apakah\s+)?(boleh|bisa)\s+(bertanya|nanya|tanya|naros)\b/i.test(s) ||
      /\b(mau|ingin|bade|hoyong)\s+(nanya|tanya|bertanya|naros)\s*(dong|nih|ya|atuh|min|kang|teh)?\s*(boleh|bisa|kenging|tiasa)?/i.test(s) ||
      /\b(bisa|boleh|tiasa|kenging)\s+(tanya|nanya|naros)\s*(tanya)?\s*(di\s+sini|disini)?\b/i.test(s);

    // B. Stating intent to ask questions or asking if AI can answer ("saya memiliki 12 pertanyaan, bisakah anda menjawabnya?", "saya ada pertanyaan", etc.)
    const statingQuestions =
      /\b(saya|aku|abdi|urang)\s+(memiliki|punya|ada|gaduh|bade)\s+(\d+|banyak|beberapa|satu|dua|tiga|seueur)?\s*(pertanyaan|tarosan)\b/i.test(s) ||
      /\b(ada|punya|gaduh|aya)\s+(\d+|banyak|beberapa|seueur)\s+(pertanyaan|tarosan)\b/i.test(s) ||
      /\b(bisa|bisakah|dapatkah|tiasa)\s+(anda|kamu)?\s*(menjawab(nya)?|jawab(nya)?|bantu\s+jawab|jawab\s+pertanyaan|ngawaler)\b/i.test(s) ||
      /\b(tolong|bisa|apakah\s+bisa)?\s*(jawab|menjawab|waler|ngawaler)\s+(pertanyaan|tarosan|semuanya|ini)?\b/i.test(s) ||
      /\b(ada\s+yang\s+(mau|ingin)\s+(saya|aku)?\s*(tanyakan|tanya|tanyain))\b/i.test(s) ||
      /\b(mau|ingin|bade|hoyong)\s+(konsultasi|tanya\s+sesuatu|nanya\s+sesuatu|naroskeun\s+sawios)\b/i.test(s);

    if (askingPermission || statingQuestions || extractedCount !== null) {
      return { matched: true, count: extractedCount, isPerm: askingPermission };
    }

    return { matched: false };
  };

  const qi1 = isQuestionInquiry(c1);
  const qi2 = isQuestionInquiry(c2);
  const qiRaw = isQuestionInquiry(norm);
  if (qi1.matched || qi2.matched || qiRaw.matched) {
    const finalCount = qi1.count || qi2.count || qiRaw.count || null;
    const finalPerm = qi1.isPerm || qi2.isPerm || qiRaw.isPerm || false;
    return {
      isFiller: true,
      fillerType: 'question_inquiry',
      extractedCount: finalCount,
      isAskingPermission: finalPerm,
    };
  }

  // 0.5 Capability & Identity Inquiry ("kamu bisa apa aja?", "bisa bantu apa?", "apa tugasmu?", "kamu siapa?")
  const isCapabilityOrIdentity =
    /\b(kamu|anda)?\s*(bisa|dapat)\s*(ngapain|apa\s+(aja|saja)|bantu\s+apa|ngapain\s+aja)\b/i.test(c1) ||
    /\b(apa\s+(saja\s+)?(yang\s+)?(bisa|dapat)\s+(kamu|anda)\s+(lakukan|jawab|bantu))\b/i.test(c1) ||
    /\b(apa\s+kemampuan|fitur\s+apa\s+saja|tugas\s+(kamu|anda)|fungsi\s+(kamu|anda))\b/i.test(c1) ||
    /\b(kamu|anda)\s+(siapa|ini\s+siapa|robot\s+apa|ai\s+apa)\b/i.test(c1) ||
    /\b(siapa\s+(kamu|anda))\b/i.test(c1) ||
    /^(bisa\s+bantu\s+apa|apa\s+yang\s+bisa\s+kamu\s+jawab)\??$/i.test(c1);

  if (isCapabilityOrIdentity) {
    return { isFiller: true, fillerType: 'capability_inquiry' };
  }

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

  // 5. Conversational Closure & Confirmation of No More Questions ("tidak ada", "ga ada", "udah cukup", "pas", dll.)
  if (
    /^(tidak\s*ada|ga\s*ada|gak\s*ada|ngga\s*ada|nggak\s*ada|teu\s*aya|kosong|udah\s*cukup|sudah\s*cukup|cukup\s*min|cukup|pas|itu\s*aja|itu\s*saja|udah\s*itu\s*aja|sudah\s*itu\s*saja|cukup\s*itu\s*aja|tidak\s*ada\s*lagi|ga\s*ada\s*lagi|gak\s*ada\s*lagi)(\s+(min|kang|teh|admin|kak|makasih|terima\s*kasih|kok|dulu))*$/i.test(c1) ||
    /^(tidak\s*ada|ga\s*ada|gak\s*ada|ngga\s*ada|nggak\s*ada|teu\s*aya|kosong|udah\s*cukup|sudah\s*cukup|cukup\s*min|cukup|pas|itu\s*aja|itu\s*saja|udah\s*itu\s*aja|sudah\s*itu\s*saja|cukup\s*itu\s*aja|tidak\s*ada\s*lagi|ga\s*ada\s*lagi|gak\s*ada\s*lagi)(\s+(min|kang|teh|admin|kak|makasih|terima\s*kasih|kok|dulu))*$/i.test(c2)
  ) {
    return { isFiller: true, fillerType: 'closure' };
  }

  return { isFiller: false, fillerType: null };
}

/**
 * Generates an empathetic, natural conversational reply for fillers,
 * question inquiries, and preambles.
 */
export function formatConversationalFillerReply(
  fillerType: ConversationalFillerType,
  isDeveloperUser: boolean,
  previousContext?: string,
  _userName?: string,
  extractedCount?: number | null
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
    if (fillerType === 'question_inquiry') {
      return `Tentu saja sangat boleh bos **Ilham Fazril**! Silakan sampaikan ${extractedCount ? `apa saja **${extractedCount} pertanyaan** tersebut` : 'pertanyaan-pertanyaannya'}, mau sekaligus atau satu per satu. Kodingan, query database Firestore, maupun arsitektur full-stack PSKS JABAR siap kita bahas tuntas! 🚀💻`;
    }
    if (fillerType === 'capability_inquiry') {
      return `Halo bos arsitek **Ilham Fazril**! Sistem asisten AI ini kamu rancang untuk menguasai data 10 Pilar PSKS, validasi verifikasi 2-tier, sebaran 27 Kab/Kota, dan integrasi Firestore. Ada modul atau logika yang mau kita uji atau kembangkan lagi? 🚀⚡`;
    }
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

  // 0. Question Inquiry / Preamble ("bertanya banyak boleh ga?", "saya memiliki 12 pertanyaan, bisakah anda menjawabnya?", dll.)
  if (fillerType === 'question_inquiry') {
    const questionPhrase = extractedCount
      ? `apa saja **${extractedCount} pertanyaan** tersebut`
      : 'semua pertanyaan yang ingin Anda tanyakan';

    return `Tentu saja sangat boleh! Silakan sampaikan ${questionPhrase}. Anda bebas menanyakannya sekaligus secara berurutan maupun satu per satu langsung di sini.

Sebagai Asisten Resmi **PSKS JABAR**, saya siap membantu memberikan jawaban yang jelas, rapi, dan terstruktur seputar:
- **10 Pilar Kesejahteraan Sosial** (Tagana, PSM, TKSK, Peksos, Karang Taruna, LKS, LK3, Pensos, KUBE, dan SLRT/Puskesos).
- **Alur Pendaftaran Mandiri & Verifikasi Berkas Berjenjang** (syarat berkas, verifikasi wilayah Kab/Kota, hingga pengesahan Provinsi).
- **Data Statistik & Sebaran Wilayah** di 27 Kabupaten/Kota se-Jawa Barat.
- **Layanan, Regulasi Resmi, & Kontak Pengaduan** Dinas Sosial Provinsi Jawa Barat.

Silakan ketik pertanyaan Anda di kolom percakapan ini, saya siap menjawabnya dengan senang hati 😊!`;
  }

  // 0.5 Capability Inquiry ("kamu bisa apa aja?", "siapa kamu?")
  if (fillerType === 'capability_inquiry') {
    return `Halo! Saya adalah Asisten AI Resmi **PSKS JABAR** (Kecerdasan Buatan Dinas Sosial Provinsi Jawa Barat). Saya siap membantu Anda memberikan informasi dan panduan seputar:
1. **10 Pilar Kesejahteraan Sosial**: Regulasi, tugas pokok, fungsi, dan kriteria personil pilar sosial.
2. **Panduan Pendaftaran Mandiri**: Tata cara mendaftar, syarat berkas pendukung, serta pemantauan status verifikasi berkas.
3. **Data dan Statistik Sebaran**: Informasi jumlah personil terverifikasi di 27 Kabupaten/Kota se-Jawa Barat.
4. **Layanan Kedinasan**: Informasi kontak kantor, alamat, dan saluran konsultasi resmi Dinsos Jawa Barat.

Silakan tanyakan informasi yang sedang Anda butuhkan!`;
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

  // Percakapan Penutup / Konfirmasi Tidak Ada Pertanyaan Lagi ("tidak ada", "udah cukup", dll.)
  if (fillerType === 'closure') {
    return `Baik, terima kasih banyak! 😊 Jika sewaktu-waktu membutuhkan panduan atau informasi seputar 10 Pilar PSKS dan layanan Dinas Sosial Provinsi Jawa Barat lagi, jangan ragu untuk menyapa kembali ya. Semoga harinya menyenangkan!`;
  }

  // Conversational Filler / Ack ("ohh", "oke", "siap", "paham", "ngerti", "oh gitu", dll.)
  if (topicContext) {
    return `Iya betul, semoga penjelasannya bermanfaat dan mudah dipahami 😊. Apakah ada hal lain yang ingin Anda ketahui lebih lanjut seputar **${topicContext}** atau layanan sosial lainnya di Jawa Barat? Saya siap membantu!`;
  }

  return `Iya, betul 😊. Ada yang ingin ditanyakan lagi seputar 10 Pilar PSKS atau layanan Dinas Sosial Provinsi Jawa Barat? Saya siap membantu memberikan panduan yang Anda butuhkan!`;
}
