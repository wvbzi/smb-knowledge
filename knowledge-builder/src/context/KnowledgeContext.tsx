"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { KnowledgeBase } from "@/types/knowledge";

type KnowledgeContextType = {
  knowledgeData: KnowledgeBase[];
  isHydrated: boolean;
  saveDraft: (kb: KnowledgeBase) => void;
  updateKnowledge: (id: string, updates: Partial<KnowledgeBase>) => void;
  commitSave: (id: string) => void;
  deleteKnowledge: (id: string) => void;
  getKnowledge: (id: string) => KnowledgeBase | undefined;
};

const KnowledgeContext = createContext<KnowledgeContextType | undefined>(undefined);

const KB_PREFIX = "kb:";

function keyFor(id: string) {
  return `${KB_PREFIX}${id}`;
}

export function KnowledgeProvider({ children }: { children: React.ReactNode }) {
  const [knowledgeData, setKnowledgeData] = useState<KnowledgeBase[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);

  // Hydration: scan localStorage once for every kb:{id} key and load it into
  // state. This is the single source of truth read path, no separate index
  // to keep in sync. Runs once on mount.
  useEffect(() => {
    const loaded: KnowledgeBase[] = [];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key || !key.startsWith(KB_PREFIX)) continue;

      const raw = localStorage.getItem(key);
      if (!raw) continue;

      try {
        loaded.push(JSON.parse(raw) as KnowledgeBase);
      } catch {
        // Skip corrupted entries rather than crash hydration for everything else.
        console.warn(`Failed to parse localStorage key: ${key}`);
      }
    }

    setKnowledgeData(loaded);
    setIsHydrated(true);
  }, []);

  // Called right after scraping finishes. Persists as a draft under its own
  // uuid, never a shared slot, so concurrent tabs scraping different sites
  // never collide.
  const saveDraft = useCallback((kb: KnowledgeBase) => {
    localStorage.setItem(keyFor(kb.id), JSON.stringify(kb));
    setKnowledgeData((prev) => [...prev.filter((k) => k.id !== kb.id), kb]);
  }, []);

  // Called on every field edit while reviewing. Keeps whatever status the
  // record already has (draft or saved), this does not promote a draft.
  const updateKnowledge = useCallback((id: string, updates: Partial<KnowledgeBase>) => {
    setKnowledgeData((prev) => {
      const next = prev.map((kb) => (kb.id === id ? { ...kb, ...updates } : kb));
      const updated = next.find((kb) => kb.id === id);
      if (updated) {
        localStorage.setItem(keyFor(id), JSON.stringify(updated));
      }
      return next;
    });
  }, []);

  // Called on Save click. Changes draft -> saved and stamps savedAt.
  const commitSave = useCallback((id: string) => {
    setKnowledgeData((prev) => {
      const next = prev.map((kb) =>
        kb.id === id
          ? { ...kb, status: "saved" as const, savedAt: new Date().toISOString() }
          : kb
      );
      const saved = next.find((kb) => kb.id === id);
      if (saved) {
        localStorage.setItem(keyFor(id), JSON.stringify(saved));
      }
      return next;
    });
  }, []);

  const deleteKnowledge = useCallback((id: string) => {
    localStorage.removeItem(keyFor(id));
    setKnowledgeData((prev) => prev.filter((kb) => kb.id !== id));
  }, []);

  const getKnowledge = useCallback(
    (id: string) => knowledgeData.find((kb) => kb.id === id),
    [knowledgeData]
  );

  return (
    <KnowledgeContext.Provider
      value={{
        knowledgeData,
        isHydrated,
        saveDraft,
        updateKnowledge,
        commitSave,
        deleteKnowledge,
        getKnowledge,
      }}
    >
      {children}
    </KnowledgeContext.Provider>
  );
}

export function useKnowledge() {
  const context = useContext(KnowledgeContext);
  if (!context) {
    throw new Error("useKnowledge must be used within a KnowledgeProvider");
  }
  return context;
}