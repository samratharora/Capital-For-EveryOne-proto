// Demo people: invented, synthetic profiles for showing the profile model at work. Each has the same kind of inputs
// the real model reads on the server (lib/profile/features.ts): share of the limit used, how they pay, goals, Spend
// Pause, view, what they ticked on "About you", and how they use the app. The demo runs the real trained model on
// them in the browser, so the person type, confidence and reasons on screen are the model's own output.
// Plus, separately, what each person told Dial about themselves (lib/access/catalogue.ts situations), which shapes
// how the app looks, as it would for a real person.
//
// No real person is described. Names and stories are made up for the demo.
import type { SituationId } from "../access/catalogue";
import { emptyUsage, type ProfileInputs } from "../profile/features";

export interface DemoPerson {
  id: string;
  name: string;
  age: number;
  /** Two short lines: who they are, in their own world. */
  story: string;
  /** What they said to Dial about themselves, in their words. */
  said: string;
  situations: SituationId[];
  inputs: ProfileInputs;
}

const usage = (u: Partial<ReturnType<typeof emptyUsage>>) => ({ ...emptyUsage(), ...u });

export const DEMO_PEOPLE: readonly DemoPerson[] = [
  {
    id: "margaret",
    name: "Margaret",
    age: 78,
    story: "Retired teacher with cataracts. Got her first smartphone last year and still isn't sure about apps.",
    said: "I can't see small writing, and I'm not very good with apps.",
    situations: ["low_vision"],
    inputs: { utilisation: 0.22, payments: [{ kind: "statement" }], goalKinds: [], spendPauseOn: false, simpleView: true, needs: ["digital", "plain_words", "step_by_step"], usage: usage({ dial: 8 }) },
  },
  {
    id: "sam",
    name: "Sam",
    age: 23,
    story: "First job, first credit card. Dyslexic, and wants to get his credit file in good shape.",
    said: "I'm dyslexic and this is my first credit card.",
    situations: ["reading"],
    inputs: { utilisation: 0.62, payments: [{ kind: "minimum" }], goalKinds: ["pay_on_time"], spendPauseOn: false, simpleView: false, needs: ["new_to_credit", "numbers"], usage: usage({ learn: 6, dial: 2 }) },
  },
  {
    id: "priya",
    name: "Priya",
    age: 31,
    story: "Night-shift nurse. Her hours, and her pay, change every month, and checks her card at 3am.",
    said: "I check my phone at night after shifts and it's too bright.",
    situations: ["night_vision"],
    inputs: { utilisation: 0.86, payments: [{ kind: "minimum" }], goalKinds: [], spendPauseOn: true, simpleView: true, needs: ["irregular_income", "money_tight"], usage: usage({ dial: 3 }) },
  },
  {
    id: "david",
    name: "David",
    age: 52,
    story: "Has Parkinson's. His wife died this spring, the household income has dropped, and he's taken over the money.",
    said: "My hands shake, so I keep pressing the wrong thing.",
    situations: ["dexterity"],
    inputs: { utilisation: 0.4, payments: [{ kind: "custom" }], goalKinds: ["pay_on_time"], spendPauseOn: false, simpleView: true, needs: ["bereavement", "income_change", "short_answers"], usage: usage({ dial: 4 }) },
  },
  {
    id: "aisha",
    name: "Aisha",
    age: 29,
    story: "Saving for a deposit. Loves a spreadsheet, pays in full every month, and is colour blind.",
    said: "I'm colour blind, so the red and green warnings all look the same to me.",
    situations: ["colour_vision"],
    inputs: { utilisation: 0.12, payments: [{ kind: "statement" }], goalKinds: ["save_up", "category_cap"], spendPauseOn: false, simpleView: false, needs: [], usage: usage({ whatIf: 7, detailed: 9, goals: 5 }) },
  },
];

export const demoPersonById = (id: string) => DEMO_PEOPLE.find((p) => p.id === id) ?? null;
