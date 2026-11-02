// Pure Web Audio API Synthesizer Engine for 1960s Cybernetic Laboratory

class CyberneticAudioSynthesizer {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private humGain: GainNode | null = null;
  private humOsc1: OscillatorNode | null = null;
  private humOsc2: OscillatorNode | null = null;
  private humWhistle: OscillatorNode | null = null;
  private alarmInterval: number | null = null;

  private initContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtxClass) {
        this.ctx = new AudioCtxClass();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public setMuted(muted: boolean): void {
    this.isMuted = muted;
    if (muted) {
      this.stopAlarm();
      this.stopCrtHum();
    }
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  /**
   * 15ms metallic relay click synthesized with white noise burst and resonant filter
   */
  public playClick(): void {
    if (this.isMuted) return;
    const ctx = this.initContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const bufferSize = Math.floor(ctx.sampleRate * 0.015);
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        // High frequency mechanical click with quick decay
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.2));
      }

      const noiseSource = ctx.createBufferSource();
      noiseSource.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(2400, now);
      filter.Q.setValueAtTime(4.0, now);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.015);

      noiseSource.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      noiseSource.start(now);
      noiseSource.stop(now + 0.015);
    } catch {
      // Audio playback failed or blocked by browser policy
    }
  }

  /**
   * 5ms high-frequency tick for analog potentiometer dials
   */
  public playDial(): void {
    if (this.isMuted) return;
    const ctx = this.initContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(1200 + Math.random() * 400, now);
      osc.frequency.exponentialRampToValueAtTime(400, now + 0.006);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.006);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.006);
    } catch {
      // Audio failure ignored
    }
  }

  /**
   * Harmonious dual-frequency chime when all 4 truth table states pass
   */
  public playSuccess(): void {
    if (this.isMuted) return;
    const ctx = this.initContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      // C5 (523.25 Hz) and G5 (783.99 Hz) with a hint of E6 (1318.5 Hz)
      const freqs = [523.25, 659.25, 783.99];

      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.06);

        gain.gain.setValueAtTime(0.001, now + idx * 0.06);
        gain.gain.linearRampToValueAtTime(0.18, now + idx * 0.06 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.06 + 0.45);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + idx * 0.06);
        osc.stop(now + idx * 0.06 + 0.5);
      });
    } catch {
      // Audio failure ignored
    }
  }

  /**
   * Oscillating 2-tone vintage retro klaxon siren when XOR linear crisis triggers
   */
  public playAlarm(): void {
    if (this.isMuted) return;
    this.stopAlarm(); // stop any prior alarm
    const ctx = this.initContext();
    if (!ctx) return;

    try {
      let isHigh = false;
      let count = 0;

      const triggerTone = () => {
        if (this.isMuted || count > 6) {
          this.stopAlarm();
          return;
        }

        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sawtooth';
        // Alternates between 880 Hz and 587 Hz (vintage industrial warning)
        osc.frequency.setValueAtTime(isHigh ? 880 : 587, now);
        isHigh = !isHigh;
        count++;

        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.18);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.2);
      };

      triggerTone();
      this.alarmInterval = window.setInterval(triggerTone, 220);
    } catch {
      // Audio failure ignored
    }
  }

  /**
   * Rising 4-note teletype fanfare for a completed laboratory experiment
   */
  public playMission(): void {
    if (this.isMuted) return;
    const ctx = this.initContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      [392.0, 523.25, 659.25, 1046.5].forEach((freq, idx) => {
        const t = now + 0.15 + idx * 0.09;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(freq, t);
        gain.gain.setValueAtTime(0.0001, t);
        gain.gain.linearRampToValueAtTime(0.07, t + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + (idx === 3 ? 0.5 : 0.12));
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t);
        osc.stop(t + 0.55);
      });
    } catch {
      // Audio failure ignored
    }
  }

  /**
   * Low "thunk" of a banana plug being pushed into a patch-bay socket
   */
  public playPatch(): void {
    if (this.isMuted) return;
    const ctx = this.initContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.exponentialRampToValueAtTime(70, now + 0.08);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.12);
    } catch {
      // Audio failure ignored
    }
    this.playClick();
  }

  public stopAlarm(): void {
    if (this.alarmInterval !== null) {
      clearInterval(this.alarmInterval);
      this.alarmInterval = null;
    }
  }

  /**
   * 60Hz transformer mains hum + subtle CRT flyback transformer whistle
   */
  public startCrtHum(): void {
    if (this.isMuted || this.humGain) return;
    const ctx = this.initContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      this.humGain = ctx.createGain();
      this.humGain.gain.setValueAtTime(0.001, now);
      this.humGain.gain.linearRampToValueAtTime(0.045, now + 0.8);

      // 60 Hz fundamental mains hum
      this.humOsc1 = ctx.createOscillator();
      this.humOsc1.type = 'sawtooth';
      this.humOsc1.frequency.setValueAtTime(60, now);

      // 120 Hz second harmonic
      this.humOsc2 = ctx.createOscillator();
      this.humOsc2.type = 'sine';
      this.humOsc2.frequency.setValueAtTime(120, now);

      // Very soft CRT high-pitched trace whistle (7.8 kHz)
      this.humWhistle = ctx.createOscillator();
      this.humWhistle.type = 'sine';
      this.humWhistle.frequency.setValueAtTime(7800, now);

      const whistleGain = ctx.createGain();
      whistleGain.gain.setValueAtTime(0.005, now);

      const lowpass = ctx.createBiquadFilter();
      lowpass.type = 'lowpass';
      lowpass.frequency.setValueAtTime(250, now);

      this.humOsc1.connect(lowpass);
      this.humOsc2.connect(lowpass);
      lowpass.connect(this.humGain);

      this.humWhistle.connect(whistleGain);
      whistleGain.connect(this.humGain);

      this.humGain.connect(ctx.destination);

      this.humOsc1.start();
      this.humOsc2.start();
      this.humWhistle.start();
    } catch {
      // Audio failure ignored
    }
  }

  public stopCrtHum(): void {
    if (!this.humGain || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      this.humGain.gain.linearRampToValueAtTime(0.0001, now + 0.2);
      setTimeout(() => {
        try {
          this.humOsc1?.stop();
          this.humOsc2?.stop();
          this.humWhistle?.stop();
          this.humOsc1?.disconnect();
          this.humOsc2?.disconnect();
          this.humWhistle?.disconnect();
          this.humGain?.disconnect();
        } catch {}
        this.humOsc1 = null;
        this.humOsc2 = null;
        this.humWhistle = null;
        this.humGain = null;
      }, 250);
    } catch {
      this.humGain = null;
    }
  }
}

export const audioSynth = new CyberneticAudioSynthesizer();

