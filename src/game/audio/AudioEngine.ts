// 100% Procedural Web Audio API sound engine (zero external audio file dependencies)
export class AudioEngine {
  private ctx: AudioContext | null = null;
  private enabled = true;
  private engineOsc: OscillatorNode | null = null;
  private engineGain: GainNode | null = null;
  private rainNoiseNode: AudioBufferSourceNode | null = null;
  private rainGain: GainNode | null = null;
  private initialized = false;

  public init(): void {
    if (this.initialized || typeof window === 'undefined') return;
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;

    this.ctx = new AudioCtx();

    // Engine oscillator
    this.engineOsc = this.ctx.createOscillator();
    this.engineOsc.type = 'sawtooth';
    this.engineOsc.frequency.value = 52;

    const engineFilter = this.ctx.createBiquadFilter();
    engineFilter.type = 'lowpass';
    engineFilter.frequency.value = 240;

    this.engineGain = this.ctx.createGain();
    this.engineGain.gain.value = 0;

    this.engineOsc.connect(engineFilter);
    engineFilter.connect(this.engineGain);
    this.engineGain.connect(this.ctx.destination);
    this.engineOsc.start();

    // Procedural rain white-noise loop
    const bufferSize = this.ctx.sampleRate * 2;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    this.rainNoiseNode = this.ctx.createBufferSource();
    this.rainNoiseNode.buffer = noiseBuffer;
    this.rainNoiseNode.loop = true;

    const rainFilter = this.ctx.createBiquadFilter();
    rainFilter.type = 'bandpass';
    rainFilter.frequency.value = 1100;

    this.rainGain = this.ctx.createGain();
    this.rainGain.gain.value = 0;

    this.rainNoiseNode.connect(rainFilter);
    rainFilter.connect(this.rainGain);
    this.rainGain.connect(this.ctx.destination);
    this.rainNoiseNode.start();

    this.initialized = true;
  }

  public resume(): void {
    if (!this.initialized) this.init();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (!enabled && this.engineGain && this.rainGain && this.ctx) {
      this.engineGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.05);
      this.rainGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.05);
    }
  }

  public updateEngine(active: boolean, speedKmh: number, category: string): void {
    if (!this.ctx || !this.engineOsc || !this.engineGain) return;
    if (!this.enabled || !active) {
      this.engineGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.08);
      return;
    }
    const baseFreq =
      category === 'airplane'
        ? 68
        : category === 'bus' || category === 'truck'
        ? 38
        : category === 'auto'
        ? 64
        : category === 'motorcycle'
        ? 72
        : 48;
    const freq = baseFreq + Math.abs(speedKmh) * (category === 'airplane' ? 0.55 : 0.85);
    this.engineOsc.frequency.setTargetAtTime(freq, this.ctx.currentTime, 0.06);
    const vol = Math.min(0.055, 0.018 + Math.abs(speedKmh) * 0.0003);
    this.engineGain.gain.setTargetAtTime(vol, this.ctx.currentTime, 0.08);
  }

  public updateRain(intensity: number): void {
    if (!this.ctx || !this.rainGain) return;
    const target = this.enabled ? intensity * 0.035 : 0;
    this.rainGain.gain.setTargetAtTime(target, this.ctx.currentTime, 0.2);
  }

  public playHorn(category = 'hatchback'): void {
    if (!this.enabled) return;
    this.resume();
    if (!this.ctx) return;

    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    if (category === 'airplane') {
      osc1.type = 'sine';
      osc2.type = 'triangle';
      osc1.frequency.value = 520;
      osc2.frequency.value = 659;
    } else if (category === 'bus' || category === 'truck') {
      osc1.type = 'sawtooth';
      osc2.type = 'sawtooth';
      osc1.frequency.value = 185;
      osc2.frequency.value = 233;
    } else if (category === 'auto') {
      osc1.type = 'square';
      osc2.type = 'triangle';
      osc1.frequency.value = 460;
      osc2.frequency.value = 510;
    } else {
      osc1.type = 'sawtooth';
      osc2.type = 'sawtooth';
      osc1.frequency.value = 390;
      osc2.frequency.value = 490;
    }

    gain.gain.setValueAtTime(0.06, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.35);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.ctx.destination);

    osc1.start();
    osc2.start();
    osc1.stop(this.ctx.currentTime + 0.36);
    osc2.stop(this.ctx.currentTime + 0.36);
  }

  public playChime(type: 'success' | 'alert' | 'click' = 'click'): void {
    if (!this.enabled) return;
    this.resume();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type === 'alert' ? 'square' : 'sine';

    const now = this.ctx.currentTime;
    if (type === 'success') {
      osc.frequency.setValueAtTime(523.25, now);
      osc.frequency.setValueAtTime(659.25, now + 0.08);
      osc.frequency.setValueAtTime(783.99, now + 0.16);
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.36);
    } else if (type === 'alert') {
      osc.frequency.setValueAtTime(680, now);
      osc.frequency.setValueAtTime(520, now + 0.12);
      gain.gain.setValueAtTime(0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.26);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.27);
    } else {
      osc.frequency.setValueAtTime(440, now);
      gain.gain.setValueAtTime(0.025, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.08);
    }
  }

  public playImpact(strength = 1.0): void {
    if (!this.enabled) return;
    this.resume();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(140 * Math.min(1.5, Math.max(0.7, strength)), now);
    osc.frequency.exponentialRampToValueAtTime(36, now + 0.16);

    gain.gain.setValueAtTime(Math.min(0.14, 0.08 * strength), now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.19);
  }

  public playTrainHorn(): void {
    if (!this.enabled) return;
    this.resume();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    for (const freq of [220, 277.18]) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now);
      gain.gain.setValueAtTime(0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.9);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.92);
    }
  }

  public dispose(): void {
    try {
      this.engineOsc?.stop();
      this.rainNoiseNode?.stop();
      this.ctx?.close();
    } catch {
      // ignore
    }
  }
}
