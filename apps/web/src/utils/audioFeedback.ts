// Industrial Web Audio API tone generator for warehouse barcode scanner feedback
class AudioFeedback {
  private audioContext: AudioContext | null = null;

  // Initialize or resume browser audio context
  private getContext(): AudioContext | null {
    if (typeof window === "undefined") return null;
    if (!this.audioContext) {
      const AudioConstructor = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioConstructor) {
        this.audioContext = new AudioConstructor();
      }
    }
    if (this.audioContext && this.audioContext.state === "suspended") {
      this.audioContext.resume();
    }
    return this.audioContext;
  }

  // Play crisp high-frequency confirmation tone (880Hz, 80ms)
  public playSuccessTone(): void {
    const context = this.getContext();
    if (!context) return;

    try {
      const oscillator = context.createOscillator();
      const gainNode = context.createGain();

      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(880, context.currentTime);

      gainNode.gain.setValueAtTime(0.15, context.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.08);

      oscillator.connect(gainNode);
      gainNode.connect(context.destination);

      oscillator.start();
      oscillator.stop(context.currentTime + 0.08);
    } catch {
      // Audio playback unavailable or blocked by browser policy
    }
  }

  // Play low-frequency error rejection tone (220Hz, 150ms)
  public playErrorTone(): void {
    const context = this.getContext();
    if (!context) return;

    try {
      const oscillator = context.createOscillator();
      const gainNode = context.createGain();

      oscillator.type = "sawtooth";
      oscillator.frequency.setValueAtTime(220, context.currentTime);

      gainNode.gain.setValueAtTime(0.2, context.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.15);

      oscillator.connect(gainNode);
      gainNode.connect(context.destination);

      oscillator.start();
      oscillator.stop(context.currentTime + 0.15);
    } catch {
      // Audio playback unavailable or blocked by browser policy
    }
  }
}

export const audioFeedback = new AudioFeedback();
