"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAccount, useWriteContract } from "wagmi";
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
  Pencil,
  Plus,
  Trash2,
  Save,
  ImageIcon,
} from "lucide-react";
import { formatAddress } from "../../../utils/web3";
import {
  CONTRACT_ADDRESSES,
  QUINTY_ABI,
  BASE_SEPOLIA_CHAIN_ID,
  ETH_ADDRESS,
  parseTokenAmount,
} from "../../../utils/contracts";
import { uploadMetadataToIpfs, BountyMetadata, CUSTOM_PINATA_GATEWAY } from "../../../utils/ipfs";
import { Markdown } from "../../../components/ui/markdown";
import { ImageUpload } from "../../../components/ui/image-upload";

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  approved: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
  cancelled: "bg-gray-100 text-gray-600",
  expired: "bg-gray-100 text-gray-500",
};

const BOUNTY_TYPES = ["development", "design", "marketing", "research", "other"];

function DraftCard({
  draft,
  onApprove,
  onReject,
  onUpdate,
  actionLoading,
}: {
  draft: Draft;
  onApprove: (id: string) => void;
  onReject: (id: string, reason: string) => void;
  onUpdate: (id: string, updates: Record<string, any>) => Promise<void>;
  actionLoading: string | null;
}) {
  const [expanded, setExpanded] = useState(false);
  const [rejectMode, setRejectMode] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);

  // Edit form state
  const [editTitle, setEditTitle] = useState(draft.title);
  const [editDescription, setEditDescription] = useState(draft.description);
  const [editRequirements, setEditRequirements] = useState(draft.requirements || "");
  const [editBountyType, setEditBountyType] = useState(draft.bounty_type || "development");
  const [editDeliverables, setEditDeliverables] = useState<string[]>(draft.deliverables || []);
  const [editSkills, setEditSkills] = useState<string[]>(draft.skills || []);
  const [editPrizeTiers, setEditPrizeTiers] = useState(draft.prize_tiers || []);
  const [editSlashPercent, setEditSlashPercent] = useState(draft.slash_percent || 2500);
  const [editCoverImageCid, setEditCoverImageCid] = useState(draft.cover_image_cid || "");
  const [newDeliverable, setNewDeliverable] = useState("");
  const [newSkill, setNewSkill] = useState("");

  const isLoading = actionLoading === draft.id;
  const isPending = draft.status === "pending";
  const expiresAt = new Date(draft.expires_at);
  const daysLeft = Math.max(0, Math.ceil((expiresAt.getTime() - Date.now()) / 86400000));

  const hasCoverImage = editMode ? !!editCoverImageCid : !!draft.cover_image_cid;

  const startEdit = () => {
    setEditTitle(draft.title);
    setEditDescription(draft.description);
    setEditRequirements(draft.requirements || "");
    setEditBountyType(draft.bounty_type || "development");
    setEditDeliverables([...(draft.deliverables || [])]);
    setEditSkills([...(draft.skills || [])]);
    setEditPrizeTiers([...(draft.prize_tiers || [])]);
    setEditSlashPercent(draft.slash_percent || 2500);
    setEditCoverImageCid(draft.cover_image_cid || "");
    setEditMode(true);
    setExpanded(true);
  };

  const cancelEdit = () => {
    setEditMode(false);
  };

  const saveEdit = async () => {
    setSaving(true);
    try {
      await onUpdate(draft.id, {
        title: editTitle,
        description: editDescription,
        requirements: editRequirements || undefined,
        bountyType: editBountyType,
        deliverables: editDeliverables,
        skills: editSkills,
        prizeTiers: editPrizeTiers,
        slashPercent: editSlashPercent,
        coverImageCid: editCoverImageCid || undefined,
      });
      setEditMode(false);
    } catch (err: any) {
      alert(err.response?.data?.error || "Failed to save changes");
    } finally {
      setSaving(false);
    }
  };

  const coverImageUrl = draft.cover_image_cid
    ? `${CUSTOM_PINATA_GATEWAY}${draft.cover_image_cid}`
    : null;

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
          {editMode ? (
            <Input
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="text-lg font-semibold"
            />
          ) : (
            <h3 className="font-semibold text-gray-900 text-lg">{draft.title}</h3>
          )}
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
        <div className="mt-4 space-y-4">
          {/* Cover Image */}
          <div>
            <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
              Cover Image {isPending && <span className="text-red-500">*</span>}
            </h4>
            {editMode || (isPending && !draft.cover_image_cid) ? (
              <ImageUpload
                value={editCoverImageCid || draft.cover_image_cid || undefined}
                onUpload={async (cid) => {
                  if (editMode) {
                    setEditCoverImageCid(cid);
                  } else {
                    // Direct save when not in full edit mode
                    try {
                      await onUpdate(draft.id, { coverImageCid: cid });
                    } catch {}
                  }
                }}
                className="rounded-lg max-w-sm h-40"
              />
            ) : coverImageUrl ? (
              <img
                src={coverImageUrl}
                alt="Cover"
                className="w-full max-w-sm rounded-lg object-cover h-40"
              />
            ) : null}
          </div>

          {/* Bounty Type & Slash */}
          {editMode ? (
            <div className="flex items-center gap-4">
              <div>
                <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Type</h4>
                <select
                  value={editBountyType}
                  onChange={(e) => setEditBountyType(e.target.value)}
                  className="text-sm border border-gray-200 rounded-lg px-3 py-1.5"
                >
                  {BOUNTY_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div>
                <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Slash %</h4>
                <Input
                  type="number"
                  min={25}
                  max={50}
                  value={editSlashPercent / 100}
                  onChange={(e) => setEditSlashPercent(Number(e.target.value) * 100)}
                  className="w-20 text-sm"
                />
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              {draft.bounty_type && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-medium capitalize">
                  {draft.bounty_type}
                </span>
              )}
              {draft.slash_percent && draft.slash_percent !== 2500 && (
                <span className="text-xs text-gray-500">
                  Slash: {draft.slash_percent / 100}%
                </span>
              )}
            </div>
          )}

          {/* Description */}
          <div>
            <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide">Description</h4>
            {editMode ? (
              <textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                rows={10}
                className="mt-1 w-full text-sm border border-gray-200 rounded-lg px-3 py-2 font-mono"
                placeholder="Markdown supported..."
              />
            ) : (
              <Markdown className="mt-1">{draft.description}</Markdown>
            )}
          </div>

          {/* Requirements */}
          <div>
            <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide">Requirements</h4>
            {editMode ? (
              <textarea
                value={editRequirements}
                onChange={(e) => setEditRequirements(e.target.value)}
                rows={3}
                className="mt-1 w-full text-sm border border-gray-200 rounded-lg px-3 py-2 font-mono"
                placeholder="Markdown supported..."
              />
            ) : draft.requirements ? (
              <Markdown className="mt-1">{draft.requirements}</Markdown>
            ) : (
              <p className="mt-1 text-sm text-gray-400 italic">No requirements specified</p>
            )}
          </div>

          {/* Deliverables */}
          <div>
            <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide">Deliverables</h4>
            {editMode ? (
              <div className="mt-1 space-y-1.5">
                {editDeliverables.map((d, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Input
                      value={d}
                      onChange={(e) => {
                        const updated = [...editDeliverables];
                        updated[i] = e.target.value;
                        setEditDeliverables(updated);
                      }}
                      className="flex-1 text-sm"
                    />
                    <button
                      onClick={() => setEditDeliverables(editDeliverables.filter((_, idx) => idx !== i))}
                      className="text-red-400 hover:text-red-600"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
                <div className="flex items-center gap-2">
                  <Input
                    value={newDeliverable}
                    onChange={(e) => setNewDeliverable(e.target.value)}
                    placeholder="Add deliverable..."
                    className="flex-1 text-sm"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && newDeliverable.trim()) {
                        setEditDeliverables([...editDeliverables, newDeliverable.trim()]);
                        setNewDeliverable("");
                      }
                    }}
                  />
                  <button
                    onClick={() => {
                      if (newDeliverable.trim()) {
                        setEditDeliverables([...editDeliverables, newDeliverable.trim()]);
                        setNewDeliverable("");
                      }
                    }}
                    className="text-[#0EA885] hover:text-[#0c9474]"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : draft.deliverables && draft.deliverables.length > 0 ? (
              <ul className="mt-1 space-y-1">
                {draft.deliverables.map((d, i) => (
                  <li key={i} className="text-sm text-gray-700 flex items-center gap-1.5">
                    <span className="w-1 h-1 rounded-full bg-gray-400" />
                    {d}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-1 text-sm text-gray-400 italic">No deliverables specified</p>
            )}
          </div>

          {/* Skills */}
          <div>
            <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide">Required Skills</h4>
            {editMode ? (
              <div className="mt-1">
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {editSkills.map((s, i) => (
                    <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 flex items-center gap-1">
                      {s}
                      <button
                        onClick={() => setEditSkills(editSkills.filter((_, idx) => idx !== i))}
                        className="text-gray-400 hover:text-red-500"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    placeholder="Add skill..."
                    className="flex-1 text-sm"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && newSkill.trim()) {
                        setEditSkills([...editSkills, newSkill.trim()]);
                        setNewSkill("");
                      }
                    }}
                  />
                  <button
                    onClick={() => {
                      if (newSkill.trim()) {
                        setEditSkills([...editSkills, newSkill.trim()]);
                        setNewSkill("");
                      }
                    }}
                    className="text-[#0EA885] hover:text-[#0c9474]"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : draft.skills && draft.skills.length > 0 ? (
              <div className="mt-1 flex flex-wrap gap-1.5">
                {draft.skills.map((s, i) => (
                  <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                    {s}
                  </span>
                ))}
              </div>
            ) : null}
          </div>

          {/* Prize Tiers */}
          <div>
            <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide">Prize Tiers</h4>
            {editMode ? (
              <div className="mt-1 space-y-2">
                {editPrizeTiers.map((tier, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-500 w-8">#{tier.rank}</span>
                    <Input
                      type="text"
                      value={tier.amount}
                      onChange={(e) => {
                        const updated = [...editPrizeTiers];
                        updated[i] = { ...updated[i], amount: e.target.value };
                        setEditPrizeTiers(updated);
                      }}
                      className="w-32 text-sm"
                    />
                    <span className="text-sm text-gray-500">{tier.token}</span>
                    <button
                      onClick={() => setEditPrizeTiers(editPrizeTiers.filter((_, idx) => idx !== i))}
                      className="text-red-400 hover:text-red-600"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => {
                    const nextRank = editPrizeTiers.length + 1;
                    setEditPrizeTiers([...editPrizeTiers, { rank: nextRank, amount: "0.001", token: "ETH" }]);
                  }}
                  className="text-xs text-[#0EA885] hover:text-[#0c9474] flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" /> Add prize tier
                </button>
              </div>
            ) : (
              <div className="mt-1 space-y-1">
                {draft.prize_tiers.map((tier, i) => (
                  <div key={i} className="text-sm text-gray-700 flex items-center gap-2">
                    <span className="font-medium">#{tier.rank}</span>
                    <span>{tier.amount} {tier.token}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Deadlines */}
          {(draft.open_deadline || draft.judging_deadline) && !editMode && (
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

      {/* Action buttons */}
      {isPending && (
        <div className="mt-4">
          {editMode ? (
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                className="bg-[#0EA885] hover:bg-[#0c9474] text-white"
                disabled={saving}
                onClick={saveEdit}
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Save className="w-4 h-4 mr-1" />}
                Save Changes
              </Button>
              <Button size="sm" variant="outline" onClick={cancelEdit} disabled={saving}>
                Cancel
              </Button>
            </div>
          ) : rejectMode ? (
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
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                className="bg-[#0EA885] hover:bg-[#0c9474] text-white"
                disabled={isLoading || !hasCoverImage}
                onClick={() => onApprove(draft.id)}
                title={!hasCoverImage ? "Upload a cover image first" : undefined}
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
                onClick={startEdit}
              >
                <Pencil className="w-4 h-4 mr-1" />
                Edit
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
              {!hasCoverImage && (
                <span className="text-xs text-orange-500 flex items-center gap-1">
                  <ImageIcon className="w-3 h-3" />
                  Cover image required
                </span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function AgentDraftsPage() {
  const router = useRouter();
  const { address } = useAccount();
  const { profile, authenticated, loading: authLoading } = useAuth();
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const { drafts, loading, error, approveDraft, rejectDraft, updateDraft, refetch } = useDrafts(statusFilter);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [txStatus, setTxStatus] = useState<{ draftId: string; hash?: string; step: string } | null>(null);
  const { writeContractAsync } = useWriteContract();

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
    const draft = drafts.find((d) => d.id === draftId);
    if (!draft || !address) return;

    try {
      setActionLoading(draftId);

      // Step 1: Upload IPFS metadata first
      setTxStatus({ draftId, step: "Uploading metadata to IPFS..." });

      const now = Math.floor(Date.now() / 1000);
      const openDeadlineTs = draft.open_deadline
        ? Math.floor(new Date(draft.open_deadline).getTime() / 1000)
        : now + 7 * 86400;
      const judgingDeadlineTs = draft.judging_deadline
        ? Math.floor(new Date(draft.judging_deadline).getTime() / 1000)
        : now + 14 * 86400;

      const metadata: BountyMetadata = {
        title: draft.title,
        description: draft.description,
        requirements: draft.requirements ? [draft.requirements] : [],
        deliverables: draft.deliverables || [],
        skills: draft.skills || [],
        images: draft.cover_image_cid ? [draft.cover_image_cid] : [],
        deadline: judgingDeadlineTs,
        bountyType: (draft.bounty_type as BountyMetadata["bountyType"]) || "development",
        agentName: draft.agents?.name || undefined,
      };

      const metadataCid = await uploadMetadataToIpfs(metadata);

      // Step 2: Create bounty on-chain
      setTxStatus({ draftId, step: "Creating bounty on-chain..." });

      let totalAmount = 0n;
      const prizes: bigint[] = [];

      for (const tier of draft.prize_tiers) {
        const amount = parseTokenAmount(tier.amount, tier.token === "ETH" ? ETH_ADDRESS : tier.token);
        prizes.push(amount);
        totalAmount += amount;
      }

      const hash = await writeContractAsync({
        address: CONTRACT_ADDRESSES[BASE_SEPOLIA_CHAIN_ID].Quinty as `0x${string}`,
        abi: QUINTY_ABI,
        functionName: "createBounty",
        args: [
          draft.title,
          `${draft.description}\n\nMetadata: ipfs://${metadataCid}`,
          BigInt(openDeadlineTs),
          BigInt(judgingDeadlineTs),
          BigInt(draft.slash_percent || 2500),
          prizes,
          ETH_ADDRESS as `0x${string}`,
        ],
        value: totalAmount,
      });

      setTxStatus({ draftId, hash, step: "Waiting for confirmation..." });

      const { waitForTransactionReceipt } = await import("wagmi/actions");
      const { wagmiConfig } = await import("../../../utils/web3");
      await waitForTransactionReceipt(wagmiConfig, { hash });

      // Step 3: Mark as approved in backend ONLY after on-chain success
      setTxStatus({ draftId, step: "Finalizing..." });
      await approveDraft(draftId);

      setTxStatus(null);
      await refetch();
      alert("Bounty created on-chain successfully!");
    } catch (err: any) {
      console.error("Approve & fund error:", err);
      alert(err.response?.data?.error || err.shortMessage || err.message || "Failed to approve and fund");
    } finally {
      setActionLoading(null);
      setTxStatus(null);
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

  const handleUpdate = async (draftId: string, updates: Record<string, any>) => {
    await updateDraft(draftId, updates);
  };

  const filterTabs = [
    { label: "All", value: undefined },
    { label: "Pending", value: "pending" },
    { label: "Approved", value: "approved" },
    { label: "Rejected", value: "rejected" },
  ];

  return (
    <main className="min-h-screen bg-white pt-20 pb-24">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
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

        {/* Tx status banner */}
        {txStatus && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
            <span className="text-sm text-blue-700">{txStatus.step}</span>
            {txStatus.hash && (
              <a
                href={`https://sepolia.basescan.org/tx/${txStatus.hash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-500 underline ml-auto"
              >
                View tx
              </a>
            )}
          </div>
        )}

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
                onUpdate={handleUpdate}
                actionLoading={actionLoading}
              />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
