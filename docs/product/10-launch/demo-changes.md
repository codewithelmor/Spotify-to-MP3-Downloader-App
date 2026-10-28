# Demo video: change log

Date: 2026-10-28. App version shown: 1.0.0. Status: produced, **not uploaded**, pending review.

## Background

`docs/product/10-launch/` was copied from the YouTube-Downloader-App project. All of its content was for that app. The tooling was reused and the content was rewritten for the Spotify to MP3 Downloader.

## New video

| Item | Value |
|---|---|
| File | `demo/exports/spotify-to-mp3-v1.0.0-overview.mp4` |
| Length / format | 64.5 s, 1920x1080, 30 fps, H.264, AAC 48 kHz stereo, 6 chapters |
| SHA-256 | `3dd70f4555a1f076447f16a194d99d745928d935b3fe6593ac10783faf2cb1e9` (re-checked after production) |
| Loudness | -16.0 LUFS, peak -3.1 dBFS |
| Voice-over | Kokoro-82M `am_michael`, local TTS, American male, about 142 wpm |
| Test track | `https://open.spotify.com/track/3rSzz97Bk9GCEgEBbQPzyd`, saved as `Mojofly - Tumatakbo.mp3` |
| MP3 bitrate | 128 kbps: ffprobe reports the audio stream as `mp3`, `bit_rate 128000` (the container shows 145 kbps because of the cover art) |

Journey shown: paste link, Load, set 128 kbps, Download, open the folder and show the file with cover and tags in Explorer. The producer's log records every step as pass.

## Files added or rewritten in `docs/product/10-launch/demo/`

- Planning: `demo-plan.md`, `journeys.md`, `feature-map.md`, `script.md`, `scenes.json`, `edit.json` (the last four existed and were overwritten).
- Captions: `captions/spotify-to-mp3-v1.0.0-overview.srt` and `.vtt` (16 cues).
- Thumbnail: `thumbnail/spotify-to-mp3-v1.0.0-thumbnail.png` (1280x720), plus title and end card images.
- `exports/chapters.txt` and `qc-report.md`.
- Automation: `automation/record.js` and `cards.py` were updated, and `automation/assemble.py` is new (edit and captions). `cursor.ps1`, `explorer.ps1` and `tts_kokoro.py` are unchanged.

## Removed

The producer deleted the stale YouTube-app audio, captions, thumbnails, exports, recordings and old `qc-report.md`. `published-links.md` was not touched; it still lists only the old YouTube-app uploads.

## Outside `docs/`

- `app/out/` was rebuilt with `npm run build` (git-ignored).
- The demo output folder is `C:\demo\spotify-music`, chosen so no user profile path shows on screen. Old `C:\demo\music`, `video`, `captions` and `profile` folders were left in place.

## Known limits (from the producer's report)

- No human has listened to the audio. Captions are timed proportionally within each scene, not word-aligned.
- Which YouTube result yt-dlp matched was not checked.
- The 9:16 vertical cut was skipped.
- The preview shows the heading "Track" with no album name, because the backend returns `name: null` and `album: null` for a single track.
- The Explorer segment showed a device name and drive list; the producer masked them in the edit. Review should confirm.
- The narration never says the track or artist name, to avoid mispronunciation.
- FFmpeg's native AAC encoder hung at 192k mono in this build, so `assemble.py` uses 160k stereo.
- `qc-report.md` passes with a freezedetect note for 16.2-30.5 s (static screen during narration).

## Review result (market-reviewer, 2026-10-28)

**Not approved.** Full report: `review-2026-10-28.md`. The video file is technically clean: the hash matches, the Explorer mask hides the device name and drive list in every checked frame, and the version matches `app/package.json`.

- High: legal check not run (YouTube and Spotify terms, copyright). The "Spotify" name and green branding carry trademark risk. `.gitignore` would let a `git add` commit the video, the raw unmasked Explorer recordings and `automation/node_modules`.
- Medium: no LICENSE file although the end card links the repo. A "VLC" label and icon show for about 9 s. A commercial track and its cover art are shown. Captions are sidecar only and the AI-voice disclosure is not voiced. The Spotify `?si=` parameter is visible in the URL.
- Low: "keeps files small" is unmeasured. The Explorer mask is a hard-edged block. `published-links.md` has stale rows from the other app. The end-card footer is small.

## Open items

1. Fix the review findings (at least the High items), re-export, and re-review.
2. Legal check: the app converts commercial music matched on YouTube, which may breach YouTube's terms and copyright law. Run `market-legal-check` before any public use.
3. `.gitignore` does not yet ignore the large media files. Not changed without the owner's say-so.
4. Loom upload needs the owner's approval of an upload preview. Earlier MCP uploads ignored the visibility setting and went public, so check visibility afterwards.
