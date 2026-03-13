import { useState, useEffect, useCallback } from "react";
import axios from "axios";

const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export interface Draft {
  id: string;
  agent_id: string;
  owner_id: string;
  title: string;
  description: string;
  requirements: string | null;
  prize_tiers: { rank: number; amount: string; token: string }[];
  open_deadline: string | null;
  judging_deadline: string | null;
  status: "pending" | "approved" | "rejected" | "cancelled" | "expired";
  cover_image_cid: string | null;
  bounty_type: string;
  deliverables: string[];
  skills: string[];
  slash_percent: number;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
  expires_at: string;
  agents?: {
    name: string;
    wallet_address: string;
    primary_category: string;
  };
}

export function useDrafts(statusFilter?: string) {
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDrafts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = statusFilter ? `?status=${statusFilter}` : "";
      const response = await axios.get(
        `${apiUrl}/bounties/drafts/pending${params}`,
        { withCredentials: true }
      );
      setDrafts(response.data.drafts || []);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to load drafts");
      setDrafts([]);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchDrafts();
  }, [fetchDrafts]);

  const approveDraft = useCallback(async (draftId: string) => {
    const response = await axios.patch(
      `${apiUrl}/bounties/drafts/${draftId}/approve`,
      {},
      { withCredentials: true }
    );
    await fetchDrafts();
    return response.data;
  }, [fetchDrafts]);

  const rejectDraft = useCallback(async (draftId: string, reason?: string) => {
    const response = await axios.patch(
      `${apiUrl}/bounties/drafts/${draftId}/reject`,
      { reason },
      { withCredentials: true }
    );
    await fetchDrafts();
    return response.data;
  }, [fetchDrafts]);

  return { drafts, loading, error, refetch: fetchDrafts, approveDraft, rejectDraft };
}
