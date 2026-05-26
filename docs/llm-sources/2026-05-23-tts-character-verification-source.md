# TTS Character Metadata Verification Source

Source material discovered on 2026-05-23.

This source is for rule/effect verification only. It must not be treated as an official rule source, final app data, or asset permission.

## Source

### Steam Workshop: 몰타의 관문 한글판

- Workshop ID: `1198835784`
- URL: https://steamcommunity.com/sharedfiles/filedetails/?id=1198835784
- Status: accessible through Steam Workshop metadata/API on 2026-05-23.
- Use: verification checklist candidate for the 54 character cards' activation requirements and some effect notes.
- Notes: the workshop description says the Korean TTS version adds function explanations as notes on character cards.

## Extraction Policy

The extraction keeps only text metadata needed for rule/effect verification:

- TTS card object ID
- Activation requirement text from the card nickname field
- Effect note text from the card description field

The extraction intentionally does not preserve:

- Card images
- Image URLs
- The TTS save binary
- Custom deck face/back URLs

## Derived File

- Sanitized extraction: `2026-05-23-tts-character-verification.json`
- Extraction script: `../../scripts/extract-tts-character-verification.mjs`

The derived JSON is a candidate checklist, not canonical card data. Every card still needs verification against official card photos, a rulebook, or user-provided scans/photos before implementation.
