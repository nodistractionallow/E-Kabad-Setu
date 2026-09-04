import { Language } from '../types';

let currentUtterance: SpeechSynthesisUtterance | null = null;

export const speakVoice = (text: string, lang: Language = 'hi'): Promise<boolean> => {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      console.warn('Speech synthesis not supported in this browser.');
      playFeedbackChime();
      resolve(false);
      return;
    }

    try {
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      currentUtterance = utterance;

      const langMap: Record<Language, string> = {
        hi: 'hi-IN',
        mr: 'mr-IN',
        en: 'en-IN',
      };

      utterance.lang = langMap[lang] || 'hi-IN';
      utterance.rate = 0.95;
      utterance.pitch = 1.0;

      const voices = window.speechSynthesis.getVoices();
      const matchedVoice = voices.find(
        (v) => v.lang.startsWith(utterance.lang) || (lang === 'hi' && v.lang.includes('hi'))
      );

      if (matchedVoice) {
        utterance.voice = matchedVoice;
      }

      utterance.onend = () => {
        currentUtterance = null;
        resolve(true);
      };

      utterance.onerror = (e) => {
        console.warn('Speech synthesis utterance error:', e);
        currentUtterance = null;
        resolve(false);
      };

      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.warn('Speech synthesis error:', err);
      playFeedbackChime();
      resolve(false);
    }
  });
};

export const stopVoice = () => {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    currentUtterance = null;
  }
};

// Subtle Web Audio API chime as instant tactile confirmation
export const playFeedbackChime = (type: 'beep' | 'warning' | 'success' = 'beep') => {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;

    if (type === 'warning') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.setValueAtTime(330, now + 0.1);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
      osc.start(now);
      osc.stop(now + 0.35);
    } else if (type === 'success') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, now); // C5
      osc.frequency.setValueAtTime(659.25, now + 0.08); // E5
      osc.frequency.setValueAtTime(783.99, now + 0.16); // G5
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
      osc.start(now);
      osc.stop(now + 0.4);
    } else {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, now);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
      osc.start(now);
      osc.stop(now + 0.15);
    }
  } catch {
    // Silent fail if AudioContext is blocked by autoplay policy
  }
};
