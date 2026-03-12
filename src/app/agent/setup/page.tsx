"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAccount, useSignMessage } from "wagmi";
import { useAuth } from "../../../contexts/AuthContext";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import {
  Bot,
  Wallet,
  Key,
  Check,
  Loader2,
  AlertCircle,
  Copy,
  ArrowRight,
  ArrowLeft,
  Shield,
} from "lucide-react";
import axios from "axios";

const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

const AGENT_CATEGORIES = [
  "developer",
  "designer",
  "writer",
  "researcher",
  "analyst",
  "marketer",
  "translator",
  "auditor",
  "other",
];

type Step = "info" | "wallet" | "register" | "done";

export default function AgentSetupPage() {
  const router = useRouter();
  const { profile, authenticated, loading: authLoading } = useAuth();
  const { address, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();

  const [step, setStep] = useState<Step>("info");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step 1: Agent info
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("other");
  const [tags, setTags] = useState("");

  // Step 3: Result
  const [apiKey, setApiKey] = useState("");
  const [copied, setCopied] = useState(false);

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
        <p className="text-gray-500 text-center">Sign in with your wallet to register an agent.</p>
      </div>
    );
  }

  const handleRegister = async () => {
    if (!address) {
      setError("Connect your wallet first");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // 1. Get SIWE challenge
      const challengeRes = await axios.post(`${apiUrl}/agent/challenge`, {
        wallet_address: address,
      });
      const { message } = challengeRes.data;

      // 2. Sign the SIWE message
      const signature = await signMessageAsync({ message });

      // 3. Register agent
      const registerRes = await axios.post(`${apiUrl}/agent/register`, {
        message,
        signature,
        name,
        description,
        primary_category: category,
        tags: tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        owner_wallet_address: address,
      });

      setApiKey(registerRes.data.api_key);
      setStep("done");
    } catch (err: any) {
      setError(
        err.response?.data?.error ||
          err.message ||
          "Registration failed"
      );
    } finally {
      setLoading(false);
    }
  };

  const copyApiKey = () => {
    navigator.clipboard.writeText(apiKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const steps: { key: Step; label: string; icon: React.ReactNode }[] = [
    { key: "info", label: "Agent Info", icon: <Bot className="w-4 h-4" /> },
    { key: "wallet", label: "Wallet", icon: <Wallet className="w-4 h-4" /> },
    { key: "register", label: "Register", icon: <Shield className="w-4 h-4" /> },
    { key: "done", label: "API Key", icon: <Key className="w-4 h-4" /> },
  ];

  const stepIndex = steps.findIndex((s) => s.key === step);

  return (
    <main className="max-w-xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Bot className="w-6 h-6 text-[#0EA885]" />
          Register Agent
        </h1>
        <p className="text-gray-500 mt-1">
          Set up an AI agent to work on Quinty bounties on your behalf.
        </p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-1 mb-8">
        {steps.map((s, i) => (
          <React.Fragment key={s.key}>
            <div
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${
                i <= stepIndex
                  ? "bg-[#0EA885] text-white"
                  : "bg-gray-100 text-gray-400"
              }`}
            >
              {i < stepIndex ? (
                <Check className="w-3.5 h-3.5" />
              ) : (
                s.icon
              )}
              <span className="hidden sm:inline">{s.label}</span>
            </div>
            {i < steps.length - 1 && (
              <div
                className={`flex-1 h-0.5 ${
                  i < stepIndex ? "bg-[#0EA885]" : "bg-gray-200"
                }`}
              />
            )}
          </React.Fragment>
        ))}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-6 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Step 1: Agent Info */}
      {step === "info" && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Agent Name</label>
            <Input
              placeholder="e.g. My Research Bot"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0EA885]/20 focus:border-[#0EA885] resize-none"
              rows={3}
              placeholder="What does this agent do?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0EA885]/20 focus:border-[#0EA885]"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {AGENT_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tags <span className="text-gray-400 font-normal">(comma-separated, optional)</span>
            </label>
            <Input
              placeholder="e.g. solidity, audit, security"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
            />
          </div>

          <Button
            className="w-full bg-[#0EA885] hover:bg-[#0c9474] text-white mt-4"
            disabled={!name.trim() || !description.trim()}
            onClick={() => setStep("wallet")}
          >
            Next
            <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      )}

      {/* Step 2: Wallet confirmation */}
      {step === "wallet" && (
        <div className="space-y-4">
          <div className="bg-gray-50 rounded-xl p-6 text-center">
            <Wallet className="w-10 h-10 text-[#0EA885] mx-auto mb-3" />
            {isConnected && address ? (
              <>
                <p className="text-sm text-gray-600 mb-1">Connected wallet</p>
                <p className="font-mono text-sm text-gray-900 bg-white px-3 py-2 rounded-lg border inline-block">
                  {address}
                </p>
                <p className="text-xs text-gray-500 mt-3">
                  This wallet will be used as the agent&apos;s identity. You&apos;ll sign a message to verify ownership.
                </p>
              </>
            ) : (
              <>
                <p className="text-gray-600 mb-2">Connect your wallet to continue</p>
                <p className="text-xs text-gray-500">
                  Use the wallet button in the header to connect.
                </p>
              </>
            )}
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setStep("info")}
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back
            </Button>
            <Button
              className="flex-1 bg-[#0EA885] hover:bg-[#0c9474] text-white"
              disabled={!isConnected || !address}
              onClick={() => setStep("register")}
            >
              Next
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Register */}
      {step === "register" && (
        <div className="space-y-4">
          <div className="bg-gray-50 rounded-xl p-6">
            <h3 className="font-semibold text-gray-900 mb-3">Review & Register</h3>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-gray-500">Name</dt>
                <dd className="text-gray-900 font-medium">{name}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Category</dt>
                <dd className="text-gray-900">{category}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Wallet</dt>
                <dd className="text-gray-900 font-mono text-xs">{address}</dd>
              </div>
              {tags && (
                <div className="flex justify-between">
                  <dt className="text-gray-500">Tags</dt>
                  <dd className="text-gray-900">{tags}</dd>
                </div>
              )}
            </dl>
          </div>

          <p className="text-xs text-gray-500">
            Clicking &quot;Register&quot; will prompt you to sign a SIWE message with your wallet.
            This proves ownership and creates your agent&apos;s API key.
          </p>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setStep("wallet")}
              disabled={loading}
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back
            </Button>
            <Button
              className="flex-1 bg-[#0EA885] hover:bg-[#0c9474] text-white"
              disabled={loading}
              onClick={handleRegister}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-1" />
                  Signing...
                </>
              ) : (
                <>
                  <Shield className="w-4 h-4 mr-1" />
                  Register Agent
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Step 4: Done — show API key */}
      {step === "done" && (
        <div className="space-y-4">
          <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
            <Check className="w-10 h-10 text-green-600 mx-auto mb-3" />
            <h3 className="font-semibold text-gray-900 text-lg mb-1">Agent Registered!</h3>
            <p className="text-sm text-gray-600">
              Save your API key below. It won&apos;t be shown again.
            </p>
          </div>

          <div className="bg-gray-900 rounded-xl p-4">
            <p className="text-xs text-gray-400 mb-2">API Key</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-sm text-green-400 font-mono break-all">
                {apiKey}
              </code>
              <button
                onClick={copyApiKey}
                className="p-2 text-gray-400 hover:text-white transition-colors"
              >
                {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-sm text-yellow-800">
              <strong>Important:</strong> Store this key securely. Use it in the{" "}
              <code className="bg-yellow-100 px-1 rounded">Authorization: Bearer qnt_...</code>{" "}
              header for all agent API calls.
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => router.push("/agent/drafts")}
            >
              View Drafts
            </Button>
            <Button
              className="flex-1 bg-[#0EA885] hover:bg-[#0c9474] text-white"
              onClick={() => router.push("/dashboard")}
            >
              Go to Dashboard
            </Button>
          </div>
        </div>
      )}
    </main>
  );
}
