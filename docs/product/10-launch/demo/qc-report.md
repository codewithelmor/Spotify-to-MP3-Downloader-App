# Demo quality check

Video: `exports/spotify-to-mp3-v1.0.0-overview.mp4` | SHA-256: `3dd70f4555a1f076447f16a194d99d745928d935b3fe6593ac10783faf2cb1e9` | App version: 1.0.0 | Checked: 2026-10-28

| # | Check | Result | Notes |
|---|---|---|---|
| 1 | Planned journey J1 shown start to finish | Pass | paste, Load, 128 kbps, Download, Open folder, Explorer |
| 2 | Result visible >= 1.5 s | Pass | "Finished / 1 of 1 track(s) saved." about 5 s; Explorer details about 8 s |
| 3 | No failed or hidden steps | Pass | record.js log: every check ok, JOURNEY PASS (final take) |
| 4 | MP3 really 128 kbps | Pass | ffprobe audio stream: mp3, bit_rate 128000 (container 145 kbps includes cover art) |
| 5 | Tags and cover present | Pass | title Tumatakbo, artist Mojofly, album Now, 2005, Rock, track 7/11; mjpeg cover stream; shown in Explorer Details |
| 6 | No private data on screen/audio/captions | Pass | paths C:\demo\...; Explorer nav pane below "Videos" (contains a device name) is masked in the edit; Spotify link `si` parameter is a public share tag |
| 7 | Captions .srt and .vtt | Pass | 16 cues; "128" written as digits |
| 8 | Version on cards matches app/package.json | Pass | v1.0.0 |
| 9 | H.264 High, yuv420p, AAC 48 kHz stereo, faststart | Pass | 1920x1080, 30 fps |
| 10 | Length within plan | Pass | 64.5 s (45-75 s) |
| 11 | Loudness | Pass | -16.0 LUFS integrated, peak -3.1 dBFS |
| 12 | Voice synced to screen | Pass (by construction, spot-checked) | voice placed at scene markers + 0.3 s; caption timing is proportional per scene, not word-aligned |
| 13 | Voice accuracy | Pass | faster-whisper small.en on the final mix matched the script; "Mojofly" not spoken; track title not spoken; "MP3", "yt-dlp", "FFmpeg" recognised. Not listened to by a human |
| 14 | Pacing | Pass | about 142 wpm |
| 15 | No long frozen parts | Note | freezedetect flags 16.2-30.5 s (static form while narration plays, progress bar and cursor are small changes) and card holds. Accepted |
| 16 | Honest claims; AI voice disclosed; no Spotify affiliation implied | Pass | disclaimers on title and end cards; "AI-generated voice (Kokoro)" |
| 17 | Chapters | Pass | 6 chapters embedded in MP4 and in exports/chapters.txt |
| 18 | Music licensed | Note | no music track added; the demo song is a commercial recording (Mojofly - Tumatakbo) shown as a cover and file name, never played |

**Result:** Pass, with the notes above.

**Open risk (not a QC item):** the app's purpose (matching and converting commercial music from YouTube) may breach YouTube's terms and copyright law. Run `market-legal-check` before any public use; keep any upload at owner or workspace visibility.
