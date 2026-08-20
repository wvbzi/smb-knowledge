"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useKnowledge } from "@/context/KnowledgeContext";
import { KnowledgeBase } from "@/types/knowledge";
import ActionButton from "@/components/ActionButton";
import {
  Search,
  LayoutGrid,
  Table as TableIcon,
  FileText,
  Pencil,
  Trash2,
  ExternalLink,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Building,
  Plus,
  Download,
} from "lucide-react";

type ViewMode = "card" | "table" | "detailed";
type StatusFilter = "saved" | "draft";
type SortField = "companyName" | "date";
type SortOrder = "asc" | "desc";

function downloadJson(kb: KnowledgeBase) {
  const blob = new Blob([JSON.stringify(kb, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${(kb.companyName || "knowledge-base").toLowerCase().replace(/[^a-z0-9]+/g, "-")}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function formatDate(isoString: string | null): string {
  if (!isoString) return "Never";
  try {
    const d = new Date(isoString);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return isoString;
  }
}

// Logo Avatar with fallback to colored initial
function CompanyAvatar({
  logoUrl,
  companyName,
  size = "md",
}: {
  logoUrl?: string | null;
  companyName?: string | null;
  size?: "sm" | "md" | "lg";
}) {
  const [hasError, setHasError] = useState(false);
  const initial = (companyName || "?").trim().charAt(0).toUpperCase();

  const sizeClasses = {
    sm: "w-8 h-8 text-xs",
    md: "w-11 h-11 text-base font-semibold",
    lg: "w-14 h-14 text-xl font-bold",
  }[size];

  if (logoUrl && !hasError) {
    return (
      <img
        src={logoUrl}
        alt={companyName || "Logo"}
        onError={() => setHasError(true)}
        className={`${sizeClasses} object-contain rounded-xl bg-checkerboard border border-gray-200 p-1 shrink-0 shadow-2xs`}
      />
    );
  }

  return (
    <div
      className={`${sizeClasses} rounded-xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center shrink-0`}
    >
      {initial}
    </div>
  );
}

export default function KnowledgeViewPage() {
  const router = useRouter();
  const { knowledgeData, isHydrated, deleteKnowledge } = useKnowledge();

  const [statusFilter, setStatusFilter] = useState<StatusFilter>("saved");
  const [viewMode, setViewMode] = useState<ViewMode>("card");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Table sorting
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

  // Delete modal state
  const [itemToDelete, setItemToDelete] = useState<KnowledgeBase | null>(null);

  // Filtered dataset
  const filteredData = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return knowledgeData
      .filter((kb) => kb.status === statusFilter)
      .filter((kb) => {
        if (!query) return true;
        const name = (kb.companyName || "").toLowerCase();
        const industry = (kb.companyFoundation?.industry || "").toLowerCase();
        const website = (kb.companyFoundation?.website || kb.sourceUrl || "").toLowerCase();
        return name.includes(query) || industry.includes(query) || website.includes(query);
      })
      .sort((a, b) => {
        if (sortField === "companyName") {
          const nameA = (a.companyName || a.sourceUrl).toLowerCase();
          const nameB = (b.companyName || b.sourceUrl).toLowerCase();
          return sortOrder === "asc" ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
        } else {
          const dateA = new Date(a.savedAt || a.scrapedAt).getTime();
          const dateB = new Date(b.savedAt || b.scrapedAt).getTime();
          return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
        }
      });
  }, [knowledgeData, statusFilter, searchQuery, sortField, sortOrder]);

  const selectedItem = useMemo(() => {
    return knowledgeData.find((kb) => kb.id === selectedId);
  }, [knowledgeData, selectedId]);

  const handleToggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortOrder(field === "date" ? "desc" : "asc");
    }
  };

  const confirmDelete = () => {
    if (!itemToDelete) return;
    deleteKnowledge(itemToDelete.id);
    if (selectedId === itemToDelete.id) {
      setSelectedId(null);
    }
    setItemToDelete(null);
  };

  // Skeleton loading on mount/hydration
  if (!isHydrated) {
    return (
      <div className="min-h-screen pt-28 pb-16 px-4 md:px-8 bg-background text-secondary max-w-6xl mx-auto flex flex-col gap-6">
        <div className="h-8 w-48 bg-gray-100 rounded-lg animate-pulse" />
        <div className="h-12 w-full bg-gray-100 rounded-xl animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="h-44 bg-gray-100 rounded-2xl animate-pulse" />
          <div className="h-44 bg-gray-100 rounded-2xl animate-pulse" />
        </div>
      </div>
    );
  }

  const rawCountForStatus = knowledgeData.filter((k) => k.status === statusFilter).length;

  return (
    <div className="min-h-screen pt-28 pb-20 px-4 md:px-8 bg-background text-secondary">
      <div className="max-w-6xl mx-auto flex flex-col gap-6">
        {/* Header & Controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-header tracking-tight">
              Knowledge History
            </h1>
            <p className="text-desc text-xs md:text-sm mt-1">
              Browse, inspect, and manage your scraped company knowledge bases.
            </p>
          </div>

          <ActionButton href="/knowledge">
            <span className="flex items-center gap-1">
              <Plus className="w-4 h-4" />
              <span>Scrape New Site</span>
            </span>
          </ActionButton>
        </div>

        {/* Toolbar: Segmented Tabs, Search & View Switcher */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-gray-50/70 border border-gray-200 rounded-2xl p-2.5">
          <div className="flex items-center gap-2">
            {/* Status Segmented Control */}
            <div className="flex bg-gray-200/70 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => {
                  setStatusFilter("saved");
                  setSelectedId(null);
                }}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  statusFilter === "saved"
                    ? "bg-white text-header shadow-xs"
                    : "text-desc hover:text-secondary"
                }`}
              >
                Saved ({knowledgeData.filter((k) => k.status === "saved").length})
              </button>
              <button
                type="button"
                onClick={() => {
                  setStatusFilter("draft");
                  setSelectedId(null);
                }}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  statusFilter === "draft"
                    ? "bg-white text-header shadow-xs"
                    : "text-desc hover:text-secondary"
                }`}
              >
                Drafts ({knowledgeData.filter((k) => k.status === "draft").length})
              </button>
            </div>

            {/* View Mode Toggle */}
            <div className="flex bg-gray-200/70 p-1 rounded-xl">
              <button
                type="button"
                title="Card View"
                onClick={() => setViewMode("card")}
                className={`p-1.5 rounded-lg text-xs transition-all ${
                  viewMode === "card"
                    ? "bg-white text-primary shadow-xs"
                    : "text-desc hover:text-secondary"
                }`}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                type="button"
                title="Table View"
                onClick={() => setViewMode("table")}
                className={`p-1.5 rounded-lg text-xs transition-all ${
                  viewMode === "table"
                    ? "bg-white text-primary shadow-xs"
                    : "text-desc hover:text-secondary"
                }`}
              >
                <TableIcon className="w-4 h-4" />
              </button>
              <button
                type="button"
                title="Detailed View"
                onClick={() => setViewMode("detailed")}
                className={`p-1.5 rounded-lg text-xs transition-all ${
                  viewMode === "detailed"
                    ? "bg-white text-primary shadow-xs"
                    : "text-desc hover:text-secondary"
                }`}
              >
                <FileText className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Search Input */}
          <div className="relative flex-1 md:max-w-xs">
            <Search className="w-4 h-4 text-desc absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search company, industry, domain..."
              className="w-full pl-9 pr-3.5 py-1.5 bg-white border border-gray-200 rounded-xl text-xs md:text-sm text-secondary placeholder:text-desc focus:outline-none focus:border-primary"
            />
          </div>
        </div>

        {/* Content Area */}
        {rawCountForStatus === 0 ? (
          /* Empty State for category */
          <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center flex flex-col items-center gap-3">
            <Building className="w-10 h-10 text-desc/60" />
            <h3 className="text-base font-bold text-header">
              {statusFilter === "saved" ? "No saved knowledge bases yet" : "No drafts in progress"}
            </h3>
            <p className="text-xs text-desc max-w-sm">
              {statusFilter === "saved"
                ? "Scrape a company website to gather foundational information."
                : "In-progress review drafts will automatically appear here until saved."}
            </p>
            {statusFilter === "saved" && (
              <div className="mt-2">
                <ActionButton href="/knowledge">Scrape a Company</ActionButton>
              </div>
            )}
          </div>
        ) : filteredData.length === 0 ? (
          /* Search Empty State */
          <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center flex flex-col items-center gap-2">
            <h3 className="text-base font-bold text-header">No results found</h3>
            <p className="text-xs text-desc">
              No entries matching &ldquo;{searchQuery}&rdquo; in {statusFilter}s.
            </p>
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="text-xs text-primary font-medium hover:underline mt-1"
            >
              Clear search filter
            </button>
          </div>
        ) : viewMode === "card" ? (
          /* 1. Card View Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredData.map((kb) => (
              <div
                key={kb.id}
                className="bg-white border border-gray-200 rounded-2xl p-5 flex flex-col justify-between gap-4 transition-all hover:border-gray-300 hover:shadow-xs"
              >
                <div className="flex items-start gap-3.5">
                  <CompanyAvatar
                    logoUrl={kb.brandingAndStyle?.logos?.[0]}
                    companyName={kb.companyName}
                    size="md"
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-bold text-header truncate">
                      {kb.companyName || "Unnamed Company"}
                    </h3>
                    <p className="text-xs text-desc truncate mt-0.5">
                      {kb.companyFoundation?.industry || "Industry not specified"}
                    </p>
                    <a
                      href={kb.companyFoundation?.website || kb.sourceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-primary hover:underline flex items-center gap-1 mt-1 truncate"
                    >
                      <span className="truncate">{kb.companyFoundation?.website || kb.sourceUrl}</span>
                      <ExternalLink className="w-3 h-3 shrink-0" />
                    </a>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-gray-100 pt-3 text-xs text-desc">
                  <span className="bg-gray-100 text-secondary px-2 py-0.5 rounded-md font-medium text-[11px]">
                    {kb.offerings?.length || 0} offerings
                  </span>

                  <span>
                    {statusFilter === "saved"
                      ? `Saved ${formatDate(kb.savedAt)}`
                      : `Scraped ${formatDate(kb.scrapedAt)}`}
                  </span>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      title="Export JSON"
                      onClick={() => downloadJson(kb)}
                      className="p-1.5 text-secondary hover:text-primary rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      title="Edit Knowledge Base"
                      onClick={() => router.push(`/knowledge/${kb.id}`)}
                      className="p-1.5 text-secondary hover:text-primary rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      title="Delete Knowledge Base"
                      onClick={() => setItemToDelete(kb)}
                      className="p-1.5 text-desc hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : viewMode === "table" ? (
          /* 2. Table View */
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-secondary border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200 text-header uppercase tracking-wider font-semibold">
                    <th
                      className="py-3 px-4 cursor-pointer select-none"
                      onClick={() => handleToggleSort("companyName")}
                    >
                      <div className="flex items-center gap-1">
                        <span>Company</span>
                        {sortField === "companyName" ? (
                          sortOrder === "asc" ? <ArrowUp className="w-3.5 h-3.5 text-primary" /> : <ArrowDown className="w-3.5 h-3.5 text-primary" />
                        ) : (
                          <ArrowUpDown className="w-3.5 h-3.5 text-desc" />
                        )}
                      </div>
                    </th>
                    <th className="py-3 px-4">Industry</th>
                    <th className="py-3 px-4">Website</th>
                    <th className="py-3 px-4">Offerings</th>
                    <th
                      className="py-3 px-4 cursor-pointer select-none"
                      onClick={() => handleToggleSort("date")}
                    >
                      <div className="flex items-center gap-1">
                        <span>{statusFilter === "saved" ? "Saved Date" : "Scraped Date"}</span>
                        {sortField === "date" ? (
                          sortOrder === "asc" ? <ArrowUp className="w-3.5 h-3.5 text-primary" /> : <ArrowDown className="w-3.5 h-3.5 text-primary" />
                        ) : (
                          <ArrowUpDown className="w-3.5 h-3.5 text-desc" />
                        )}
                      </div>
                    </th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredData.map((kb) => (
                    <tr key={kb.id} className="hover:bg-gray-50/70 transition-colors">
                      <td className="py-3 px-4 font-medium text-header">
                        <div className="flex items-center gap-2.5">
                          <CompanyAvatar
                            logoUrl={kb.brandingAndStyle?.logos?.[0]}
                            companyName={kb.companyName}
                            size="sm"
                          />
                          <span className="truncate max-w-[160px]">
                            {kb.companyName || "Unnamed Company"}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-desc truncate max-w-[140px]">
                        {kb.companyFoundation?.industry || "—"}
                      </td>
                      <td className="py-3 px-4 truncate max-w-[160px]">
                        <a
                          href={kb.companyFoundation?.website || kb.sourceUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-primary hover:underline flex items-center gap-1 truncate"
                        >
                          <span className="truncate">{kb.companyFoundation?.website || kb.sourceUrl}</span>
                          <ExternalLink className="w-3 h-3 shrink-0" />
                        </a>
                      </td>
                      <td className="py-3 px-4">
                        <span className="bg-gray-100 text-secondary px-2 py-0.5 rounded-md text-[11px] font-medium">
                          {kb.offerings?.length || 0}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-desc">
                        {formatDate(kb.savedAt || kb.scrapedAt)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            title="Export JSON"
                            onClick={() => downloadJson(kb)}
                            className="p-1.5 text-secondary hover:text-primary rounded-md hover:bg-gray-100 transition-colors"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            title="Edit"
                            onClick={() => router.push(`/knowledge/${kb.id}`)}
                            className="p-1.5 text-secondary hover:text-primary rounded-md hover:bg-gray-100 transition-colors"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            title="Delete"
                            onClick={() => setItemToDelete(kb)}
                            className="p-1.5 text-desc hover:text-red-600 rounded-md hover:bg-red-50 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* 3. Detailed Master-Detail View */
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
            {/* Left Master List Pane */}
            <div className="md:col-span-4 bg-white border border-gray-200 rounded-2xl p-3 flex flex-col gap-1.5 max-h-[700px] overflow-y-auto">
              <span className="text-[11px] font-semibold text-desc uppercase tracking-wider px-2 py-1">
                Select Company ({filteredData.length})
              </span>
              {filteredData.map((kb) => (
                <button
                  key={kb.id}
                  type="button"
                  onClick={() => setSelectedId(kb.id)}
                  className={`w-full text-left p-2.5 rounded-xl flex items-center gap-3 transition-colors ${
                    selectedId === kb.id
                      ? "bg-primary text-white"
                      : "hover:bg-gray-100 text-secondary"
                  }`}
                >
                  <CompanyAvatar
                    logoUrl={kb.brandingAndStyle?.logos?.[0]}
                    companyName={kb.companyName}
                    size="sm"
                  />
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-semibold truncate ${selectedId === kb.id ? "text-white" : "text-header"}`}>
                      {kb.companyName || "Unnamed Company"}
                    </p>
                    <p className={`text-[11px] truncate ${selectedId === kb.id ? "text-white/80" : "text-desc"}`}>
                      {kb.companyFoundation?.industry || "No industry"}
                    </p>
                  </div>
                </button>
              ))}
            </div>

            {/* Right Detailed Inspect Pane */}
            <div className="md:col-span-8 bg-white border border-gray-200 rounded-2xl p-6 min-h-[500px]">
              {!selectedItem ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-12 text-desc gap-2">
                  <FileText className="w-10 h-10 text-desc/50" />
                  <p className="text-sm font-medium">Select a company from the list to view full details.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-6">
                  {/* Detail Pane Header */}
                  <div className="flex items-start justify-between border-b border-gray-100 pb-4 gap-4">
                    <div className="flex items-center gap-3.5">
                      <CompanyAvatar
                        logoUrl={selectedItem.brandingAndStyle?.logos?.[0]}
                        companyName={selectedItem.companyName}
                        size="lg"
                      />
                      <div>
                        <h2 className="text-xl font-bold text-header">
                          {selectedItem.companyName || "Unnamed Company"}
                        </h2>
                        <p className="text-xs text-desc">
                          {selectedItem.companyFoundation?.industry || "Industry not specified"} &bull;{" "}
                          <a
                            href={selectedItem.companyFoundation?.website || selectedItem.sourceUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-primary hover:underline"
                          >
                            {selectedItem.companyFoundation?.website || selectedItem.sourceUrl}
                          </a>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => downloadJson(selectedItem)}
                        className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-secondary text-xs font-semibold rounded-lg transition-colors border border-gray-200 flex items-center gap-1.5"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Export JSON</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => router.push(`/knowledge/${selectedItem.id}`)}
                        className="px-3 py-1.5 bg-primary text-white text-xs font-semibold rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-1.5"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setItemToDelete(selectedItem)}
                        className="p-1.5 text-desc hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Company Overview & Foundation */}
                  <div className="flex flex-col gap-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-desc">
                      Company Overview
                    </h4>
                    <p className="text-sm text-secondary leading-relaxed bg-gray-50/70 p-3.5 rounded-xl border border-gray-100">
                      {selectedItem.companyFoundation?.description || "No overview description provided."}
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs mt-2">
                      <div>
                        <span className="text-desc block">Year Founded:</span>
                        <span className="font-medium text-header">{selectedItem.companyFoundation?.yearFounded || "—"}</span>
                      </div>
                      <div>
                        <span className="text-desc block">Employees:</span>
                        <span className="font-medium text-header">{selectedItem.companyFoundation?.employeeCount || "—"}</span>
                      </div>
                      <div>
                        <span className="text-desc block">Business Model:</span>
                        <span className="font-medium text-header">{selectedItem.companyFoundation?.businessModel || "—"}</span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-desc block">Address:</span>
                        <span className="font-medium text-header">{selectedItem.companyFoundation?.mainAddress || "—"}</span>
                      </div>
                    </div>
                  </div>

                  {/* Positioning */}
                  {(selectedItem.positioning?.pitch || selectedItem.positioning?.foundingStory) && (
                    <div className="flex flex-col gap-2 border-t border-gray-100 pt-4">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-desc">
                        Positioning & Story
                      </h4>
                      {selectedItem.positioning.pitch && (
                        <p className="text-xs text-secondary italic bg-gray-50 p-3 rounded-lg">
                          &ldquo;{selectedItem.positioning.pitch}&rdquo;
                        </p>
                      )}
                    </div>
                  )}

                  {/* Offerings */}
                  <div className="flex flex-col gap-2 border-t border-gray-100 pt-4">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-desc">
                      Offerings ({selectedItem.offerings?.length || 0})
                    </h4>
                    {selectedItem.offerings?.length === 0 ? (
                      <p className="text-xs text-desc italic">No offerings documented.</p>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {selectedItem.offerings.map((off) => (
                          <div key={off.id} className="p-3 border border-gray-200 rounded-xl bg-gray-50/50 flex flex-col gap-1">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-xs text-header">{off.name}</span>
                              {off.pricing && (
                                <span className="text-[11px] font-semibold text-primary">{off.pricing}</span>
                              )}
                            </div>
                            {off.description && (
                              <p className="text-xs text-desc">{off.description}</p>
                            )}
                            {off.features?.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1">
                                {off.features.map((f, fi) => (
                                  <span key={fi} className="text-[10px] bg-white border border-gray-200 px-1.5 py-0.5 rounded text-secondary">
                                    {f}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Brand Assets */}
                  {(selectedItem.brandingAndStyle?.colors?.length > 0 || selectedItem.brandingAndStyle?.fonts?.length > 0) && (
                    <div className="flex flex-col gap-2 border-t border-gray-100 pt-4">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-desc">
                        Brand Style
                      </h4>
                      <div className="flex flex-wrap items-center gap-2">
                        {selectedItem.brandingAndStyle.colors?.map((c, ci) => (
                          <div key={ci} className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 px-2 py-1 rounded-md text-xs">
                            <div className="w-3.5 h-3.5 rounded border border-gray-300" style={{ backgroundColor: c }} />
                            <span className="font-mono text-[11px] text-secondary">{c}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {itemToDelete && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white border border-gray-200 rounded-2xl max-w-sm w-full p-6 flex flex-col gap-4 shadow-xl">
            <div>
              <h3 className="text-base font-bold text-header">Confirm Deletion</h3>
              <p className="text-xs text-desc mt-1.5">
                Are you sure you want to delete the knowledge base for{" "}
                <span className="font-semibold text-secondary">
                  {itemToDelete.companyName || itemToDelete.sourceUrl}
                </span>
                ? This action cannot be undone.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setItemToDelete(null)}
                className="px-3.5 py-1.5 text-xs font-semibold text-secondary hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="px-3.5 py-1.5 text-xs font-semibold bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}