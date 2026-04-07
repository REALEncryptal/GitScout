"use client";

import { Button } from "@/components/ui/button";
import { triggerScout } from "@/lib/actions/trigger-scout";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Radar, Loader2 } from "lucide-react";

interface ScoutTriggerButtonProps {
  credits: number;
  isScanning: boolean;
}

export function ScoutTriggerButton({
  credits,
  isScanning: initialIsScanning,
}: ScoutTriggerButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [started, setStarted] = useState(false);

  const isScanning = initialIsScanning || started;
  const disabled = loading || isScanning || credits <= 0;

  async function handleClick() {
    setLoading(true);
    try {
      const result = await triggerScout();
      setStarted(true);
      toast.success("Scouting started!", {
        description: `${result.creditsRemaining} credit${result.creditsRemaining !== 1 ? "s" : ""} remaining. This runs in the background — the pipeline status below will update automatically.`,
        duration: 6000,
      });
      setTimeout(() => router.refresh(), 3000);
    } catch (error) {
      toast.error("Failed to start scouting", {
        description:
          error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      onClick={handleClick}
      disabled={disabled}
      size="lg"
      className="gap-2"
    >
      {loading || isScanning ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Radar className="h-4 w-4" />
      )}
      {isScanning
        ? "Scanning..."
        : credits <= 0
          ? "No Credits"
          : "Start Scouting"}
    </Button>
  );
}
