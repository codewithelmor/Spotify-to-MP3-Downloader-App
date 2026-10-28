# Demo plan: Spotify to MP3 v1.0.0

- **Type:** quick overview, 64.5 s (target 45-75 s), 1920x1080, 30 fps. No 9:16 cut (UI is landscape and the video is over 60 s; not cheap).
- **Audience / goal:** developers and colleagues; understand what the app does and look at the source code.
- **Shared on:** reviewed by market-reviewer first; upload only by market-publisher after approval.
- **Voice-over:** local Kokoro-82M `am_michael` (American male, Apache-2.0), disclosed on the end card.
- **Story:** problem (want a track as a file) -> paste link, Load -> 128 kbps -> Download -> tagged MP3 with cover in Explorer -> honest end card.
- **Journey:** J1 Spotify track link to a 128 kbps tagged MP3 (see journeys.md).
- **Honest claims:** audio is matched on YouTube with yt-dlp and converted with FFmpeg; nothing is downloaded from Spotify; no Spotify sign-in; independent project, not affiliated with Spotify; use only for music you may save.
- **Data:** demo profile `C:\demo\spotify-profile`, output `C:\demo\spotify-music`. No accounts.
