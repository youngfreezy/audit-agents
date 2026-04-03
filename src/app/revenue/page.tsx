"use client";

import { useState } from "react";
import Link from "next/link";
import { RevenueReport } from "@/components/RevenueReport";
import type { SubscriptionHealthReport } from "@/lib/types";

interface OverviewMetric {
  id: string;
  name: string;
  unit: string;
  value: number;
}

export default function RevenuePage() {
  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<SubscriptionHealthReport | null>(null);
  const [sparklines, setSparklines] = useState<{
    revenue: number[];
    mrr: number[];
    churn: number[];
    trials: number[];
  } | null>(null);
  const [overview, setOverview] = useState<OverviewMetric[]>([]);
  const [projectName, setProjectName] = useState("");

  const handleSubmit = async (useSample: boolean) => {
    if (!useSample && !apiKey.trim()) {
      setError("Please enter your RevenueCat API key");
      return;
    }

    setLoading(true);
    setError(null);
    setReport(null);

    try {
      const res = await fetch("/api/audit/revenue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          useSample ? { useSampleData: true } : { apiKey: apiKey.trim() }
        ),
      });

      const data = await res.json();
      if (data.error) throw new Error(data.error);

      setReport(data.report);
      setSparklines(data.sparklines);
      setOverview(data.overview);
      setProjectName(data.projectName);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setReport(null);
    setSparklines(null);
    setOverview([]);
    setProjectName("");
    setError(null);
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-5xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <Link
            href="/"
            className="text-sm text-gray-500 hover:text-gray-300 transition-colors"
          >
            &larr; Back to Prism
          </Link>
          <h1 className="text-4xl font-bold mt-4 mb-3">
            <span className="text-teal-400">SubPulse</span>
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            AI-powered subscription intelligence. Connect your RevenueCat data
            and get an instant health report with actionable insights.
          </p>
          <p className="text-gray-600 text-sm mt-2">
            Powered by RevenueCat Charts API + Claude AI
          </p>
        </div>

        {/* Form */}
        {!report && (
          <div className="max-w-lg mx-auto mb-12">
            <div className="bg-gray-900 border border-gray-700 rounded-xl p-6">
              {/* API Key Input */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  RevenueCat API Key
                </label>
                <div className="relative">
                  <input
                    type={showKey ? "text" : "password"}
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="sk_..."
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-teal-500 font-mono text-sm pr-16"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey(!showKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500 hover:text-gray-300"
                  >
                    {showKey ? "Hide" : "Show"}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Your key is used server-side only and never stored.
                </p>
              </div>

              {/* Submit */}
              <button
                onClick={() => handleSubmit(false)}
                disabled={loading || !apiKey.trim()}
                className="w-full py-3 rounded-lg font-medium transition-colors bg-teal-600 hover:bg-teal-500 text-white disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {loading ? "Analyzing..." : "Analyze Subscription Health"}
              </button>

              {/* Divider */}
              <div className="flex items-center gap-4 my-6">
                <div className="flex-1 h-px bg-gray-700" />
                <span className="text-xs text-gray-500 uppercase">or</span>
                <div className="flex-1 h-px bg-gray-700" />
              </div>

              {/* Sample Data */}
              <button
                onClick={() => handleSubmit(true)}
                disabled={loading}
                className="w-full py-3 rounded-lg font-medium transition-colors bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-600 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {loading
                  ? "Analyzing..."
                  : "Try with Dark Noise sample data"}
              </button>
              <p className="text-xs text-gray-500 mt-2 text-center">
                Demo using real data from the Dark Noise app
              </p>
            </div>

            {/* Loading */}
            {loading && (
              <div className="mt-8 text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-teal-400 mb-4" />
                <p className="text-gray-400">
                  Fetching charts data and generating AI analysis...
                </p>
                <p className="text-gray-500 text-sm mt-1">
                  This takes 15-30 seconds
                </p>
              </div>
            )}
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="max-w-lg mx-auto mb-8 bg-red-950/50 border border-red-700 rounded-lg p-4 text-red-300">
            {error}
          </div>
        )}

        {/* Report */}
        {report && sparklines && (
          <div>
            <div className="flex justify-center mb-6">
              <button
                onClick={handleClear}
                className="px-5 py-2 rounded-lg text-sm font-medium bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700 border border-gray-700 transition-colors"
              >
                Analyze Another App
              </button>
            </div>
            <RevenueReport
              report={report}
              sparklines={sparklines}
              overview={overview}
              projectName={projectName}
            />
          </div>
        )}
      </div>
    </div>
  );
}
