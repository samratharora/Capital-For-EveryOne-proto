"use client";

// Plays a demo person's app on Home: it starts from the standard look, then each step lands in turn (their view, the
// profile model's layout, then what they told Dial), with sections gliding to their new places (View Transitions,
// one name per section in home-screen.tsx) and a soft wash of colour across the screen. Reduced motion: all at once.
// Then a small banner says whose app this is, with a way back. Demo only: nothing here is saved beyond this visit.
import { RotateCcw, Users } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { prefersReducedMotion, reveal } from "@/lib/access/reveal";
import { clearDemoPerson, currentDemoPerson, finishPendingReshape, pendingReshape, type ReshapePlan } from "@/lib/demo/reshape";
import { usePreferences } from "@/lib/preferences/provider";
import { useMode } from "@/lib/state/mode-context";

/** Slower than an adaptation's steps, so each change of a whole app can be seen and read. */
const STEP_MS = 1300;

export function DemoReshape() {
  const prefsApi = usePreferences();
  const { setMode } = useMode();
  const [person, setPerson] = useState<ReshapePlan | null>(null);
  const [step, setStep] = useState<string | null>(null);
  const live = useRef({ prefsApi, setMode });
  live.current = { prefsApi, setMode };

  useEffect(() => {
    const plan = pendingReshape();
    setPerson(plan ?? currentDemoPerson());
    if (!plan) return;
    const { prefsApi: p, setMode: mode } = live.current;
    // Start from the standard look, so everyone sees the same app become this person's.
    p.resetToDefault();
    mode("complex");
    // The "Make it yours" invitation belongs to a real first visit, not to a demo person's app.
    p.apply([{ type: "onboarding", value: "skipped" }], { save: false });
    let applied = 0;
    const root = document.documentElement;
    root.setAttribute("data-reshaping", "true");
    const cancel = reveal(
      plan.steps.length,
      (n) => {
        for (; applied < n; applied++) {
          const s = plan.steps[applied];
          if (s.mode) live.current.setMode(s.mode);
          if (s.actions.length) live.current.prefsApi.apply(s.actions, { save: false });
          setStep(s.label);
        }
        if (n === plan.steps.length) {
          finishPendingReshape();
          setTimeout(() => root.removeAttribute("data-reshaping"), 900);
        }
      },
      { reduced: prefersReducedMotion(p.prefs.motion), gapMs: STEP_MS },
    );
    return () => {
      cancel();
      root.removeAttribute("data-reshaping");
    };
  }, []);

  if (!person) return null;

  const reset = () => {
    prefsApi.resetToDefault();
    setMode("complex");
    clearDemoPerson();
    setPerson(null);
  };

  return (
    <section aria-label="Demo person" className="demo-banner hairline flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-card p-(--space)">
      <div className="flex flex-col">
        <p className="font-bold">Demo: {person.name}&apos;s app</p>
        <p className="text-sm text-muted-foreground">
          The profile model read {person.name} as &ldquo;{person.typeTitle}&rdquo; ({Math.round(person.confidence * 100)}% sure).
        </p>
        <p role="status" className="text-sm font-semibold">
          {step ?? ""}
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Link href="/account/demo-people" className="hairline inline-flex min-h-(--target-min) items-center gap-2 rounded-full bg-card px-4 font-bold">
          <Users aria-hidden className="size-[1.1em]" />
          Someone else
        </Link>
        <button type="button" onClick={reset} className="hairline inline-flex min-h-(--target-min) items-center gap-2 rounded-full bg-card px-4 font-bold">
          <RotateCcw aria-hidden className="size-[1.1em]" />
          Reset
        </button>
      </div>
    </section>
  );
}
