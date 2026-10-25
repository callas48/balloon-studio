# Stamp brush MVP — 2026-09-29

## Existing architecture checked
- Canvas 2D, classic scripts; no framework or build dependency.
- `app.js`: rendering, undo/redo snapshots, pointer dispatch.
- `lettering.js`, `clone-fill.js`: existing cleanup tools; kept separate.
- `image-layers.js`: serializable data URL image layers and per-layer erasure.
- `studio.js`, `autosave.js`: multi-page project documents, IndexedDB project autosave.
- `mobile.js`: capture-phase pan/pinch handlers; starting pinch cancels a pending stamp stroke.
- Existing presets use localStorage; new image-heavy brush presets use their own IndexedDB database.

## Implemented
- PNG/WebP (one or multiple, up to 32 tips) -> decoded alpha-preserving PNG -> versioned BrushData.
- Editor, actual shared rendering engine in test canvas and document canvas.
- Sequential/random tips, size, spacing, random size, base rotation, stroke direction rotation,
  random rotation, opacity, random opacity, scatter, linear pen size pressure.
- Mouse and finger inputs use full nominal pressure. No CSP pressure curve emulation.
- Local IndexedDB library, edit/delete, portable `.brush.json` backup and import.
- Import/editor cancellation does not save. Explicit save writes to the library.
- Each completed stroke is rasterized into a transparent ordinary image layer; consecutive
  strokes in one drawing session share a layer, but each stroke has its own undo snapshot.
- Leaving brush mode starts a new layer on the next activation. Existing layer transformations,
  eraser, project saving/autosave, export and page thumbnails consume the same PNG layer data.
- Brush presets remain separate from project documents; project artwork is self-contained.
- Limits: 100 presets, 32 tips per preset, 2048px per tip side, 16M decoded tip pixels combined,
  12MB per input image/48MB per import, 12,000 stamps per stroke, 16M pixel/8000px paint layer.
- No uploaded sample brush was added to the public site.

## SUT research and deliberate boundary
Three actual supplied SUT files were inspected offline with SQLite and TAR libraries:
- `묻은_체액브러시.sut`: 10 MaterialFile entries.
- `흐르는_체액브러시.sut`: 8 MaterialFile entries.
- `방울진_체액브러시.sut`: 7 MaterialFile entries.

All have SQLite headers, Manager/Node/Variant/MaterialFile tables. MaterialFile.FileData
contains TAR members including proprietary C2F `.layer`, a material thumbnail PNG and XML.
Thumbnail images have alpha but are limited to about 300px. PNG signatures inside `.layer`
are not reliable standalone brush images: the tested streams included fully transparent
results and invalid image data. Treating these as full brush tips would be incorrect.

Browser SUT selection currently checks the SQLite signature and explains the conversion
limitation; it does NOT claim to parse settings or convert brush tips. Original SUT bytes
are never retained as the runtime brush format. PNG/WebP export of the source tips is needed.

Public-brush clarification: user wants the three supplied brushes to become common presets.
User explicitly chose original tip quality instead of provisional thumbnail-quality presets.
Public registration is therefore pending original transparent PNG/WebP tips, grouped by brush.
Do not silently substitute the extracted thumbnails or regenerate the designs.

### Options
A. Browser-only conversion: SQLite WASM is feasible for container parsing. A verified original
material decoder and mapping of the active Node/Variant settings are still missing.
B. Separate converter module: recommended. Return normalized BrushData + tips + unsupported
feature warnings; keep it independent of the painting engine. Can eventually run in a worker.
C. Desktop/server conversion: useful if a reliable licensed decoder/export workflow is found,
but changing execution location alone does not decode the proprietary `.layer` data.

Do not map spacing/effector blobs from numeric resemblance alone. Unsupported settings can be
ignored once tips are valid; inability to decode any real tip is a conversion failure.

Research references (no third-party converter code copied):
- https://github.com/MorrowShore/CSPBrushExtract — source PNG signature scanning; not proof of original tip decoding; AGPL.
- https://github.com/tohsakarat/Brush-Converter — documents the `.layer` decoding limitation.
- https://help.clip-studio.com/en-us/manual_en/150_tools/Importing_and_exporting_tools.htm

## Verification
`NODE_PATH=/opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules node tests/brushes.cjs`
Tests use real Canvas pixel output for alpha and serialized PNG, plus pointer integration with
stubbed UI: distance sampling independent of event rate, tip sequencing, rotation, pressure,
random bounds, schema rejection, cancel, merged paint layers, per-stroke undo snapshots,
SUT rejection, HTML ID/script wiring. Syntax checks cover all classic JS scripts.
No physical mobile/stylus or real browser IndexedDB interaction was exercised in this environment.
