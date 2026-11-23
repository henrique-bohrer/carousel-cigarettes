import soundEngine from './soundEngine.js';
import {
  loadCustomCarAudio,
  removeCustomCarAudio,
  saveCustomCarAudio,
} from './customAudioStore.js';

// Motor Híbrido estilo Gran Turismo / Need For Speed (Web Audio API):
// 1) Se houver um áudio real (.mp3/.wav/.ogg) enviado pelo usuário ou salvo em public/audio/cars/<id>.mp3
//    ou public/audio/engines/<tipo>.mp3, aplica loop com crossfade sem estalo e varia o playbackRate em 60fps
//    conforme RPM, acelerador e trocas de marcha!
// 2) Se ainda não houver gravação real para aquele carro, usa automaticamente o sintetizador físico calibrado.

const DEFAULT_ENGINE = {
  type: 'i4',
  label: '2.0L Turbo',
  idleRpm: 950,
  redlineRpm: 7500,
  gears: 6,
  cylinders: 4,
  turbo: false,
  supercharger: false,
  straightCut: false,
  vtecRpm: null,
  shiftMs: 140,
  exhaustPop: 0.4,
};

function makeDistortionCurve(amount = 35) {
  const samples = 1024;
  const curve = new Float32Array(samples);
  for (let i = 0; i < samples; i++) {
    const x = (i * 2) / samples - 1;
    curve[i] = ((3 + amount) * x * 20 * (Math.PI / 180)) / (Math.PI + amount * Math.abs(x));
  }
  return curve;
}

/**
 * Converte qualquer gravação real (.mp3/.wav/.ogg) em um loop contínuo suave sem clique na emenda:
 * - Remove silêncio inicial/final automaticamente
 * - Recorta o trecho ativo central (até 3.2s)
 * - Aplica crossfade de potência igual (equal-power) nas pontas para girar em loop infinito sem estalos!
 */
function createSeamlessLoopBuffer(ctx, rawBuffer) {
  const sampleRate = rawBuffer.sampleRate;
  const channels = rawBuffer.numberOfChannels;
  const rawLength = rawBuffer.length;

  // Detecta início e fim do áudio ativo (ignora silêncio nas bordas)
  const ch0 = rawBuffer.getChannelData(0);
  const threshold = 0.015;
  let startSample = 0;
  let endSample = rawLength - 1;

  while (startSample < rawLength - 1 && Math.abs(ch0[startSample]) < threshold) {
    startSample += 1;
  }
  while (endSample > startSample && Math.abs(ch0[endSample]) < threshold) {
    endSample -= 1;
  }

  let activeLength = endSample - startSample;
  if (activeLength < Math.floor(sampleRate * 0.25)) {
    startSample = 0;
    activeLength = rawLength;
  }

  // Limita o loop a no máximo 3.2 segundos (pega o núcleo mais rico da gravação)
  const maxSamples = Math.floor(sampleRate * 3.2);
  if (activeLength > maxSamples) {
    const offset = Math.floor((activeLength - maxSamples) * 0.25);
    startSample += offset;
    activeLength = maxSamples;
  }

  // Crossfade de 18% entre final e início para emenda invisível
  const fadeSamples = Math.min(
    Math.floor(activeLength * 0.18),
    Math.floor(sampleRate * 0.35)
  );
  const loopLength = Math.max(Math.floor(sampleRate * 0.15), activeLength - fadeSamples);

  const outBuffer = ctx.createBuffer(channels, loopLength, sampleRate);

  for (let c = 0; c < channels; c++) {
    const src = rawBuffer.getChannelData(c);
    const dst = outBuffer.getChannelData(c);

    for (let i = 0; i < loopLength; i++) {
      dst[i] = src[startSample + i];
    }

    // Mistura suave da cauda sobre o início (equal-power cos/sin fade)
    for (let i = 0; i < fadeSamples && i < loopLength; i++) {
      const t = i / fadeSamples;
      const fadeIn = Math.sin(t * Math.PI * 0.5);
      const fadeOut = Math.cos(t * Math.PI * 0.5);
      const headVal = src[startSample + i];
      const tailVal = src[startSample + loopLength + i] || 0;
      dst[i] = headVal * fadeIn + tailVal * fadeOut;
    }
  }

  return outBuffer;
}

class EngineAudioController {
  constructor() {
    this.activeSession = null;
    this.distortionCache = new Map();
    this.sampleBufferCache = new Map(); // cacheKey -> { buffer, sourceType, label }
    this.missingUrls = new Set();
    this.pendingLoads = new Map();
  }

  _getDistortionCurve(amount) {
    if (!this.distortionCache.has(amount)) {
      this.distortionCache.set(amount, makeDistortionCurve(amount));
    }
    return this.distortionCache.get(amount);
  }

  _getAudioContext() {
    if (!soundEngine.isEnabled()) return null;
    return soundEngine._ensureContext();
  }

  /**
   * Tenta carregar e decodificar um arquivo de áudio estático em /audio/...
   * Protege contra o fallback SPA do Vite (que devolve text/html 200 quando o arquivo não existe).
   */
  async _tryFetchStaticAudio(ctx, url) {
    if (!url || this.missingUrls.has(url)) return null;
    try {
      const res = await fetch(url);
      const contentType = (res.headers.get('content-type') || '').toLowerCase();
      if (!res.ok || contentType.includes('text/html')) {
        this.missingUrls.add(url);
        return null;
      }
      const arr = await res.arrayBuffer();
      if (!arr || arr.byteLength < 1024) {
        this.missingUrls.add(url);
        return null;
      }
      const decoded = await ctx.decodeAudioData(arr.slice(0));
      return createSeamlessLoopBuffer(ctx, decoded);
    } catch {
      this.missingUrls.add(url);
      return null;
    }
  }

  /**
   * Resolve o melhor sample real disponível para um carro (em ordem de prioridade):
   * 1) Áudio enviado pelo usuário (IndexedDB)
   * 2) Arquivo específico do carro: /audio/cars/<card.id>.mp3 (ou card.audioUrl)
   * 3) Arquivo da família do motor: /audio/engines/<engine.type>.mp3
   */
  async _resolveRealSample(ctx, card) {
    if (!ctx || !card) return null;

    if (this.sampleBufferCache.has(card.id)) {
      return this.sampleBufferCache.get(card.id);
    }

    if (this.pendingLoads.has(card.id)) {
      return this.pendingLoads.get(card.id);
    }

    const promise = (async () => {
      // 1. Áudio personalizado salvo no navegador (IndexedDB)
      const custom = await loadCustomCarAudio(card.id);
      if (custom?.buffer) {
        try {
          const decoded = await ctx.decodeAudioData(custom.buffer.slice(0));
          const loopBuffer = createSeamlessLoopBuffer(ctx, decoded);
          const entry = { buffer: loopBuffer, sourceType: 'custom', label: custom.fileName || 'Áudio Real' };
          this.sampleBufferCache.set(card.id, entry);
          return entry;
        } catch {
          // arquivo corrompido -> segue para próximos fallbacks
        }
      }

      // 2. Arquivo local específico do carro em public/audio/cars/
      const carUrls = [
        card.audioUrl,
        `/audio/cars/${card.id}.mp3`,
        `/audio/cars/${card.id}.wav`,
        `/audio/cars/${card.id}.ogg`,
      ].filter(Boolean);

      for (const url of carUrls) {
        const loopBuffer = await this._tryFetchStaticAudio(ctx, url);
        if (loopBuffer) {
          const entry = { buffer: loopBuffer, sourceType: 'car-file', label: url.split('/').pop() };
          this.sampleBufferCache.set(card.id, entry);
          return entry;
        }
      }

      // 3. Arquivo local da família do motor em public/audio/engines/
      const engineType = card.engine?.type;
      if (engineType) {
        const famKey = `family::${engineType}`;
        if (this.sampleBufferCache.has(famKey)) {
          const famEntry = this.sampleBufferCache.get(famKey);
          this.sampleBufferCache.set(card.id, famEntry);
          return famEntry;
        }

        const famUrls = [
          `/audio/engines/${engineType}.mp3`,
          `/audio/engines/${engineType}.wav`,
          `/audio/engines/${engineType}.ogg`,
        ];

        for (const url of famUrls) {
          const loopBuffer = await this._tryFetchStaticAudio(ctx, url);
          if (loopBuffer) {
            const entry = { buffer: loopBuffer, sourceType: 'engine-file', label: url.split('/').pop() };
            this.sampleBufferCache.set(famKey, entry);
            this.sampleBufferCache.set(card.id, entry);
            return entry;
          }
        }
      }

      // Nenhum áudio real encontrado — marca null para usar síntese sem latência nas próximas vezes
      this.sampleBufferCache.set(card.id, null);
      return null;
    })();

    this.pendingLoads.set(card.id, promise);
    try {
      return await promise;
    } finally {
      this.pendingLoads.delete(card.id);
    }
  }

  /**
   * Pré-carrega o áudio real de um carro (ex.: ao abrir o Inspetor 3D) e informa se há sample real ativo.
   */
  async inspectCardAudioStatus(card) {
    if (!card) return { hasRealAudio: false, sourceType: 'synth', label: null };
    const cached = this.sampleBufferCache.get(card.id);
    if (cached) {
      return { hasRealAudio: true, sourceType: cached.sourceType, label: cached.label };
    }
    const custom = await loadCustomCarAudio(card.id);
    if (custom?.buffer) {
      return { hasRealAudio: true, sourceType: 'custom', label: custom.fileName || 'Áudio Real' };
    }
    // Verifica sem exigir AudioContext ativo caso ainda não tenha som ligado
    const ctx = this._getAudioContext();
    if (ctx) {
      const resolved = await this._resolveRealSample(ctx, card);
      if (resolved) {
        return { hasRealAudio: true, sourceType: resolved.sourceType, label: resolved.label };
      }
    }
    return { hasRealAudio: false, sourceType: 'synth', label: null };
  }

  /**
   * Registra um arquivo de áudio real enviado pelo usuário (.mp3, .wav, .ogg) para um carro específico!
   */
  async registerCustomAudioFile(card, file) {
    const ctx = this._getAudioContext() || soundEngine._ensureContext();
    if (!ctx) throw new Error('Ative o som no topo para testar o áudio real.');

    const rawBytes = await file.arrayBuffer();
    const decoded = await ctx.decodeAudioData(rawBytes.slice(0));
    const loopBuffer = createSeamlessLoopBuffer(ctx, decoded);

    await saveCustomCarAudio(card.id, rawBytes, file.name);
    const entry = { buffer: loopBuffer, sourceType: 'custom', label: file.name };
    this.sampleBufferCache.set(card.id, entry);
    return entry;
  }

  /**
   * Remove o áudio personalizado salvo no navegador para um carro, voltando ao arquivo da pasta ou síntese.
   */
  async clearCustomAudio(cardId) {
    await removeCustomCarAudio(cardId);
    this.sampleBufferCache.delete(cardId);
  }

  /**
   * Cria um Rig responsivo de SAMPLE REAL com playbackRate + filtro dinâmico de carga do motor!
   */
  _createRealSampleRig(ctx, buffer, engine) {
    const now = ctx.currentTime;

    const rigGain = ctx.createGain();
    rigGain.gain.setValueAtTime(0.0001, now);
    rigGain.connect(soundEngine.compressor);

    // Filtro dinâmico que abre o brilho do escapamento quando você pisa fundo
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.Q.value = 1.2;
    filter.frequency.setValueAtTime(1400, now);
    filter.connect(rigGain);

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    source.playbackRate.setValueAtTime(0.75, now);
    source.connect(filter);
    source.start(now);

    const minRate = engine.type.startsWith('f1') ? 0.62 : 0.6;
    const maxRate = engine.type.startsWith('f1') ? 2.0 : 1.75;

    const updateRpm = (rpm, throttle = 1) => {
      const t = ctx.currentTime;
      const normRpm = Math.max(
        0,
        Math.min(1, (rpm - engine.idleRpm) / Math.max(1000, engine.redlineRpm - engine.idleRpm))
      );

      // Mapeia RPM em tempo real para velocidade/pitch real do motor gravado!
      const targetRate = minRate + (maxRate - minRate) * Math.pow(normRpm, 0.92);
      source.playbackRate.setTargetAtTime(targetRate, t, 0.025);

      // Abertura de filtro conforme carga do acelerador
      const cutoff = 900 + 7500 * (0.3 + 0.7 * normRpm) * (0.55 + 0.45 * throttle);
      filter.frequency.setTargetAtTime(cutoff, t, 0.03);

      const volume = (0.34 + 0.24 * normRpm) * (0.55 + 0.45 * throttle);
      rigGain.gain.setTargetAtTime(volume, t, 0.025);
    };

    const destroy = (fadeSec = 0.09) => {
      const t = ctx.currentTime;
      rigGain.gain.cancelScheduledValues(t);
      rigGain.gain.setTargetAtTime(0.0001, t, Math.max(0.015, fadeSec / 3));
      try {
        source.stop(t + fadeSec + 0.06);
      } catch {
        // já parado
      }
    };

    return { updateRpm, destroy, rigGain, isRealSample: true };
  }

  _rpmToBaseHz(rpm, engine) {
    const firingOrder =
      engine.type === 'rotary'
        ? 3.0
        : engine.type === 'f1-v10'
          ? 5.0
          : engine.type === 'f1-v6-turbo' || engine.type === 'f1-v6-hybrid'
            ? 3.4
            : engine.type === 'boxer'
              ? 1.75
              : (engine.cylinders || 6) / 2;

    return Math.max(28, (rpm / 60) * firingOrder * 0.62);
  }

  /**
   * Rig de síntese física (fallback automático quando não há arquivo real).
   */
  _createSynthRig(ctx, engine) {
    const now = ctx.currentTime;

    const rigGain = ctx.createGain();
    rigGain.gain.setValueAtTime(0.0001, now);
    rigGain.connect(soundEngine.compressor);

    const shaper = ctx.createWaveShaper();
    const driveAmount =
      engine.type === 'f1-v10' || engine.type === 'rotary'
        ? 55
        : engine.type === 'muscle-v8' || engine.type === 'boxer'
          ? 65
          : 42;
    shaper.curve = this._getDistortionCurve(driveAmount);
    shaper.oversample = '2x';

    const exhaustFilter = ctx.createBiquadFilter();
    exhaustFilter.type = 'lowpass';
    exhaustFilter.Q.value =
      engine.type === 'f1-v10' || engine.type === 'v12'
        ? 4.2
        : engine.type === 'rotary'
          ? 5.0
          : 2.6;
    exhaustFilter.frequency.setValueAtTime(320, now);

    shaper.connect(exhaustFilter);
    exhaustFilter.connect(rigGain);

    const oscMain = ctx.createOscillator();
    oscMain.type = engine.type === 'rotary' ? 'square' : 'sawtooth';
    const mainGain = ctx.createGain();
    mainGain.gain.value = 0.28;
    oscMain.connect(mainGain);
    mainGain.connect(shaper);

    const oscHarm = ctx.createOscillator();
    oscHarm.type = engine.type === 'muscle-v8' || engine.type === 'boxer' ? 'sawtooth' : 'triangle';
    const harmGain = ctx.createGain();
    harmGain.gain.value = engine.type === 'f1-v10' || engine.type === 'v12' ? 0.24 : 0.16;
    oscHarm.connect(harmGain);
    harmGain.connect(shaper);

    const oscSub = ctx.createOscillator();
    oscSub.type = 'sine';
    const subGain = ctx.createGain();
    subGain.gain.value =
      engine.type === 'muscle-v8' || engine.type === 'w16' || engine.type === 'boxer'
        ? 0.36
        : 0.22;
    oscSub.connect(subGain);
    subGain.connect(exhaustFilter);

    let rumbleOsc = null;
    if (engine.type === 'muscle-v8' || engine.type === 'boxer') {
      rumbleOsc = ctx.createOscillator();
      const rumbleGain = ctx.createGain();
      rumbleOsc.type = 'sine';
      rumbleOsc.frequency.setValueAtTime(engine.type === 'boxer' ? 18 : 13, now);
      rumbleGain.gain.value = engine.type === 'boxer' ? 14 : 10;
      rumbleOsc.connect(rumbleGain);
      rumbleGain.connect(oscMain.frequency);
      rumbleOsc.start(now);
    }

    let whineOsc = null;
    let whineGain = null;
    if (engine.turbo || engine.supercharger || engine.straightCut) {
      whineOsc = ctx.createOscillator();
      whineOsc.type = engine.straightCut ? 'sawtooth' : 'sine';
      const whineFilter = ctx.createBiquadFilter();
      whineFilter.type = 'bandpass';
      whineFilter.Q.value = engine.straightCut ? 6.0 : 3.5;
      whineFilter.frequency.setValueAtTime(engine.straightCut ? 2200 : 3200, now);

      whineGain = ctx.createGain();
      whineGain.gain.setValueAtTime(0.0001, now);

      whineOsc.connect(whineFilter);
      whineFilter.connect(whineGain);
      whineGain.connect(rigGain);
      whineOsc.start(now);
    }

    oscMain.start(now);
    oscHarm.start(now);
    oscSub.start(now);

    const updateRpm = (rpm, throttle = 1, gearRatio = 1) => {
      const t = ctx.currentTime;
      const baseHz = this._rpmToBaseHz(rpm, engine);
      const normRpm = Math.max(
        0,
        Math.min(1, (rpm - engine.idleRpm) / Math.max(1000, engine.redlineRpm - engine.idleRpm))
      );

      const vtecActive = engine.vtecRpm && rpm >= engine.vtecRpm;
      const harmMult =
        engine.type === 'f1-v10'
          ? 2.0
          : engine.type === 'v12'
            ? 1.5
            : engine.type === 'rotary'
              ? 1.98
              : engine.type === 'muscle-v8'
                ? 1.25
                : vtecActive
                  ? 2.0
                  : 1.5;

      oscMain.frequency.setTargetAtTime(baseHz, t, 0.025);
      oscHarm.frequency.setTargetAtTime(baseHz * harmMult, t, 0.025);
      oscSub.frequency.setTargetAtTime(baseHz * 0.5, t, 0.025);

      const minCutoff = engine.type === 'f1-v10' ? 650 : 280;
      const maxCutoff =
        engine.type === 'f1-v10'
          ? 5800
          : engine.type === 'v12' || engine.type === 'rotary'
            ? 4600
            : vtecActive
              ? 4200
              : 2800;
      const cutoff = minCutoff + (maxCutoff - minCutoff) * (0.25 + 0.75 * normRpm) * (0.55 + 0.45 * throttle);
      exhaustFilter.frequency.setTargetAtTime(cutoff, t, 0.03);

      harmGain.gain.setTargetAtTime(
        vtecActive ? 0.3 : engine.type === 'f1-v10' || engine.type === 'v12' ? 0.24 : 0.16,
        t,
        0.04
      );

      const targetVolume = (0.14 + 0.14 * normRpm) * (0.65 + 0.35 * throttle);
      rigGain.gain.setTargetAtTime(targetVolume, t, 0.03);

      if (whineOsc && whineGain) {
        if (engine.straightCut) {
          const whineHz = 650 + normRpm * 2400 * (0.75 + 0.25 * gearRatio);
          whineOsc.frequency.setTargetAtTime(whineHz, t, 0.025);
          whineGain.gain.setTargetAtTime(0.05 + normRpm * 0.11, t, 0.03);
        } else if (engine.supercharger) {
          const scHz = 900 + normRpm * 2800;
          whineOsc.frequency.setTargetAtTime(scHz, t, 0.025);
          whineGain.gain.setTargetAtTime(0.025 + normRpm * 0.08 * throttle, t, 0.03);
        } else if (engine.turbo) {
          const turboHz = 1800 + normRpm * 3400;
          whineOsc.frequency.setTargetAtTime(turboHz, t, 0.04);
          whineGain.gain.setTargetAtTime(normRpm > 0.3 ? (normRpm - 0.3) * 0.075 * throttle : 0.0001, t, 0.05);
        }
      }
    };

    const destroy = (fadeSec = 0.08) => {
      const t = ctx.currentTime;
      rigGain.gain.cancelScheduledValues(t);
      rigGain.gain.setTargetAtTime(0.0001, t, Math.max(0.015, fadeSec / 3));
      const stopAt = t + fadeSec + 0.06;
      try {
        oscMain.stop(stopAt);
        oscHarm.stop(stopAt);
        oscSub.stop(stopAt);
        if (rumbleOsc) rumbleOsc.stop(stopAt);
        if (whineOsc) whineOsc.stop(stopAt);
      } catch {
        // já encerrado
      }
    };

    return { updateRpm, destroy, rigGain, isRealSample: false };
  }

  _playShiftEffect(ctx, engine) {
    const now = ctx.currentTime;

    soundEngine._playNoiseBurst({
      startTime: now,
      duration: engine.type.startsWith('f1') ? 0.045 : 0.085,
      filterType: 'bandpass',
      freqStart: engine.type.startsWith('f1') ? 950 : 620,
      freqEnd: 220,
      q: 1.4,
      gain: 0.24 * (engine.exhaustPop || 0.6),
      attack: 0.003,
    });
    soundEngine._playTone({
      freq: engine.type.startsWith('f1') ? 130 : 95,
      endFreq: 42,
      type: 'sine',
      startTime: now,
      duration: 0.07,
      gain: 0.2,
      attack: 0.003,
    });

    if (engine.turbo) {
      const flutterBursts = engine.type === 'i6-turbo' || engine.type === 'boxer' ? [0.02, 0.065, 0.11] : [0.02];
      flutterBursts.forEach((offset, i) => {
        soundEngine._playNoiseBurst({
          startTime: now + offset,
          duration: 0.055,
          filterType: 'highpass',
          freqStart: 3600 - i * 450,
          freqEnd: 1800,
          q: 2.8,
          gain: 0.12 - i * 0.025,
          attack: 0.004,
        });
      });
    }
  }

  _playDecelPops(ctx, engine) {
    const now = ctx.currentTime;
    const popCount = engine.type === 'rotary' || engine.type === 'flat6' || engine.type === 'i6-turbo' ? 3 : 2;
    for (let i = 0; i < popCount; i++) {
      const t = now + 0.07 + i * 0.085 + Math.random() * 0.03;
      soundEngine._playNoiseBurst({
        startTime: t,
        duration: 0.055,
        filterType: 'bandpass',
        freqStart: 480 + Math.random() * 260,
        freqEnd: 160,
        q: 2.0,
        gain: 0.14 * (engine.exhaustPop || 0.5),
        attack: 0.003,
      });
    }
  }

  /**
   * Acelerada rápida (Rev Blip) — usa sample real se disponível, com fallback instantâneo para síntese!
   */
  async playRevBlip(card) {
    this.stopAcceleration(true);
    const ctx = this._getAudioContext();
    if (!ctx || !card) return;

    const engine = { ...DEFAULT_ENGINE, ...(card.engine || {}) };
    const sample = await this._resolveRealSample(ctx, card);
    const rig = sample?.buffer
      ? this._createRealSampleRig(ctx, sample.buffer, engine)
      : this._createSynthRig(ctx, engine);

    const startTime = performance.now();
    const peakRpm = engine.idleRpm + (engine.redlineRpm - engine.idleRpm) * 0.8;
    const upMs = engine.type.startsWith('f1') ? 220 : 290;
    const downMs = 380;
    let popPlayed = false;

    const step = (nowMs) => {
      const elapsed = nowMs - startTime;
      if (elapsed <= upMs) {
        const p = elapsed / upMs;
        const eased = 1 - Math.pow(1 - p, 2.2);
        const rpm = engine.idleRpm + (peakRpm - engine.idleRpm) * eased;
        rig.updateRpm(rpm, 1.0, 0.8);
        requestAnimationFrame(step);
      } else if (elapsed <= upMs + downMs) {
        if (!popPlayed) {
          popPlayed = true;
          if (engine.turbo) this._playShiftEffect(ctx, engine);
          else this._playDecelPops(ctx, engine);
        }
        const p = (elapsed - upMs) / downMs;
        const rpm = peakRpm - (peakRpm - engine.idleRpm) * (p * p);
        rig.updateRpm(rpm, 0.25, 0.6);
        requestAnimationFrame(step);
      } else {
        rig.destroy(0.12);
      }
    };

    requestAnimationFrame(step);
  }

  /**
   * Aceleração contínua com trocas automáticas de marcha — totalmente responsiva tanto com
   * áudios reais (.mp3/.wav/.ogg via playbackRate) quanto com o sintetizador físico!
   */
  startAcceleration(card, onTelemetry) {
    this.stopAcceleration(true);
    const ctx = this._getAudioContext();
    if (!card) return;

    const engine = { ...DEFAULT_ENGINE, ...(card.engine || {}) };
    const cachedSample = this.sampleBufferCache.get(card.id);

    let rig = ctx
      ? cachedSample?.buffer
        ? this._createRealSampleRig(ctx, cachedSample.buffer, engine)
        : this._createSynthRig(ctx, engine)
      : null;

    let gear = 1;
    let rpm = engine.idleRpm + 600;
    let shiftingUntil = 0;
    let lastFrame = performance.now();
    let stopped = false;
    let rafId = null;

    // Se ainda não estava no cache de memória, tenta carregar o sample real em background e faz troca suave!
    if (ctx && !this.sampleBufferCache.has(card.id)) {
      this._resolveRealSample(ctx, card).then((sample) => {
        if (stopped || !sample?.buffer) return;
        const oldRig = rig;
        rig = this._createRealSampleRig(ctx, sample.buffer, engine);
        rig.updateRpm(rpm, 1.0, gear / engine.gears);
        if (oldRig) oldRig.destroy(0.08);
      });
    }

    const session = {
      cardId: card.id,
      engine,
      stop: (immediate = false) => {
        if (stopped) return;
        stopped = true;
        if (rafId) cancelAnimationFrame(rafId);

        const activeRig = rig;
        if (immediate || !ctx || !activeRig) {
          if (activeRig) activeRig.destroy(0.05);
          if (onTelemetry) onTelemetry(null);
          return;
        }

        this._playDecelPops(ctx, engine);
        const decelStart = performance.now();
        const startRpm = rpm;
        const decelDuration = 380;

        const decelStep = (nowMs) => {
          const p = Math.min(1, (nowMs - decelStart) / decelDuration);
          const curRpm = startRpm - (startRpm - engine.idleRpm) * p;
          activeRig.updateRpm(curRpm, 0.18, gear / engine.gears);
          if (p < 1) {
            requestAnimationFrame(decelStep);
          } else {
            activeRig.destroy(0.1);
          }
        };
        requestAnimationFrame(decelStep);
        if (onTelemetry) onTelemetry(null);
      },
    };

    this.activeSession = session;

    const tick = (nowMs) => {
      if (stopped) return;
      const dt = Math.min(0.05, (nowMs - lastFrame) / 1000);
      lastFrame = nowMs;

      const isShifting = nowMs < shiftingUntil;
      const rpmSpan = engine.redlineRpm - engine.idleRpm;

      if (isShifting) {
        if (rig) rig.updateRpm(rpm, 0.15, gear / engine.gears);
      } else {
        const baseClimbSec = engine.type.startsWith('f1') ? 0.68 : 0.92;
        const gearFactor = 1 + (gear - 1) * 0.28;
        const rpmPerSec = rpmSpan / (baseClimbSec * gearFactor);

        rpm += rpmPerSec * dt;

        if (rpm >= engine.redlineRpm) {
          if (gear < engine.gears) {
            gear += 1;
            const dropFactor = engine.type.startsWith('f1') ? 0.72 : 0.62;
            rpm = engine.idleRpm + rpmSpan * dropFactor;
            shiftingUntil = nowMs + (engine.shiftMs || 130);
            if (ctx) this._playShiftEffect(ctx, engine);
          } else {
            rpm = engine.redlineRpm - (Math.sin(nowMs * 0.08) > 0 ? 180 : 0);
          }
        }

        if (rig) rig.updateRpm(rpm, 1.0, gear / engine.gears);
      }

      if (onTelemetry) {
        const topSpeed = card.perf?.topSpeedKmh || (240 + (card.stats?.velocidade || 80) * 1.4);
        const progress =
          ((gear - 1) + Math.max(0, (rpm - engine.idleRpm) / rpmSpan)) / engine.gears;
        onTelemetry({
          rpm: Math.round(rpm),
          maxRpm: engine.redlineRpm,
          gear,
          maxGears: engine.gears,
          shifting: isShifting,
          speedKmh: Math.round(topSpeed * Math.min(1, progress)),
          engineLabel: rig?.isRealSample ? `${engine.label} • ÁUDIO REAL` : engine.label,
        });
      }

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
  }

  stopAcceleration(immediate = false) {
    if (this.activeSession) {
      const s = this.activeSession;
      this.activeSession = null;
      s.stop(immediate);
    }
  }
}

export const engineAudio = new EngineAudioController();
export default engineAudio;
