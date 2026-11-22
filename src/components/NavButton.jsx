import React from 'react';

const NavButton = ({ onClick, direction, disabled }) => {
  const isPrev = direction === 'prev';
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={isPrev ? 'Carta anterior' : 'Próxima carta'}
      className="w-12 h-12 rounded-full bg-slate-900/90 hover:bg-slate-800 border border-slate-700 hover:border-amber-400/60 text-slate-200 hover:text-amber-300 flex items-center justify-center shadow-lg transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
    >
      <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2.5">
        {isPrev ? (
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        ) : (
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        )}
      </svg>
    </button>
  );
};

export default NavButton;
