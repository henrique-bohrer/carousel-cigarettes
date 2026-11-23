// Motor de efeitos sonoros procedural (Web Audio API) — 100% offline, sem latência e sem arquivos quebrados.

const SOUND_PREF_KEY = 'apex-tcg-sound-enabled-v1';

class SoundEngine {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.compressor = null;
    this.noiseBuffer = null;
    this.enabled = this._loadEnabled();
    this.lastTearTickTime = 0;
  }

  _loadEnabled() {
    try {
      const saved = localStorage.getItem(SOUND_PREF_KEY);
      return saved === null ? true : saved === 'true';
    } catch {
      return true;
    }
  }

  isEnabled() {
    return this.enabled;
  }

  setEnabled(value) {
    this.enabled = Boolean(value);
    try {
      localStorage.setItem(SOUND_PREF_KEY, String(this.enabled));
    } catch {
      // ignora erro de armazenamento
    }
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(this.enabled ? 0.85 : 0, this.ctx.currentTime, 0.02);
    }
    if (this.enabled) {
      this.playUiClick();
    }
    return this.enabled;
  }

  toggle() {
    return this.setEnabled(!this.enabled);
  }

  _ensureContext() {
    if (!this.enabled) return null;
    if (typeof window === 'undefined') return null;

    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return null;

    if (!this.ctx) {
      this.ctx = new AudioCtx();
      this.compressor = this.ctx.createDynamicsCompressor();
      this.compressor.threshold.value = -14;
      this.compressor.knee.value = 18;
      this.compressor.ratio.value = 6;
      this.compressor.attack.value = 0.003;
      this.compressor.release.value = 0.18;

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this.enabled ? 0.85 : 0;

      this.compressor.connect(this.masterGain);
      this.masterGain.connect(this.ctx.destination);
      this.noiseBuffer = this._createNoiseBuffer(2.0);
    }

    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }

    return this.ctx;
  }

  _createNoiseBuffer(durationSec) {
    const sampleRate = this.ctx.sampleRate;
    const length = Math.floor(sampleRate * durationSec);
    const buffer = this.ctx.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);
    let lastOut = 0;
    for (let i = 0; i < length; i++) {
      const white = Math.random() * 2 - 1;
      // Mistura de ruído branco com leve coloração para soar orgânico (papel / embalagem metálica)
      lastOut = (lastOut + 0.08 * white) / 1.08;
      data[i] = white * 0.65 + lastOut * 1.1;
    }
    return buffer;
  }

  _playTone({
    freq,
    endFreq = null,
    type = 'sine',
    startTime,
    duration,
    gain = 0.18,
    attack = 0.008,
    detune = 0,
  }) {
    const ctx = this.ctx;
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const env = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, startTime);
    if (endFreq !== null) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(20, endFreq), startTime + duration);
    }
    if (detune) {
      osc.detune.setValueAtTime(detune, startTime);
    }

    env.gain.setValueAtTime(0.0001, startTime);
    env.gain.linearRampToValueAtTime(gain, startTime + attack);
    env.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

    osc.connect(env);
    env.connect(this.compressor);

    osc.start(startTime);
    osc.stop(startTime + duration + 0.02);
  }

  _playNoiseBurst({
    startTime,
    duration,
    filterType = 'bandpass',
    freqStart = 1800,
    freqEnd = 3600,
    q = 1.5,
    gain = 0.2,
    attack = 0.006,
  }) {
    const ctx = this.ctx;
    if (!ctx || !this.noiseBuffer) return;

    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuffer;

    const filter = ctx.createBiquadFilter();
    filter.type = filterType;
    filter.Q.value = q;
    filter.frequency.setValueAtTime(freqStart, startTime);
    filter.frequency.exponentialRampToValueAtTime(Math.max(80, freqEnd), startTime + duration);

    const env = ctx.createGain();
    env.gain.setValueAtTime(0.0001, startTime);
    env.gain.linearRampToValueAtTime(gain, startTime + attack);
    env.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

    src.connect(filter);
    filter.connect(env);
    env.connect(this.compressor);

    const offset = Math.random() * 0.8;
    src.start(startTime, offset, duration + 0.02);
  }

  // ========================
  // SONS DE INTERFACE & TEMA AUTOMOBILÍSTICO (Ignição / troca de marcha / cartas)
  // ========================

  playUiClick() {
    const ctx = this._ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    this._playTone({ freq: 680, endFreq: 520, type: 'triangle', startTime: now, duration: 0.045, gain: 0.08, attack: 0.003 });
  }

  /** Som de ignição / troca rápida de marcha ao selecionar um pacote */
  playLighterClick() {
    const ctx = this._ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    // Pequeno "blip" de aceleração esportiva + clique mecânico da borboleta de marcha
    this._playTone({ freq: 180, endFreq: 420, type: 'sawtooth', startTime: now, duration: 0.14, gain: 0.08, attack: 0.01 });
    this._playTone({ freq: 420, endFreq: 260, type: 'triangle', startTime: now + 0.13, duration: 0.12, gain: 0.07, attack: 0.005 });
    this._playNoiseBurst({ startTime: now, duration: 0.04, filterType: 'bandpass', freqStart: 2400, freqEnd: 4600, q: 2, gain: 0.1 });
  }

  /** Deslizar / passar carta no carrossel ou catálogo */
  playCardSlide() {
    const ctx = this._ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    this._playNoiseBurst({
      startTime: now,
      duration: 0.09,
      filterType: 'bandpass',
      freqStart: 1200,
      freqEnd: 3400,
      q: 1.4,
      gain: 0.14,
      attack: 0.01,
    });
    this._playTone({ freq: 320, endFreq: 480, type: 'sine', startTime: now, duration: 0.06, gain: 0.05, attack: 0.005 });
  }

  /** Estalo tátil de carta TCG virando no ar */
  playCardFlip() {
    const ctx = this._ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    // Estalo seco do papel cartão (snap)
    this._playNoiseBurst({
      startTime: now,
      duration: 0.065,
      filterType: 'bandpass',
      freqStart: 2200,
      freqEnd: 4800,
      q: 1.6,
      gain: 0.22,
      attack: 0.004,
    });
    // Swoosh suave da rotação 3D
    this._playNoiseBurst({
      startTime: now + 0.03,
      duration: 0.16,
      filterType: 'bandpass',
      freqStart: 700,
      freqEnd: 2400,
      q: 0.9,
      gain: 0.12,
      attack: 0.02,
    });
    this._playTone({ freq: 190, endFreq: 110, type: 'sine', startTime: now, duration: 0.08, gain: 0.12, attack: 0.004 });
  }

  // ========================
  // SOM DO PACOTE SE ABRINDO (Rasgo metálico + brilho de abertura)
  // ========================

  /** Pequenos estalos metálicos enquanto o jogador arrasta o dedo/mouse na faixa de rasgo */
  playPackTearTick(progressPct = 50) {
    const ctx = this._ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    if (now - this.lastTearTickTime < 0.045) return;
    this.lastTearTickTime = now;

    const baseFreq = 1600 + progressPct * 26;
    this._playNoiseBurst({
      startTime: now,
      duration: 0.04,
      filterType: 'bandpass',
      freqStart: baseFreq,
      freqEnd: baseFreq * 1.4,
      q: 2.6,
      gain: 0.16,
      attack: 0.003,
    });
  }

  /** Som completo do pacote metálico rasgando e liberando luz (estilo Pokémon TCG Pocket) */
  playPackTear(isGodPack = false) {
    const ctx = this._ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    // 1. Sequência rápida de micro-rasgos do lacre aluminizado (0ms -> 340ms)
    const ripSteps = [0, 0.05, 0.11, 0.17, 0.24, 0.31];
    ripSteps.forEach((offset, idx) => {
      const f = 1400 + idx * 420;
      this._playNoiseBurst({
        startTime: now + offset,
        duration: 0.09,
        filterType: 'bandpass',
        freqStart: f,
        freqEnd: f * 1.55,
        q: 2.2,
        gain: 0.24 + idx * 0.02,
        attack: 0.004,
      });
    });

    // 2. Rasgo contínuo de embalagem foil por baixo
    this._playNoiseBurst({
      startTime: now,
      duration: 0.42,
      filterType: 'highpass',
      freqStart: 1100,
      freqEnd: 4600,
      q: 0.8,
      gain: 0.18,
      attack: 0.02,
    });

    // 3. Estalo de ar + Impacto luminoso ao concluir o rasgo (340ms)
    this._playTone({
      freq: 140,
      endFreq: 55,
      type: 'sine',
      startTime: now + 0.32,
      duration: 0.35,
      gain: 0.26,
      attack: 0.008,
    });

    // 4. Acorde cintilante de abertura do booster
    const chord = isGodPack
      ? [523.25, 659.25, 783.99, 987.77, 1174.66, 1567.98]
      : [440, 554.37, 659.25, 880];
    chord.forEach((freq, idx) => {
      this._playTone({
        freq,
        type: isGodPack ? 'triangle' : 'sine',
        startTime: now + 0.32 + idx * 0.045,
        duration: isGodPack ? 1.15 : 0.65,
        gain: isGodPack ? 0.14 : 0.1,
        attack: 0.015,
      });
    });
  }

  // ========================
  // SONS EXCLUSIVOS POR RARIDADE + CAMADAS FOIL E FULL ART
  // ========================

  /**
   * Toca uma assinatura sonora única para cada raridade (Comum, Raro, Épico, Lendário, Místico)
   * e adiciona camadas holográficas extras se a carta for Foil ou Full Art!
   */
  playRarityReveal(rarity = 'Comum', variant = 'normal') {
    const ctx = this._ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    switch (rarity) {
      case 'Comum': {
        // Som limpo e aconchegante: toque suave de madeira/marimba + nota clara
        this._playTone({ freq: 523.25, type: 'sine', startTime: now, duration: 0.18, gain: 0.16, attack: 0.005 });
        this._playTone({ freq: 659.25, type: 'triangle', startTime: now + 0.06, duration: 0.24, gain: 0.12, attack: 0.006 });
        break;
      }

      case 'Raro': {
        // Som cristalino azul-safira: arpejo brilhante ascendente (Ré maior)
        const notes = [587.33, 739.99, 880.0, 1174.66];
        notes.forEach((freq, i) => {
          this._playTone({
            freq,
            type: 'triangle',
            startTime: now + i * 0.055,
            duration: 0.38,
            gain: 0.14,
            attack: 0.006,
          });
          this._playTone({
            freq: freq * 2,
            type: 'sine',
            startTime: now + i * 0.055 + 0.01,
            duration: 0.24,
            gain: 0.05,
            attack: 0.008,
          });
        });
        break;
      }

      case 'Épico': {
        // Som ametista vibrante: sub-impacto suave + acorde sintético crescente (Mi maior 7)
        this._playTone({ freq: 164.81, endFreq: 82.41, type: 'sine', startTime: now, duration: 0.38, gain: 0.22, attack: 0.008 });
        const notes = [329.63, 415.3, 493.88, 659.25, 830.61, 987.77];
        notes.forEach((freq, i) => {
          this._playTone({
            freq,
            type: i < 2 ? 'sawtooth' : 'triangle',
            startTime: now + i * 0.05,
            duration: 0.62,
            gain: i < 2 ? 0.06 : 0.13,
            attack: 0.012,
            detune: i % 2 === 0 ? -4 : 4,
          });
        });
        break;
      }

      case 'Lendário': {
        // Fanfarra dourada triunfante: impacto grave + sinos dourados em Fá maior 9
        this._playTone({ freq: 130.81, endFreq: 65.41, type: 'sine', startTime: now, duration: 0.55, gain: 0.28, attack: 0.006 });
        this._playNoiseBurst({ startTime: now, duration: 0.28, filterType: 'bandpass', freqStart: 1200, freqEnd: 5200, q: 1.2, gain: 0.12 });

        const fanfare = [349.23, 440.0, 523.25, 659.25, 783.99, 1046.5, 1318.51];
        fanfare.forEach((freq, i) => {
          const t = now + i * 0.06;
          this._playTone({ freq, type: 'triangle', startTime: t, duration: 0.85, gain: 0.15, attack: 0.01 });
          this._playTone({ freq: freq * 1.5, type: 'sine', startTime: t + 0.015, duration: 0.65, gain: 0.055, attack: 0.012, detune: 5 });
        });
        break;
      }

      case 'Místico': {
        // Crescendo cósmico/prismático épico: trovão grave + cascata celestial de sinos harmônicos
        this._playTone({ freq: 110, endFreq: 48, type: 'sine', startTime: now, duration: 0.85, gain: 0.34, attack: 0.008 });
        this._playTone({ freq: 220, endFreq: 440, type: 'triangle', startTime: now, duration: 0.45, gain: 0.1, attack: 0.04 });
        this._playNoiseBurst({ startTime: now, duration: 0.45, filterType: 'bandpass', freqStart: 800, freqEnd: 6800, q: 1.0, gain: 0.16 });

        const mysticNotes = [261.63, 392.0, 493.88, 587.33, 659.25, 783.99, 987.77, 1174.66, 1318.51, 1567.98, 2093.0];
        mysticNotes.forEach((freq, i) => {
          const t = now + i * 0.052;
          this._playTone({ freq, type: 'triangle', startTime: t, duration: 1.2, gain: 0.13, attack: 0.012, detune: -6 });
          this._playTone({ freq, type: 'sine', startTime: t + 0.01, duration: 1.25, gain: 0.1, attack: 0.015, detune: 6 });
        });
        break;
      }

      case 'F1 Histórica': {
        // Categoria Suprema F1: passagem de motor V10 gritando (flyby Doppler) + fanfarra de pódio imperial!
        this._playTone({ freq: 290, endFreq: 980, type: 'sawtooth', startTime: now, duration: 0.36, gain: 0.1, attack: 0.03 });
        this._playTone({ freq: 980, endFreq: 520, type: 'sawtooth', startTime: now + 0.36, duration: 0.32, gain: 0.08, attack: 0.01 });
        this._playNoiseBurst({ startTime: now, duration: 0.55, filterType: 'bandpass', freqStart: 1200, freqEnd: 7400, q: 1.4, gain: 0.16 });
        // Sub-impacto de campeão
        this._playTone({ freq: 110, endFreq: 42, type: 'sine', startTime: now + 0.3, duration: 0.95, gain: 0.36, attack: 0.01 });
        // Fanfarra triunfante de Fórmula 1 em Sol maior majestoso
        const podiumNotes = [392.0, 493.88, 587.33, 783.99, 987.77, 1174.66, 1567.98, 1975.53];
        podiumNotes.forEach((freq, i) => {
          const t = now + 0.24 + i * 0.055;
          this._playTone({ freq, type: 'triangle', startTime: t, duration: 1.35, gain: 0.14, attack: 0.01, detune: -5 });
          this._playTone({ freq, type: 'sine', startTime: t + 0.012, duration: 1.35, gain: 0.11, attack: 0.012, detune: 5 });
        });
        break;
      }

      default:
        this._playTone({ freq: 523.25, type: 'sine', startTime: now, duration: 0.2, gain: 0.14 });
    }

    // Camada extra exclusiva para versão FOIL (brilho holográfico cristalino)
    if (variant === 'foil') {
      this._playFoilShimmer(now + 0.12);
    }

    // Camada extra exclusiva para versão FULL ART (cascata prismática grandiosa)
    if (variant === 'full-art') {
      this._playFullArtHalo(now + 0.1);
    }
  }

  _playFoilShimmer(startTime) {
    const sparkles = [1760, 2093, 2349.32, 2637.02, 3135.96];
    sparkles.forEach((freq, idx) => {
      this._playTone({
        freq,
        type: 'sine',
        startTime: startTime + idx * 0.042,
        duration: 0.42,
        gain: 0.065,
        attack: 0.006,
      });
    });
  }

  _playFullArtHalo(startTime) {
    // Halo prismático agudo + cintilação dupla
    const sparkles = [1567.98, 1975.53, 2349.32, 2637.02, 3135.96, 3520.0, 4186.01];
    sparkles.forEach((freq, idx) => {
      this._playTone({
        freq,
        type: 'sine',
        startTime: startTime + idx * 0.038,
        duration: 0.65,
        gain: 0.075,
        attack: 0.008,
        detune: idx % 2 === 0 ? 7 : -7,
      });
    });
    this._playNoiseBurst({
      startTime,
      duration: 0.45,
      filterType: 'highpass',
      freqStart: 4200,
      freqEnd: 8200,
      q: 1.4,
      gain: 0.08,
      attack: 0.05,
    });
  }

  /** Som ao alternar entre Normal / Foil / Full Art na Vitrine ou Inspetor */
  playSwitchEdition(variant = 'normal') {
    const ctx = this._ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    if (variant === 'full-art') {
      this._playFullArtHalo(now);
      this._playTone({ freq: 587.33, type: 'triangle', startTime: now, duration: 0.35, gain: 0.12 });
      this._playTone({ freq: 880, type: 'triangle', startTime: now + 0.05, duration: 0.4, gain: 0.12 });
    } else if (variant === 'foil') {
      this._playFoilShimmer(now);
      this._playTone({ freq: 523.25, type: 'sine', startTime: now, duration: 0.25, gain: 0.1 });
    } else {
      this.playCardFlip();
    }
  }

  /** Som de moedas ao vender cartas ou resgatar bônus */
  playCoinSound() {
    const ctx = this._ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    this._playTone({ freq: 1318.51, type: 'sine', startTime: now, duration: 0.16, gain: 0.15, attack: 0.003 });
    this._playTone({ freq: 1975.53, type: 'sine', startTime: now + 0.075, duration: 0.34, gain: 0.16, attack: 0.003 });
    this._playTone({ freq: 2637.02, type: 'triangle', startTime: now + 0.085, duration: 0.24, gain: 0.07, attack: 0.004 });
  }

  /** Som de encerramento / resumo do pacote */
  playSummaryChime(isProfit = true) {
    const ctx = this._ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const notes = isProfit ? [523.25, 659.25, 783.99, 1046.5] : [440, 523.25, 659.25];
    notes.forEach((freq, i) => {
      this._playTone({
        freq,
        type: 'triangle',
        startTime: now + i * 0.06,
        duration: 0.45,
        gain: 0.11,
        attack: 0.008,
      });
    });
  }

  /** Som de embaralhamento rápido das 5 cartas (Wonder Pick) */
  playShuffleSound() {
    const ctx = this._ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    for (let i = 0; i < 6; i++) {
      this._playNoiseBurst({
        startTime: now + i * 0.075,
        duration: 0.055,
        filterType: 'bandpass',
        freqStart: 1600 + i * 180,
        freqEnd: 3600 + i * 150,
        q: 1.5,
        gain: 0.16,
        attack: 0.004,
      });
    }
  }

  /** Som de selagem acrílica e revelação da nota PSA (8, 9 ou 10 Gem Mint) */
  playGradeReveal(grade = 8) {
    const ctx = this._ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    // Estalo de cápsula acrílica fechando
    this._playTone({ freq: 920, endFreq: 420, type: 'triangle', startTime: now, duration: 0.07, gain: 0.14, attack: 0.003 });
    this._playNoiseBurst({ startTime: now, duration: 0.04, filterType: 'highpass', freqStart: 3000, freqEnd: 6000, q: 2, gain: 0.12 });

    if (grade === 10) {
      // PSA 10 GEM MINT — fanfarra prismática brilhante!
      const notes = [523.25, 659.25, 783.99, 1046.5, 1318.51, 1567.98, 2093.0];
      notes.forEach((freq, i) => {
        this._playTone({ freq, type: 'triangle', startTime: now + 0.08 + i * 0.05, duration: 0.9, gain: 0.13, attack: 0.008 });
      });
      this._playFullArtHalo(now + 0.18);
    } else if (grade === 9) {
      const notes = [440, 554.37, 659.25, 880];
      notes.forEach((freq, i) => {
        this._playTone({ freq, type: 'triangle', startTime: now + 0.08 + i * 0.06, duration: 0.5, gain: 0.12, attack: 0.008 });
      });
    } else {
      this._playTone({ freq: 392, type: 'sine', startTime: now + 0.08, duration: 0.25, gain: 0.12 });
      this._playTone({ freq: 493.88, type: 'sine', startTime: now + 0.16, duration: 0.3, gain: 0.12 });
    }
  }

  /** Som de fusão energética Trade-Up */
  playTradeUpFanfare() {
    const ctx = this._ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    // Riser de energia subindo
    this._playTone({ freq: 180, endFreq: 720, type: 'sawtooth', startTime: now, duration: 0.42, gain: 0.08, attack: 0.04 });
    this._playNoiseBurst({ startTime: now, duration: 0.4, filterType: 'bandpass', freqStart: 600, freqEnd: 4400, q: 1.8, gain: 0.14 });
    // Explosão harmônica
    this._playTone({ freq: 140, endFreq: 55, type: 'sine', startTime: now + 0.42, duration: 0.4, gain: 0.28, attack: 0.005 });
    [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
      this._playTone({ freq, type: 'triangle', startTime: now + 0.42 + i * 0.045, duration: 0.65, gain: 0.13, attack: 0.01 });
    });
  }

  /** Som de rodada do Duelo (vitória, empate ou derrota na rodada) */
  playDuelRound(outcome = 'win') {
    const ctx = this._ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    if (outcome === 'win') {
      this._playTone({ freq: 523.25, type: 'triangle', startTime: now, duration: 0.14, gain: 0.14 });
      this._playTone({ freq: 783.99, type: 'triangle', startTime: now + 0.08, duration: 0.28, gain: 0.16 });
    } else if (outcome === 'draw') {
      this._playTone({ freq: 440, type: 'sine', startTime: now, duration: 0.2, gain: 0.12 });
    } else {
      this._playTone({ freq: 311.13, endFreq: 220, type: 'sawtooth', startTime: now, duration: 0.25, gain: 0.09 });
    }
  }

  /** Fanfarra de vitória de Duelo ou resgate de Missão */
  playVictoryFanfare() {
    const ctx = this._ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5, 1318.51];
    notes.forEach((freq, i) => {
      this._playTone({ freq, type: 'triangle', startTime: now + i * 0.07, duration: 0.55, gain: 0.14, attack: 0.008 });
    });
  }

  /**
   * Som de tensão pré-revelação (estilo Clash Royale!) antes de a carta explodir na tela:
   * - Épico: descarga elétrica roxa subindo
   * - Lendário: riser arco-íris brilhante
   * - Místico: vórtice grave + tensão cósmica
   * - F1 Histórica: os 5 icônicos bips das luzes vermelhas de largada da Fórmula 1!
   */
  playRevealBuildup(rarity = 'Épico') {
    const ctx = this._ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    if (rarity === 'Épico') {
      this._playTone({ freq: 240, endFreq: 780, type: 'sawtooth', startTime: now, duration: 0.28, gain: 0.08, attack: 0.02 });
      this._playNoiseBurst({ startTime: now, duration: 0.25, filterType: 'bandpass', freqStart: 1800, freqEnd: 5200, q: 3.0, gain: 0.12 });
      return;
    }

    if (rarity === 'Lendário') {
      this._playTone({ freq: 261.63, endFreq: 1046.5, type: 'triangle', startTime: now, duration: 0.44, gain: 0.12, attack: 0.03 });
      [523.25, 659.25, 783.99, 987.77].forEach((f, idx) => {
        this._playTone({ freq: f, type: 'sine', startTime: now + idx * 0.09, duration: 0.18, gain: 0.09, attack: 0.01 });
      });
      return;
    }

    if (rarity === 'Místico') {
      this._playTone({ freq: 85, endFreq: 210, type: 'sawtooth', startTime: now, duration: 0.58, gain: 0.11, attack: 0.04 });
      this._playTone({ freq: 330, endFreq: 1320, type: 'triangle', startTime: now, duration: 0.58, gain: 0.1, attack: 0.05 });
      this._playNoiseBurst({ startTime: now, duration: 0.55, filterType: 'bandpass', freqStart: 400, freqEnd: 4600, q: 2.2, gain: 0.15 });
      return;
    }

    if (rarity === 'F1 Histórica') {
      // 5 bips icônicos das luzes vermelhas de largada da F1 (● ● ● ● ●) antes do "Lights Out!"
      for (let i = 0; i < 5; i++) {
        this._playTone({
          freq: 880,
          type: 'square',
          startTime: now + i * 0.15,
          duration: 0.085,
          gain: 0.075,
          attack: 0.004,
        });
      }
      // Motor V10 roncando no grid esperando as luzes apagarem
      this._playTone({ freq: 210, endFreq: 420, type: 'sawtooth', startTime: now, duration: 0.78, gain: 0.06, attack: 0.05 });
    }
  }
}

export const soundEngine = new SoundEngine();
export default soundEngine;
