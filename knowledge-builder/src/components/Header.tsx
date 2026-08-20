import Link from "next/link";
import ActionButton from "./ActionButton";

export default function Header() {
  return (
    <header className="fixed top-6 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-6xl bg-white/80 backdrop-blur-md rounded-full border border-gray-200/70 shadow-sm px-6 py-3 flex items-center justify-between transition-all">
      <Link href="/" className="flex items-center gap-2">
        <img src="/moflo_icon.avif" alt="MoFlo Icon" className="h-6 w-auto" />
        <img src="/moflo_text.avif" alt="MoFlo" className="h-4.5 w-auto" />
      </Link>

      <div className="flex items-center gap-6">
        <Link
          href="/knowledge/view"
          className="text-secondary hover:text-primary font-medium text-sm transition-colors duration-300"
        >
          History
        </Link>
        <ActionButton href="/knowledge">Try Knowledge</ActionButton>
      </div>
    </header>
  );
}
