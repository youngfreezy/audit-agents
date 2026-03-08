"use client";

import { useState } from "react";

interface AuditFormProps {
  onSubmit: (data: {
    name: string;
    urls: string[];
    description: string;
    auditType: "architecture" | "ux-revenue" | "growth" | "all";
  }) => void;
  loading: boolean;
}

export function AuditForm({ onSubmit, loading }: AuditFormProps) {
  const [name, setName] = useState("");
  const [urlInput, setUrlInput] = useState("");
  const [description, setDescription] = useState("");
  const [auditType, setAuditType] = useState<"architecture" | "ux-revenue" | "growth" | "all">("all");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const urls = urlInput
      .split("\n")
      .map((u) => u.trim())
      .filter((u) => u.startsWith("http"));
    if (!name || !urls.length) return;
    onSubmit({ name, urls, description, auditType });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Product Name
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., Notion, Linear, My SaaS App"
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          URLs to Analyze
          <span className="text-gray-500 font-normal ml-2">(one per line)</span>
        </label>
        <textarea
          value={urlInput}
          onChange={(e) => setUrlInput(e.target.value)}
          placeholder={"https://example.com\nhttps://example.com/pricing"}
          rows={3}
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Description
          <span className="text-gray-500 font-normal ml-2">(optional context)</span>
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Brief description of what the product does, target market, etc."
          rows={2}
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-3">
          Audit Type
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { value: "all" as const, label: "Full Audit", desc: "All 3 agents" },
            { value: "architecture" as const, label: "Architecture", desc: "Scalability, payments, design" },
            { value: "ux-revenue" as const, label: "UX Revenue", desc: "Will it get paid users?" },
            { value: "growth" as const, label: "Growth", desc: "Monetization & experiments" },
          ].map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setAuditType(opt.value)}
              className={
                "p-3 rounded-lg border text-left transition-all " +
                (auditType === opt.value
                  ? "bg-blue-600/20 border-blue-500 text-white"
                  : "bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-500")
              }
            >
              <div className="font-medium text-sm">{opt.label}</div>
              <div className="text-xs mt-1 opacity-70">{opt.desc}</div>
            </button>
          ))}
        </div>
      </div>

      <button
        type="submit"
        disabled={loading || !name || !urlInput.trim()}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-500 text-white font-medium py-3 px-6 rounded-lg transition-colors"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Analyzing... (this takes 30-60s)
          </span>
        ) : (
          "Run Audit"
        )}
      </button>
    </form>
  );
}
