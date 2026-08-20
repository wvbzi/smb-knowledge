import ActionButton from "@/components/ActionButton";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-background text-secondary">
      <main className="flex flex-col items-center justify-center text-center max-w-4xl gap-10">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-secondary leading-[1.15]">
          Knowledge is <span className="text-primary">the foundation</span> of how MoFlo learns your business.
        </h1>

        <div className="flex items-center justify-center">
          <ActionButton href="/knowledge">Try Knowledge</ActionButton>
        </div>
      </main>
    </div>
  );
}

