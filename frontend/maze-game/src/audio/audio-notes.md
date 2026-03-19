# Audio Asset Notes

Drop-in folder:
- `public/audio/`

Required filenames:
- `ui_click.mp3`
- `popup_open.mp3`
- `popup_close.mp3`
- `coins_gain.mp3`
- `bg_music.mp3`

Design targets:
- `ui_click`: very short, soft tap, no sharp highs.
- `popup_open`: gentle bloom/whoosh, subtle.
- `popup_close`: gentle tuck-away, shorter than open.
- `coins_gain`: soft shimmer/chime, positive but not loud.
- `bg_music`: calm ambient loop, low fatigue, seamless loop.

Recommended max durations:
- `ui_click`: < 120ms
- `popup_open`: 150-300ms
- `popup_close`: 100-220ms
- `coins_gain`: 200-500ms
- `bg_music`: 20-60s (loop-safe)

Recommended format:
- `mp3` (or `ogg` if you later switch mapping in one place: `src/audio/audioManager.js`)

Volume targets (per-sound defaults in registration map):
- `ui_click`: 0.26
- `popup_open`: 0.25
- `popup_close`: 0.22
- `coins_gain`: 0.28
- `bg_music`: 0.16

Fallback behavior:
- Missing files do not crash the game.
- Manager logs a warning once per missing key and uses procedural fallback.
- Replacing files requires no code changes if names remain the same.
