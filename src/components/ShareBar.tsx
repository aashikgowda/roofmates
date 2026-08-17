"use client";

import { useState } from "react";

// Shows the household code and a one-tap copy of the invite link.
export default function ShareBar({ code }: { code: string }) {
  const [copied, setCopied] = useState<"code" | "link" | null>(null);

  async function copy(kind: "code" | "link") {
    const text =
      kind === "code"
        ? code
        : `${window.location.origin}/h/${code}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(kind);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      // Clipboard may be unavailable; ignore silently.
    }
  }

  return (
    <div className="mt-4 flex flex-wrap items-center gap-2 rounded-xl border bg-card px-4 py-3">
      <span className="text-sm text-muted">Invite housemates:</span>
      <button
        onClick={() => copy("code")}
        className="font-mono font-semibold tracking-widest text-brand hover:underline"
        title="Copy code"
      >
        {code}
      </button>
      <span className="ml-auto flex gap-2">
        <button onClick={() => copy("code")} className="btn-ghost">
          {copied === "code" ? "Copied ✓" : "Copy code"}
        </button>
        <button onClick={() => copy("link")} className="btn-ghost">
          {copied === "link" ? "Copied ✓" : "Copy link"}
        </button>
      </span>
    </div>
  );
}
