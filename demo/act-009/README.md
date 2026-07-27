# ACT-009: 60-Second Installation and Review Demo

This directory contains the reproducible source for the Tenets product demo.
The recording uses:

- The intentionally flawed FastAPI fixture under
  `examples/architecture-review-demo/`
- Real output from the current repository CLI
- A checked-in architecture review of the fixture
- A deterministic ImageMagick and FFmpeg renderer

## Regenerate

From the repository root:

```bash
demo/act-009/capture-demo.sh
node demo/act-009/render-demo.js
```

The renderer creates:

```text
docs/assets/tenets-demo.mp4
docs/assets/tenets-demo-poster.png
docs/assets/tenets-demo-preview.gif
```

The MP4 is exactly 60 seconds and contains no audio. The preview GIF shows each
of the six ten-second scenes once.

## Verify

```bash
python3 -m unittest discover examples/architecture-review-demo/tests
cd cli && npm test
ffprobe -v error -show_entries format=duration \
  -of default=noprint_wrappers=1:nokey=1 \
  docs/assets/tenets-demo.mp4
```

The review transcript is intentionally stored separately from the renderer so
its findings can be inspected and updated when rule meaning changes.
