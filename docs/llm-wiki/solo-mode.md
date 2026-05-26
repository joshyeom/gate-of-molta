# Solo Mode And AI Difficulty

This page defines the project-specific solo/automa plan. It is a custom digital adaptation unless an official solo source is found later.

## Setup Model

The game should allow a total table size from 2 to 5 participants.

For the first browser-only solo release:

- `totalPlayers`: 2, 3, 4, or 5.
- `humanPlayers`: 1.
- `aiPlayers`: `totalPlayers - 1`.
- All AI seats use the selected difficulty by default.
- Future versions may allow per-seat difficulty, local hotseat humans, or online humans, but the first implementation should keep one human plus AI seats.

The base rules engine should still model normal player seats and turn order. AI should be a system actor that dispatches the same legal actions a human player can take.

## Design Principles

- Difficulty should change AI decision quality, not core game rules.
- AI must not peek at hidden deck order or hidden hands unless a card effect legally reveals that information.
- AI decisions must be deterministic for the same seed, visible state, difficulty, and action history.
- Tie-breaking randomness should use the seeded game RNG or a deterministic AI RNG stream.
- AI logic must live outside React and browser APIs.
- The UI may speed up or summarize AI turns, but it must not decide AI actions.

## Difficulty Levels

| Difficulty | Intent | Algorithm | Lookahead | Player Interaction |
| --- | --- | --- | --- | --- |
| Easy | Learnable and forgiving | Greedy single-action heuristic | Current action only | Mostly ignores opponents |
| Normal | Baseline solo opponent | Weighted heuristic over a full 3-action turn | Current turn | Light blocking and target planning |
| Hard | Strong tactical opponent | Beam search / bounded lookahead with public-memory scoring | Current turn plus likely next turn | Actively denies key market cards |
| Expert | High-pressure challenge | Probabilistic rollout / expectimax over legal visible information | Multi-turn sampled plans | Strong blocking, endgame timing, and opponent modeling |

Recommended MVP implementation:

- Implement Easy first because it validates legal AI action generation.
- Implement Normal as the first default difficulty.
- Add Hard after verified card effects are stable.
- Add Expert only after full rules, performance budgets, and AI test fixtures exist.

## Easy

Easy AI should be intentionally simple.

Behavior:

- Evaluates one legal action at a time.
- Activates a character if it can pay the cost, prioritizing highest immediate power.
- Otherwise places a visible character with the highest simple value if the gate has space.
- Otherwise takes a pearl that helps the closest visible gate character requirement.
- Draws from deck if no visible market choice has obvious value.
- Refreshes the pearl market only when all visible choices look useless by a simple score.
- Does not intentionally block the human player.
- Uses random or low-weight tie-breaking so it feels imperfect.

Purpose:

- Good for onboarding, rule learning, and testing.
- Easy to debug because each action has a short reason.

## Normal

Normal AI should feel competent without being oppressive.

Behavior:

- Scores short 3-action turn plans instead of one action at a time.
- Tracks its own hand, gate characters, diamonds, and activation targets.
- Values pearls by flexibility and by whether they complete known requirements.
- Places characters based on expected activation feasibility, power, diamonds, and ability status.
- Uses diamonds when they complete a useful activation.
- Lightly blocks the human by taking a pearl or character if the human visibly benefits a lot from it.
- Avoids wasting actions when hand limit pressure will force discards.
- Uses small deterministic randomness for personality and replay variety.

Purpose:

- Recommended default.
- Strong enough to create market pressure while still beatable without perfect play.

## Hard

Hard AI should punish inefficient play.

Behavior:

- Uses bounded search over candidate 3-action plans.
- Keeps public memory: seen discards, visible markets, activated cards, and known card counts.
- Estimates draw odds from remaining deck composition, not hidden deck order.
- Scores opportunity cost, action efficiency, hand-limit waste, diamond leverage, and character-slot pressure.
- Blocks high-value market cards when the human is close to activating or reaching the end-game threshold.
- Times activation to trigger or avoid the final round when advantageous.
- Uses fewer random tie-breaks than Normal.

Purpose:

- Good for players who already understand card requirements and tempo.
- Still fair because it uses only public information and probability.

## Expert

Expert AI should be a challenge mode, not the MVP baseline.

Behavior:

- Uses sampled rollouts or expectimax-style evaluation from a sanitized visible-information state.
- Models likely opponent goals from visible gate characters, hand size, diamonds, and recent actions.
- Optimizes endgame timing, tiebreaker diamonds, and denial moves.
- Re-evaluates the value of market refreshes based on deck composition and opponent needs.
- Uses very low randomness, mostly for equivalent scores.
- Can use per-seat personalities later, such as aggressive activator, market denier, or resource hoarder, but these should be deterministic strategy profiles.

Purpose:

- High-pressure solo mode after the game has stable verified content.
- Requires performance budgets so AI turns do not stall the UI.

## Scoring Features

AI heuristics should be built from reusable scoring features rather than hardcoded card names where possible.

Useful features:

- Immediate power gained.
- Expected power from gate characters.
- Pearl requirement completion distance.
- Pearl flexibility across multiple requirements.
- Diamond count and expected diamond usefulness.
- Character-slot pressure on the gate.
- Hand-limit discard risk.
- Market denial value against the human.
- Refresh value for bad markets.
- End-game trigger value or danger.
- Tie-breaker value from diamonds near game end.

Card-specific effects can add feature hooks after the card data is verified.

## Player Count Scaling

Player count should affect table pressure, not rules shortcuts.

- 2 players: one human and one AI; direct duel, more predictable market control.
- 3 players: one human and two AI seats; enough market churn for a strong default solo mode.
- 4 players: one human and three AI seats; more volatile markets and more blocking opportunities.
- 5 players: one human and four AI seats; highest market churn, longest rounds, and most endgame timing complexity.

The first recommended default is 3 total players on Normal difficulty. It gives the solo player more interaction than a duel without making AI turns too long.

## Engine Interface

Recommended types:

```ts
type AiDifficulty = "easy" | "normal" | "hard" | "expert";

type GameSetupOptions = {
  totalPlayers: 2 | 3 | 4 | 5;
  humanPlayerCount: 1;
  aiDifficulty: AiDifficulty;
  seed: string;
};

type AiDecisionContext = {
  state: VisibleGameStateForActor;
  actorId: PlayerId;
  difficulty: AiDifficulty;
};
```

Recommended flow:

1. Build a visible-state snapshot for the AI actor.
2. Enumerate legal actions or legal turn plans.
3. Score candidates using the difficulty policy.
4. Pick the best candidate with deterministic tie-breaking.
5. Dispatch the chosen action through the normal engine reducer.

## Open Questions

- Should the first UI expose all four difficulties immediately, or show Hard/Expert as later unlocks?
- Should AI seats share one difficulty, or should advanced setup allow per-seat difficulty?
- Should the default table size be 2 or 3 players?
- Should future challenge modes add rule handicaps, or should difficulty remain AI-quality-only?

