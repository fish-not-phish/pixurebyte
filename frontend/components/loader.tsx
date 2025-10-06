"use client";

import { Loader2 } from "lucide-react";

export default function Loading({ text = "Loading..." }: { text?: string }) {
  return (
    <div className="flex items-center justify-center">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      <span className="ml-2 text-muted-foreground">{text}</span>
    </div>
  );
}
