# Journeys

## J1: Spotify track link to 128 kbps tagged MP3
1. App opens with empty input (folder shown: C:\demo\spotify-music).
2. Paste https://open.spotify.com/track/3rSzz97Bk9GCEgEBbQPzyd?si=34cf043065c4408d, click Load. Check: row shows Tumatakbo / Mojofly / 4:15 and cover.
3. Quality = 128 kbps. Check: select value 128; folder shown.
4. Download. Check: "Finished", "1 of 1 track(s) saved.", one .mp3 in folder, ffprobe audio stream mp3 128000 bps, cover stream present.
5. Open folder -> Explorer shows `Mojofly - Tumatakbo.mp3`, cover art, Details (title, artist, album, bit rate 128kbps).
