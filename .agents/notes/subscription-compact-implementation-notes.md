# Subscription compact feature — implementation notes

Worktree: `/private/tmp/llm-pf-main` (git worktree @ `653d8bd`). Sole writer. No commits or pushes.

## Round 3 (review fix): aggregator-only creator bars + explicit-channel creator boundary

Addresses P1 and P2 from `/tmp/llm-pf-subscription-final-review.md`.

- **P1 — reachability.** `channelBars` now appends a lightweight bar for every creator that is aggregator-attributed but has no vendor bar (LongCat, Xiaomi, StepFun, Alibaba, DeepSeek): `{ id: creator, label: creator, vendors: [creator], channels: [], plans: [] }`. The existing aggregator-attachment loop then populates those channels (creator label preserved, no fictional vendor plans). The page resolver `creatorByRowBase` now derives from `ROWS_RAW` instead of the price/tok-filtered `MODELS`, so unplotted catalog rows such as DeepSeek V4.1 Flash (tok `null`) still get attributed. `clearBarSelection` deletes `S.subscriptionPlans[bar.id]` (aggregator-only bars store under the creator id, not a channel id) and `currentPlan` reads `S.subscriptionPlans[bar.id]` first so the persisted selection highlights.
- **P2 — boundary.** `mappingFor` rejects an explicit non-aggregator `channelId` whose `channel.vendors` does not include the canonical creator (`channelKey`: xAI → SpaceXAI). `rateFor(104, 'Kimi', 'Kimi K3', 'pro200', 'OpenAI')` now returns `104` (was `10` via OpenAI inheritance); Cursor still reprices xAI rows (reseller vendors `['Cursor','SpaceXAI']`); the omitted-channelId legacy path is unchanged.
- **Cleanup.** Removed narration-only comments from `test-pricing.mjs`; external provenance comments/notes kept.

Verification: `node scripts/test-pricing.mjs`, `MKL_SNAPSHOT=1 node scripts/build-proto.mjs` (ROWS_RAW sha1 unchanged `5a5406dd1405`), `verify-subscription-compact-browser.mjs` 16/16 on the parent's existing TaskSpace 11 p1 (report `/tmp/llm-pf-subscription-final-report.json`, screenshot `/tmp/llm-pf-subscription-final.png`), and the pre-existing `verify-pricing-browser.mjs` on the same space. Space 11 left open; no new space.

## Round 2 (desktop finish): per-creator aggregator bars + compact dock

Supersedes the standalone-aggregator-bar layout and the 320px dock from round 1. Research artifact: `.agents/notes/subscription-channel-research.md` (cap numerators, fee-correction log, mismatch/unknown list, Cursor forum scenarios).

- **Aggregator channels embed into served creator bars.** `channelBars(registry, resolveCreator?)` no longer emits standalone OpenCode/CommandCode bars: each aggregator channel (with all its plans) is appended to every creator bar it serves. Attribution derives from vendor providers' plan model keys × `channel.vendors`, plus an optional `resolveCreator(modelBase)` the page builds from `ROWS_RAW` rows (single source, no duplicated map; needed for GPT-6 Luna → OpenAI and for unplotted DeepSeek rows). Creators with no vendor bar (LongCat, Xiaomi, StepFun, Alibaba, DeepSeek) get a lightweight creator-labeled bar (no vendor plan) so the aggregator ratios are reachable. Each embedded channel carries bar-scoped `servedModels`, and plan detail blocks/coverage render only bar-relevant models. One xAI bar hosts SpaceXAI/Cursor/Go/GOAT with a single mutually exclusive selection.
- **Per-creator selections coexist.** `{OpenAI:'go10', Kimi:'go10'}` is valid; picking Go for Kimi never erases the OpenAI plan. Storage keys stay `bar.id`; owner lookup goes through the bar's channels. No auto lowest-price/fallback: an uncovered model stays API even when the plan is selected.
- **Legacy storage deterministic.** Retired standalone aggregator bar ids (`OpenCode`/`CommandCode`) fold into the grok bar (their vendors were `['SpaceXAI']`); member-key fallback in `resolveSelection`/`normalizeSelections` excludes aggregator channels (they live in many bars, so the fallback would be ambiguous); bar.id wins over legacy keys; junk drops; idempotent.
- **Ratios are literal `numerator / monthlyUsd` expressions** in catalog and tests (Go fee $10, Go Plus fee $40, GOAT fee $10). New `goPlus40` plan. Supplement ratios: GLM-5.3 15/120/20, Kimi K3 15/60/20, MiniMax-M3 60/180/47, LongCat 60/240/50, MiMo-Flash 60/120/20, Luna 15/60/20, Muse GOAT 20, Step5 GOAT 20, Qwen3.7 GOAT 33. Provenance: `snapshot` for 3-field rate matches; `estimated` for GPT-6 Luna + Qwen3.7 Plus GOAT (official cacheWrite 0.125/0.50 vs plotted estimate 0.10/0.40 — labeled estimate, never an exact 4-field match); `conditional` for MiniMax GOAT (officially shown M3-50% band, condition rendered in plan details); `unknown` for DeepSeek V4.1 Flash (time-dependent; conditional peak caps in the note only) and GOAT Grok 4.5. GLM-5.3-Flash has no mapping (rate mismatch); no Claude Haiku 5.5 alias (different generation; mismatch note only).
- **Compact dock (desktop-only per task override).** `max-height:min(216px, max(160px, calc(100vh - 96px - var(--bar-height) - 44px - 340px)))`: measured 216px dock / 369px chart at 1470×837, 208px dock / 340px chart at 1280×800. Terse one-line header (full caveats remain in tooltips/plan details), plans section first, Token mix grid + reset tools inside `<details id="mix-details">` collapsed by default, tighter paddings/button sizes. Detail expansion scrolls inside the dock; the chart is never overlapped.
- Verification round 2: `test-pricing.mjs` (incl. cap/fee/value guards against the Go-fee ratio errors, per-creator isolation, legacy folds, idempotency), `MKL_SNAPSHOT=1` rebuild (ROWS_RAW sha1 unchanged, full-file build idempotent: identical sha1 across two consecutive builds, inline runtime byte-equal to the module), compact browser QA 14/14 (`/tmp/llm-pf-subscription-desktop-report.json`: 1470×837 dock 216px/chart 369px; 1280×800 dock 208px/chart 340px; 1280×720 floor dock 160px/chart 308px non-overlap; per-creator reload persistence; legacy-fold conflict; screenshots `/tmp/llm-pf-subscription-desktop-{dock,1280,percreator,aggregators}.png`), existing `verify-pricing-browser.mjs` passes (mix-details opened programmatically before fills).

## Round 1 (context)

Merged candidate A (channel metadata + reserved bottom dock) with the minimal-surface constraints: additive registry metadata, two small pure helpers, no second registry, no new persistence schema. Rejected candidate B's 7-method catalog and v2 storage.

## Files changed

- `scripts/pricing-model.mjs` — additive `channel:{label,kind,vendors,group?}` on every provider; per-plan `source/sourceDate/sourceUrl/quotaNote` overrides; new plans (SpaceXAI SuperGrok $30; Cursor Pro/Pro Plus/Ultra shared pool; OpenCode Go; Command Code GOAT); `multiplier:null` + `provenance:"unknown"` for access-only mappings; new pure exports `channelBars(registry)`, `resolveSelection(bars, selection, creator, modelName)`, `normalizeSelections(bars, selection)`; engine `mappingFor/rateFor/effectiveRates` gain optional `channelId`, `rateFor` treats a null multiplier as no discount.
- `prototype-4d-3d.html` — `#pricing-panel` is now a reserved bottom dock (never overlays the chart), header entry `#sub-entry`, compact tier buttons (name/price only) with mappings/coverage/source in `<details>`, merged xAI bar, `--dock-height` layout reservation.
- `scripts/build-proto.mjs` — `window.MKL_PRICING` export list adds `channelBars, resolveSelection`.
- `scripts/test-pricing.mjs` — literal assertions for the new channels, unknown multipliers, strict generations, aliases, grouping, and selection resolution; Cursor Ultra Composer expectation moved 15.2→15.
- `scripts/verify-subscription-compact-browser.mjs` — new browser QA on the parent's existing TaskSpace 11.
- `scripts/verify-pricing-browser.mjs` — `state()` now waits for one rendered frame after `motion.done` before sampling sprite positions.
- `SKILL.md` — pricing paragraph updated for channels / merged bar / unknown multipliers / reserved dock.

## Decisions

- **Merged xAI bar.** SpaceXAI and Cursor share `channel.group:"grok"`; `channelBars` merges them into one bar with `bar.id:"SpaceXAI"` (first registry key), preserving the legacy `SpaceXAI` storage key. `SuperGrok` and `Cursor` tiers are mutually exclusive.
- **No credit stacking across channels.** (Round 1) `applyBarSelection` clears any other bar that shares a vendor with the chosen bar — with per-creator embedding (round 2) all bars have disjoint vendors, so this is a safety no-op; mutual exclusivity lives inside each bar. `resolveSelection` only returns a plan whose owning channel actually covers the model (or its inheritance base), so a stale or inapplicable selection cannot shadow a valid one. `normalizeSelections` runs once on load, before render, so persisted conflicts are resolved deterministically instead of being guessed at runtime: the first bar in order that claims a vendor keeps its selection, member keys collapse to `bar.id` (legacy `{Cursor:'ultra200'}` migrates to `{SpaceXAI:'ultra200'}`; retired `{OpenCode:'go10'}` folds into the grok bar), and stray keys drop.
- **Explicit channel resolution, no peer search.** `resolveSelection` returns `{barId, channelId, planId}` and the engine matches inside that explicit channel. With no `channelId`, `mappingFor` falls back to the creator's own channel (legacy call compatibility).
- **Unknown ≠ 1×.** `multiplier:null` renders access and leaves the API price; `rateFor` returns the API rate with the mapping attached, so the tooltip/details say "折扣未知", not a silent 1× or a wrong discount. Direct hit stops before inheritance.
- **Curation.** Heavy $300 Grok 4.7 ×19.4 preserved. Cursor tiers use the user-screenshot shared-pool estimates 22.5/20/15, labeled estimated/non-official and shared (not per-model); the conflicting forum lower scenario (800/60 = 13.3333, 2000/200 = 10) is recorded in `.agents/notes/subscription-channel-research.md`, not applied. The legacy Composer-only 15.2 is folded into the shared 15 with a deviation note kept in the Ultra plan note. SuperGrok $30 keeps Grok 4.6 unknown; the $80/week scenario (≈11.6×) is recorded as an not-adopted estimate. Aggregator ratios are model-specific cap ratios with window/meter caveats, not plan-wide multipliers, not universal, and not a budget allocator (no caps added).
- **Plan source overrides provider source.** Cursor/xAI/OpenCode/GOAT carry their own official source URLs; the tooltip and details use `plan.sourceUrl ?? provider.sourceUrl`.
- **Reserved layout.** Dock is `position:fixed; left:16px; right:324px; bottom:var(--bar-height)` with the viewport-derived compact budget (round 2). A `ResizeObserver` sets `--dock-height`; `.chart`, `#state`, and `#cfgpop` include it via `calc()`, so the WebGL plot shrinks instead of being covered. A narrow viewport falls back to a full-width dock above the mobile rail (unchanged, not a QA target per the desktop-only override).

## Verification

- `node scripts/test-pricing.mjs` — passes (literal expected rates).
- Domain tests `test-axis-domain`, `test-frontier-domain`, `test-motion`, `test-feedback-parity` — pass.
- `MKL_SNAPSHOT=1 node scripts/build-proto.mjs` — re-inlines the module; `ROWS_RAW` sha1 unchanged (`c836b0e3…` before and after), so no baseline was invented.
- Browser QA (TaskSpace 11, p1, not finished) — round 2: `scripts/verify-subscription-compact-browser.mjs` 12/12 checks (see round 2 section above); report `/tmp/llm-pf-subscription-desktop-report.json`, screenshots `/tmp/llm-pf-subscription-desktop-*.png`. Round 1 (superseded): 10 checks, `/tmp/llm-pf-subscription-after-report.json`.
- Existing `scripts/verify-pricing-browser.mjs` (TaskSpace 11) — passes; evidence in `/tmp/mkl-subscription-evidence/`.

## Deviations and residual risks

- Cursor Ultra's Composer multiplier is a user-requested business change (15.2→15); the test expectation changed with it.
- `verify-pricing-browser.mjs` gained a one-frame settle because `motion.done` can flip on a poll before the final interpolation frame; this is a harness robustness fix, not a behavior/expectation change.
- The generic UI oracle `test-redesign-browser.mjs` was not re-run: it needs a separate TaskSpace and the parent scoped QA to TaskSpace 11. The panel DOM contract it depends on (data-provider-button/data-plan/data-tier, range inputs, keyboard nav, #plans-api/#mix-defaults/#pricing-close, renderPricingPanel, pricingPanel) is preserved.
- Cursor/GOAT/OpenCode figures are estimates or published cap ratios, not guaranteed quota; Cursor has no AA benchmark rows, so its mappings are exercised only via the merged Grok bar and pure-function tests.
- Mobile/narrow layout is best-effort and unverified this round (desktop-only override: 1470×837 and 1280×800 are the verified targets).
- Kimi K3 Go Plus: the task text listed 6, but the binding cap÷fee rule gives 60/40 = 1.5 (the 6 repeats the supplement report's Go-fee error); implemented 1.5 and documented in the research artifact.
- LongCat/Xiaomi/StepFun/Alibaba/DeepSeek bars are aggregator-only (no vendor plan); DeepSeek V4.1 Flash has no plotted benchmark row, so its bar select is reachable but its rows are not on the chart (checked via the engine in the browser QA).
