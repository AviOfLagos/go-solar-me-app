# Go Solar Me: design rules

The app should feel calm and easy: one clear thing to do on every screen, short guided steps, and visible progress toward a real goal.

## Look

| Token | Value | Use |
|---|---|---|
| `bg` | `#F3F2EC` warm off-white | Screen background |
| `card` | `#FFFFFF` | Cards and sheets |
| `ink` | `#17201B` green-black | Text, primary buttons, dark cards |
| `mute` | `#6E7670` | Secondary text |
| `line` | `#E5E3DB` | Borders, dividers |
| `mint` | `#BDF0A6` | Brand accent: selected states, progress, highlights |
| `mintDeep` | `#2F7D4F` | Accent text on light backgrounds (AA contrast) |
| `lemon` | `#F4F1A8` | Second accent: tips, "suggested", savings |
| `night` | `#1D2621` | Dark hero cards |

- **Type:** Manrope. Big headings are light (300), not bold. Body 15–16px. Labels semibold.
- **Shapes:** cards 24px corners, buttons are full pills, chips are pills.
- **Buttons:** primary is ink with white text. Secondary is white with a hairline border. Only one primary per screen.
- **Tab bar:** a floating pill, four tabs at most.
- **Imagery:** real homes with panels in warm light. Photos lead onboarding and home.
- **Motion:** gentle (150–250 ms), confirm progress, never decorate.

## Rules (and where they come from)

1. **One question per screen.** Ask the next thing only after the last one is answered. *(NN/g: ask one question at a time; progressive disclosure)*
2. **Few choices, one suggestion.** Show at most three options; mark one "Suggested" from the person's role; put the rest behind "More ways". *(Hick's law: decision time grows with the number of choices)*
3. **Wizards for anything over one screen.** Kit finder, checkout and Go Solar Me setup are steppers:
   - Show a progress bar and "Step 2 of 3".
   - Name the next step on the button ("Next: delivery"), not just "Next".
   - Back always works and keeps answers.
   - Answers are remembered if the person leaves. *(NN/g wizard guidelines)*
4. **Say what's coming.** Before a flow starts, say how long it takes ("3 quick questions"). *(NN/g: transparency)*
5. **Start people with progress.** The first step should be pre-filled from what we know (role, last answers), so the bar never starts at zero. *(Endowed progress: 34% vs 19% completion)*
6. **Make the finish line visible.** Progress bars count down near the end ("1 step left"). Go Solar Me shows milestones at 25, 50, 75 and 100%. *(Goal-gradient effect)*
7. **Celebrate real wins only.** These are paying, getting funded and the kit being installed. Never invent goals or move the finish line to keep people grinding.
8. **Show the payoff in naira.** "You save about ₦96,000 a month on fuel" beats kW figures. Specs go one tap deeper.
9. **Plain words.** Write at a 6th–8th grade reading level. Use "light", not "load"; "hours without NEPA", not "autonomy".
10. **Errors next to the field, in plain words, with the fix.**

## Gamification we use (and don't)

**We use:**
- Progress bars in every flow.
- Milestone badges on funding pages.
- A savings counter on the kit match.
- "Lists shared" and "clients who bought" counters for installers.
- A short celebration on success.

**We don't use:** streaks, points, leaderboards, fake countdowns or scarcity. This is a big purchase, so trust matters more than engagement.

Sources:
- [NN/g: Wizards](https://www.nngroup.com/articles/wizards/)
- [NN/g: 4 principles to reduce cognitive load in forms](https://www.nngroup.com/articles/4-principles-reduce-cognitive-load/)
- [Yu-kai Chou: goal-gradient and endowed progress](https://yukaichou.com/behavioral-analysis/goal-gradient-hypothesis-hull-kivetz-motivation-acceleration/)
- [Hick's law in UX](https://uxcel.com/blog/hicks-law-in-ux-design-simplifying-choices-for-faster-decisions)
