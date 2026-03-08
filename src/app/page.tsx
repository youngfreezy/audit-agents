"use client";

import { useState } from "react";
import { AuditForm } from "@/components/AuditForm";
import { ArchReport } from "@/components/ArchReport";
import { UXReport } from "@/components/UXReport";
import { GrowthReport } from "@/components/GrowthReport";
import type {
  ArchitecturalAuditReport,
  UXRevenueReport,
  GrowthMonetizationReport,
} from "@/lib/types";

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [archReport, setArchReport] =
    useState<ArchitecturalAuditReport | null>(null);
  const [uxReport, setUXReport] = useState<UXRevenueReport | null>(null);
  const [growthReport, setGrowthReport] =
    useState<GrowthMonetizationReport | null>(null);
  const [activeTab, setActiveTab] = useState<"arch" | "ux" | "growth">(
    "arch"
  );
  const [formKey, setFormKey] = useState(0);

  const handleClear = () => {
    setArchReport(null);
    setUXReport(null);
    setGrowthReport(null);
    setError(null);
    setFormKey((k) => k + 1);
  };

  const handleSubmit = async (data: {
    name: string;
    urls: string[];
    description: string;
    auditType: "architecture" | "ux-revenue" | "growth" | "all";
  }) => {
    setLoading(true);
    setError(null);
    setArchReport(null);
    setUXReport(null);
    setGrowthReport(null);

    const payload = {
      name: data.name,
      urls: data.urls,
      description: data.description || undefined,
    };

    try {
      const requests: { key: string; promise: Promise<Response> }[] = [];

      if (data.auditType === "architecture" || data.auditType === "all") {
        requests.push({
          key: "arch",
          promise: fetch("/api/audit/architecture", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          }),
        });
      }

      if (data.auditType === "ux-revenue" || data.auditType === "all") {
        requests.push({
          key: "ux",
          promise: fetch("/api/audit/ux-revenue", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          }),
        });
      }

      if (data.auditType === "growth" || data.auditType === "all") {
        requests.push({
          key: "growth",
          promise: fetch("/api/audit/growth", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          }),
        });
      }

      const responses = await Promise.all(
        requests.map((r) => r.promise)
      );

      let firstTab: "arch" | "ux" | "growth" | null = null;

      for (let i = 0; i < requests.length; i++) {
        const res = await responses[i].json();
        if (res.error) throw new Error(res.error);

        if (requests[i].key === "arch") {
          setArchReport(res.report);
          if (!firstTab) firstTab = "arch";
        } else if (requests[i].key === "ux") {
          setUXReport(res.report);
          if (!firstTab) firstTab = "ux";
        } else if (requests[i].key === "growth") {
          setGrowthReport(res.report);
          if (!firstTab) firstTab = "growth";
        }
      }

      if (firstTab) setActiveTab(firstTab);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const hasResults = archReport || uxReport || growthReport;
  const tabCount =
    (archReport ? 1 : 0) + (uxReport ? 1 : 0) + (growthReport ? 1 : 0);

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-5xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-3">Prism</h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            AI-powered architecture, revenue, and growth analysis for any
            product. Paste any URL and get a comprehensive analysis in 60 seconds.
          </p>
        </div>

        {/* Form */}
        <div className="max-w-2xl mx-auto mb-12">
          <AuditForm key={formKey} onSubmit={handleSubmit} loading={loading} />
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
            {/* Clear Button */}
            <div className="flex justify-center mb-6">
              <button
                onClick={handleClear}
                className="px-5 py-2 rounded-lg text-sm font-medium bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700 border border-gray-700 transition-colors"
              >
                Clear & Start Over
              </button>
            </div>

            {/* Tabs */}
            {tabCount > 1 && (
              <div className="flex justify-center gap-2 mb-8">
                {archReport && (
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
                )}
                {uxReport && (
                  <button
                    onClick={() => setActiveTab("ux")}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      activeTab === "ux"
                        ? "bg-purple-600 text-white"
                        : "bg-gray-800 text-gray-400 hover:text-white"
                    }`}
                  >
                    UX Revenue (
                    {uxReport.will_get_paid_users ? "YES" : "NO"} -{" "}
                    {uxReport.overall_ux_score.toFixed(0)}/100)
                  </button>
                )}
                {growthReport && (
                  <button
                    onClick={() => setActiveTab("growth")}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      activeTab === "growth"
                        ? "bg-emerald-600 text-white"
                        : "bg-gray-800 text-gray-400 hover:text-white"
                    }`}
                  >
                    Growth ({growthReport.overall_score.toFixed(0)}/100)
                  </button>
                )}
              </div>
            )}

            {activeTab === "arch" && archReport && (
              <ArchReport report={archReport} />
            )}
            {activeTab === "ux" && uxReport && (
              <UXReport report={uxReport} />
            )}
            {activeTab === "growth" && growthReport && (
              <GrowthReport report={growthReport} />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
