# Rules Capture

This file is the working source for the actual board-game rules of "몰타의 관문".

Do not implement gameplay rules until the relevant section is filled in or otherwise verified.

## Rule Source

- Primary source: WING Board Game "몰타의 관문" article, accessed 2026-05-23.
- Confirmation source: Korea Boardgames YouTube video "몰타의 관문 게임 소개 영상", accessed 2026-05-23.
- Source note: `../llm-sources/2026-05-23-gate-of-molta-rule-links.md`
- BoardLife source status: provided by user but blocked by Cloudflare challenge in the agent environment.
- Character metadata candidate: `../llm-sources/2026-05-23-tts-character-verification.json`
- Character metadata status: TTS-derived verification checklist only; not canonical rules, final app data, or asset permission.
- Notes: this capture is enough for the core turn loop and pearl number distribution. Character card data is still incomplete; solo mode is a custom draft in `solo-mode.md`.

## Components

- Player count: 2-5 in the original game.
- Play time: about 45 minutes.
- Board: no central board identified; play uses shared open-card rows and each player's gate card/tableau.
- Cards:
  - Pearl cards: 64.
  - Pearl cards are numbered 1-8, with 8 cards of each number.
  - Character cards: current prototype deck uses every fixture card entry as exactly one physical card.
  - Player gate cards: 5.
- Tokens:
  - No separate physical token type confirmed from the source.
  - Diamond resources appear to be represented by cards drawn from the character deck and placed on the left side of a player's gate.
- Player pieces:
  - Each player has one gate card.
- Other:
  - Original source does not describe solo components.

## Setup

- Separate the pearl cards and character cards, then shuffle each deck.
- Reveal 4 pearl cards in the center as open pearl cards.
- Place the remaining pearl cards face-down as the pearl draw pile/acquisition pile.
- Reveal 2 character cards in the center as open character cards.
- Place the remaining character cards face-down as the character draw pile/acquisition pile.
- Each player takes one gate card and places it in front of them.
- No starting hand/resource distribution was identified; the YouTube explanation states players start with only their gate.
- Current digital prototype exception: the app currently deals 5 pearl cards to each player at setup because the user requested playable starting hands. Treat this as a custom prototype rule until reconciled with an official rulebook or explicit final design.
- Choose a start player.
- The start player flips their gate so the start-player symbol is visible.
- The source says the open-card refresh effect from a pearl card is not applied during initial setup.

## Game Structure

- Round structure:
  - Starting with the start player, players take turns clockwise.
  - A round is complete after every player from start player through last player has taken a turn.
- Turn structure:
  - On a turn, the active player performs exactly 3 actions.
  - The player may choose actions in any order.
  - The same action may be repeated.
  - After the final action, the active player applies the pearl hand limit.
- Phase order:
  - Start-of-turn/before-action timing for some blue abilities, if active.
  - Three player actions.
  - End-of-action timing for some blue abilities, if active.
  - End-of-turn hand limit.
- End-of-round rules:
  - End-game timing depends on a player reaching at least 12 power.

## Player Actions

List every legal player action and when it can be taken.

| Action | Timing | Cost | Effect | Notes |
| --- | --- | --- | --- | --- |
| Gain 1 pearl card | During one of the 3 actions | 1 action | Take 1 open pearl card or the top card of the pearl draw pile into hand. | If an open pearl is taken, refill the open pearl row to 4. |
| Replace all open pearl cards | During one of the 3 actions | 1 action | Discard all 4 open pearl cards and reveal 4 new pearl cards. | Need confirmation whether refresh symbols revealed this way trigger character-row refresh. |
| Place 1 character on gate | During one of the 3 actions | 1 action | Take 1 open character card or the top card of the character draw pile and place it on the player's gate. | If an open character is taken, refill to 2. Gate capacity is 2 characters. |
| Activate 1 character on gate | During one of the 3 actions | 1 action plus required pearl cards | Discard pearl cards matching that character's required combination, then move the character to the right side of the gate as activated. | Activated characters provide power, possible diamonds, and possible special abilities. |

### Pearl Card Gain Details

- If the active player takes an open pearl card, immediately refill the open pearl row from the pearl draw pile.
- If any pearl card with the refresh/exchange symbol enters the open pearl row, discard all open character cards and reveal 2 new open character cards.
- This refresh effect is not applied during initial setup.
- At the end of the active player's turn, they may keep at most 5 pearl cards in hand and must discard extras.

### Character Placement Details

- Character cards are placed upright on the player's gate.
- One named exception from the source: the "도깨비불" card is placed upside down.
- A player's gate can hold at most 2 unactivated character cards.
- To place a new character while the gate is full, the player must discard one existing gate character first.

### Character Activation Details

- To activate a character, the player pays pearl cards matching the character's requirement.
- The activated character is turned/reoriented and placed on the right side of the gate.
- Activated character cards contribute power.
- Some activated characters grant diamond resources.
- Some activated characters have special abilities.

## Card Types

| Type | Purpose | Timing | Notes |
| --- | --- | --- | --- |
| Pearl card | Resource card used to activate characters. | Gained during actions; paid during activation. | Has numeric values. Some cards can show a refresh/exchange symbol that refreshes open characters when revealed as a refill after taking an open pearl. |
| Character card | Tableau card that can be placed on a gate and later activated for power/effects. | Placed and activated by actions. | Each character has a pearl requirement, power value, and possibly diamonds or special abilities. |
| Gate card | Player area and start-player marker. | Setup. | Holds up to 2 unactivated characters; activated characters go to the right; diamonds appear to go to the left. |
| Diamond resource | Temporary modifier resource. | Used when paying pearl requirements. | Can increase a pearl card number by 1 under restrictions. |

## Card Effects

Candidate activation requirements and effect notes for 54 character-card entries have been extracted from a Korean Tabletop Simulator workshop save. This data is still not an official source, but the current playable prototype executes these candidate effects after explicit user approval. The implemented mapping lives in `src/game/engine/abilities.ts`, payment planning in `src/game/engine/selectors.ts`, and state changes in `src/game/engine/reducer.ts`.

Implemented prototype effect groups:

- Passive hand-limit bonuses.
- Reusable virtual pearl values from activated characters.
- Pearl value overrides: hand `3` as any value, and hand `1` as `8`.
- Diamond `+1` base rule and the activated candidate effect that can lower a pearl by `1`.
- Immediate action bonuses and next-player action bonuses.
- Start-of-turn peek and gate/market swap abilities.
- During-turn pearl `2` discard for a diamond.
- After-actions discard/redraw hand ability.
- Opponent hand steal and opponent gate discard effects.
- Reclaiming one just-used pearl.
- Adjacent activation of upside-down wisp cards.

Prototype timing rule:

- Newly activated blue/passive effects are not available on the same turn they are activated. They become ready from that player's next turn. Red/on-activation effects, including immediate action bonuses and other activation-resolution effects, still resolve immediately when the card is activated.

Unresolved for final rules:

- These are prototype interpretations of candidate text, not verified official rules.
- Ambiguous target choices currently use deterministic defaults until interactive choice prompts are added.

### Diamond Rules

- Diamonds can increase a pearl card's number by 1 when paying a requirement.
- Diamonds cannot decrease a number by the base rule.
- Prototype exception: an activated `character-401-357-p1-d1` lets its owner use a diamond to lower a paid pearl by 1, but not below 1.
- Only 1 diamond can be used per pearl card.
- Used diamonds are discarded.
- A pearl card value cannot be increased above 8.
- If an activated character shows diamonds, draw that many character cards from the character draw pile and place them on the left side of the player's gate as diamond resources.

### Blue Ability Timing

The source describes timing with a moon icon position on the activated card:

- Moon on the left: usable before starting the player's actions.
- Moon in the middle: usable any time during the player's turn.
- Moon on the right: usable after the player's actions.

The current prototype maps the captured candidate effect text by character definition ID. Official card names, final timing icons, and final target-choice wording still need verification.

Current implementation detail: a blue/passive ability card activated during the current turn is tracked separately and is hidden from legal ability actions, payment substitutes, hand-limit bonuses, and persistent action-count bonuses until the next turn.

## Solo Mode

- The provided rule source describes the original game as 2-5 players.
- No official solo mode was captured from the provided sources.
- For this project, solo play should currently be treated as a custom digital adaptation unless another source proves official solo rules exist.
- The first digital solo setup should allow 2-5 total participants, with 1 human player and the remaining seats controlled by AI.
- AI seats should use the same legal actions as human seats through the normal engine reducer.
- Difficulty should change AI decision quality, not the underlying rules. See `solo-mode.md`.
- Required future design:
  - Decide the default table size.
  - Define solo turn timing relative to the player's turn.
  - Define how the solo system takes pearls, places/activates characters, refreshes markets, and triggers end game.
  - Implement and tune Easy, Normal, Hard, and Expert AI policies.

## Win And Loss Conditions

- End-game trigger:
  - When any player reaches at least 12 power, finish the current round through the last player.
  - The game ends when that same round is complete; there is no additional full final round.
  - If the last player in turn order is the player who reaches 12+ power, the game ends after that player's turn resolves instead of advancing to the start player.
- Winner:
  - At the end of the round in which 12+ power first appeared, the player with the most power wins.
- Tiebreaker:
  - If tied on power, the player with more diamonds wins.
- Further tiebreakers:
  - Not captured.
- Solo win/loss:
  - Not defined by the original rules source.

## Randomness

- Shuffle rules:
  - Pearl deck and character deck are shuffled separately during setup.
- Pearl deck composition is 1-8, 8 copies each.
- Current prototype refresh-pearl composition: one refresh variant each for values 3, 4, and 5; all other copies of those values are normal pearl cards.
- Discarded character cards do not reshuffle into the character draw pile in the current prototype.
- Draw rules:
  - Pearl row starts with 4 open cards.
  - Character row starts with 2 open cards.
  - Taking an open card refills from the matching draw pile.
  - Taking from the top of a draw pile does not require refilling the open row.
  - Diamond rewards draw cards from the character draw pile.
- Dice/random table rules:
  - None captured.
- Seedable behavior needed:
  - Deck shuffles must be seeded for reproducible digital games.
  - Top-deck draws and market refills should derive entirely from seeded deck order.

## Implementation Notes

Potential engine actions:

- `gainPearlFromMarket(index)`
- `gainPearlFromDeck()`
- `refreshPearlMarket()`
- `placeCharacterFromMarket(index, optionalDiscardGateSlot)`
- `placeCharacterFromDeck(optionalDiscardGateSlot)`
- `activateGateCharacter(slot, paymentPlan)`
- `useBlueAbility(characterId, choices)`
- `discardPearlsToHandLimit(cardIds)`
- `endTurn()`

Potential state zones:

- `pearlDeck`
- `pearlMarket`
- `pearlDiscard`
- `characterDeck`
- `characterMarket`
- `characterDiscard`
- per-player `pearlHand`
- per-player `gateCharacters`
- per-player `activatedCharacters`
- per-player `diamonds`
- `startPlayerId`
- `currentPlayerId`
- `actionsRemaining`
- `endGameTriggeredByPlayerId`
- `finalRoundState`

## Open Questions

- What are the official names, power values, and diamond rewards for the 54 candidate character entries?
- Which TTS-derived activation requirements and effect notes match the official Korean cards?
- Confirm whether the current refresh-pearl values 3, 4, and 5 exactly match the official physical deck.
- Confirm whether the current fixture character-card entries exactly match the official physical deck list.
- What happens when a draw pile is empty?
- Are discarded pearl/character cards reshuffled into decks?
- What is the exact rule for "도깨비불" and why it is placed upside down?
- What are the further tiebreakers after diamonds, if any?
- Are there official solo rules that should override or coexist with the custom AI design?
- Should the first UI expose Hard/Expert immediately or after the Normal AI is tuned?
