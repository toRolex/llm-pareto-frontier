# MKL UI redesign

## Decisions
- HTML 是 build 输入兼输出。build 仅替换内联数据、pricing runtime 和依赖，不重写 UI。直接修改 HTML UI 区域。
- pricing-model.mjs 保持原样。套餐面板委派独立实现，仅改其函数区。
- 3D 保持原相机、几何与业务投影，品牌色点与 hover-only logo 分离。
- 2D 常显标注使用屏幕 SVG 层，getBBox 碰撞布局；选择当前视图前沿与当前指标 Top10。

## Validation
- 备份：`/tmp/mkl-redesign-backup/prototype-4d-3d.html`。
- ego-browser 单一 TaskSpace 12，file:// 实际打开；完成后 finish 一次。
- 3D 暗/亮渲染、拖转、hover 单图标与信息框通过；主题 light 刷新保留。运行错误数组始终空。
- 2D 两视图 × 11 指标：标牌数与当前视图前沿 ∪ Top10 完全一致，22 次 getBBox 检查零标牌重叠。结果 `/tmp/mkl-redesign-backup/browser-validation.json`。
- 价格模式四档，Linear/Log、Perf归一、$/task、指标切换实际 cost/投影改变；Token视图交互正常。
- 套餐按钮与 range 实测：Anthropic Max5x Opus倍率57.3；OpenAI Plus显示8.1/10.6继承倍率；刷新保留选择。
- 四比例无效139.6%保留上次有效mix；25/25/25/25有效。reset mix保留plan，reset API保留mix。初态使用页面两个reset归零，未清profile。
- code-reviewer 只读复核发现三项，已修：tooltip进入时不隐藏、筛选伪元素颜色、Mesh点参与effort虚化。浏览器复验tooltip进入保持block且71个非组点opacity=.12。
- `node .agents/skills/model-killing-line/scripts/test-pricing.mjs` 通过。
- build默认TMPDIR无源JSON，使用已有 `/tmp/mkl-rescue-fixture`；该目录重建后的 ROWS_RAW/METRICS_DATA/ARENA_DATA 与备份字节相同。
- 两次 `MKL_DIR=/tmp/mkl-rescue-fixture node .agents/skills/model-killing-line/scripts/build-proto.mjs` SHA256均为 `c65641daea9dda7c3e8a99ded5a720a5b4567e0d285455ca0834309576ac098b`。
- 五截图位于 `/tmp/mkl-redesign-backup/shots/`：3d-dark.png、3d-light.png、2d-dark.png、pricing-panel.png、tooltip.png；已打开检查。

## Semantic preservation
- 未修改 scripts/pricing-model.mjs、build-proto.mjs。
- mappingFor/rateFor/effectiveRates/mixedRate/validateMix/cacheWriteQuote完全不变。
- readPricingState/persistPricingState/applyMixDraft/costOf/priceBreakdown/killFront/指标覆盖与effort映射规则不变。
- 固定估算倍率、各家API/套餐混用、同base effort倍率、OpenAI Sol继承、严格版本、cacheWrite来源标志仍由原引擎控制。

## Deviations
- 原 2D frontLine 使用 rows.cost 快照，而实际价格坐标使用 costOf。只修正该前沿渲染线与新标牌选集按effective cost判定；4D判定不变。这是价格面板切换后前沿与坐标一致性的必要修复。
- 2D 正交取景略加外边距和垂直偏移，避免新双排底栏遮轴标题；前轮3D相机/交互未改，本次按外审要求调整默认相机。
- 外审项2：仅改3D相机、轴文字展示与对比，不改业务投影。尝试统一放大轴文字造成1080的2D纵轴标题裁切，改为按视图字号/位置并在跨维切换时重建；2D原取景不变。
- 外审项3：倍率属于模型而非token类型，明确写各模型API除数，避免虚构输入/输出倍率含义；诚实估算与继承/拟合标记保留。
- 外审项4：固定155px底部位置不能覆盖1080/1200三行底栏，改测量真实底栏高度；面板保留内部滚动，所有原控件保留。
- 外审项5：保留native range键盘路径，补分段按钮方向/Home/End键及focus样式。
- 外审项1/8：新增真浏览器独立oracle，逐点校验position、完整前沿线顶点顺序与SVG前沿flag/标签选集；四价格模式×API/Plus套餐。临时3模型交叉输入/输出价格fixture明确翻转排序与前沿成员，在finally恢复MODELS/selected/S；ROWS_RAW不动。22真实指标场景重复数量相等、无重叠、无error；Token视图oracle只按tok判定。
- 外审项6：通过CDP新文档脚本拦window.localStorage（getter抛SecurityError），不修改用户浏览器profile；独立页关闭、预注入移除。
- 外审项7：启用CDP Network并记录requestWillBeSent；导航仅1个file文档+23个内联data资源，0外部请求。`network-requests.json`保留精简清单，`test-redesign-browser.json`保留原始完整事件（含data内容），非仅静态grep。
- 外审项8/9：fixture两遍build日志/hash及pricing日志落备份目录；新回归报告 `test-redesign-browser.json`。截图 `3d-dark.png / 3d-light.png / 2d-dark.png / pricing-panel.png / narrow-1200.png / narrow-1080.png / pricing-1200.png / pricing-1080.png`，3D前后对比额外留before。

## Rescue follow-up (2026-10-07)
- 默认3D相机由 (15.5,13,-18) 改 (12.8,10.1,-11.8)，target下移1.3；图体放大且避开底栏。3D tick 24→32 / scale1.25，title26→34 / scale1.25；两主题文字对比提高。标题与刻度错开，2D保留原字号/轴位置，跨维切换重建world但保相机过渡。
- 套餐卡不再用无语义 `8.1× / 10.6×`。按实际映射模型列 `模型：API ÷ 倍率（估算）`，没有错误解释成input/output倍率；fitted / inherited及来源tooltip保留。
- 底栏ResizeObserver提供实际高度变量；state/panel/config跟随。1200/1080底栏三行分区，价格面板792px高、距离底栏16px，内部滚动，无横向溢出。档位卡可换行，长模型列表不断框。
- native range原本支持方向键；档位按钮新增←→/Home/End（选档并移动焦点）、全控件可见focus ring。不替换价格事件链。
- 新浏览器回归37项通过；22标牌场景labels==expected且零重叠，禁存储下亮/暗真实点击通过；1200/1080各13标牌零裁切、零error，边界JSON `narrow-validation.json`。`fixture-equivalence.json`保存三个数据块与备份逐字相等证据。只读code-reviewer收尾复核通过，无阻塞。TaskSpace13已finish。
- 暗/亮3D、暗2D、价格面板及1200/1080截图见 `/tmp/mkl-redesign-backup/shots/`；before对比 `3d-dark-before-rescue.png`。
- fixture build连续两次SHA256相同：`e7faa53b125be00a65452d4a020aa74ecc53f2d7ba5029905f375299412fc9d2`；test-pricing通过。数据源未处理，仍使用等价fixture。

## Remaining risks
- 标牌避让针对label/legend；极端放大平移时视窗外标牌不画，回到视窗自动恢复。
- 前轮禁用存储未测；本次通过CDP预注入独立页的localStorage SecurityError实测，不清profile；初载/套餐更改/刷新无error，失存储有明确warning且刷新回默认。
- build需要源JSON目录；默认TMPDIR缺失会明确失败，未静默回退旧数据。

