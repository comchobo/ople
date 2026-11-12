# Actual model API verification — 2026-11-12

The explicit Compose run of `RUN_LIVE_AI=1 pytest -s tests/test_live_ai.py`
passed in **25.90 seconds** on the final transport implementation. An earlier
run also passed in 21.96 seconds; the same two clips were reused to verify the
subsequent absolute-deadline/cancellation fix. Credentials were provided through ignored `.env`;
none are included in this record.

## Korean audio: Turbo only

Both committed source WAVs were submitted through the FastAPI interview upload
path. Each returned HTTP 200, advanced one question, and preserved its exact
original bytes in the private audio volume. There were no additional audio
samples and no comparison with another STT model.

Model: `@cf/openai/whisper-large-v3-turbo`, `language=ko`, `task=transcribe`.

| FLEURS ID | Upload/STT/next-question elapsed | Actual transcription |
| --- | --- | --- |
| 1883 | 4.13 s | 다리 및 수직 간격은 15m이며 공사는 2011년 8월에 마무리되었으며 해당 다리의 통행금지는 2017년 3월까지이다. |
| 1929 | 3.33 s | 델포트로가 2세트에서 먼저 어드벤티즈를 얻었지만 6대6이 된 후 다시 타이 브레이크가 필요했다. |

Reference transcripts and attribution are in `transcripts.json` and `README.md`.
Manual inspection found `밑` transcribed as `및` in the first sample and
`어드밴티지` as `어드벤티즈` in the second. Dates and numeric values were retained;
spacing and numeric notation differed. This establishes usable Korean integration
for these two inputs, **not** a general accuracy or noisy-conversation benchmark.
The displayed times include next-question generation, not isolated STT latency.

## Ollama Cloud

`deepseek-v4.1-flash:1017` successfully generated the initial and subsequent
questions in the audio path. Separately, ten short synthetic Korean text answers
exercised ten contextual question turns, a grounded summary, and A/B/C generation
using real API calls. No personal or additional audio data was required.

Server schema validation accepted exactly A/B/C, nonempty titles/descriptions,
valid categories and activity ranges within 60 months. Inspection confirmed:

- A: product-development expertise and colleague mentoring while keeping the job.
- B: a one-hour coding lesson for two friends, then a small adult-learning group.
- C: watercolor, family time, and walks as the desired daily life.
- The summary preserved the synthetic constraints of four hours per week and
  KRW 100,000 per month without inventing a personal background.

Model output is illustrative planning content, not a promise that activities fit
every constraint. The two-clip smoke test does not verify tablet microphone
hardware or interactive Google authorization. Browser E2E was intentionally not run.
