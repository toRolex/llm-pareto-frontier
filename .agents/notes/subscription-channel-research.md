# Subscription channel supplement — aggregator cap ratios (OpenCode Go / Go Plus / Command Code GOAT)

Snapshot dates: OpenCode page checked 2026-10-10 (footer "last updated Oct 10, 2026") and 2026-10-11; Command Code GOAT page checked 2026-10-10/11; xAI/Cursor pages checked 2026-10-11. Sources: https://opencode.ai/docs/go/ , https://commandcode.ai/docs/plans/goat , https://cursor.com/docs/models-and-pricing , https://x.ai/pricing , https://docs.x.ai/developers/pricing (page dated Sep 29, 2026). Local plotted rates read from `ROWS_RAW` (`pin`/`pcache`/`pout`/`pcacheWrite`) in the worktree at implementation time.

## Derivation rule (binding)

`multiplier = official per-model monthly cap ÷ plan monthlyUsd`, written as a literal `numerator / monthlyUsd` expression in both the catalog (`pricing-model.mjs`) and `test-pricing.mjs`. Fees: OpenCode Go $10, OpenCode Go Plus **$40**, GOAT $10. The earlier supplement report computed several Plus ratios against the $10 Go fee; every such figure below is corrected. Task examples vs derived values are flagged explicitly.

## Cap numerators (official, per model row) and plotted-rate identity

Input / cache-read / output in USD per 1M tokens. "3-field match" = plotted `pin/pcache/pout` equal official rates at published precision. Plot `pcacheWrite` for non-Anthropic models is an estimate (= input), so a 3-field match is not a full 4-field match unless stated.

| Plot base (creator) | Go cap | Go Plus cap | GOAT cap | Rates | Decision |
|---|---|---|---|---|---|
| GLM-5.3 (Z AI) | $15 | $120 | $20 | 1.40 / 0.26 / 4.40 — 3-field match | Go 15/10=1.5, Plus 120/40=3, GOAT 20/10=2 (`snapshot`). Cache write not separately published. |
| GLM-5.3-Flash (Z AI) | $60 | $180 | $60 | official 0.15 / 0.03 / 0.50 vs plot 0.15 / 0.026 / 0.50 | **No mapping** — cache-read mismatch. Raw arithmetic (6 / 4.5 / 6) is recorded here only as evidence, never as an API-equivalent ratio. |
| Kimi K3 (Kimi) | $15 | $60 | $20 | 3.00 / 0.30 / 15.00 — 3-field match | Go 1.5, Plus **60/40=1.5**, GOAT 2. ⚠ Task text said Kimi K3 Plus = 6; under the binding cap÷fee rule 60/40 = 1.5 — the 6 repeats the supplement report's Go-fee error (60/10). Implemented 1.5. Cache write not separately published. |
| MiniMax-M3 (MiniMax) | $60 | $180 | $47 | 0.30 / 0.06 / 1.20 — 3-field match | Go 60/10=6, Plus **180/40=4.5** (task correction; the report's 18 = 180/10 is the Go-fee error). GOAT 47/10=4.7 only at the officially listed "MiniMax M3-50%" discounted band (condition explicitly shown on the GOAT page; full band 0.60/0.12/2.40 does not support it) → `conditional` provenance, condition rendered in the plan details. |
| LongCat 2.0 (LongCat*) | $60 | $240 | $50 | 0.30 / 0.006 / 1.20 — 3-field match | Go 6, Plus 240/40=6, GOAT 5. (*aggregator-only creator) |
| MiMo-V2.6-Flash (Xiaomi*) | $60 | $120 | $20 | 0.14 / 0.0028 / 0.28 — 3-field match | Go 6, Plus 120/40=3, GOAT 2. GOAT name punctuation normalized ("MiMo V2.6 Flash"). (*aggregator-only creator) |
| MiMo-V2.6-Pro (Xiaomi*) | $15 | $60 | $20 | 0.435 / 0.0036 / 0.87 | GOAT cache-read matches plot → GOAT 2 only. OpenCode cache-read $0.003625 differs → **no Go/Plus ratio**. (*aggregator-only creator) |
| GPT-6 Luna (OpenAI) | $15 | $60 | $20 | 0.10 / 0.01 / 0.50 — 3-field match | Go 1.5, Plus 60/40=1.5, GOAT 2, but official cache write **$0.125** vs plotted estimate **$0.10** → not a full 4-field match → `estimated` provenance with caveat note; never labeled an exact verified match. |
| Qwen3.7 Plus (Alibaba*) | $60 | $180 | $33 | 0.40 / 0.08 / 1.60 | GOAT: 3-field match but official cache write **$0.50** vs plotted estimate $0.40 → GOAT 33/10=3.3 `estimated`. OpenCode cache-read $0.04 vs plot $0.08 → **no Go/Plus ratio**. (*aggregator-only creator) |
| Muse Spark 1.3 (Meta) | — (OpenCode lists only the "Contributor" variant at 0.10/0.002/0.20 — different model listing) | — | $20 | 1.25 / 0.15 / 4.25 — GOAT 3-field match | GOAT 2 only. |
| Step 5 Preview (StepFun*) | free temporarily (unlimited) — does not match plotted paid rates | — | $20 | 1.00 / 0.05 / 2.70 — GOAT 3-field match | GOAT 2 only. (*aggregator-only creator) |
| DeepSeek V4.1 Flash (DeepSeek*) | $60 | $120 | $60 | scheduled: peak 0.30/0.006/1.20 (= plot), off-peak 0.15/0.003/0.60 | **No fixed multiplier** (time-dependent). Conditional peak-only caps recorded in the note only: Go 60/10=6, Plus **120/40=3** (report's 12 is the Go-fee error), GOAT 6. `unknown` provenance, access-only. (*aggregator-only creator) |
| Grok 4.7 / 4.6 (xAI) | $15 | $60 | $20 | 2.00 / 0.50 / 6.00 below 200K | Go 1.5, Plus 60/40=1.5, GOAT 2 (unchanged from prior work, now written as literals). |
| Grok 4.5 (xAI) | not offered on Go | — | $20 | GOAT cache-read $0.50 vs xAI current $0.30 | **No verified ratio** → `unknown`, access-only (rate row exists; identity unproven). |

Creators marked (*aggregator-only creator) have no vendor bar in the registry. `channelBars` gives each one a lightweight bar (label = creator, `vendors = [creator]`, no vendor plans) and attaches the aggregator channels that serve it, so these ratios activate in the UI (button, per-creator selection, repricing) without any fictional vendor plan. The page resolver that attributes them derives from `ROWS_RAW` (not the price/tok-filtered `MODELS`), so unplotted catalog rows such as DeepSeek V4.1 Flash (tok `null`) still belong to a bar. `resolveSelection` reaching these bars means the node tests' catalog ratios are now UI-reachable.

## Supported-but-unmapped official listings (mismatch notes, no aliases)

Recorded in plan `quotaNote`s so the UI states why they stay API-priced; **no model entries created**:

- **Claude Haiku 5.5** (Go $15 / Plus $60 / GOAT $20 at 0.10/0.01/0.50 ≤100K): a different generation from the plotted `Claude 4.5 Haiku` (1.00/0.10/5.00). Never map across generations — no Haiku alias.
- GLM-5.3 FlashX (0.37/0.075/1.25) — not the plotted Flash; name and rates differ.
- DeepSeek V4 Pro / (latest) (peak matches plot's `V4 Pro 0813` but version identity unresolved → no ratio); DeepSeek V4 Flash, V4 Flash Fast, V4 Flash Vision (Exp) — names/rates differ from plotted bases.
- Hy3 (~0.14/0.035/0.58 vs plot 0.136/0.034/0.555) — near but not equal.
- Qwen3.8 Max (suffix omitted by OpenCode; plotted 0902 row has null prices), Qwen 3.8 27B (input/cache differ), Qwen3.8 Flash (plot has `Qwen3.8-Flash-Next`).
- GPT-6 Astra / GPT-6.1 Sol — no exact published plan rows; GPT 5.6 Luna is a different generation from GPT-6 Luna.
- OpenCode's "Muse Spark 1.3 Contributor" is a different listing from the plotted base.

## Cursor quota scenarios (recorded, not applied)

Cursor official docs publish no numeric pool allowances, so the catalog keeps the user's screenshot estimates with `estimated` provenance. Conflicting community scenarios are recorded for provenance only:

- User screenshot estimates (applied in catalog): Pro 450/20 = 22.5, Pro Plus 1200/60 = 20, Ultra 3000/200 = 15 (shared "Cursor models" pool).
- Forum lower scenario (not applied): Pro Plus 800/60 = 13.3333, Ultra 2000/200 = 10.
- Other unverified secondary claims: Reddit r/cursor 1vxcvlx (Ultra $500 third-party + $2000 Cursor models), cellcog.ai blog ($500 + $3000). None matches an official fixed quota.

## GOAT plan-level limits

$10/mo advertises up to $70 credits; shared windows $14/5h, $35/week, $70/month. Per-model credit rows are not additive and do not make the plan a budget allocator; ratios are per-model display caps only. OpenCode rolling windows: 5h = 20% of a model's monthly cap, week = 50%.

## Corrections log vs the 2026-10-10 supplement report

| Model · plan | Report said | Correct (cap ÷ fee) | Status |
|---|---|---|---|
| Kimi K3 · Go Plus | 6 (60/10) | 1.5 (60/40) | fixed; task text repeated the 6, derivation rule wins |
| GPT-6 Luna · Go Plus | 6 (60/10) | 1.5 (60/40) | task-corrected |
| MiniMax-M3 · Go Plus | 18 (180/10) | 4.5 (180/40) | task-corrected |
| DeepSeek V4.1 Flash · Go Plus | 12 (120/10) | 3 (120/40) | fixed here (conditional figure only) |
| LongCat 2.0 · Go Plus | 6 (240/40) | 6 | already correct |
| GLM-5.3 · Go Plus | 3 (120/40) | 3 | already correct |

## Residual risks

- Plan tables and negotiated limits change; this is a dated snapshot (2026-10-10/11).
- Cap ratios are displayed-meter comparisons, not cash/API credits, guaranteed usage, or plan-wide multipliers; GOAT shares windows across all model rows, OpenCode caps roll per model.
- Models whose cache-write is unpublished in the official table (GLM-5.3, Kimi K3, MiniMax-M3, LongCat, MiMo Flash) match on three fields only; Luna and Qwen3.7 Plus carry an explicit cache-write mismatch and are labeled `estimated`, not exact.
- GOAT MiniMax 4.7 is valid only at the officially listed 50% band; DeepSeek figures are peak-rate conditionals.
- Grok 4.5, Claude Haiku 5.5, and the other mismatch listings stay API-priced by design.
