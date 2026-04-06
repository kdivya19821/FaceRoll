/**
 * Utility to handle Text-to-Speech (TTS) using the Web Speech API
 */

export const speak = (text) => {
    if (!window.speechSynthesis) {
        console.error("Speech Synthesis not supported in this browser.");
        return;
    }

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    
    // Optional: Configure voice profile (speed, pitch, etc.)
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    // Use a natural sounding voice if available (optional)
    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
        // Try to find a nice English voice
        const preferredVoice = voices.find(v => v.name.includes('Google') || v.name.includes('Natural') || v.lang === 'en-US');
        if (preferredVoice) utterance.voice = preferredVoice;
    }

    window.speechSynthesis.speak(utterance);
};

export const announceAttendance = (studentName, isLate = false) => {
    const text = isLate 
        ? `Late entry marked for ${studentName}.` 
        : `Done! Attendance marked for ${studentName}.`;
    speak(text);
};

export const announceRegistration = (name) => {
    speak(`Registration complete for ${name}.`);
};
