import React, { useEffect, useRef, useState } from 'react';
import soundEngine from '../utils/soundEngine.js';

const CustomSelect = ({ value, onChange, options, label = 'Ordenar', ariaLabel }) => {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  const selectedOption = options.find((opt) => opt.value === value) || options[0];

  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setOpen(false);
        return;
      }
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        const currentIdx = options.findIndex((o) => o.value === value);
        const delta = e.key === 'ArrowDown' ? 1 : -1;
        const nextIdx = (currentIdx + delta + options.length) % options.length;
        soundEngine.playUiClick();
        onChange(options[nextIdx].value);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, options, value, onChange]);

  const handleToggle = () => {
    soundEngine.playUiClick();
    setOpen((prev) => !prev);
  };

  const handleSelect = (optValue) => {
    soundEngine.playUiClick();
    onChange(optValue);
    setOpen(false);
  };

  return (
    <div ref={containerRef} className="relative inline-block">
      {/* Botão gatilho estilizado */}
      <button
        type="button"
        onClick={handleToggle}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel || label}
        className={`min-w-[178px] px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center justify-between gap-2.5 transition-all backdrop-blur-md ${
          open
            ? 'bg-slate-900 border-amber-400/80 text-white shadow-[0_0_20px_rgba(251,191,36,0.2)]'
            : 'bg-slate-950/80 border-slate-700/90 text-slate-200 hover:border-amber-400/50 hover:text-white'
        }`}
      >
        <span className="flex items-center gap-2 truncate">
          {selectedOption?.icon && (
            <span className="text-amber-400 text-[11px] leading-none">{selectedOption.icon}</span>
          )}
          <span className="truncate">{selectedOption?.label}</span>
        </span>
        <svg
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          className={`w-3.5 h-3.5 text-amber-300/90 shrink-0 transition-transform duration-200 ${
            open ? 'rotate-180' : ''
          }`}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 8l4 4 4-4" />
        </svg>
      </button>

      {/* Menu flutuante customizado (substitui o select nativo do navegador) */}
      {open && (
        <div
          role="listbox"
          aria-label={ariaLabel || label}
          className="absolute right-0 mt-2 w-52 z-50 rounded-2xl bg-slate-900/95 backdrop-blur-xl border border-amber-400/30 shadow-[0_20px_45px_rgba(0,0,0,0.85),0_0_25px_rgba(251,191,36,0.12)] p-1.5 animate-pop-in"
        >
          <div className="px-2.5 py-1 text-[10px] font-mono uppercase tracking-[0.18em] text-slate-500 border-b border-white/5 mb-1">
            {label}
          </div>
          {options.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <button
                key={opt.value}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => handleSelect(opt.value)}
                className={`w-full px-2.5 py-2 rounded-xl text-left text-xs font-semibold flex items-center justify-between gap-2 transition-all ${
                  isSelected
                    ? 'bg-gradient-to-r from-amber-400/20 via-amber-400/10 to-transparent text-amber-200 border border-amber-400/40'
                    : 'text-slate-300 hover:bg-slate-800/90 hover:text-white border border-transparent'
                }`}
              >
                <span className="flex items-center gap-2 truncate">
                  {opt.icon && (
                    <span className={`text-[11px] ${isSelected ? 'text-amber-300' : 'text-slate-400'}`}>
                      {opt.icon}
                    </span>
                  )}
                  <span className="truncate">{opt.label}</span>
                </span>
                {isSelected && (
                  <span className="text-amber-300 text-xs font-black shrink-0">✓</span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CustomSelect;
