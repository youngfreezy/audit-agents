"use client";

import { useState } from "react";
import { AuditForm } from "@/components/AuditForm";
import { ArchReport } from "@/components/ArchReport";
import { UXReport } from "@/components/UXReport";
import type { ArchitecturalAuditReport, UXRevenueReport } from "@/lib/types";

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [archReport, setArchReport] = useState<ArchitecturalAuditReport | null>(null);
  const [uxReport, setUXReport] = useState<UXRevenueReport | null>(null);
  const [activeTab, setActiveTab] = useState<"arch" | "ux">("arch");

  const handleSubmit = async (data: {
    name: string;
    urls: string[];
    description: string;
    auditType: "architecture" | "ux-revenue" | "both";
  }) => {
    setLoading(true);
    setError(null);
    setArchReport(null);
    setUXReport(null);

    const payload = {
      name: data.name,
      urls: data.urls,
      description: data.description || undefined,
    };

    try {
      const requests: Promise<Response>[] = [];

      if (data.auditType === "architecture" || data.auditType === "both") {
        requests.push(
          fetch("/api/audit/architecture", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          })
        );
      }

      if (data.auditType === "ux-revenue" || data.auditType === "both") {
        requests.push(
          fetch("/api/audit/ux-revenue", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          })
        );
      }

      const responses = await Promise.all(requests);
      let idx = 0;

      if (data.auditType === "architecture" || data.auditType === "both") {
        const res = await responses[idx++].json();
        if (res.error) throw new Error(res.error);
        setArchReport(res.report);
        setActiveTab("arch");
      }

      if (data.auditType === "ux-revenue" || data.auditType === "both") {
        const res = await responses[idx++].json();
        if (res.error) throw new Error(res.error);
        setUXReport(res.report);
        if (data.auditType === "ux-revenue") setActiveTab("ux");
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const hasResults = archReport || uxReport;

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-5xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-3">
            Audit Agents
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            AI-powered architectural review and revenue viability analysis.
            Paste any URL and get a comprehensive audit in 60 seconds.
          </p>
        </div>

        {/* Form */}
        <div className="max-w-2xl mx-auto mb-12">
          <AuditForm onSubmit={handleSubmit} loading={loading} />
        </div>

        {/* Error */}
        {error && (
          <div className="max-w-2xl mx-auto mb-8 bg-red-950/50 border border-red-700 rounded-lg p-4 text-red-300">
            {error}
          </div>
        )}

        {/* Results */}
        {hasResults && (
          <div>
            {/* Tabs */}
            {archReport && uxReport && (
              <div className="flex gap-2 mb-8">
                <button
                  onClick={() => setActiveTab("arch")}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === "arch"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-800 text-gray-400 hover:text-white"
                  }`}
                >
                  Architecture ({archReport.overall_score.toFixed(0)}/100)
                </button>
                <button
                  onClick={() => setActiveTab("ux")}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === "ux"
                      ? "bg-purple-600 text-white"
                      : "bg-gray-800 text-gray-400 hover:text-white"
                  }`}
                >
                  UX Revenue ({uxReport.will_get_paid_users ? "YES" : "NO"} - {uxReport.overall_ux_score.toFixed(0)}/100)
                </button>
              </div>
            )}

            {activeTab === "arch" && archReport && <ArchReport report={archReport} />}
            {activeTab === "ux" && uxReport && <UXReport report={uxReport} />}
          </div>
        )}
      </div>
    </div>
  );
}
