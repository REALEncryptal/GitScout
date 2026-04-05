import { Inngest } from "inngest";
import type { Events } from "./events";

export const inngest = new Inngest({
  id: "gitscout",
  schemas: new Map() as never, // Type helper for events
});

// Re-export typed for use in functions
export type InngestClient = typeof inngest;

// Type-safe event sending helper
export function createTypedClient() {
  return inngest as Inngest & {
    send: <K extends keyof Events>(
      event: { name: K; data: Events[K]["data"] } | { name: K; data: Events[K]["data"] }[]
    ) => Promise<void>;
  };
}
