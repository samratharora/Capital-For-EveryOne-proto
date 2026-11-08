// The demo people are only useful if the real model reads them the way their stories say. If the model is retrained
// and stops agreeing, this fails, so the demo never quietly shows something different from what the presenter says.
import { describe, expect, it } from "vitest";
import { profileModel } from "../profile/model";
import { inferProfile } from "../profile/infer";
import { SITUATION_IDS } from "../access/catalogue";
import { DEMO_PEOPLE } from "./people";

const EXPECTED = { margaret: "clear_simple", sam: "building", priya: "stretched", david: "life_change", aisha: "planner" } as const;

describe("demo people, read by the real profile model", () => {
  const model = profileModel()!;
  it.each(DEMO_PEOPLE.map((p) => [p.name, p] as const))("%s", (_name, p) => {
    const r = inferProfile(model, p.inputs);
    console.log(p.name, r.type, r.confidence, r.reasons.join("; "));
    expect(r.type).toBe(EXPECTED[p.id as keyof typeof EXPECTED]);
    expect(r.source).toBe("model");
    expect(r.reasons.length).toBeGreaterThan(0);
  });
  it("each person's own words map to real situations", () => {
    for (const p of DEMO_PEOPLE) for (const s of p.situations) expect(SITUATION_IDS).toContain(s);
  });
});
