# Bug fix

1. Reproduce it yourself on the matching surface via the control skill (Non-negotiables), even when a debug or instrumentation protocol says to ask the user to reproduce. skip: 浏览器原始复现由主agent负责，本agent用真实HTML代码执行尺度复现。
2. Binary-search the cause. Form the candidate hypotheses, then rule them out until one survives.
3. Plan the fix. If it crosses a function boundary, `architect` first.
4. Verify on the same surface. skip: 主agent负责浏览器最终验收，本agent交付运行测试与浏览器可重复脚本。
5. Stage the commits so the failing repro lands before the fix in git history. skip: 禁止提交，保存先失败后通过输出。
6. Run **Opening a PR**. skip: 未授权发布。

# Architect

- Ground. 定向只读子agent。
- Sketch. 比较共享域对象与局部域计算。
- Agree. 自主选择。
- Implement. 源码与真实模板修改。
- Scrap. 无必要则不执行。

# Throughput checkpoint

- Blocking first steps. 只读jj安全门通过。已有jj，身份一致。无敏感文件扫描命中。不snapshot，不写版本状态。
- Independent workstreams. 只读设计复核与主agent模板定位并行。
- Shared mutable state. 所有写入限定独立/tmp目录。
- Smallest safe decomposition. 一名实现owner，避免共改HTML模板。

# Acceptance

- 当前有效保留模型决定域，单模型、零价格、空集有限。
- 点、轴、网格、前沿使用同一变换。
- 彩色名称与小effort，无rect，选集及hover不变。
- 重建、精确patch与测试输出可重复。
