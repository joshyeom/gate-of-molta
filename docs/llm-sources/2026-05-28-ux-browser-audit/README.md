# 2026-05-28 UX Browser Audit

Playwright screenshots captured while auditing repeated automated play and 5-player layout behavior.

Files:

- `desktop-3p-start.png`, `desktop-3p-mid.png`, `desktop-3p-end.png`
- `desktop-5p-start.png`, `desktop-5p-mid.png`
- `desktop-5p-mid-after-hud-fix.png`
- `desktop-5p-mid-after-layout-fix.png`
- `landscape-mobile-5p-start.png`, `landscape-mobile-5p-mid.png`

Audit notes:

- Desktop 5-player HUD controls originally overlapped the top-right opponent area.
- After the HUD fix, the controls no longer overlapped opponents, but the market still intersected the lower opponent row.
- After the layout fix, Playwright bounding checks showed no status/opponent, market/opponent, or market/player intersections at 1440x900.
- A separate accelerated browser run completed 10 consecutive React games with no console/page errors and no game-over text overflow.
