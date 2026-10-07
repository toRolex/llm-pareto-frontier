# Subscription pricing feature implementation notes

## Scope

Extend `.agents/skills/model-killing-line` with subscription-equivalent pricing and configurable token mix. Keep the generated HTML single-file, zero-network at runtime, and preserve current model rows and renderer.

## Decisions

- Canonical model shape: `SubscriptionRegistry` keyed by provider, each provider owns plans with monthly price and model selectors; each model mapping stores multiplier plus provenance (`observed`, `fitted`, or `inherited`). Pricing composition is four input-share weights and four API token rates (`input`, `cacheRead`, `cacheWrite`, `output`). Per-row API prices remain the source of truth; a single effective-price function applies either a selected plan multiplier or the weighted API composition.
- Keep business price math in a small pure module that the build can inline into the HTML and Node can import in tests. Runtime gets no sidecar dependency.
- Invalid mix is an uncommitted draft: inputs remain visible, the prior valid composition remains active, and an inline validation error explains why.
- Persist selected plan per provider and only valid mix values. Storage failures remain non-fatal and visible.
- Keep subscription mappings strict to the user-specified model generations, except OpenAI's explicit GPT-6.1 Sol inheritance rule. All other unspecified generations remain API-priced.

## Deviations

- `how`, `architect`, and principle skills are marked user-only by their loader. Read their full skill files directly instead of invoking them. Their usage maps to this feature's existing HTML cost pipeline.
- The project directory is not a Git or jj repository. No version-control operations are in scope or possible here.
- Feature owner owns the coupled build/data/HTML changes directly per the task. Main window is assigned independent review; no child agents are spawned.
- Cache-write source facts are still pending from the main window. Do not label cache-write rates as measured until evidence arrives; preserve provenance and display any estimate honestly.

## Throughput checkpoint

- Blocking first steps: confirm available AA price JSON shape including `cacheWrite`; trace `costOf`, price mode, tooltip, recompute and build path before editing.
- Independent workstreams: n/a, data/build/HTML form one coupled price pipeline and share generated rows and UI state.
- Shared mutable state: no parallel writes; build script, source HTML, and generated HTML will be edited serially by this owner.
- Smallest safe decomposition: one owner is safest because price composition, plan selection, tooltip provenance, persistent UI state, and build-injected data meet in the single generated page.

## Progress

- [x] Task read and constraints captured.
- [ ] Trace price input shape and cache-write evidence before changing data.
- [ ] Implement the model registry, pricing math, controls, and persisted state.
- [ ] Make build reproducible and add behavior-focused Node tests.
- [ ] Rebuild from existing temporary inputs and inspect generated HTML.
- [ ] Browser-verify local file runtime, controls, network, and console.
- [ ] Review diff and report verified results and limitations.

## Rescue implementation and verification

- Resume point was unfinished runtime integration. HTML referenced `window.MKL_PRICING` before any inline definition and loaded three.js / OrbitControls as sidecar scripts. Builder now injects the canonical module and both libraries. Repeated builds retain controls and return identical SHA1 `e562454bfdf29f913b0c8e050234a0db5414e06d`.
- Reproduced a real interaction bug during browser testing. The pricing panel overlapped its bottom-bar toggle and intercepted the click. Added an explicit close button inside the panel rather than bypassing pointer actions.
- Corrected rejection of valid zero rates and zero-share missing fields. Missing positive-share rates still return null. Runtime filters missing active prices and maps zero-price points to the far end of the log axis.
- Read official Anthropic pricing page at https://platform.claude.com/docs/en/about-claude/pricing . It explicitly states `5-minute cache write = 1.25x base input price`. Anthropic write rates are rule-derived, not AA measurements. Other providers use `write=input` with explicit estimate provenance. Official fetched HTML was saved at `/tmp/mkl-anthropic-pricing.html`.
- No live AA/Arena refresh was performed. Existing inline `ROWS_RAW`, `METRICS_DATA`, and `ARENA_DATA` were extracted into `/tmp/mkl-rescue-fixture/` strictly as temporary offline fixtures. Price slug overrides were included to preserve all 115 existing priced rows. Builder still reads production `aa-data.json`; no HTML-source fallback was added to production. 266 rows, 115 priced, 153 missing, 89 complete model variants, 76 default-visible variants.
- `node scripts/test-pricing.mjs` passed literal-output tests for 10.4 division, Astra exception, Luna inheritance, effort consistency, Sonnet fits, strict generations, other providers, four-field mixture including write, invalid mixes, missing zero-share fields, and legitimate zero rates.
- `ego-browser nodejs < .agents/skills/model-killing-line/scripts/verify-pricing-browser.mjs` passed against real file:// HTML. It uses actual fill/select/click controls. Assertions cover coordinate and 4D-front membership changes, 2D-front geometry changes, all four price modes, $/task, 3D and both 2D views, GDPval, axis scales, performance normalization, invalid-draft retention, refresh persistence, independent reset actions, and actual pointer-hover tooltip.
- Browser result has `window.__errs2=[]` and `performance.getEntriesByType('resource')=[]`. Both JS dependencies are inline. Evidence lives in `/tmp/mkl-subscription-evidence/browser-results.json`, `pricing-3d.png`, `cost-2d.png`, and `tooltip-3d.png`. Screenshots were opened for visual inspection. Browser task spaces were finished.
- The first rescue browser test targeted Sol max, whose tok is legitimately missing and therefore not in MODELS. Test corrected to real Sol xhigh. A later rerun exposed ego Node cwd differing from repository cwd; browser URL now has an explicit default path and accepts `MKL_BROWSER_URL`, plus `MKL_BROWSER_SPACE` to resume a failed QA space.
- SKILL.md now documents four shares, defaults, registry, sources, fixed full-quota estimates, independent resets, write provenance, and fetch-prices-before-build ordering.
- No child agents, version-control operations, commits, pushes, or PRs. Main window owns independent review. No claim that all pre-existing metric/filter interactions were exhaustively retested; untouched renderer behavior remains for main-window review.

## Delivery status

- Implementation and behavioral/browser verification complete.
- Main-window independent review pending.
