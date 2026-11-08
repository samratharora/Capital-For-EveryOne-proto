"use client";

// Meet the demo people. Pick one and the real profile model reads their (synthetic) profile live: what it sees, how
// sure it is of each person type, and why. Then "Show their app" plays the reshape on Home.
import { ArrowRight, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { changesFor } from "@/lib/access/understand";
import { situationById } from "@/lib/access/catalogue";
import { DEMO_PEOPLE, type DemoPerson } from "@/lib/demo/people";
import { queueReshape } from "@/lib/demo/reshape";
import { describeActions } from "@/lib/preferences/schema";
import { PERSON_TYPE_COPY, PERSON_TYPES } from "@/lib/profile/catalog";
import { inferProfile } from "@/lib/profile/infer";
import { profileModel } from "@/lib/profile/model";

/** Each person's own colours for their avatar: soft, two-tone, and never the only way to tell people apart. */
const HUES: Record<string, [string, string]> = {
  margaret: ["#f6c27a", "#d9733f"],
  sam: ["#8fd3c7", "#2f7f9e"],
  priya: ["#b9a7f5", "#4b3a9c"],
  david: ["#f2a5a5", "#a33d55"],
  aisha: ["#a6d98a", "#3d7d3f"],
};

/** What the model's inputs mean, in words, for the "what it sees" chips. */
function seen(p: DemoPerson): string[] {
  const i = p.inputs;
  const out: string[] = [];
  if (i.utilisation !== null) out.push(`Uses ${Math.round(i.utilisation * 100)}% of the limit`);
  const kinds = i.payments.map((x) => x.kind);
  out.push(kinds.includes("statement") ? "Pays in full" : kinds.every((k) => k === "minimum") ? "Pays the minimum" : "Pays part of the bill");
  if (i.spendPauseOn) out.push("Spend Pause on");
  out.push(i.simpleView ? "Simple view" : "Detailed view");
  if (i.goalKinds.length) out.push(`${i.goalKinds.length} goal${i.goalKinds.length > 1 ? "s" : ""}`);
  if (i.needs.length) out.push(`Ticked ${i.needs.length} thing${i.needs.length > 1 ? "s" : ""} in About you`);
  const used = Object.entries(i.usage).filter(([, n]) => n > 0);
  if (used.length) out.push(`Uses ${used.map(([k]) => ({ dial: "Dial", learn: "the Learning Lab", whatIf: "what-if sums", goals: "goals", detailed: "Detailed view" })[k] ?? k).join(", ")}`);
  return out;
}

export function PeopleScreen() {
  const router = useRouter();
  const model = useMemo(() => profileModel(), []);
  const [chosen, setChosen] = useState<DemoPerson | null>(null);
  // Bumped on every pick, so the bars and reasons replay their entrance for each person.
  const [run, setRun] = useState(0);
  const result = useMemo(() => (chosen && model ? inferProfile(model, chosen.inputs) : null), [chosen, model]);

  if (!model) return <p role="status">The profile model isn&apos;t available, so the demo people can&apos;t be shown.</p>;

  const pick = (p: DemoPerson) => {
    setChosen(p);
    setRun((r) => r + 1);
    requestAnimationFrame(() => document.getElementById("model-reading")?.scrollIntoView({ behavior: "smooth", block: "start" }));
  };

  const show = () => {
    if (!chosen || !result?.type) return;
    const layout = result.adaptations.displayOffer;
    queueReshape({
      personId: chosen.id,
      name: chosen.name,
      typeTitle: PERSON_TYPE_COPY[result.type].title,
      confidence: result.confidence,
      steps: [
        { label: layout?.mode === "simple" || chosen.inputs.simpleView ? "Simple view" : "Detailed view", mode: layout?.mode ?? (chosen.inputs.simpleView ? "simple" : "complex"), actions: [] },
        ...(layout ? [{ label: layout.title, actions: layout.actions }] : []),
        ...chosen.situations.map((s) => ({ label: situationById(s).heard, actions: changesFor([s]).map((c) => c.action) })),
      ],
    });
    router.push("/account");
  };

  const sorted = result ? [...PERSON_TYPES].sort((a, b) => result.probabilities[b] - result.probabilities[a]) : [];

  return (
    <div className="flex flex-col gap-(--space)">
      <div className="flex flex-col gap-2">
        <h1 className="text-xl font-bold tracking-tight">Meet the demo people</h1>
        <p className="text-muted-foreground">
          Invented people with synthetic profiles. Pick one, and the app&apos;s profile model reads them live, then reshapes the app around them.
        </p>
      </div>

      <ul className="demo-people grid grid-cols-1 gap-(--space) sm:grid-cols-2 xl:grid-cols-3" aria-label="Demo people">
        {DEMO_PEOPLE.map((p, i) => {
          const [a, b] = HUES[p.id] ?? ["#ccc", "#666"];
          const on = chosen?.id === p.id;
          return (
            <li key={p.id} style={{ "--i": i } as React.CSSProperties} className="demo-person">
              <button
                type="button"
                onClick={() => pick(p)}
                aria-pressed={on}
                className={`elevated flex h-full w-full flex-col gap-3 rounded-2xl bg-card p-(--space) text-left transition-[transform,box-shadow] duration-300 hover:-translate-y-0.5 ${on ? "ring-4 ring-primary" : ""}`}
              >
                <span className="flex items-center gap-3">
                  <span aria-hidden className="demo-avatar" style={{ "--a": a, "--b": b } as React.CSSProperties}>
                    {p.name[0]}
                  </span>
                  <span>
                    <span className="block text-lg font-bold">{p.name}</span>
                    <span className="text-sm text-muted-foreground">{p.age}</span>
                  </span>
                </span>
                <span>{p.story}</span>
                <span className="text-sm italic text-muted-foreground">&ldquo;{p.said}&rdquo;</span>
              </button>
            </li>
          );
        })}
      </ul>

      {chosen && result && (
        <section key={run} id="model-reading" aria-labelledby="reading-h" aria-live="polite" className="demo-reading elevated flex scroll-mt-(--space) flex-col gap-5 rounded-2xl bg-card p-(--space)">
          <h2 id="reading-h" className="flex items-center gap-2 text-lg font-bold">
            <Sparkles aria-hidden className="size-[1.1em] text-primary" />
            How the profile model reads {chosen.name}
          </h2>

          <div className="flex flex-col gap-2">
            <h3 className="font-bold">What it sees</h3>
            <ul className="flex flex-wrap gap-2">
              {seen(chosen).map((s, i) => (
                <li key={s} style={{ "--i": i } as React.CSSProperties} className="demo-chip hairline rounded-full bg-accent px-3 py-1 text-sm text-accent-foreground">
                  {s}
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-col gap-2">
            <h3 className="font-bold">How sure it is of each type</h3>
            <ol className="flex flex-col gap-2">
              {sorted.map((t, i) => {
                const p = result.probabilities[t];
                const win = t === result.type;
                return (
                  <li key={t} style={{ "--i": i, "--w": `${Math.max(1, Math.round(p * 100))}%` } as React.CSSProperties} className="demo-bar-row">
                    <span className={`flex justify-between text-sm ${win ? "font-bold" : ""}`}>
                      <span>{PERSON_TYPE_COPY[t].title}</span>
                      <span>{Math.round(p * 100)}%</span>
                    </span>
                    <span aria-hidden className="demo-bar-track">
                      <span className={`demo-bar ${win ? "demo-bar-win" : ""}`} />
                    </span>
                  </li>
                );
              })}
            </ol>
          </div>

          {result.type ? (
            <div className="demo-verdict flex flex-col gap-2">
              <p className="text-lg font-bold">
                {PERSON_TYPE_COPY[result.type].title}, {Math.round(result.confidence * 100)}% sure
              </p>
              <ul className="flex flex-col gap-1">
                {result.reasons.map((r, i) => (
                  <li key={r} style={{ "--i": i } as React.CSSProperties} className="demo-reason">
                    {r}
                  </li>
                ))}
              </ul>
              <h3 className="mt-2 font-bold">What changes for {chosen.name}</h3>
              <ul className="flex list-disc flex-col gap-1 pl-5">
                {result.adaptations.displayOffer && <li>From the model: {result.adaptations.displayOffer.title.toLowerCase()}.</li>}
                {chosen.situations.map((s) => (
                  <li key={s}>From what {chosen.name} told Dial: {describeActions(changesFor([s]).map((c) => c.action))}.</li>
                ))}
              </ul>
              <button type="button" onClick={show} className="mt-2 inline-flex min-h-(--target-min) items-center justify-center gap-2 self-start rounded-full bg-primary px-5 font-bold text-primary-foreground">
                Show {chosen.name}&apos;s app
                <ArrowRight aria-hidden className="size-[1.1em]" />
              </button>
            </div>
          ) : (
            <p>The model isn&apos;t sure enough about {chosen.name} (under {Math.round(model.threshold * 100)}%), so the app would ask rather than guess.</p>
          )}
          <p className="text-sm text-muted-foreground">
            Trained on synthetic data only ({model.version}). The real app only uses this with the person&apos;s consent, and never changes anything until they say yes.
          </p>
        </section>
      )}
    </div>
  );
}
