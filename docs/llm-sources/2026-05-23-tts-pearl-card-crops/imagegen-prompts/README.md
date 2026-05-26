# Pearl Card Image-Generation Prompts

Prompt set for image-to-image restoration of the pearl-card reference crops.

Use each file in `../cards/` as the edit target/reference image and pair it with the matching prompt from `prompts.json` or `prompts.md`.

The prompt strategy is:

- preserve the source card composition and identity
- keep all numerals, inverted bottom numerals, borders, medallions, and refresh icons fixed
- request high input fidelity, low creativity, and restoration-only behavior
- remove blur, scan haze, compression artifacts, and muddy edges
- avoid redesigning the card

Outputs created from these prompts are still reference-only derivatives of Steam/TTS source material unless rights are confirmed.
