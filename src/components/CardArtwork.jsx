import React, { useLayoutEffect, useRef, useState } from 'react';
import { useCarImages } from '../context/CarImageContext.jsx';

function CarSilhouette({ bodyType, livery, isF1 }) {
  const { body, stripe, rim, number } = livery;

  if (bodyType === 'f1' || isF1) {
    // Fórmula 1 clássica / moderna em perfil lateral detalhado com asas, sidepods, cockpit e rodas slick
    return (
      <svg viewBox="0 0 260 115" className="w-full h-auto drop-shadow-[0_14px_22px_rgba(0,0,0,0.85)]" fill="none">
        {/* Sombra no asfalto */}
        <ellipse cx="132" cy="98" rx="108" ry="8" fill="rgba(0,0,0,0.65)" />
        {/* Faixas de velocidade aerodinâmica */}
        <line x1="10" y1="30" x2="55" y2="30" stroke={stripe} strokeWidth="1.5" strokeOpacity="0.65" strokeLinecap="round" />
        <line x1="4" y1="42" x2="40" y2="42" stroke="#ffffff" strokeWidth="1" strokeOpacity="0.45" strokeLinecap="round" />
        <line x1="18" y1="54" x2="48" y2="54" stroke={stripe} strokeWidth="1.2" strokeOpacity="0.5" strokeLinecap="round" />

        {/* Asa traseira (Rear Wing) */}
        <path d="M26 36 L52 34 L56 64 L32 64 Z" fill={body} stroke={stripe} strokeWidth="1.5" />
        <rect x="24" y="34" width="28" height="6" rx="1.5" fill={stripe} />

        {/* Cobertura do motor + Airbox + Chassi principal */}
        <path
          d="M52 54 L88 38 L124 38 L138 48 L194 56 L236 66 L242 74 L212 78 L54 78 Z"
          fill={body}
          stroke="rgba(255,255,255,0.3)"
          strokeWidth="1.2"
        />

        {/* Faixa de pintura (Livery racing stripe) */}
        <path
          d="M66 56 L118 46 L176 58 L228 69 L216 74 L164 66 L104 60 L62 66 Z"
          fill={stripe}
          fillOpacity="0.92"
        />

        {/* Cockpit + Capacete do piloto estilizado */}
        <path d="M116 42 Q128 32 142 46 L116 48 Z" fill="#090d16" />
        <circle cx="129" cy="43" r="6.5" fill="#facc15" stroke="#18181b" strokeWidth="1.5" />
        <path d="M126 42 H135" stroke="#0f172a" strokeWidth="2.4" strokeLinecap="round" />
        {/* Roll-hoop / T-Cam */}
        <path d="M108 38 L113 26 L121 26 L120 38 Z" fill={stripe} />
        <rect x="110" y="23" width="12" height="3" rx="1" fill="#f8fafc" />

        {/* Assoalho de fibra de carbono */}
        <rect x="52" y="75" width="160" height="5" rx="2" fill="#111827" stroke="rgba(255,255,255,0.2)" strokeWidth="0.8" />

        {/* Asa dianteira (Front Wing) */}
        <path d="M214 70 L248 68 L250 78 L214 79 Z" fill={stripe} stroke="rgba(255,255,255,0.35)" strokeWidth="1" />

        {/* Número de corrida no bico/tampa */}
        <text
          x="156"
          y="69"
          fill="#ffffff"
          fontSize="12"
          fontWeight="900"
          fontFamily="monospace"
          textAnchor="middle"
          style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.9))' }}
        >
          {number}
        </text>

        {/* Roda traseira slick larga */}
        <circle cx="66" cy="76" r="19" fill="#09090b" stroke="#27272a" strokeWidth="3" />
        <circle cx="66" cy="76" r="11" fill={rim} stroke={stripe} strokeWidth="2" />
        <circle cx="66" cy="76" r="4" fill="#09090b" />

        {/* Roda dianteira slick */}
        <circle cx="204" cy="77" r="17" fill="#09090b" stroke="#27272a" strokeWidth="3" />
        <circle cx="204" cy="77" r="10" fill={rim} stroke={stripe} strokeWidth="2" />
        <circle cx="204" cy="77" r="3.5" fill="#09090b" />
      </svg>
    );
  }

  if (bodyType === 'hypercar') {
    return (
      <svg viewBox="0 0 260 115" className="w-full h-auto drop-shadow-[0_14px_22px_rgba(0,0,0,0.85)]" fill="none">
        <ellipse cx="132" cy="96" rx="104" ry="8" fill="rgba(0,0,0,0.65)" />
        {/* Asa traseira ativa */}
        <path d="M28 46 L52 44 L50 54 L36 55 Z" fill={stripe} />
        {/* Carroceria ultra-baixa aerodinâmica */}
        <path
          d="M28 66 L44 52 L92 42 L148 40 L198 54 L236 64 L240 76 L216 80 L34 80 Z"
          fill={body}
          stroke="rgba(255,255,255,0.3)"
          strokeWidth="1.2"
        />
        {/* Vidro panorâmico em gota */}
        <path d="M96 44 L146 43 L178 55 L112 56 Z" fill="#020617" stroke={stripe} strokeWidth="1" strokeOpacity="0.7" />
        {/* Entrada de ar lateral + faixa de pintura */}
        <path d="M84 62 L176 60 L226 68 L216 74 L80 73 Z" fill={stripe} fillOpacity="0.9" />
        {/* Farol LED afiado */}
        <path d="M214 63 L234 66 L224 69 Z" fill="#fef08a" />
        {/* Lanterna LED traseira */}
        <rect x="28" y="62" width="12" height="4" rx="1.5" fill="#ef4444" />
        {/* Rodas */}
        <circle cx="68" cy="78" r="17" fill="#09090b" stroke="#27272a" strokeWidth="2.8" />
        <circle cx="68" cy="78" r="10.5" fill={rim} stroke={stripe} strokeWidth="1.6" />
        <circle cx="68" cy="78" r="3.5" fill="#09090b" />
        <circle cx="198" cy="78" r="17" fill="#09090b" stroke="#27272a" strokeWidth="2.8" />
        <circle cx="198" cy="78" r="10.5" fill={rim} stroke={stripe} strokeWidth="1.6" />
        <circle cx="198" cy="78" r="3.5" fill="#09090b" />
      </svg>
    );
  }

  if (bodyType === 'gt3') {
    // Carro de corrida FIA GT3: asa traseira pescoço-de-cisne alta, splitter frontal, difusor e gaiola
    return (
      <svg viewBox="0 0 260 115" className="w-full h-auto drop-shadow-[0_14px_22px_rgba(0,0,0,0.85)]" fill="none">
        <ellipse cx="132" cy="96" rx="108" ry="8" fill="rgba(0,0,0,0.68)" />
        {/* Asa traseira swan-neck FIA GT3 */}
        <path d="M18 32 L54 34 L52 41 L20 40 Z" fill={stripe} stroke="rgba(255,255,255,0.35)" strokeWidth="1" />
        <path d="M36 40 L42 54" stroke="#0f172a" strokeWidth="3.5" strokeLinecap="round" />
        {/* Carroceria widebody GT3 */}
        <path
          d="M28 60 L50 52 L92 37 L154 37 L192 52 L240 60 L246 77 L28 77 Z"
          fill={body}
          stroke="rgba(255,255,255,0.3)"
          strokeWidth="1.2"
        />
        {/* Gaiola de proteção (Roll Cage) visível no vidro */}
        <path d="M96 41 L150 41 L178 53 L86 53 Z" fill="#090d16" stroke="rgba(255,255,255,0.22)" strokeWidth="1" />
        <line x1="112" y1="42" x2="128" y2="53" stroke={stripe} strokeWidth="1.8" strokeOpacity="0.8" />
        {/* Faixa de equipe GT3 */}
        <path d="M36 63 L234 63 L232 69 L34 69 Z" fill={stripe} fillOpacity="0.92" />
        {/* Splitter dianteiro + Canards + Difusor traseiro */}
        <rect x="218" y="75" width="32" height="4" rx="1.5" fill="#09090b" stroke={stripe} strokeWidth="0.9" />
        <rect x="24" y="74" width="22" height="5" rx="1.5" fill="#09090b" />
        {/* Farol endurance amarelo + lanterna LED */}
        <rect x="220" y="60" width="14" height="5" rx="2" fill="#facc15" />
        <rect x="28" y="60" width="10" height="4.5" rx="1.5" fill="#ef4444" />
        {/* Placa de número lateral */}
        <rect x="122" y="57" width="24" height="14" rx="2.5" fill="#ffffff" fillOpacity="0.92" />
        <text x="134" y="67.5" fill="#090d16" fontSize="9.5" fontWeight="900" fontFamily="monospace" textAnchor="middle">
          {number}
        </text>
        {/* Rodas slick GT3 */}
        <circle cx="68" cy="77" r="17" fill="#09090b" stroke="#27272a" strokeWidth="3" />
        <circle cx="68" cy="77" r="10.5" fill={rim} stroke={stripe} strokeWidth="1.8" />
        <circle cx="68" cy="77" r="3.5" fill="#09090b" />
        <circle cx="198" cy="77" r="17" fill="#09090b" stroke="#27272a" strokeWidth="3" />
        <circle cx="198" cy="77" r="10.5" fill={rim} stroke={stripe} strokeWidth="1.8" />
        <circle cx="198" cy="77" r="3.5" fill="#09090b" />
      </svg>
    );
  }

  if (bodyType === 'jdm') {
    return (
      <svg viewBox="0 0 260 115" className="w-full h-auto drop-shadow-[0_14px_22px_rgba(0,0,0,0.85)]" fill="none">
        <ellipse cx="132" cy="96" rx="102" ry="8" fill="rgba(0,0,0,0.65)" />
        {/* Aerofólio GT JDM alto */}
        <path d="M26 38 L52 38 L54 44 L30 44 Z" fill={stripe} />
        <rect x="38" y="44" width="4" height="12" fill="#0f172a" />
        {/* Corpo cupê JDM */}
        <path
          d="M28 60 L54 54 L94 38 L152 38 L186 53 L234 59 L236 78 L30 78 Z"
          fill={body}
          stroke="rgba(255,255,255,0.28)"
          strokeWidth="1.2"
        />
        {/* Janelas escuras */}
        <path d="M98 42 L148 42 L174 54 L88 54 Z" fill="#090d16" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
        {/* Faixa lateral Neon / Street */}
        <path d="M36 65 L228 65 L226 70 L34 70 Z" fill={stripe} fillOpacity="0.88" />
        {/* Farol dianteiro + lanterna redonda clássica */}
        <rect x="218" y="60" width="14" height="5" rx="2" fill="#e0f2fe" />
        <circle cx="33" cy="63" r="3.2" fill="#ef4444" />
        {/* Rodas esportivas */}
        <circle cx="70" cy="78" r="16.5" fill="#09090b" stroke="#27272a" strokeWidth="2.8" />
        <circle cx="70" cy="78" r="10" fill={rim} stroke={stripe} strokeWidth="1.6" />
        <circle cx="70" cy="78" r="3.5" fill="#09090b" />
        <circle cx="196" cy="78" r="16.5" fill="#09090b" stroke="#27272a" strokeWidth="2.8" />
        <circle cx="196" cy="78" r="10" fill={rim} stroke={stripe} strokeWidth="1.6" />
        <circle cx="196" cy="78" r="3.5" fill="#09090b" />
      </svg>
    );
  }

  // Supercar / Muscle / Street
  const isMuscle = bodyType === 'muscle';
  return (
    <svg viewBox="0 0 260 115" className="w-full h-auto drop-shadow-[0_14px_22px_rgba(0,0,0,0.85)]" fill="none">
      <ellipse cx="132" cy="96" rx="102" ry="8" fill="rgba(0,0,0,0.65)" />
      {bodyType === 'supercar' && <path d="M30 46 L52 44 L54 55 L34 56 Z" fill={body} stroke={stripe} strokeWidth="1.2" />}
      <path
        d={
          isMuscle
            ? 'M26 58 L62 54 L94 40 L152 40 L176 53 L236 56 L238 78 L28 78 Z'
            : 'M28 62 L52 52 L96 40 L150 40 L186 52 L236 60 L238 78 L30 78 Z'
        }
        fill={body}
        stroke="rgba(255,255,255,0.28)"
        strokeWidth="1.2"
      />
      <path d="M98 44 L148 44 L170 54 L86 54 Z" fill="#090d16" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
      <path d="M36 64 L230 64 L228 69 L34 69 Z" fill={stripe} fillOpacity="0.9" />
      {isMuscle && <rect x="188" y="48" width="22" height="7" rx="2" fill="#3f3f46" stroke="#a1a1aa" strokeWidth="1" />}
      <rect x="220" y="60" width="14" height="5" rx="2" fill="#fef08a" />
      <rect x="29" y="61" width="9" height="4.5" rx="1.5" fill="#ef4444" />
      <circle cx="70" cy="78" r="16.5" fill="#09090b" stroke="#27272a" strokeWidth="2.8" />
      <circle cx="70" cy="78" r="10" fill={rim} stroke={stripe} strokeWidth="1.6" />
      <circle cx="70" cy="78" r="3.5" fill="#09090b" />
      <circle cx="196" cy="78" r="16.5" fill="#09090b" stroke="#27272a" strokeWidth="2.8" />
      <circle cx="196" cy="78" r="10" fill={rim} stroke={stripe} strokeWidth="1.6" />
      <circle cx="196" cy="78" r="3.5" fill="#09090b" />
    </svg>
  );
}

const CardArtwork = ({ card, isFullArt = false, isFoil = false }) => {
  const isF1 = card.raridade === 'F1 Histórica' || card.bodyType === 'f1';
  const { photos, artMode } = useCarImages();
  const photoUrl = artMode === 'photo' ? (card.imageUrl || photos[card.id] || null) : null;

  // Rastreia por URL exata (elimina race condition de onLoad em imagens já cacheadas pelo navegador!)
  const imgRef = useRef(null);
  const [loadedUrl, setLoadedUrl] = useState(null);
  const [failedUrl, setFailedUrl] = useState(null);

  const imgLoaded = Boolean(photoUrl && loadedUrl === photoUrl);
  const imgFailed = Boolean(photoUrl && failedUrl === photoUrl);

  // Se a imagem já estava no cache HTTP do navegador ao montar/trocar de carta, marca imediatamente como carregada
  useLayoutEffect(() => {
    const img = imgRef.current;
    if (photoUrl && img && img.complete && img.naturalWidth > 0) {
      setLoadedUrl(photoUrl);
    }
  }, [photoUrl]);

  const livery = card.livery || {
    bgFrom: card.accentColor || '#1e293b',
    bgTo: '#090d1a',
    body: '#e2e8f0',
    stripe: '#fbbf24',
    rim: '#cbd5e1',
    number: card.number,
    badge: card.origem.toUpperCase(),
  };

  const showPhoto = Boolean(photoUrl && !imgFailed);

  return (
    <div
      className="relative w-full h-full overflow-hidden flex flex-col items-center justify-center"
      style={{
        background: `radial-gradient(circle at 50% 30%, ${livery.bgFrom}, ${livery.bgTo} 85%)`,
      }}
    >
      {/* Foto real via Wikipédia / Wikimedia Commons (carregamento eager para funcionar dentro de cartas 3D viradas) */}
      {showPhoto && (
        <>
          <img
            ref={imgRef}
            key={photoUrl}
            src={photoUrl}
            alt={`${card.marca} ${card.tipo}`}
            decoding="async"
            referrerPolicy="no-referrer"
            onLoad={() => setLoadedUrl(photoUrl)}
            onError={() => setFailedUrl(photoUrl)}
            className={`absolute inset-0 w-full h-full object-cover object-center transition-opacity duration-300 ${
              imgLoaded ? 'opacity-100' : 'opacity-0'
            } ${isFullArt ? 'saturate-125 contrast-110' : 'saturate-110'}`}
          />

          {/* Vinheta cinematográfica + color-grading temático por raridade/pintura */}
          <div
            className={`absolute inset-0 pointer-events-none transition-opacity duration-500 ${
              imgLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            style={{
              background: isFullArt
                ? `linear-gradient(180deg, rgba(5,8,18,0.55) 0%, ${livery.bgFrom}22 35%, rgba(5,8,18,0.25) 60%, rgba(5,8,18,0.92) 100%)`
                : `linear-gradient(180deg, rgba(5,8,18,0.18) 0%, transparent 45%, rgba(5,8,18,0.75) 100%)`,
            }}
          />

          {/* Tag técnica sutil sobre a foto real (apenas no layout Normal/Foil) */}
          {imgLoaded && !isFullArt && (
            <div className="absolute bottom-1.5 left-1.5 z-10 px-2 py-0.5 rounded-full bg-black/65 border border-white/15 backdrop-blur-sm">
              <span
                className="text-[7.5px] font-mono font-bold tracking-[0.18em] uppercase"
                style={{ color: livery.stripe }}
              >
                {livery.badge}
              </span>
            </div>
          )}
        </>
      )}

      {/* Arte vetorial estilizada (aparece instantaneamente enquanto a foto carrega, no modo Vetor ou se offline) */}
      {(!showPhoto || !imgLoaded) && (
        <>
          {isF1 ? (
            <div
              className="absolute inset-0 opacity-20"
              style={{
                backgroundImage:
                  'linear-gradient(45deg, rgba(255,255,255,0.22) 25%, transparent 25%), linear-gradient(-45deg, rgba(255,255,255,0.22) 25%, transparent 25%), linear-gradient(45deg, transparent 75%, rgba(255,255,255,0.22) 75%), linear-gradient(-45deg, transparent 75%, rgba(255,255,255,0.22) 75%)',
                backgroundSize: '18px 18px',
                backgroundPosition: '0 0, 0 9px, 9px -9px, -9px 0',
              }}
            />
          ) : (
            <div
              className="absolute inset-0 opacity-20"
              style={{
                backgroundImage: `radial-gradient(${livery.stripe} 1px, transparent 1px)`,
                backgroundSize: '14px 14px',
              }}
            />
          )}

          <div
            className="absolute inset-x-0 bottom-0 h-1/3 pointer-events-none"
            style={{
              background: 'linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.55) 45%, rgba(0,0,0,0.85) 100%)',
            }}
          />

          <div
            className={`relative z-10 w-full flex flex-col items-center justify-center px-3 ${
              isFullArt ? '-mt-14 scale-110' : ''
            }`}
          >
            <div
              className="absolute font-mono font-black tracking-tighter select-none pointer-events-none opacity-15"
              style={{
                fontSize: isFullArt ? '5.5rem' : '4rem',
                color: livery.stripe,
                top: '-18px',
              }}
            >
              {livery.number}
            </div>

            <CarSilhouette bodyType={card.bodyType} livery={livery} isF1={isF1} />

            <div className="mt-1 px-2.5 py-0.5 rounded-full bg-black/55 border border-white/15 backdrop-blur-sm">
              <span
                className="text-[8px] font-mono font-bold tracking-[0.2em] uppercase"
                style={{ color: livery.stripe }}
              >
                {livery.badge}
              </span>
            </div>
          </div>
        </>
      )}

      {/* Feixes radiais luminosos para Foil / Full Art / F1 */}
      {(isFullArt || isFoil || isF1) && (
        <div
          className={`absolute inset-0 pointer-events-none ${showPhoto && imgLoaded ? 'opacity-25' : 'opacity-40'}`}
          style={{
            backgroundImage: `repeating-conic-gradient(from 10deg at 50% 42%, ${livery.stripe}30 0deg 10deg, transparent 10deg 22deg)`,
          }}
        />
      )}
    </div>
  );
};

export default CardArtwork;
