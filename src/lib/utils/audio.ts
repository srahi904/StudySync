// src/lib/utils/audio.ts

export function playNotificationSound() {
  if (typeof window === 'undefined') return;
  
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // Create a subtle "pop" / "bloop" sound
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.type = 'sine';
    
    // Frequency sweep for a nice pop sound
    oscillator.frequency.setValueAtTime(600, audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(800, audioContext.currentTime + 0.05);
    oscillator.frequency.exponentialRampToValueAtTime(300, audioContext.currentTime + 0.1);
    
    // Volume envelope
    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.15);
  } catch (error) {
    console.error('Failed to play notification sound:', error);
  }
}
