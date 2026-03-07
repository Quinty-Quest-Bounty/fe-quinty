import { useState, useEffect, useCallback } from "react";

const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

interface HiddenItems {
  bounties: number[];
  quests: number[];
}

export function useHiddenItems() {
  const [hiddenBountyIds, setHiddenBountyIds] = useState<Set<number>>(new Set());
  const [hiddenQuestIds, setHiddenQuestIds] = useState<Set<number>>(new Set());

  const fetchHidden = useCallback(async () => {
    try {
      const res = await fetch(`${apiUrl}/moderation/hidden`);
      if (!res.ok) return;
      const data: HiddenItems = await res.json();
      setHiddenBountyIds(new Set(data.bounties));
      setHiddenQuestIds(new Set(data.quests));
    } catch {
      // Fail open — if backend is down, show everything
    }
  }, []);

  useEffect(() => {
    fetchHidden();
    const interval = setInterval(fetchHidden, 60000);
    return () => clearInterval(interval);
  }, [fetchHidden]);

  const isHidden = useCallback(
    (type: "bounty" | "quest", id: number) => {
      return type === "bounty" ? hiddenBountyIds.has(id) : hiddenQuestIds.has(id);
    },
    [hiddenBountyIds, hiddenQuestIds],
  );

  return { hiddenBountyIds, hiddenQuestIds, isHidden, refetch: fetchHidden };
}
