"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../contexts/AuthContext";
import { useDrafts, Draft } from "../../../hooks/useDrafts";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import {
  FileText,
  Check,
  X,
  Clock,
  Loader2,
  ChevronDown,
  ChevronUp,
  Bot,
  AlertCircle,
} from "lucide-react";
import { formatAddress } from "../../../utils/web3";

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  approved: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
  cancelled: "bg-gray-100 text-gray-600",
  expired: "bg-gray-100 text-gray-500",
};

function DraftCard({
  draft,
  onApprove,
  onReject,
  actionLoading,
}: {
  draft: Draft;
  onApprove: (id: string) => void;
  onReject: (id: string, reason: string) => void;
  actionLoading: string | null;
}) {
  const [expanded, setExpanded] = useState(false);
  const [rejectMode, setRejectMode] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  const isLoading = actionLoading === draft.id;
  const isPending = draft.status === "pending";
  const expiresAt = new Date(draft.expires_at);
  const daysLeft = Math.max(0, Math.ceil((expiresAt.getTime() - Date.now()) / 86400000));

  return (
    <div className="border border-gray-200 rounded-xl p-5 hover:border-[#0EA885]/30 transition-colors">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[draft.status]}`}>
              {draft.status}
            </span>
            {isPending && daysLeft <= 2 && (
              <span className="text-xs text-orange-600 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Expires in {daysLeft}d
              </span>
            )}
          </div>
          <h3 className="font-semibold text-gray-900 text-lg">{draft.title}</h3>
          {draft.agents && (
            <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
              <Bot className="w-3.5 h-3.5" />
              {draft.agents.name} &middot; {formatAddress(draft.agents.wallet_address)}
            </p>
          )}
        </div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-gray-400 hover:text-gray-600 p-1"
        >
          {expanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </button>
      </div>

      {expanded && (
        <div className="mt-4 space-y-3">
          <div>
            <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide">Description</h4>
            <p className="text-sm text-gray-700 mt-1 whitespace-pre-wrap">{draft.description}</p>
          </div>

          {draft.requirements && (
            <div>
              <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide">Requirements</h4>
              <p className="text-sm text-gray-700 mt-1 whitespace-pre-wrap">{draft.requirements}</p>
            </div>
          )}

          <div>
            <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide">Prize Tiers</h4>
            <div className="mt-1 space-y-1">
              {draft.prize_tiers.map((tier, i) => (
                <div key={i} className="text-sm text-gray-700 flex items-center gap-2">
                  <span className="font-medium">#{tier.rank}</span>
                  <span>{tier.amount} {tier.token}</span>
                </div>
              ))}
            </div>
          </div>

          {(draft.open_deadline || draft.judging_deadline) && (
            <div className="flex gap-6 text-sm text-gray-600">
              {draft.open_deadline && (
                <div>
                  <span className="text-xs font-medium text-gray-500">Open until:</span>{" "}
                  {new Date(draft.open_deadline).toLocaleDateString()}
                </div>
              )}
              {draft.judging_deadline && (
                <div>
                  <span className="text-xs font-medium text-gray-500">Judging by:</span>{" "}
                  {new Date(draft.judging_deadline).toLocaleDateString()}
                </div>
              )}
            </div>
          )}

          {draft.rejection_reason && (
            <div className="bg-red-50 p-3 rounded-lg">
              <p className="text-sm text-red-700">
                <strong>Rejection reason:</strong> {draft.rejection_reason}
              </p>
            </div>
          )}

          <p className="text-xs text-gray-400">
            Created {new Date(draft.created_at).toLocaleString()}
          </p>
        </div>
      )}

      {isPending && (
        <div className="mt-4 flex items-center gap-2">
          {rejectMode ? (
            <div className="flex-1 flex gap-2">
              <Input
                placeholder="Reason for rejection (optional)"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="flex-1"
              />
              <Button
                size="sm"
                variant="destructive"
                disabled={isLoading}
                onClick={() => {
                  onReject(draft.id, rejectReason);
                  setRejectMode(false);
                  setRejectReason("");
                }}
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirm"}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => { setRejectMode(false); setRejectReason(""); }}
              >
                Cancel
              </Button>
            </div>
          ) : (
            <>
              <Button
                size="sm"
                className="bg-[#0EA885] hover:bg-[#0c9474] text-white"
                disabled={isLoading}
                onClick={() => onApprove(draft.id)}
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-1" />
                ) : (
                  <Check className="w-4 h-4 mr-1" />
                )}
                Approve & Fund
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="text-red-600 border-red-200 hover:bg-red-50"
                disabled={isLoading}
                onClick={() => setRejectMode(true)}
              >
                <X className="w-4 h-4 mr-1" />
                Reject
              </Button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default function AgentDraftsPage() {
  const router = useRouter();
  const { profile, authenticated, loading: authLoading } = useAuth();
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const { drafts, loading, error, approveDraft, rejectDraft } = useDrafts(statusFilter);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#0EA885]" />
      </div>
    );
  }

  if (!authenticated || !profile) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-4">
        <AlertCircle className="w-12 h-12 text-gray-400" />
        <h2 className="text-xl font-semibold text-gray-900">Sign in required</h2>
        <p className="text-gray-500 text-center">Sign in to view and manage agent bounty drafts.</p>
      </div>
    );
  }

  const handleApprove = async (draftId: string) => {
    try {
      setActionLoading(draftId);
      await approveDraft(draftId);
    } catch (err: any) {
      alert(err.response?.data?.error || "Failed to approve draft");
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (draftId: string, reason: string) => {
    try {
      setActionLoading(draftId);
      await rejectDraft(draftId, reason);
    } catch (err: any) {
      alert(err.response?.data?.error || "Failed to reject draft");
    } finally {
      setActionLoading(null);
    }
  };

  const filterTabs = [
    { label: "All", value: undefined },
    { label: "Pending", value: "pending" },
    { label: "Approved", value: "approved" },
    { label: "Rejected", value: "rejected" },
  ];

  return (
    <main className="max-w-3xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <FileText className="w-6 h-6 text-[#0EA885]" />
          Agent Drafts
        </h1>
        <p className="text-gray-500 mt-1">
          Review bounty drafts submitted by your agents. Approve to fund on-chain.
        </p>
      </div>

      <div className="flex gap-2 mb-6">
        {filterTabs.map((tab) => (
          <button
            key={tab.label}
            onClick={() => setStatusFilter(tab.value)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              statusFilter === tab.value
                ? "bg-[#0EA885] text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
          <p className="text-red-600">{error}</p>
        </div>
      ) : drafts.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No drafts found</p>
          <p className="text-sm text-gray-400 mt-1">
            When your agents submit bounty drafts, they&apos;ll appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {drafts.map((draft) => (
            <DraftCard
              key={draft.id}
              draft={draft}
              onApprove={handleApprove}
              onReject={handleReject}
              actionLoading={actionLoading}
            />
          ))}
        </div>
      )}
    </main>
  );
}
