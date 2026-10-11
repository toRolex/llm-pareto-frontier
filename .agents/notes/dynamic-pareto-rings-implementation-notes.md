# Dynamic Pareto outer rings

Task and checklist live in /tmp/pareto-rings-task.md. Read /tmp/llm-pareto-frontier-three-axis-handoff.md for boundaries, not as override of latest instruction.

## Evidence and decisions

Parent reproduced in Ego space 2 on actual generated desktop HTML. Default Index 3D has 42 visible ring sprites against 24 three-axis frontier points. Cost 2D retains 42 ring sprites against five cost/metric frontier points. No browser errors. Screenshot /tmp/pareto-rings-before.png.

Latest user specifically requests dynamic benchmark/coordinate changes and different 2D/3D frontiers. Therefore ring membership follows displayed axes, not a fixed three-axis subset across all views. Speed never grants ring qualification. Existing front3/front2Cost/front2Tok collections define the data shape; no new Pareto algorithm is needed.

One writer at a time in /private/tmp/llm-pf-main. Prior subscription changes must remain intact. Snapshot build only. No commit, PR, push or deployment requested.

## Implementation and acceptance

Selected revised A after two candidates and independent verdict /tmp/pareto-design-verdict.md. B registry duplicated lifecycle state. A uses one local view-to-frontier table and keeps world.front/frontSet consumers. All different views rebuild with view in targetKey; obsolete speed qualification tooltip was deleted. Writer notes /tmp/pareto-rings-implementation-notes.md, task patch /tmp/pareto-rings-task.patch. Independent source review /tmp/pareto-rings-final-review.md found no product blocker and requested stronger runtime evidence.

Parent ran failing baseline oracle, then passed 77 desktop browser checks in /tmp/pareto-rings-browser-results.json, original 57 feedback browser checks /tmp/pareto-feedback-browser-report.json and pricing browser suite /tmp/mkl-subscription-evidence. All five offline suites passed after final MKL_SNAPSHOT=1 build. 265 ROWS_RAW entries exactly unchanged against pre-task baseline.

Review evidence gaps addressed. Script now reads attached, visible shownTopology geometry and exact SVG fill projection, plus settled camera/control state and retired ring cleanup. Parent removed two added explanatory comments and corrected unsupported Configs regex locator.

## Deviations

Clear-config regression exposed preexisting token-log tick loop. Actual UI reported RangeError Invalid array length at logTicks line2096, selected0 but old rows71. Empty log domain starts at0; kMin=-Infinity makes k++ never advance. Minimal fix makes token log ticks require min>0 just as cost ticks do, otherwise linear ticks. Actual inline VM timeout regression added to test-axis-domain. Diagnostic /tmp/pareto-rings-edge-fix-report.md. Clear now passes all views with zero rings/rows.

A bare settle poll can report elapsed animation completion before a rendering frame. Parent oracle now waits two frames before checking sprites. Uninterrupted requestAnimationFrame could skip the middle of a240ms animation under browser load. The reversal test therefore samples the live production sampleDataMotion at the actual current timestamp before reversing; it is a browser object continuity check, not proof of uninterrupted rendered frame cadence. Recorded opacity0.9497568, sampled0.9497491, new plan/from and new ring opacity exactly0.9497491. This limitation does not change final-membership acceptance.

No commits, pushes, PR or deployment. Final screenshot /tmp/pareto-rings-after.png; parent visually confirmed default cost view only front points are ringed.
