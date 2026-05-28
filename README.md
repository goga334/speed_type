# Speed Type

Minimal typing trainer with a full-screen video background that reacts to your pace.

## Features

- Phrase difficulty tiers that ramp from Warmup to Overdrive.
- Pace meter calibrated by target CPM for the active tier.
- Dynamic video playback: slow down and dim when pace drops.
- Space or Enter advances to the next phrase after completion.
- Upload a text file of video links for a custom shuffled playlist.
- Video sound toggle with hover volume control.

## Run

Open `index.html` directly in a browser.

No build step or dependencies are required.

## Video Playlist Format

Upload a `.txt` file with direct video URLs. Comment lines beginning with `#` are ignored.

```txt
# Source page or note
https://example.com/video-one.mp4
https://example.com/video-two.webm
```

Supported extensions include `.mp4`, `.webm`, `.ogg`, `.ogv`, `.mov`, and `.m4v`.

## Default Video

The default background video is `Flor de Suculenta.webm` from Wikimedia Commons by Koffermejia, licensed under CC BY-SA 4.0.
