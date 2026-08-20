import { NextResponse } from "next/server";
import { validateUrl } from "@/app/lib/validateUrl";
import { scrapeWebsite } from "@/app/lib/scraper";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const rawUrl = body.url || body.targetUrl;

    if (!rawUrl || typeof rawUrl !== "string") {
      return NextResponse.json(
        { error: "Please provide a valid website URL to scrape." },
        { status: 400 }
      );
    }

    const validation = validateUrl(rawUrl);
    if (!validation.ok) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    const scrapedData = await scrapeWebsite(validation.url);
    return NextResponse.json(scrapedData);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to scrape website";
    const status = message.includes("timed out") ? 504 : 502;

    return NextResponse.json(
      { error: `Could not scrape website: ${message}` },
      { status }
    );
  }
}
