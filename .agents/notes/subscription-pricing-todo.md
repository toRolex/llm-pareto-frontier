# Subscription pricing feature todos

## Feature playbook

- [x] `how` over the affected subsystem. Read the local cost pipeline and relevant notes directly because the how skill is user-only.
- [x] `architect` for parallel design exploration. Skipped parallel agents because the task explicitly assigns one owner and prohibits spawning. Compared whole-shape alternatives locally.
- [x] Write the throughput checkpoint as four todo items. A dimension that genuinely does not apply (single file, no fan-out) keeps its item with `n/a: <reason>` rather than being dropped:
  - [x] **Blocking first steps.** Gates run before fan-out. Cache-write source not yet supplied; source HTML and build pipeline traced. Proceed with an explicit estimate provenance.
  - [x] **Independent workstreams.** Disjoint files, services, or layers parallelize. Shared writes serialize. One owner holds coupled build/data/HTML.
  - [x] **Shared mutable state.** Default to splitting the target (the **separate-before-serializing-shared-state** principle skill). Serialize only for real invariants. No shared editing; serialize coupled files.
  - [x] **Smallest safe decomposition.** If one worker is best, name why. One owner is safest because build, source rows, runtime, and shared UI state must stay synchronized.
- [x] Delegate code-writing to a subagent using your configured feature model (default `grok-4.7-xhigh-fast`) with a specific scope (file paths, named data shape and its organizing structure per **principle-model-the-domain**, a state machine over scattered booleans, a table/registry over branching, a typed model over repeated shape assumptions, chosen before the delegate writes logic, and success criteria). When the implementation admits multiple valid shapes (error handling, abstraction layer, test structure), delegate via the **arena** skill instead so the runners surface the alternatives and the cross-judge guards the pick. Mandatory: no skip-with-reason escape, and Laziness Protocol does not override it (the gain is review separation, not lines saved). A subagent forbidden to spawn satisfies this by owning the diff directly with the same review separation. No "standing by" reply that waits on a nested agent. Comments per **Comments**. Surgical edits, re-ground against the source for upstream-derived files. Port shared-primitive improvements to all consumers and verify each. Commit liberally.
  - n/a: task forbids this agent from spawning subagents. This owner implements the diff; the main window performs independent review.
- [x] Verify on the matching surface. "Inconclusive" or wrong-surface is not a pass. Flag it.
- [x] Rebase into small, ordered commits.
  Use the **sequence-verifiable-units** principle skill, building, verifying, and committing each small unit before the next.
  - skip: project directory is not a jj or Git repository; no version-control operations or commits can be performed.
- [x] If the design is contested, `interrogate` before shipping.
  - n/a: product decisions and top-level spec were fixed in the task. The remaining uncertainty is cache-write source data, which is recorded with provenance rather than silently guessed.
- [x] Run **Opening a PR**.
  - skip: user explicitly prohibits PRs.

## Architect phases

- [x] Ground.
- [x] Sketch.
- [x] Agree.
- [x] Implement.
- [x] Scrap. No discarded design needed.

## Implementation units

- [x] Add typed-in-spirit pricing registry and pure pricing math.
- [x] Add API cache-write field with transparent estimate/source provenance.
- [x] Extend build to inject pricing data and runtime pricing code idempotently.
- [x] Add four-share controls, vendor plan selectors, restore actions, persistence, and clear localStorage warning.
- [x] Route chart coordinate, frontiers, 2D view, tooltip and per-task conversions through one effective-price function.
- [x] Add Node behavior tests and run repeated build checks.
- [x] Open and test the generated HTML in a real browser. Check 3D, 2D, metric/config controls, all pricing state interactions, persistence, network, and console.
- [x] Review actual diff and document evidence and limitations.
