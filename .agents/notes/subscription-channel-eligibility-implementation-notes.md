# Subscription channel eligibility correction

## Parent acceptance

Parent reran pricing, axis, frontier, motion and feedback suites successfully. Final snapshot rebuild and pricing/feedback rerun passed. Serialized registry and 265 ROWS_RAW hashes still match pre-change artifact.

Desktop Ego acceptance passed nine recorded check groups against actual file in TaskSpace 13. The original failing repro now prints `PASS standalone channel bars and official-only OpenAI plans`. Report `/tmp/llm-pf-subscription-eligibility-report.json`; screenshot `/tmp/subscription-channel-eligibility-final.png`, opened and inspected by parent. TaskSpace 13 finished with no retained pages.

Fresh review `/tmp/subscription-channel-eligibility-final-review.md` found no behavior defect. Accepted its P2 harness finding by checking accumulated runtime errors before each tested reload and at end, then reran complete browser suite successfully. Removed three redundant comment lines from module/HTML and rebuilt. No safety suppressions added. New public catalog and automatic embedded-to-global selection migration remain rejected.

First browser run reached projection assertions but pointer action was intercepted when a deep button sat in the dock's clipped scroll area. Explicit scrollIntoView before real page.click fixes test targeting, with no application layout change. Repeated complete browser suite passes. Removed unused apiSol baseline and replaced redundant JSON stringify/parse cloning with object spreads. Storage/viewport restoration ran in finally after success and failure.

No commit, push, PR or deployment. Actual source stays in `/private/tmp/llm-pf-main/.agents/skills/llm-pareto-frontier/`.

## Scope

User wants standalone OpenCode Go and Command Code subscription bars. Aggregators may cover only models without an official subscription. Remove aggregator-only creator bars. Preserve multiplier data, desktop layout and model snapshot. No commit, push, PR or deployment.

## Work units and throughput checkpoint

Read-only flow investigation, bounded design comparison, single-writer implementation, parent browser acceptance. Changes cross catalog, resolver, storage and UI boundaries, so delegate bounded units rather than one large work unit. Each unit stays within 20% context. The existing registry is the source of official coverage; no duplicated creator blacklist.

## Bug fix checklist

- [x] 1. Reproduce it yourself on the matching surface via the control skill (Non-negotiables), even when a debug or instrumentation protocol says to ask the user to reproduce. Ask the user only with a stated, specific reason the control surface cannot reach the target, and only after driving it as far as it goes. If it won't reproduce directly, synthesize the trigger, tighten conditions, or instrument until it fires.
- [ ] 2. Binary-search the cause. Form the candidate hypotheses, then rule them out until one survives. Seed them with `how` over the affected subsystem and the **why** skill for regression history. Each pass, take the split that cuts the most remaining problem space, get runtime evidence, eliminate. When program state is unclear, add instrumentation or logging and read it as the code runs. Don't guess. Drive a long or stubborn hunt with Cursor's `/loop` command. Confirm the surviving *mechanism* with runtime evidence before the step-3 architect/interrogate fan-out.
- [ ] 3. Plan the fix. If it crosses a function boundary, `architect` first. Delegate implementation to a subagent using your configured bug-fix model (default `grok-4.7-xhigh-fast`) with a specific scope.
- [ ] 4. Verify on the same surface. The original repro now passes. "Inconclusive" or wrong-surface is not a pass. Flag it. Unit tests show branch behavior, not bug absence.
- [ ] 5. Stage the commits so the failing repro lands before the fix in git history. See the **tdd** skill for the failing-test-first cadence when the bug has a cheap local test path. Skip it when the test would be expensive, integration-heavy, or unclear.
  skip: no commits authorized for this local feedback iteration. Record failing and passing evidence instead.
- [ ] 6. Run **Opening a PR**.
  skip: preserve the handoff's local-only delivery boundary.

## Architect checklist

- [ ] Ground
- [ ] Sketch
- [ ] Agree
- [ ] Implement
- [ ] Scrap
  skip: only if implementation disproves the sketch.

## Arena checklist

- [x] Frame
- [ ] Fan out
- [ ] Cross-judge
- [ ] Pick
- [ ] Graft
- [ ] Verify

Rubric. Model-level official coverage including inheritance and unknown mappings; independent channel bars; single-source policy in both UI and engine; unchanged storage/ratio data; small API and diff. Two read-only candidates compare predicate plus projection against derived eligibility catalog. Configured Kimi architect model is unavailable, so use GLM and DeepSeek at medium effort instead. They write separate /tmp artifacts, not the source worktree.

## Grounding

Investigator traced registry to channelBars, normalization, resolveSelection and page priceBreakdown. Its creator-level exclusion recommendation is rejected because a creator having some subscription does not prove this particular model has one. Existing vendor plan model keys and inheritedMultiplier define official coverage. Cursor is reseller, not official. Bare engine aggregator calls must use the same eligibility rule as visible plan coverage.

## Reproduction

Parent created Ego TaskSpace 13 and opened the actual file URL. OpenAI visibly offers OpenCode Go, Go Plus and Command Code GOAT for GPT-6 Luna. Runtime CHANNEL_BARS includes OpenAI with all three channels and separate LongCat, Xiaomi, DeepSeek, StepFun and Alibaba creator bars. This matches the reported defect. Existing notes show the prior round deliberately introduced per-creator aggregator embedding, so this is a requirement correction, not a stale build.

## Accepted design and single-writer checkpoint

Read `/tmp/subscription-eligibility-design-verdict.md` in full. Implement A's small internal predicate with B's filtered per-plan projection. Reject a public catalog and legacy embedded-key widening. The data shape remains raw registry config plus projected bars/plans; raw models, ratios and provenance stay intact. Advisor reviewed the candidate direction and highlighted null coverage, caller attribution, exclusivity, runtime parity and snapshot hash checks.

Unit 1 covers engine/bars/resolver/normalization and behavior tests. Unit 2 covers UI callers, compact browser acceptance script and snapshot build. Parent already reproduced the real UI in TaskSpace 13 and owns browser acceptance. This writer will not operate the browser or version control. Use this existing checklist as the local task record; staging and PR steps remain skipped. No further fanout under the explicit single-writer contract.

## Unit 1 evidence

`node scripts/test-pricing.mjs` passed. Full ROWS_RAW attribution yields OpenCode 3/3 and CommandCode 7 projected models. Explicit engine calls reject official direct/null coverage and Luna inheritance. Raw ratio regressions remain, including LongCat 60/10 and 240/40, both 6. Cursor Grok 4.5 does not count as official coverage and keeps existing resolver priority. Legacy embedded keys are discarded, real aggregator keys preserved, and normalization is idempotent with first-bar aggregator precedence. No public export or constructor parameter added.

## Unit 2 implementation

UI consumes projected coverage for aggregator benchmark presence, buttons and details. Aggregator mappings receive the actual creator and explicit channelId. Official/reseller mappings keep channel attribution and explicit boundary validation. Nonempty aggregator selections clear only other aggregator bars. API clears only its own bar. Main panel markup, geometry controls and token mix remain unchanged. The compact browser script is being updated for current behavior, explicit existing space/url configuration and state restoration; it will not run in this writer.

## Final offline verification and residual boundary

Snapshot rebuild passed twice with `metrics: 0 variants; arena boards: ; tok patched: 0; prices patched: 0; logos added: (none)`. Final build followed by pricing tests and browser-script syntax check passed. Axis-domain, frontier-domain, motion and feedback-parity tests passed against rebuilt HTML. Pricing tests execute the actual UI selection functions in a VM and check embedded pricing source parity; this is not DOM/browser acceptance. A temporary test failure came from using the wrong marker name for the parity assertion. It was corrected to the existing `SUBSCRIPTION_PRICING_RUNTIME`, with no runtime code change.

Pre/post serialized hashes match exactly. Registry SHA256 is `7b6ac551064d4250e7c8961c615f5166305230604043d766afa0985eabb5be2f`. ROWS_RAW SHA256 is `914996e24c1b82d18451ed0794798b0cd18258151f28b25b12f6f3a78afa141d`, with 265 rows. Evidence is `/tmp/subscription-eligibility-before.json`, `/tmp/subscription-eligibility-after.json` and rerunnable `/tmp/subscription-eligibility-hashes.mjs`.

Final Advisor review recommends keeping browser acceptance open and rerunning pricing after the final build; that rerun passed. The production `CHANNEL_BARS` entry passes creatorByRowBase from ROWS_RAW, and the test uses the full same data attribution. `channelBars()` without callback cannot infer Luna inheritance, explicitly tested and retained per verdict. Bare engine rejects Luna when given its real OpenAI creator. Cursor reseller priority remains unchanged. The rewritten browser script is syntax-checked only, not executed. Its state-restoration and geometry/DOM assertions are pending parent runtime verification. No browser operation, user-state clearing, staging, commit, push or PR performed.

Model the Domain shaped the raw-registry plus projected-plan structure. Laziness Protocol kept one internal predicate and no public catalog. Test Behavior, Not Implementation shaped output, absence and actual UI-function assertions. Prove It Works shaped serialized data checks and final rebuilt-artifact tests. All four principle leaf skills were read in full.
