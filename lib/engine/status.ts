/** Opportunity statuses (docs/DESIGN.md). No dependencies: safe for the phone bundle. */

export const STATUSES = [
  "captured", "researching", "needs_verification", "draft_ready", "published",
  "contacted", "interested", "follow_up", "won", "lost",
] as const;
export type Status = (typeof STATUSES)[number];

export const STATUS_LABEL: Record<Status, string> = {
  captured: "Captured",
  researching: "Researching",
  needs_verification: "Verify",
  draft_ready: "Draft ready",
  published: "Published",
  contacted: "Contacted",
  interested: "Interested",
  follow_up: "Follow-up",
  won: "Won",
  lost: "Lost",
};

/** Statuses the founders set by hand. The others come from research and publishing (OE-06 to OE-14). */
export const MANUAL_STATUSES: Status[] = ["contacted", "interested", "follow_up", "won", "lost"];

/** Home groups. */
export const PROCESSING: Status[] = ["captured", "researching", "needs_verification"];
export const READY: Status[] = ["draft_ready", "published"];
export const FOLLOWING: Status[] = ["contacted", "interested", "follow_up", "won", "lost"];

/** Filter chips on the All tab. */
export const FILTERS: { key: string; label: string; statuses: Status[] | null }[] = [
  { key: "all", label: "All", statuses: null },
  { key: "processing", label: "Processing", statuses: PROCESSING },
  { key: "ready", label: "Ready", statuses: READY },
  { key: "contacted", label: "Contacted", statuses: ["contacted"] },
  { key: "interested", label: "Interested", statuses: ["interested"] },
  { key: "follow_up", label: "Follow-up", statuses: ["follow_up"] },
  { key: "won", label: "Won", statuses: ["won"] },
  { key: "lost", label: "Lost", statuses: ["lost"] },
];

export const isStatus = (v: unknown): v is Status => typeof v === "string" && (STATUSES as readonly string[]).includes(v);
