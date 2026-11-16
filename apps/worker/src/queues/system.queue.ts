/**
 * The platform's own queue. Module queues follow the same pattern: the queue name and every job
 * name start with the module key (rule R7), e.g. queue "sales", job "sales.invoice-pdf".
 * When the API starts producing jobs, these names and payload types move to the producing
 * module's `contracts/` folder so both sides share them.
 */
export const SYSTEM_QUEUE = "system";

export const SYSTEM_JOBS = {
  /** Round-trip check: proves Redis, the queue and a worker are all working. */
  ping: "system.ping",
} as const;

export interface SystemPingData {
  /** ISO time the producer added the job. */
  sentAt: string;
}

export interface SystemPingResult {
  pong: true;
  sentAt: string;
  processedAt: string;
  /** How long the job waited in the queue before a worker picked it up. */
  waitedMs: number;
}
