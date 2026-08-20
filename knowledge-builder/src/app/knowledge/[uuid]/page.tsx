"use client";

import React, { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { useKnowledge } from "@/context/KnowledgeContext";
import { KnowledgeBase } from "@/types/knowledge";
import ActionButton from "@/components/ActionButton";

// Helper for managing string[] tags/chips
function StringArrayField({
  label,
  description,
  values,
  onChange,
  placeholder = "Add item...",
}: {
  label: string;
  description?: string;
  values: string[];
  onChange: (val: string[]) => void;
  placeholder?: string;
}) {
  const [input, setInput] = useState("");

  const handleAdd = () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    if (!values.includes(trimmed)) {
      onChange([...values, trimmed]);
    }
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAdd();
    }
  };

  const handleRemove = (index: number) => {
    onChange(values.filter((_, i) => i !== index));
  };

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-secondary uppercase tracking-wider">
        {label}
      </label>
      {description && <p className="text-xs text-desc">{description}</p>}
      
      <div className="flex flex-wrap gap-2 mb-1.5">
        {values.length === 0 ? (
          <span className="text-xs text-desc italic border border-dashed border-gray-200 rounded-md px-2.5 py-1">
            Not found — add manually
          </span>
        ) : (
          values.map((item, idx) => (
            <span
              key={idx}
              className="inline-flex items-center gap-1.5 bg-gray-100 text-secondary text-xs px-2.5 py-1 rounded-full border border-gray-200"
            >
              <span>{item}</span>
              <button
                type="button"
                onClick={() => handleRemove(idx)}
                className="text-desc hover:text-red-500 font-bold ml-1 text-sm leading-none"
              >
                &times;
              </button>
            </span>
          ))
        )}
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="flex-1 px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-secondary placeholder:text-desc focus:outline-none focus:border-primary"
        />
        <button
          type="button"
          onClick={handleAdd}
          className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-secondary font-medium text-xs rounded-lg transition-colors border border-gray-200"
        >
          + Add
        </button>
      </div>
    </div>
  );
}

// Helper for Color Swatches array
function ColorSwatchesField({
  values,
  onChange,
}: {
  values: string[];
  onChange: (val: string[]) => void;
}) {
  const [newColor, setNewColor] = useState("#2663EB");

  const handleAdd = () => {
    const trimmed = newColor.trim();
    if (!trimmed) return;
    if (!values.includes(trimmed)) {
      onChange([...values, trimmed]);
    }
  };

  const handleRemove = (idx: number) => {
    onChange(values.filter((_, i) => i !== idx));
  };

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-secondary uppercase tracking-wider">
        Brand Colors
      </label>
      <div className="flex flex-wrap items-center gap-3">
        {values.length === 0 ? (
          <span className="text-xs text-desc italic border border-dashed border-gray-200 rounded-md px-2.5 py-1">
            Not found — add manually
          </span>
        ) : (
          values.map((hex, idx) => (
            <div
              key={idx}
              className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg p-1.5 pr-2"
            >
              <div
                className="w-5 h-5 rounded-md border border-gray-300 shadow-xs"
                style={{ backgroundColor: hex }}
              />
              <span className="text-xs font-mono text-secondary">{hex}</span>
              <button
                type="button"
                onClick={() => handleRemove(idx)}
                className="text-desc hover:text-red-500 font-bold ml-1 text-sm leading-none"
              >
                &times;
              </button>
            </div>
          ))
        )}

        <div className="flex items-center gap-1.5 ml-auto">
          <input
            type="color"
            value={newColor}
            onChange={(e) => setNewColor(e.target.value)}
            className="w-8 h-8 rounded border border-gray-200 cursor-pointer p-0.5"
          />
          <button
            type="button"
            onClick={handleAdd}
            className="px-2.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-secondary text-xs rounded-lg transition-colors border border-gray-200 font-medium"
          >
            + Add Color
          </button>
        </div>
      </div>
    </div>
  );
}

// Helper for Logo URLs array
function LogoThumbnailsField({
  values,
  onChange,
}: {
  values: string[];
  onChange: (val: string[]) => void;
}) {
  const [newLogoUrl, setNewLogoUrl] = useState("");

  const handleAdd = () => {
    const trimmed = newLogoUrl.trim();
    if (!trimmed) return;
    if (!values.includes(trimmed)) {
      onChange([...values, trimmed]);
    }
    setNewLogoUrl("");
  };

  const handleRemove = (idx: number) => {
    onChange(values.filter((_, i) => i !== idx));
  };

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-secondary uppercase tracking-wider">
        Logos & Icons
      </label>
      <div className="flex flex-wrap gap-3">
        {values.length === 0 ? (
          <span className="text-xs text-desc italic border border-dashed border-gray-200 rounded-md px-2.5 py-1">
            Not found — add manually
          </span>
        ) : (
          values.map((url, idx) => (
            <div
              key={idx}
              className="flex items-center gap-2 p-2 bg-gray-50 border border-gray-200 rounded-xl"
            >
              <img
                src={url}
                alt="Logo thumbnail"
                className="w-8 h-8 object-contain rounded-lg bg-checkerboard border border-gray-200 p-1 shadow-2xs"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = "none";
                }}
              />
              <span className="text-xs text-secondary max-w-[140px] truncate">{url}</span>
              <button
                type="button"
                onClick={() => handleRemove(idx)}
                className="text-desc hover:text-red-500 font-bold text-sm leading-none"
              >
                &times;
              </button>
            </div>
          ))
        )}
      </div>

      <div className="flex gap-2 mt-1">
        <input
          type="text"
          value={newLogoUrl}
          onChange={(e) => setNewLogoUrl(e.target.value)}
          placeholder="https://example.com/logo.png"
          className="flex-1 px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-secondary placeholder:text-desc focus:outline-none focus:border-primary"
        />
        <button
          type="button"
          onClick={handleAdd}
          className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-secondary text-xs rounded-lg transition-colors border border-gray-200 font-medium"
        >
          + Add Logo
        </button>
      </div>
    </div>
  );
}

export default function KnowledgeReviewPage({
  params,
}: {
  params: Promise<{ uuid: string }>;
}) {
  const { uuid } = use(params);
  const router = useRouter();

  const { isHydrated, getKnowledge, updateKnowledge, commitSave } = useKnowledge();
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [initialDataLoaded, setInitialDataLoaded] = useState(false);

  const kb = uuid ? getKnowledge(uuid) : undefined;

  const { register, control, handleSubmit, watch, reset } = useForm<KnowledgeBase>({
    defaultValues: kb,
  });

  // Populate react-hook-form once hydration completes
  useEffect(() => {
    if (isHydrated && kb && !initialDataLoaded) {
      reset(kb);
      setInitialDataLoaded(true);
    }
  }, [isHydrated, kb, initialDataLoaded, reset]);

  // Debounced auto-save on form edits (500ms)
  useEffect(() => {
    if (!initialDataLoaded || !uuid) return;

    const subscription = watch((formData) => {
      const timer = setTimeout(() => {
        updateKnowledge(uuid, formData as Partial<KnowledgeBase>);
      }, 500);

      return () => clearTimeout(timer);
    });

    return () => subscription.unsubscribe();
  }, [watch, uuid, initialDataLoaded, updateKnowledge]);

  // Field arrays for dynamic array sections
  const {
    fields: keyPeopleFields,
    append: appendKeyPerson,
    remove: removeKeyPerson,
  } = useFieldArray({
    control,
    name: "keyPeople",
  });

  const {
    fields: offeringsFields,
    append: appendOffering,
    remove: removeOffering,
  } = useFieldArray({
    control,
    name: "offerings",
  });

  const {
    fields: faqFields,
    append: appendFaq,
    remove: removeFaq,
  } = useFieldArray({
    control,
    name: "faq",
  });

  // Loading / hydration skeleton state
  if (!isHydrated) {
    return (
      <div className="min-h-screen pt-28 pb-16 px-4 md:px-8 bg-background text-secondary max-w-5xl mx-auto flex flex-col gap-6">
        <div className="h-8 w-48 bg-gray-100 rounded-lg animate-pulse" />
        <div className="h-64 bg-gray-100 rounded-2xl animate-pulse" />
        <div className="h-64 bg-gray-100 rounded-2xl animate-pulse" />
      </div>
    );
  }

  // Not found state
  if (!kb) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-background text-secondary text-center">
        <div className="max-w-md flex flex-col items-center gap-4">
          <h1 className="text-2xl font-bold text-header">Knowledge Base Not Found</h1>
          <p className="text-desc text-sm">
            We couldn&apos;t find a knowledge base associated with this identifier. It may have expired or not been saved yet.
          </p>
          <ActionButton href="/knowledge">Back to Knowledge Builder</ActionButton>
        </div>
      </div>
    );
  }

  const onSubmit = () => {
    if (!uuid) return;
    commitSave(uuid);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <div className="min-h-screen pt-28 pb-24 px-4 md:px-8 bg-background text-secondary">
      <div className="max-w-4xl mx-auto flex flex-col gap-8">
        {/* Top Action Bar */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 md:gap-6 border-b border-gray-100 pb-6">
          <div className="flex flex-col gap-2 min-w-0 flex-1">
            <h1
              className="text-2xl md:text-3xl font-bold text-header tracking-tight break-words max-w-full"
              title={kb.companyName || "Review Knowledge Base"}
            >
              {kb.companyName || "Review Knowledge Base"}
            </h1>
            <div className="flex flex-wrap items-center gap-2 text-xs text-desc">
              <span
                className={`px-2.5 py-0.5 rounded-full font-semibold border shrink-0 text-[11px] tracking-wide ${
                  kb.status === "saved"
                    ? "bg-green-50 text-green-700 border-green-200"
                    : "bg-amber-50 text-amber-700 border-amber-200"
                }`}
              >
                {kb.status === "saved" ? "Saved" : "Draft"}
              </span>
              <span className="text-gray-300">&bull;</span>
              <span className="truncate max-w-full">
                Source:{" "}
                <a
                  href={kb.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary hover:underline font-medium"
                >
                  {kb.sourceUrl}
                </a>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0 self-start md:self-start md:pt-1">
            {saveSuccess && (
              <span className="text-xs font-medium text-green-600 flex items-center gap-1 bg-green-50 px-2.5 py-1 rounded-lg border border-green-200 shrink-0">
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Saved!
              </span>
            )}
            <button
              type="button"
              onClick={() => {
                const current = watch();
                const blob = new Blob([JSON.stringify(current, null, 2)], { type: "application/json" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `${(current.companyName || "knowledge-base").toLowerCase().replace(/[^a-z0-9]+/g, "-")}.json`;
                document.body.appendChild(a);
                a.click();
                a.remove();
                URL.revokeObjectURL(url);
              }}
              className="px-3.5 py-2 bg-gray-100 hover:bg-gray-200 text-secondary text-xs font-semibold rounded-xl transition-colors border border-gray-200 whitespace-nowrap shrink-0"
            >
              Export JSON
            </button>
            <div className="shrink-0">
              <ActionButton onClick={handleSubmit(onSubmit)}>
                {kb.status === "saved" ? "Update" : "Save Knowledge Base"}
              </ActionButton>
            </div>
          </div>
        </div>

        {/* Main Review & Edit Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-8">
          {/* Section 1: Company Foundation */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 flex flex-col gap-4">
            <h2 className="text-lg font-bold text-header border-b border-gray-100 pb-2">
              1. Company Foundation
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-secondary uppercase tracking-wider">Company Name</label>
                <input
                  {...register("companyName")}
                  placeholder="Not found — add manually"
                  className="px-3.5 py-2 border border-gray-200 rounded-lg text-sm text-secondary placeholder:text-desc placeholder:italic focus:outline-none focus:border-primary"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-secondary uppercase tracking-wider">Website URL</label>
                <input
                  {...register("companyFoundation.website")}
                  placeholder="Not found — add manually"
                  className="px-3.5 py-2 border border-gray-200 rounded-lg text-sm text-secondary placeholder:text-desc placeholder:italic focus:outline-none focus:border-primary"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-secondary uppercase tracking-wider">Industry</label>
                <input
                  {...register("companyFoundation.industry")}
                  placeholder="Not found — add manually"
                  className="px-3.5 py-2 border border-gray-200 rounded-lg text-sm text-secondary placeholder:text-desc placeholder:italic focus:outline-none focus:border-primary"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-secondary uppercase tracking-wider">Business Model</label>
                <input
                  {...register("companyFoundation.businessModel")}
                  placeholder="Not found — add manually"
                  className="px-3.5 py-2 border border-gray-200 rounded-lg text-sm text-secondary placeholder:text-desc placeholder:italic focus:outline-none focus:border-primary"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-secondary uppercase tracking-wider">Company Role</label>
                <input
                  {...register("companyFoundation.companyRole")}
                  placeholder="Not found — add manually"
                  className="px-3.5 py-2 border border-gray-200 rounded-lg text-sm text-secondary placeholder:text-desc placeholder:italic focus:outline-none focus:border-primary"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-secondary uppercase tracking-wider">Year Founded</label>
                <input
                  type="number"
                  {...register("companyFoundation.yearFounded", { valueAsNumber: true })}
                  placeholder="Not found — add manually"
                  className="px-3.5 py-2 border border-gray-200 rounded-lg text-sm text-secondary placeholder:text-desc placeholder:italic focus:outline-none focus:border-primary"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-secondary uppercase tracking-wider">Legal Entity Type</label>
                <input
                  {...register("companyFoundation.legalEntityType")}
                  placeholder="Not found — add manually"
                  className="px-3.5 py-2 border border-gray-200 rounded-lg text-sm text-secondary placeholder:text-desc placeholder:italic focus:outline-none focus:border-primary"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-secondary uppercase tracking-wider">Employee Count</label>
                <input
                  type="number"
                  {...register("companyFoundation.employeeCount", { valueAsNumber: true })}
                  placeholder="Not found — add manually"
                  className="px-3.5 py-2 border border-gray-200 rounded-lg text-sm text-secondary placeholder:text-desc placeholder:italic focus:outline-none focus:border-primary"
                />
              </div>

              <div className="md:col-span-2 flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-secondary uppercase tracking-wider">Main Address</label>
                <input
                  {...register("companyFoundation.mainAddress")}
                  placeholder="Not found — add manually"
                  className="px-3.5 py-2 border border-gray-200 rounded-lg text-sm text-secondary placeholder:text-desc placeholder:italic focus:outline-none focus:border-primary"
                />
              </div>

              <div className="md:col-span-2 flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-secondary uppercase tracking-wider">Description / Overview</label>
                <textarea
                  rows={3}
                  {...register("companyFoundation.description")}
                  placeholder="Not found — add manually"
                  className="px-3.5 py-2 border border-gray-200 rounded-lg text-sm text-secondary placeholder:text-desc placeholder:italic focus:outline-none focus:border-primary"
                />
              </div>

              <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                <Controller
                  control={control}
                  name="companyFoundation.otherLocations"
                  render={({ field }) => (
                    <StringArrayField
                      label="Other Locations"
                      values={field.value || []}
                      onChange={field.onChange}
                      placeholder="Add location..."
                    />
                  )}
                />
                <Controller
                  control={control}
                  name="companyFoundation.serviceLocations"
                  render={({ field }) => (
                    <StringArrayField
                      label="Service Locations"
                      values={field.value || []}
                      onChange={field.onChange}
                      placeholder="Add region/city..."
                    />
                  )}
                />
                <Controller
                  control={control}
                  name="companyFoundation.altCompanyNames"
                  render={({ field }) => (
                    <StringArrayField
                      label="Alternative Names / DBAs"
                      values={field.value || []}
                      onChange={field.onChange}
                      placeholder="Add alias..."
                    />
                  )}
                />
              </div>
            </div>
          </div>

          {/* Section 2: Positioning */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 flex flex-col gap-4">
            <h2 className="text-lg font-bold text-header border-b border-gray-100 pb-2">
              2. Positioning & Story
            </h2>

            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-secondary uppercase tracking-wider">Elevator Pitch</label>
                <textarea
                  rows={3}
                  {...register("positioning.pitch")}
                  placeholder="Not found — add manually"
                  className="px-3.5 py-2 border border-gray-200 rounded-lg text-sm text-secondary placeholder:text-desc placeholder:italic focus:outline-none focus:border-primary"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-secondary uppercase tracking-wider">Founding Story</label>
                <textarea
                  rows={4}
                  {...register("positioning.foundingStory")}
                  placeholder="Not found — add manually"
                  className="px-3.5 py-2 border border-gray-200 rounded-lg text-sm text-secondary placeholder:text-desc placeholder:italic focus:outline-none focus:border-primary"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Market & Customers */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 flex flex-col gap-4">
            <h2 className="text-lg font-bold text-header border-b border-gray-100 pb-2">
              3. Market & Customers
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Controller
                control={control}
                name="marketAndCustomers.targetBuyers"
                render={({ field }) => (
                  <StringArrayField
                    label="Target Buyers"
                    values={field.value || []}
                    onChange={field.onChange}
                    placeholder="e.g. Small business owners..."
                  />
                )}
              />

              <Controller
                control={control}
                name="marketAndCustomers.industryGroupings"
                render={({ field }) => (
                  <StringArrayField
                    label="Industry Groupings"
                    values={field.value || []}
                    onChange={field.onChange}
                    placeholder="e.g. B2B, Retail..."
                  />
                )}
              />

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-secondary uppercase tracking-wider">Customer Needs</label>
                <textarea
                  rows={3}
                  {...register("marketAndCustomers.customerNeeds")}
                  placeholder="Not found — add manually"
                  className="px-3.5 py-2 border border-gray-200 rounded-lg text-sm text-secondary placeholder:text-desc placeholder:italic focus:outline-none focus:border-primary"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-secondary uppercase tracking-wider">Ideal Persona</label>
                <textarea
                  rows={3}
                  {...register("marketAndCustomers.idealPersona")}
                  placeholder="Not found — add manually"
                  className="px-3.5 py-2 border border-gray-200 rounded-lg text-sm text-secondary placeholder:text-desc placeholder:italic focus:outline-none focus:border-primary"
                />
              </div>

              <div className="md:col-span-2 flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-secondary uppercase tracking-wider">Industry Outlook</label>
                <input
                  {...register("marketAndCustomers.industryOutlook")}
                  placeholder="Not found — add manually"
                  className="px-3.5 py-2 border border-gray-200 rounded-lg text-sm text-secondary placeholder:text-desc placeholder:italic focus:outline-none focus:border-primary"
                />
              </div>

              <Controller
                control={control}
                name="marketAndCustomers.channels"
                render={({ field }) => (
                  <StringArrayField
                    label="Marketing Channels"
                    values={field.value || []}
                    onChange={field.onChange}
                    placeholder="e.g. SEO, Email, Social..."
                  />
                )}
              />

              <Controller
                control={control}
                name="marketAndCustomers.funnels"
                render={({ field }) => (
                  <StringArrayField
                    label="Sales Funnels"
                    values={field.value || []}
                    onChange={field.onChange}
                    placeholder="e.g. Free Trial, Book Demo..."
                  />
                )}
              />

              <Controller
                control={control}
                name="marketAndCustomers.ctas"
                render={({ field }) => (
                  <StringArrayField
                    label="Key CTAs"
                    values={field.value || []}
                    onChange={field.onChange}
                    placeholder="e.g. Get Started, Sign Up..."
                  />
                )}
              />

              <Controller
                control={control}
                name="marketAndCustomers.suppliers"
                render={({ field }) => (
                  <StringArrayField
                    label="Suppliers & Partners"
                    values={field.value || []}
                    onChange={field.onChange}
                    placeholder="e.g. AWS, Stripe..."
                  />
                )}
              />
            </div>
          </div>

          {/* Section 4: Branding & Style */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 flex flex-col gap-4">
            <h2 className="text-lg font-bold text-header border-b border-gray-100 pb-2">
              4. Branding & Style
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-secondary uppercase tracking-wider">Writing Style / Tone</label>
                <input
                  {...register("brandingAndStyle.writingStyle")}
                  placeholder="Not found — add manually"
                  className="px-3.5 py-2 border border-gray-200 rounded-lg text-sm text-secondary placeholder:text-desc placeholder:italic focus:outline-none focus:border-primary"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-secondary uppercase tracking-wider">Art & Visual Style</label>
                <input
                  {...register("brandingAndStyle.artStyle")}
                  placeholder="Not found — add manually"
                  className="px-3.5 py-2 border border-gray-200 rounded-lg text-sm text-secondary placeholder:text-desc placeholder:italic focus:outline-none focus:border-primary"
                />
              </div>

              <div className="md:col-span-2">
                <Controller
                  control={control}
                  name="brandingAndStyle.fonts"
                  render={({ field }) => (
                    <StringArrayField
                      label="Brand Fonts"
                      values={field.value || []}
                      onChange={field.onChange}
                      placeholder="e.g. Poppins, Inter..."
                    />
                  )}
                />
              </div>

              <div className="md:col-span-2">
                <Controller
                  control={control}
                  name="brandingAndStyle.colors"
                  render={({ field }) => (
                    <ColorSwatchesField
                      values={field.value || []}
                      onChange={field.onChange}
                    />
                  )}
                />
              </div>

              <div className="md:col-span-2">
                <Controller
                  control={control}
                  name="brandingAndStyle.logos"
                  render={({ field }) => (
                    <LogoThumbnailsField
                      values={field.value || []}
                      onChange={field.onChange}
                    />
                  )}
                />
              </div>
            </div>
          </div>

          {/* Section 5: Online Presence */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 flex flex-col gap-4">
            <h2 className="text-lg font-bold text-header border-b border-gray-100 pb-2">
              5. Online Presence & Socials
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-secondary uppercase tracking-wider">LinkedIn URL</label>
                <input
                  {...register("onlinePresence.linkedin")}
                  placeholder="Not found — add manually"
                  className="px-3.5 py-2 border border-gray-200 rounded-lg text-sm text-secondary placeholder:text-desc placeholder:italic focus:outline-none focus:border-primary"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-secondary uppercase tracking-wider">Facebook URL</label>
                <input
                  {...register("onlinePresence.facebook")}
                  placeholder="Not found — add manually"
                  className="px-3.5 py-2 border border-gray-200 rounded-lg text-sm text-secondary placeholder:text-desc placeholder:italic focus:outline-none focus:border-primary"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-secondary uppercase tracking-wider">Instagram URL</label>
                <input
                  {...register("onlinePresence.instagram")}
                  placeholder="Not found — add manually"
                  className="px-3.5 py-2 border border-gray-200 rounded-lg text-sm text-secondary placeholder:text-desc placeholder:italic focus:outline-none focus:border-primary"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-secondary uppercase tracking-wider">Twitter / X URL</label>
                <input
                  {...register("onlinePresence.twitter")}
                  placeholder="Not found — add manually"
                  className="px-3.5 py-2 border border-gray-200 rounded-lg text-sm text-secondary placeholder:text-desc placeholder:italic focus:outline-none focus:border-primary"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-secondary uppercase tracking-wider">YouTube URL</label>
                <input
                  {...register("onlinePresence.youtube")}
                  placeholder="Not found — add manually"
                  className="px-3.5 py-2 border border-gray-200 rounded-lg text-sm text-secondary placeholder:text-desc placeholder:italic focus:outline-none focus:border-primary"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-secondary uppercase tracking-wider">TikTok URL</label>
                <input
                  {...register("onlinePresence.tiktok")}
                  placeholder="Not found — add manually"
                  className="px-3.5 py-2 border border-gray-200 rounded-lg text-sm text-secondary placeholder:text-desc placeholder:italic focus:outline-none focus:border-primary"
                />
              </div>
            </div>
          </div>

          {/* Section 6: Key People */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-2">
              <h2 className="text-lg font-bold text-header">6. Key People</h2>
              <button
                type="button"
                onClick={() =>
                  appendKeyPerson({
                    id: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `kp_${Date.now()}`,
                    name: "",
                    title: "",
                    gender: "Unknown",
                    description: "",
                  })
                }
                className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-secondary font-medium text-xs rounded-lg transition-colors border border-gray-200"
              >
                + Add Person
              </button>
            </div>

            {keyPeopleFields.length === 0 ? (
              <p className="text-xs text-desc italic">No key people added yet.</p>
            ) : (
              <div className="flex flex-col gap-4">
                {keyPeopleFields.map((field, index) => (
                  <div key={field.id} className="p-4 border border-gray-200 rounded-xl flex flex-col gap-3 relative bg-gray-50/50">
                    <button
                      type="button"
                      onClick={() => removeKeyPerson(index)}
                      className="absolute top-3 right-3 text-desc hover:text-red-500 text-xs font-semibold"
                    >
                      Remove
                    </button>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pr-12">
                      <div className="flex flex-col gap-1">
                        <label className="text-xs font-medium text-secondary">Name</label>
                        <input
                          {...register(`keyPeople.${index}.name` as const, { required: true })}
                          placeholder="Full Name"
                          className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm text-secondary focus:outline-none focus:border-primary"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-xs font-medium text-secondary">Title / Role</label>
                        <input
                          {...register(`keyPeople.${index}.title` as const)}
                          placeholder="e.g. CEO & Founder"
                          className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm text-secondary focus:outline-none focus:border-primary"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-xs font-medium text-secondary">Gender</label>
                        <select
                          {...register(`keyPeople.${index}.gender` as const)}
                          className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm text-secondary focus:outline-none focus:border-primary"
                        >
                          <option value="Unknown">Unknown</option>
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                        </select>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-medium text-secondary">Bio / Description</label>
                      <textarea
                        rows={2}
                        {...register(`keyPeople.${index}.description` as const)}
                        placeholder="Brief background..."
                        className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm text-secondary focus:outline-none focus:border-primary"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section 7: Offerings */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-2">
              <h2 className="text-lg font-bold text-header">7. Products & Services (Offerings)</h2>
              <button
                type="button"
                onClick={() =>
                  appendOffering({
                    id: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `off_${Date.now()}`,
                    name: "",
                    category: "",
                    features: [],
                    description: "",
                    pricing: "",
                  })
                }
                className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-secondary font-medium text-xs rounded-lg transition-colors border border-gray-200"
              >
                + Add Offering
              </button>
            </div>

            {offeringsFields.length === 0 ? (
              <p className="text-xs text-desc italic">No products or services extracted yet.</p>
            ) : (
              <div className="flex flex-col gap-4">
                {offeringsFields.map((field, index) => (
                  <div key={field.id} className="p-4 border border-gray-200 rounded-xl flex flex-col gap-3 relative bg-gray-50/50">
                    <button
                      type="button"
                      onClick={() => removeOffering(index)}
                      className="absolute top-3 right-3 text-desc hover:text-red-500 text-xs font-semibold"
                    >
                      Remove
                    </button>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pr-12">
                      <div className="flex flex-col gap-1">
                        <label className="text-xs font-medium text-secondary">Offering Name</label>
                        <input
                          {...register(`offerings.${index}.name` as const, { required: true })}
                          placeholder="e.g. Standard Plan"
                          className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm text-secondary focus:outline-none focus:border-primary"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-xs font-medium text-secondary">Category</label>
                        <input
                          {...register(`offerings.${index}.category` as const)}
                          placeholder="e.g. Software, Consulting"
                          className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm text-secondary focus:outline-none focus:border-primary"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-xs font-medium text-secondary">Pricing / Model</label>
                        <input
                          {...register(`offerings.${index}.pricing` as const)}
                          placeholder="e.g. $49/mo, Custom"
                          className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm text-secondary focus:outline-none focus:border-primary"
                        />
                      </div>
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-medium text-secondary">Description</label>
                      <textarea
                        rows={2}
                        {...register(`offerings.${index}.description` as const)}
                        placeholder="Offering overview and value proposition..."
                        className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm text-secondary focus:outline-none focus:border-primary"
                      />
                    </div>

                    <Controller
                      control={control}
                      name={`offerings.${index}.features` as const}
                      render={({ field: featuresField }) => (
                        <StringArrayField
                          label="Features"
                          values={featuresField.value || []}
                          onChange={featuresField.onChange}
                          placeholder="Add a key feature..."
                        />
                      )}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section 8: FAQ */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-2">
              <h2 className="text-lg font-bold text-header">8. Frequently Asked Questions (FAQ)</h2>
              <button
                type="button"
                onClick={() =>
                  appendFaq({
                    question: "",
                    answer: "",
                  })
                }
                className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-secondary font-medium text-xs rounded-lg transition-colors border border-gray-200"
              >
                + Add FAQ Item
              </button>
            </div>

            {faqFields.length === 0 ? (
              <p className="text-xs text-desc italic">No FAQ items extracted yet.</p>
            ) : (
              <div className="flex flex-col gap-4">
                {faqFields.map((field, index) => (
                  <div key={field.id} className="p-4 border border-gray-200 rounded-xl flex flex-col gap-3 relative bg-gray-50/50">
                    <button
                      type="button"
                      onClick={() => removeFaq(index)}
                      className="absolute top-3 right-3 text-desc hover:text-red-500 text-xs font-semibold"
                    >
                      Remove
                    </button>
                    <div className="flex flex-col gap-1 pr-12">
                      <label className="text-xs font-medium text-secondary">Question</label>
                      <input
                        {...register(`faq.${index}.question` as const, { required: true })}
                        placeholder="e.g. How does pricing work?"
                        className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm text-secondary focus:outline-none focus:border-primary"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-medium text-secondary">Answer</label>
                      <textarea
                        rows={2}
                        {...register(`faq.${index}.answer` as const, { required: true })}
                        placeholder="Answer details..."
                        className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm text-secondary focus:outline-none focus:border-primary"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section 9: Legal & Compliance */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 flex flex-col gap-4">
            <h2 className="text-lg font-bold text-header border-b border-gray-100 pb-2">
              9. Legal & Compliance
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-secondary uppercase tracking-wider">Privacy Policy URL</label>
                <input
                  {...register("legal.privacyPolicyUrl")}
                  placeholder="Not found — add manually"
                  className="px-3.5 py-2 border border-gray-200 rounded-lg text-sm text-secondary placeholder:text-desc placeholder:italic focus:outline-none focus:border-primary"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-secondary uppercase tracking-wider">Terms of Service URL</label>
                <input
                  {...register("legal.termsOfServiceUrl")}
                  placeholder="Not found — add manually"
                  className="px-3.5 py-2 border border-gray-200 rounded-lg text-sm text-secondary placeholder:text-desc placeholder:italic focus:outline-none focus:border-primary"
                />
              </div>
            </div>
          </div>

          {/* Bottom Save Bar */}
          <div className="flex items-center justify-between border-t border-gray-200 pt-6">
            <button
              type="button"
              onClick={() => router.push("/knowledge")}
              className="text-desc hover:text-secondary text-sm font-medium transition-colors"
            >
              &larr; Scrape Another Site
            </button>

            <div className="flex flex-wrap items-center gap-3">
              {saveSuccess && (
                <span className="text-xs font-medium text-green-600 bg-green-50 px-2.5 py-1 rounded-lg border border-green-200 shrink-0">
                  Saved successfully!
                </span>
              )}
              <button
                type="button"
                onClick={() => {
                  const current = watch();
                  const blob = new Blob([JSON.stringify(current, null, 2)], { type: "application/json" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `${(current.companyName || "knowledge-base").toLowerCase().replace(/[^a-z0-9]+/g, "-")}.json`;
                  document.body.appendChild(a);
                  a.click();
                  a.remove();
                  URL.revokeObjectURL(url);
                }}
                className="px-3.5 py-2 bg-gray-100 hover:bg-gray-200 text-secondary text-xs font-semibold rounded-xl transition-colors border border-gray-200 whitespace-nowrap shrink-0"
              >
                Export JSON
              </button>
              <div className="shrink-0">
                <ActionButton onClick={handleSubmit(onSubmit)}>
                  {kb.status === "saved" ? "Update" : "Save Knowledge Base"}
                </ActionButton>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
