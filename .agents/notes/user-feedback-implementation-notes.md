# 用户反馈实现记录

## Bug fix 清单
1. Reproduce it yourself on the matching surface via the control skill.
   parent 已在 TaskSpace1 p1 重放。owner 不操作浏览器，遵守委派边界。
2. Binary-search the cause.
   已确认旧 P2 intersection gate、取消 flight 不落 camera2、全量标签避碰及随鼠标 tooltip。
3. Plan the fix.
   已读设计 A/B 与 /tmp/pareto-design-verdict.md。采用完整 P4、精确 P3 阶梯包络、轻量 settleView。
4. Verify on the same surface.
   parent baseline 三项 PASS。fresh feedback-verify-fix 接管 TaskSpace1/p1 串行浏览器所有权，feedback 57 checks 与原 redesign 41 checks 均运行 PASS。
5. Stage the commits so the failing repro lands before the fix in git history.
   skip. 用户禁止 VCS 写入。
6. Run Opening a PR.
   skip. 用户禁止推送和 PR。

## Throughput checkpoint
HTML 是共享状态，由 feedback-owner 单写。纯几何及 literal tests、浏览器脚本交给独立 fresh worker。新增 helper 边界修复由 fresh worker 完成。owner 收口集成与 Node 验证，不派独立 HTML 写者。预算接近上限时交接实际浏览器验证给 parent。

## 数据形状
Frontier 是 `{front4,front3,front2Cost,front2Tok,surface,interior4D,coverage,stairs}`。domain Row 是 `{id,cost,tok,val,speed,src}`。id 为 creator 与配置全名组合。raw metric 判定资格，perfVal 仅投影。project 将现有 W=10×5×10 世界映到 [-5,5] 三轴，fromDomain 分轴还原。u/v 越大代表资源预算越紧，预算原值比较是 cost/tok≤预算。height 取 projected u/v≥阈值的最高 metric，无支持为 null，真实 -5 高度不混淆。surface faces 仅 top 与真实高度差 step，不渲染人工裁剪封墙。

Hover 是 null 或 `{modelId,familyKey}`。familyKey 为 creator+baseKey。hovered 保存当前 world sprite，重建清空。aliases 原坐标保留，无 jitter，固定卡提供每个投影重合配置按钮。interior4D 字段名保留接口，其语义为 P4 非 P3，不保证几何内部。卡片写三轴投影被支配及速度权衡，不误称所有 P4 点在顶面。

Camera 的 flight 为 null 或目标过渡记录。settleView 是完成和中断的共同落地入口，清 2D drag/zoom target，并 dispose/recreate OrbitControls 清旧 damping/input。稳定态 rebuild 保留合法平移缩放。3D wheel 禁止 OrbitControls 再消费，按连续 delta 更新有界目标距离并逐帧阻尼。没有帧率或性能提升结论。

PlotRect 取 chart bounding rect。renderer、aspect、frame2D、pan 横纵分母、raycast、labels 与 SVG fill 同源。固定右侧 292px card/legend 栏预留绘图区，800px 以下预留下方 164px槽。hover 不改 card 位置和宽度。

## 基线与设计取舍
parent 的 /tmp/pareto-feedback-baseline.json 初次实测为 P4 expected42 actual15，取消飞行 camera2 actual[12.8,10.1,-11.8] expected[5,2.5,50]，默认2D labels67而期望0。详细依据在 /tmp/pareto-runtime-grounding.md。parent 后续复跑同文件会覆盖结果，失败数值在此保留。

舍弃 Delaunay 与任意交叉三角汤。没有宣称连续可实现最优面。2D阶梯与上方浅色填充同源，填充解释为超出该预算已观测最佳性能的区域，右侧无支持尾区不填。默认没有全量名字、effort或灰引线。hover只标目标base全名与effort，其他家族点仅effort。单档也高亮。

parent 初版截图发现2D取景过小、轴文字小和P4默认logo密集。owner将取景 halfH从4.5缩到3.2，将轴sprite最小屏幕高约12px，P4默认改品牌色空心描边，hover才显示logo。此修订待真实浏览器验证。

## 模板与验证
本仓库无独立 HTML template，build-proto.mjs 把现有 HTML 当模板。新增 FRONTIER_DOMAIN_RUNTIME 注入，与 axis/pricing已有模式一致。不执行可能改变事实的 build-proto；test-feedback-parity.mjs 检查内联纯源完全相等、实际IIFE语法与literal完整P4行为。没有价格事实变更。

已运行的命令。
- node .agents/skills/llm-pareto-frontier/scripts/test-frontier-domain.mjs
- node .agents/skills/llm-pareto-frontier/scripts/test-axis-domain.mjs
- node .agents/skills/llm-pareto-frontier/scripts/test-pricing.mjs
- node .agents/skills/llm-pareto-frontier/scripts/test-feedback-parity.mjs
- node --check .agents/skills/llm-pareto-frontier/scripts/verify-feedback-browser.mjs
- node --check .agents/skills/llm-pareto-frontier/scripts/test-redesign-browser.mjs

浏览器脚本使用现有 TaskSpace1/p1，不新建空间，不碰p2。fresh feedback-verify-fix 已运行完整验收。
`{ printf 'process.env.MKL_SPACE_ID="%s";\n' "${MKL_SPACE_ID:-1}"; tee < .agents/skills/llm-pareto-frontier/scripts/verify-feedback-browser.mjs; } | ego-browser nodejs`
报告为 /tmp/pareto-feedback-browser-report.json。完整 feedback runtime 57 checks 已通过，覆盖多档/单档 hover、segment、所有11指标 P4/P3实际几何、fill与pan/zoom/resize裁剪、快速取消矩阵、双主题固定卡、实际3D wheel/drag与远近投影大小。重合配置卡按钮未在该脚本中单独操作，不把它计为已验收。浏览器脚本不得以syntax pass代替runtime验收。

## Fresh runtime verification fix

首次 feedback 失败原文为 `SVG polygon exactly follows staircase and closes above it`。独立浏览器取值显示 chartTop=96，W.d 屏幕 y=118.3828125，实际 polygon 最后两点 local y=0。源正确延伸到可见图顶，测试错误假定轴顶 W.d 等于图顶。保留精确点数、阶梯、完整多边形与面积断言，expectedPolygon 从实际 plot top 独立还原世界 y，并要求 SVG rect 与 plotRect 完全一致且 overflow hidden。新增真实 2D wheel 与 drag 后同样复验。未改已审查通过的 frontier-domain helper。

修正测试后实测第二处失败为 `point hit selects exact config`，expected `Xiaomi|MiMo-V2.6-Pro`，actual `Meta|Muse Spark 1.3 (max)`。Tok视图射线命中两重叠sprite，Meta距离43.932639、Xiaomi距离47.913956；点击正中Xiaomi仍被世界隐藏cost深度夺取。pickAt 在2D把已命中sprite按屏幕中心距离排序，3D维持原最近深度选择；完全重合仍保留固定卡内aliases，不移动点。此后原失败输入与完整feedback均PASS。

原 redesign header 已检查。其 denied-storage 场景原先 task.newPage 违反本轮仅p1约束，改为同p1临时CDP preload并导航重放，finally移除preload后reload再恢复状态。不删storage行为断言、不新增页面、不finish。原redesign实跑41 checks PASS，report `/tmp/mkl-redesign-backup/test-redesign-browser.json`。

本轮命令与结果。
- `ego-browser nodejs < .agents/skills/llm-pareto-frontier/scripts/verify-feedback-browser.mjs`。初次修正fill oracle后8 checks失败于2D拾取；修复pickAt并reload后57 checks PASS。
- `{ printf 'process.env.MKL_SPACE_ID="1";\n'; tee < .agents/skills/llm-pareto-frontier/scripts/test-redesign-browser.mjs; } | ego-browser nodejs`。41 checks PASS。
- frontier-domain、axis-domain、pricing、feedback-parity 的 Node tests全部PASS，两浏览器脚本 node --check PASS。

截图已保存为 `/tmp/pareto-feedback-final-cost-default.png`、`cost-hover.png`、`tok-default.png`、`tok-hover.png`、`3d-dark.png`、`3d-light.png`、`narrow-sidebar.png`，各文件均使用同一完整前缀。已查看cost default、3d light、narrow sidebar。窄屏720×700的plot=[12,96,696,152]，card=[316.3125,284,391.6875,164]，无交叠。未宣称帧率、性能提升或窄屏文字无拥挤。截图保留供parent视觉裁决。

fresh Comment Sicko 只审查修改的pickAt、verify2D与pan/zoom断言。建议删除0、MUST KILL 0，无修改与恢复。未碰范围外注释。无git、commit、PR或价格事实变化。浏览器所有权本work unit结束后归parent，TaskSpace1/p1保留，未碰p2。

Fix Root Causes 使本轮先区分世界轴顶与viewport顶，后用重叠sprite运行时距离定位拾取原因。Prove It Works 使验收依据完整真实浏览器报告，不以syntax或纯helper测试替代。

Model the Domain 改变了 Frontier/Hover 数据形状与 nullable height。Build the Lever 改变了交付方式，留下可重放浏览器及 parity 脚本。Test Behavior, Not Implementation 改变了几何断言，采用literal fixtures及独立 P4/P3 oracle。Prove It Works 限制了结论，明确区分 Node 已测和浏览器待测。

## Parent 最终验收
parent读取实际JSON，反馈57项与原redesign41项均PASS。删helper及inline三条叙述注释、死killFront和旧注释，修阶梯面的虚线图例为面色样本后，parity、baseline3项、反馈57项再次PASS。额外合成Astra max/xhigh投影重合，实际点击固定卡第二配置按钮，hoverState和唯一全名标签成功切换xhigh，reload恢复。此按钮验证尚未纳入57项脚本。最终独立审查无阻断，/tmp/pareto-feedback-final-review.md。未测帧率。窄屏固定卡不挡图，但绘图区较小。最后TaskSpace1用户接管，停止浏览器操作。未提交、推送、建PR，未改价格事实。
