"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useKnowledge } from "@/context/KnowledgeContext";
import { KnowledgeBase } from "@/types/knowledge";
import { validateUrl } from "@/app/lib/validateUrl";
import ActionButton from "@/components/ActionButton";

export default function KnowledgePage() {
  const router = useRouter();
  const { saveDraft } = useKnowledge();

  const [url, setUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [statusText, setStatusText] = useState("Fetching site...");

  const validation = validateUrl(url);
  const isValidUrl = validation.ok;

  // Cycle status text during loading without fake progress bars
  useEffect(() => {
    if (!isLoading) {
      setStatusText("Fetching site...");
      return;
    }

    const timer = setTimeout(() => {
      setStatusText("Extracting data...");
    }, 2500);

    return () => clearTimeout(timer);
  }, [isLoading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const result = validateUrl(url);
    if (!result.ok) {
      setError(result.error);
      return;
    }

    const targetUrl = result.url;
    setIsLoading(true);

    try {
      const response = await fetch("/api/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: targetUrl }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        const message = errorData?.error || "Couldn't reach that site — check the URL and try again";
        setError(message);
        setIsLoading(false);
        return;
      }

      const data = await response.json().catch(() => ({}));

      const newId = typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `kb_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

      const kb: KnowledgeBase = {
        id: newId,
        sourceUrl: targetUrl,
        scrapedAt: new Date().toISOString(),
        savedAt: null,
        status: "draft",
        companyName: data.companyName ?? null,
        companyFoundation: {
          description: data.companyFoundation?.description ?? null,
          website: data.companyFoundation?.website ?? targetUrl,
          industry: data.companyFoundation?.industry ?? null,
          businessModel: data.companyFoundation?.businessModel ?? null,
          companyRole: data.companyFoundation?.companyRole ?? null,
          yearFounded: data.companyFoundation?.yearFounded ?? null,
          legalEntityType: data.companyFoundation?.legalEntityType ?? null,
          employeeCount: data.companyFoundation?.employeeCount ?? null,
          mainAddress: data.companyFoundation?.mainAddress ?? null,
          otherLocations: data.companyFoundation?.otherLocations ?? [],
          serviceLocations: data.companyFoundation?.serviceLocations ?? [],
          altCompanyNames: data.companyFoundation?.altCompanyNames ?? [],
        },
        positioning: {
          pitch: data.positioning?.pitch ?? null,
          foundingStory: data.positioning?.foundingStory ?? null,
        },
        marketAndCustomers: {
          targetBuyers: data.marketAndCustomers?.targetBuyers ?? [],
          customerNeeds: data.marketAndCustomers?.customerNeeds ?? null,
          idealPersona: data.marketAndCustomers?.idealPersona ?? null,
          industryGroupings: data.marketAndCustomers?.industryGroupings ?? [],
          industryOutlook: data.marketAndCustomers?.industryOutlook ?? null,
          channels: data.marketAndCustomers?.channels ?? [],
          funnels: data.marketAndCustomers?.funnels ?? [],
          ctas: data.marketAndCustomers?.ctas ?? [],
          suppliers: data.marketAndCustomers?.suppliers ?? [],
        },
        brandingAndStyle: {
          writingStyle: data.brandingAndStyle?.writingStyle ?? null,
          artStyle: data.brandingAndStyle?.artStyle ?? null,
          fonts: data.brandingAndStyle?.fonts ?? [],
          colors: data.brandingAndStyle?.colors ?? [],
          logos: data.brandingAndStyle?.logos ?? [],
        },
        onlinePresence: {
          linkedin: data.onlinePresence?.linkedin ?? null,
          facebook: data.onlinePresence?.facebook ?? null,
          instagram: data.onlinePresence?.instagram ?? null,
          twitter: data.onlinePresence?.twitter ?? null,
          youtube: data.onlinePresence?.youtube ?? null,
          tiktok: data.onlinePresence?.tiktok ?? null,
        },
        keyPeople: data.keyPeople ?? [],
        offerings: data.offerings ?? [],
        faq: data.faq ?? [],
        legal: {
          privacyPolicyUrl: data.legal?.privacyPolicyUrl ?? null,
          termsOfServiceUrl: data.legal?.termsOfServiceUrl ?? null,
        },
      };

      saveDraft(kb);
      router.push(`/knowledge/${kb.id}`);
    } catch {
      setError("Couldn't reach that site — check the URL and try again");
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-background text-secondary">
      <main className="flex flex-col items-center justify-center text-center max-w-xl w-full gap-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-header leading-tight">
            Build Your <span className="text-primary">Knowledge Base</span>
          </h1>
          <p className="text-desc text-sm md:text-base mt-2">
            Enter a company website to extract foundational business information.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
          <div className="flex flex-col gap-2 text-left">
            <label htmlFor="url-input" className="text-xs font-semibold text-secondary uppercase tracking-wider">
              Company Website URL
            </label>
            <input
              id="url-input"
              type="text"
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                if (error) setError(null);
              }}
              placeholder="https://example.com"
              disabled={isLoading}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-secondary placeholder:text-desc focus:outline-none focus:border-primary transition-colors disabled:opacity-60 disabled:cursor-not-allowed text-base"
            />
            {error && (
              <p className="text-sm text-red-600 mt-1">
                {error}
              </p>
            )}
          </div>

          <div className="flex justify-center pt-2">
            <ActionButton
              type="submit"
              isLoading={isLoading}
              disabled={!isValidUrl || isLoading}
              className="w-full md:w-auto min-w-44"
            >
              {isLoading ? statusText : "Scrape"}
            </ActionButton>
          </div>
        </form>
      </main>
    </div>
  );
}