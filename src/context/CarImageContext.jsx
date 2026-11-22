import React, { createContext, useContext, useEffect, useState } from 'react';
import { CARDS } from '../data/cards.js';
import { fetchAllCarPhotos, loadCachedPhotos } from '../utils/carImageService.js';

const ART_MODE_KEY = 'apex-tcg-art-mode-v1';

const CarImageContext = createContext({
  photos: {},
  artMode: 'photo', // 'photo' | 'vector'
  toggleArtMode: () => {},
  loading: false,
});

export function CarImageProvider({ children }) {
  const [photos, setPhotos] = useState(() => loadCachedPhotos());
  const [loading, setLoading] = useState(false);
  const [artMode, setArtMode] = useState(() => {
    try {
      return localStorage.getItem(ART_MODE_KEY) || 'photo';
    } catch {
      return 'photo';
    }
  });

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchAllCarPhotos(CARDS, loadCachedPhotos())
      .then((resolved) => {
        if (!cancelled) {
          setPhotos((prev) => ({ ...prev, ...resolved }));
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const toggleArtMode = () => {
    setArtMode((prev) => {
      const next = prev === 'photo' ? 'vector' : 'photo';
      try {
        localStorage.setItem(ART_MODE_KEY, next);
      } catch {
        // ignora erro de armazenamento
      }
      return next;
    });
  };

  return (
    <CarImageContext.Provider value={{ photos, artMode, toggleArtMode, loading }}>
      {children}
    </CarImageContext.Provider>
  );
}

export function useCarImages() {
  return useContext(CarImageContext);
}

export function useCarPhoto(cardId) {
  const { photos, artMode } = useContext(CarImageContext);
  if (artMode !== 'photo') return null;
  return photos[cardId] || null;
}
