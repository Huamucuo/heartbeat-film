# Production ledger — 2026-10-11-heartbeat-samples

Plan: ../docs/superpowers/plans/2026-10-11-heartbeat-samples.md
Design: ../docs/superpowers/specs/2026-10-11-heartbeat-design.md

The user has authorized creation. Immediate delivery is the two previously proposed key samples, 15 seconds total. Full 90-second film remains a later production stage.

Environment: Windows, existing Edge, Node, bundled NumPy/Pillow and Playwright. FFmpeg and Three.js will be pinned locally.

Ruling: Non-Git mirror — use a new isolated project directory and persistent ledger; do not create a repository or run branch bookkeeping. Cost: no Git history, mitigated by editable source and delivery archive.

Pre-flight: shared score -> audio and visuals both use exact source seconds. sampleState -> renderer has no accumulated simulation state. Export -> offline player uses filenames specified in the shared excerpt definitions.

Task 1: complete. Score contract tests observed failing before implementation, then passing. Separate WAV tests caught a silent excerpt crop caused by applying fades before output seeking; corrected with atrim + asetpts before fades. Both mastered clips now have exact sample counts and nonzero audio.

Task 2: complete. Rendered and inspected multiple contact frames. Fibers now converge at the origin instead of an unrelated disk pole. Screen-derivative filtering suppresses fine-line moire. A geometry continuity test caught the initial response lifting the origin discontinuously; the wave now has a continuous attack and leaves the core position continuous. Favicon 404 removed with an explicit data icon.

Task 3: complete. 150 + 300 frames encoded; actual MP4 decoded and measured at -15.60 / -15.88 LUFS and -1.49 / -1.50 dBTP. Seven shuffled seek hashes match; player play/pause/seek/end pass offline. No subjective listening claim is made.

Final review: fresh reviewer found no Critical/Important findings, independently reran 10 passing tests, compared the shared score, and inspected decoded images. Review limitations and their disposition are recorded in output/verification/review-report.md. No deferred minor findings. A portable source/media ZIP is generated and checked with both CRC and all-file SHA-256 verification.

Scope remains the two key samples. The longer source audio is a synthesis working file; it is not evidence that the full film exists.
