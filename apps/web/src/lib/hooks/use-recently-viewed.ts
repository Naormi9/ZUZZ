'use client';

import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'zuzz_recently_viewed';
const MAX_ITEMS = 20;

interface RecentlyViewedItem {
  id: string;
  title: string;
  price: number;
  imageUrl?: string;
  vertical: string;
  viewedAt: number;
}

export function useRecentlyViewed(vertical: string = 'cars') {
  const [items, setItems] = useState<RecentlyViewedItem[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const all: RecentlyViewedItem[] = JSON.parse(stored);
        setItems(all.filter((i) => i.vertical === vertical));
      }
    } catch {
      // ignore
    }
  }, [vertical]);

  const addItem = useCallback(
    (item: Omit<RecentlyViewedItem, 'viewedAt' | 'vertical'>) => {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        let all: RecentlyViewedItem[] = stored ? JSON.parse(stored) : [];

        // Remove duplicate
        all = all.filter((i) => i.id !== item.id);

        // Add to front
        all.unshift({ ...item, vertical, viewedAt: Date.now() });

        // Trim
        all = all.slice(0, MAX_ITEMS);

        localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
        setItems(all.filter((i) => i.vertical === vertical));
      } catch {
        // ignore
      }
    },
    [vertical],
  );

  return { items, addItem };
}
