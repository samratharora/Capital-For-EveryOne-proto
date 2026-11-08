// Hand-off between the demo people page and Home: which person to reshape the app for. Session only (this tab), so
// it never outlives the demo. Read once by DemoReshape on Home, which then plays the reshape.
import type { Mode } from "../types";
import type { UiAction } from "../preferences/schema";

export const PENDING_KEY = "cfe-demo-reshape";
export const CURRENT_KEY = "cfe-demo-person";

export interface ReshapePlan {
  personId: string;
  name: string;
  typeTitle: string;
  confidence: number;
  /** Played in order, one step at a time: the view, then the model's layout, then what they told Dial. */
  steps: { label: string; mode?: Mode; actions: UiAction[] }[];
}

const read = (key: string): ReshapePlan | null => {
  try {
    const v = sessionStorage.getItem(key);
    return v ? (JSON.parse(v) as ReshapePlan) : null;
  } catch {
    return null;
  }
};

export function queueReshape(plan: ReshapePlan) {
  try {
    sessionStorage.setItem(PENDING_KEY, JSON.stringify(plan));
    sessionStorage.setItem(CURRENT_KEY, JSON.stringify(plan));
  } catch {}
}

/**
 * The reshape waiting to play. It stays queued until finishPendingReshape(), so if Home is mounted twice (React's
 * development double mount, or a quick navigation away and back) the reshape still plays rather than being lost.
 */
export const pendingReshape = () => read(PENDING_KEY);

export function finishPendingReshape() {
  try {
    sessionStorage.removeItem(PENDING_KEY);
  } catch {}
}

export const currentDemoPerson = () => read(CURRENT_KEY);
export function clearDemoPerson() {
  try {
    sessionStorage.removeItem(CURRENT_KEY);
    sessionStorage.removeItem(PENDING_KEY);
  } catch {}
}
