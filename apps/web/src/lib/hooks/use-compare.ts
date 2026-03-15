'use client';

import { useState, useCallback, useEffect } from 'react';

const STORAGE_KEY = 'zuzz_compare';
const MAX_COMPARE = 3;

interface CompareItem {
  id: string;
  title: string;
  price: number;
  imageUrl?: string;
  year?: number;
  mileage?: number;
}

export function useCompare() {
  const [items, setItems] = useState<CompareItem[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setItems(JSON.parse(stored));
    } catch {
      // ignore
    }
  }, []);

  const persist = (newItems: CompareItem[]) => {
    setItems(newItems);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newItems));
    } catch {
      // ignore
    }
  };

  const addToCompare = useCallback(
    (item: CompareItem) => {
      if (items.length >= MAX_COMPARE) return false;
      if (items.some((i) => i.id === item.id)) return false;
      persist([...items, item]);
      return true;
    },
    [items],
  );

  const removeFromCompare = useCallback(
    (id: string) => {
      persist(items.filter((i) => i.id !== id));
    },
    [items],
  );

  const clearCompare = useCallback(() => {
    persist([]);
  }, []);

  const isInCompare = useCallback(
    (id: string) => items.some((i) => i.id === id),
    [items],
  );

  return {
    items,
    count: items.length,
    addToCompare,
    removeFromCompare,
    clearCompare,
    isInCompare,
    isFull: items.length >= MAX_COMPARE,
  };
}
