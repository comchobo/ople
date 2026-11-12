# Korean speech fixtures

Two Korean read-speech recordings and reference transcripts from **Google FLEURS:
Few-shot Learning Evaluation of Universal Representations of Speech** (Conneau,
Ma, Khanuja, Zhang, Axelrod, Dalmia, Riesa, Rivera and Bapna, 2022).

- Dataset: https://huggingface.co/datasets/google/fleurs
- Paper: https://arxiv.org/abs/2205.12446
- Revision: `70bb2e84b976b7e960aa89f1c648e09c59f894dd`
- Configuration/split: `ko_kr` / `test`; rows 0 and 1, source IDs 1883 and 1929.
- Metadata: https://datasets-server.huggingface.co/rows?dataset=google%2Ffleurs&config=ko_kr&split=test&offset=0&length=2
- Revision/license metadata: https://huggingface.co/api/datasets/google/fleurs/revision/70bb2e84b976b7e960aa89f1c648e09c59f894dd

## License and attribution

These recordings and transcripts are distributed under **Creative Commons
Attribution 4.0 International (CC BY 4.0)**, as declared by the source dataset:
https://creativecommons.org/licenses/by/4.0/

License terms: https://creativecommons.org/licenses/by/4.0/legalcode
Retain this attribution and license notice when redistributing these fixtures.
Credit Google FLEURS and the authors above; no endorsement is implied.

The WAVs are byte-for-byte downloads of the public dataset viewer's audio assets,
renamed locally; no audio editing was performed. Reference text is copied from
the source `raw_transcription` and `transcription` fields without modification.
`transcripts.json` records source filenames, stable asset URLs (without temporary
signatures), SHA-256 digests, and durations measured from the downloaded WAVs.
The two clips total 23.28 seconds. These are read-speech fixtures, not interview
recordings.

The viewer assets use 16 kHz mono IEEE float32 WAV (format tag 3). Python's
`wave` module does not directly support this encoding. Duration validation used
`wave` with only the format tag changed to PCM in an in-memory header copy, to
read frame counts and byte lengths; the downloaded files were kept unchanged.
