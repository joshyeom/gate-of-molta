# Generated ImageGen Card Restorations

Reference-only AI image-to-image restorations generated from the TTS card crops.

Do not treat these as final distributable app assets unless rights are confirmed.
They are derived from Steam/TTS source crops and are meant for visual review,
layout study, and prompt iteration.

## Folders

- `cards/` keeps the original source-position filenames, such as `12-card-sheet-face-r1c1.png`, so every output can be traced back to the crop manifest.
- `named-cards/` contains human-readable copies for review and asset planning.
- `contact-sheet.png` is a quick overview using source-position order.
- `named-review.html` lists every named image with its source crop and candidate metadata.
- `manifest.json` maps source crop filenames, generated filenames, named filenames, candidate character metadata, pearl values, hashes, and duplicate relationships.

## Naming

Named files use these conventions:

- Pearl cards: `pearl-<value>.png`
- Pearl refresh variants: `pearl-<value>-refresh.png`
- Character cards with candidate metadata: `character-<candidate-id>-<condition>-p<power>-d<diamonds>.png`
- Extra duplicate crops without review metadata: `character-extra-<sheet-position>-<condition>-p<power>-d<diamonds>.png`

The character names are candidate/metadata names, not official card names.
Official Korean card names have not been verified in this repository.

Regenerate named copies after changing outputs:

```bash
node scripts/build-imagegen-card-named-copies.mjs
```
