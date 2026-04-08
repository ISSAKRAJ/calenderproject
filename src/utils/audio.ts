class SoundEngine {
  context: AudioContext | null = null;
  isMuted: boolean = false;

  init() {
    if (!this.context) {
      this.context = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (this.context.state === 'suspended') {
      this.context.resume();
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    return this.isMuted;
  }

  playThwip() {
    if (this.isMuted || typeof window === 'undefined') return;
    this.init();
    if (!this.context) return;

    // A "thwip" sound simulating thick paper turning
    const bufferSize = this.context.sampleRate * 0.15; // 0.15 seconds
    const buffer = this.context.createBuffer(1, bufferSize, this.context.sampleRate);
    const data = buffer.getChannelData(0);

    // Generate white noise
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.context.createBufferSource();
    noise.buffer = buffer;

    // Lowpass filter to muffle the noise into a "thump/thwip" paper sound
    const filter = this.context.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, this.context.currentTime);
    filter.frequency.exponentialRampToValueAtTime(100, this.context.currentTime + 0.1);

    // Rapid gain envelope
    const gain = this.context.createGain();
    gain.gain.setValueAtTime(0.8, this.context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.1);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.context.destination);

    noise.start();
  }

  playScratch() {
    if (this.isMuted || typeof window === 'undefined') return;
    this.init();
    if (!this.context) return;

    // A quick pen "scratch" sound
    const osc = this.context.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(200, this.context.currentTime);
    osc.frequency.linearRampToValueAtTime(400, this.context.currentTime + 0.05);

    const gain = this.context.createGain();
    gain.gain.setValueAtTime(0, this.context.currentTime);
    gain.gain.linearRampToValueAtTime(0.3, this.context.currentTime + 0.02);
    gain.gain.linearRampToValueAtTime(0, this.context.currentTime + 0.05);

    // Filter to make it sound scratchy, not robotic
    const filter = this.context.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 1500;

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.context.destination);

    osc.start();
    osc.stop(this.context.currentTime + 0.05);
  }
}

// Singleton export
export const audioEngine = new SoundEngine();
