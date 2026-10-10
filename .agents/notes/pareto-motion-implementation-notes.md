# 直连前沿与平滑切换实现记录

## 用户契约

2026-10-10 用户要求二维前沿直接连接观测点，3D恢复之前非阶梯面，只保留绝对值域。3D/cost/token、指标、log/线性、API/订阅等数据切换需连续移动且可中断。外圈语义需要解释。只在 /tmp/llm-pf-main 实现，不碰主目录，不新建重复PR，不合并。

## 调查

基准父3308bf69。computeFrontier采用常高格网top/step面；二维stairs生成额外横竖折点。rebuild整体dispose后重建导致数据切换瞬移。rebuild在flight中settleView到旧目标，造成中断跳变。solid中心是所有观测点；ring仅完整4D非支配集合front4，不是选中或当前二维前沿。旧Delaunay外观参考 /tmp/llm-pareto-label-scale-fix/.agents/skills/llm-pareto-frontier/prototype-4d-3d.html。

四项Node基准测试通过。通过只说明旧契约成立，不能说明满足本轮要求。未进行本轮浏览器操作。上一轮TaskSpace1被用户接管，等待明确交还控制，不能绕过。

## Throughput checkpoint

Blocking first steps。先读实际实现与比较两个设计，再允许单一owner写入。

Independent workstreams。只读调查和设计分别输出到/tmp，不共享写目标。

Shared mutable state。canonical HTML与内联domain由一个专属实现owner持有，parent不同时写入或运行测试。

Smallest safe decomposition。所有切换共享渲染时间线，交给一个owner，验证在owner完成后由fresh reviewer执行。

## 设计比较

候选A为持久ID场景和单一motion采样，候选B为保留双世界加keyed morph。两者都坚持中断源取当时显示值，不使用旧目标。parent读完设计，认为两者原案重写过大。A的重复目标幂等论证不成立；B多次中断的层释放未充分定义。已派独立crossjudge，要求缩小到复用现有buildWorld的snapshot/morph，保留必要的旧静态参考层，避免双点重复绘制。尚未裁定或实现。

## 验证与限制

基准运行test-frontier-domain、test-axis-domain、test-pricing、test-feedback-parity均PASS。没有帧率、速度提升或主观丝滑结论。浏览器runtime验收BLOCKED，等待用户明确授权TaskSpace1控制。

## Geometry / absolute-domain checkpoint

专属 fallback implementer 已在 canonical /tmp/llm-pf-main 完成第一个可验证单元。没有触碰主 checkout，没有版本控制写操作，没有浏览器执行。

数据形状由 computeFrontier 统一持有 front4/front3/front2Cost/front2Tok、surface {positions, triangles, edges, vertexIds}、lines {cost, tok} 与逐 observation coverage。二维 front2 只输出排序后的观测顶点，exact duplicate 只折叠几何。Three line 和 SVG fill 共用 lines。三维从 earlier reference 的 Bowyer–Watson 和 MeshPhysicalMaterial/dashed edge 外观恢复，输入明确为 front3，不再是格网阶梯。只用 exact coordinate key，不做 toFixed 舍入。退化单点保留 vertex，双点/共线只有边界连线。front4 与所有 dot/ring/sprite 观测循环保留。外圈由 frontSet=front4 控制，实心中心为全部 rows，新增图例明确非 hover / 非二维前沿。

已删除 runtime perfScale/perfVal/perfMax、归一化按钮和分支，rows.val 直接 mi.get。没有改价格事实或运行 build-proto。旧阶梯几何契约测试完整改写为新行为字面预期，覆盖 fullP4、速度保留、exact alias、near coordinate、不变输入、空/单点/共线、直连顶点和真实三角拓扑。inline parity 验证源、语法、absolute rows 与 line/fill 共同输入。三个浏览器脚本已替换阶梯/归一化断言，仅运行 node --check，不执行浏览器代码。

Node 最终结果。test-frontier-domain、test-axis-domain、test-pricing、test-feedback-parity 全 PASS。verify-feedback-browser、verify-pricing-browser、test-redesign-browser 的 node --check 全 PASS。过程中修正一条 swapped projection 测试的错误预期，原始 Pareto membership 不应随 project callback 改变；修复浏览器脚本局部命名冲突后重跑成功。

Continuation。尚未实现 Motion keyed {from,to,presence}、cameraPlan、shown/pending topology fade-out/swap/in、240ms 独立通道、same-target no-op、reduced-motion 与 interruption 测试。现有 rebuild 仍整体 dispose/rebuild，flight/settleView 旧行为仍在，不能声称连续切换已完成。下一 unit 应从 rebuild/applyView/rAF/frame2D/controls 着手，保留 buildWorld，新源取同一 now 的显示快照，严禁旧 settleView 中断 snap。browser 仍 user-owned TaskSpace1，runtime 验收包括 triangulation 视觉/拾取、fill 对齐、全部切换 motion、orbit/pan/zoom、内存释放，全部未验证。

## Motion implementation checkpoint

专属 motion owner 仅编辑 /tmp/llm-pf-main，保留 geometry owner 的全部未提交产物。不执行浏览器、版本控制写操作或 nested agent。Model the Domain 原则落实为 Motion {targetKey,keyed {from,to,alphaFrom,alphaTo},t0,duration,shownAlpha} 与独立 cameraPlan。纯源 scripts/motion.mjs 原样内联，test-motion 以 fake clock 同时验证模块与内联行为。

rebuild 先在同一 now 采样当前显示点，再构造目标世界。targetKey 包含指标、两轴 scale、priceMode、perTask、mix、subscriptionPlans、theme 与 visible observation/cost，重复目标不重建或重启。共享 observation 使用目标世界唯一 dot/sprite，旧 shared handles 随旧 group 退役；仅 outgoing nodes 转移至目标 group，禁止 outgoing pick。新点和 outgoing presence 连续淡入淡出，ring membership 单独保持当前 alpha 后收敛，全部点与 effort/front/surface vertices 共用 keyed positions。

shownTopology 保留实际显示拓扑，旧 alpha 在前120ms归零，归零才换入 pending topology，后120ms淡入。打断在前半程从当前 shown alpha 继续淡出，打断在后半程以刚显示的 topology 为新的 shown。SVG fill 直接读取 shown front line BufferGeometry 与相同 topology alpha，避免用目标 frontier 产生提前跳变。numeric ticks 在 data morph 中隐藏，title/box 保留，state 与 tooltip 标注目标数据/切换中。世界销毁在下帧开始 drain；连续打断只提前释放未渲染 pending group，shown topology 和 outgoing nodes 已移出，保留层数不随打断增长。完成后删除 alpha0 outgoing handles，下一 retarget 丢弃 alpha0 obsolete keys。

cameraPlan 默认240ms，从 now 实际姿态采样，中断 applyView 不 settle 旧终点。data rebuild 不取消或改写 camera destination。planar source 把 pan 与 ortho frustum 转成匹配 perspective pose，planar endpoint 包含现有垂直偏移，settle 后保留 frame2D。flight 仅作为既有浏览器 probe alias。pointer/wheel 接管 flight 时保留实际 perspective pose并转3D orbit，不转到原2D目的地；data继续收敛，zoomDistance清空避免旧 endpoint 叠加。reduced-motion 新 data/view 切换直接提交。

Prove It Works 原则落实为五项 Node 验证。test-motion、test-frontier-domain、test-axis-domain、test-pricing、test-feedback-parity 全 PASS。test-motion 额外在 VM 调用真实 HTML sampleDataMotion，断言 zero-alpha detach、outgoing opacity、shared唯一key、完成移除和 disposal queue。verify-feedback-browser、verify-pricing-browser、test-redesign-browser 仅 node --check，未执行。feedback parity 的 fill assertion 改为实际 shown line geometry，不删除原覆盖目的。

Runtime gaps。无浏览器调用，因此相机 orthographic/perspective 交接视觉、pointer dispatch 中 OrbitControls replacement、Delaunay/fill外观、hover/ring连续性、快速中断拾取、GPU资源释放与帧耗时仍未观察。无法声称零视觉瑕疵或性能提升。parent授权恢复后需要真实UI检查全部metric/log/pricing/scenario/filter/view开关，快速打断、orbit/wheel/pan，以及reduced-motion。

## Parent actual runtime acceptance

用户明确授权重新认领TaskSpace1，claim成功，p1确认canonical file路径。owner结束后reload，parent实际执行feedback57PASS、redesign41PASS和订阅价格browserPASS。报告分别 /tmp/pareto-feedback-browser-report.json、/tmp/mkl-redesign-backup/test-redesign-browser.json、/tmp/mkl-subscription-evidence/browser-results.json。

第一次feedback在metric改变后检查到中间面坐标，settle原先只等flight。更新为同时等sampleMotion.done后57PASS。redesign同样补data settle，并修正遗漏的synthetic fixture staircase oracle为独立2DPareto直连顶点，41PASS。subscription script修复隐藏select改真实plan按钮、不存在locator改evaluate、hover坐标改plotRect、固定卡不再等待display:block、去除worker自行finish。最终实跑PASS，不将syntax当runtime证据。

parent额外采样 /tmp/pareto-motion-continuity.json确认metric/logcost/logtok/price立即共享点无明显位置跳变且点随后移动；same-target不重启时钟。中断两次取值间存在时钟推进，不能据此宣称精确零跳变。减少动态效果实际CDP模拟切cost flight=false，随后恢复emulation。没有测帧率。已读3D/token/cost截图，3D仍有继承的小默认取景，不扩范围改镜头。

独立correctness review ad61703b9889fe9c2 PASS，确认一个非阻断契约偏差，可见outgoing点未加入pick。parent将pickAt集合改为world.handles可见sprite并保持segment回退同源，真实浏览器合成筛选Sonnet max观察visible=true、pick精确同id PASS。Node motion/parity重跑PASS。fresh reviewer a94cf012b02a15680最终小修复复核PASS，确认outgoing可见时pick、alpha0与删除后不可pick。parent再次实跑feedback57PASS。未提交/推送，已有PR#1未更新。comment audit建议删除3条说明注释，parent已删除，保留inline功能marker。flight重复probe别名和pending释放两项结构flag不因建议改名就算解决，待真实正确性审查。

## Deviations

本 work unit 按用户指定顺序停在 geometry + normalization 验证 checkpoint，未开始 motion，以免跨过上下文预算。canonical 既有其他删除未恢复、未扩展、未提交。无需 parent 猜测完成范围。

配置Grok/Kimi处于临时禁选状态。设计探索换用DeepSeek/GLM，crossjudge使用gpt-6.1-sol，不改角色配置文件。
