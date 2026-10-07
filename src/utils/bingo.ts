export function getBingoLetter(number: number): string {
  if (number >= 1 && number <= 15) return 'B';
  if (number >= 16 && number <= 30) return 'I';
  if (number >= 31 && number <= 45) return 'N';
  if (number >= 46 && number <= 60) return 'G';
  if (number >= 61 && number <= 75) return 'O';
  return '';
}

export function speakBingoNumber(number: number) {
  if (!('speechSynthesis' in window)) return;
  
  // Cancelar habla anterior para evitar acumulación de cola
  window.speechSynthesis.cancel();

  const letter = getBingoLetter(number);
  const text = `${letter}, ${number}`;
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'es-CO';
  utterance.rate = 0.9; // Un poco más lento para claridad

  // Intentar buscar una voz femenina en español
  const voices = window.speechSynthesis.getVoices();
  const femaleVoice = voices.find(v => 
    v.lang.startsWith('es') && (
      v.name.toLowerCase().includes('female') || 
      v.name.toLowerCase().includes('mujer') || 
      v.name.toLowerCase().includes('paulina') || 
      v.name.toLowerCase().includes('helena') || 
      v.name.toLowerCase().includes('monica') ||
      v.name.includes('Google español')
    )
  );

  if (femaleVoice) {
    utterance.voice = femaleVoice;
  }

  window.speechSynthesis.speak(utterance);
}
