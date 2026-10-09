# Round 2 实现笔记（2026-10-09 凌晨窗口）

接手 `/tmp/llm-pareto-label-scale-handoff.md`。基线 = 目录内 `baseline.html`（main 0e0a229 重组设计版 + 上一窗口轴域工作的起点）。未提交、未发布。

## 本窗口改动（全部在 /tmp/llm-pareto-label-scale-fix）

1. **标签覆盖 + 去重**（`prototype-4d-3d.html` `updateLabels` 重写）
   - 旧规则只标前沿 ∪ Top10，且每个 effort 点重复完整名称 → 用户反馈「很多模型没有名称」「同名只标一次」。
   - 新域模型：名称属 baseModel（每模型至多一个名称标签，`namePending` 集合；名称点被避碰丢弃时顺延同模型下一点），effort 属点（无名称点只渲染 effort 次行 9px）。
   - 选集 = 全部可见点；放置优先级 = 前沿在前、val 降序。
   - 名称标签搜索加宽（4 列 dx × 200 环），effort 标签 2 列 × 100 环。
   - `window.__labelCoverage = { named, dropped }` 审计口；省略规则有界（前沿丢名 ≤ 25%、总丢 ≤ 15%，测试断言），hover tooltip 为替代入口。
2. **2D 前沿线可见性**：暗绿 `0x487265` 虚线 → 主题自适应实线（暗 `0x66d9a8` / 亮 `0x2e7358`），legend、note 文案同步；删除 `computeLineDistances` 残留。
3. **轴区避让**：轴刻度/标题 sprite 逐个投影生成禁区 + 状态条 DOM 矩形。关键教训：NDC→像素 y 必须 `(1-p.y)*innerHeight/2`，第一版漏 `/2` 使禁区全部落到屏外（测试同款公式互相印证、双双失效，截图才是真相）。
4. **resize 刷新**：resize 监听补 `labelSignature = ""` + 非 3D 视图立即 `updateLabels()`，修标签在窗口缩放后滞留旧位置的既有 bug。
5. **订阅来源覆盖 bug**（cost-check-cn 发现）：注册表后 `for (const provider of ...)` 循环把所有厂商 source/sourceUrl 覆盖成 SemiAnalysis Anthropic 文章。HTML 与 `scripts/pricing-model.mjs` 两处同步删除；各厂商自带声明恢复，tooltip 无来源 URL 的厂商不再显示错误链接。
6. **build-proto.mjs 过期注释**：混合权重注释改为指向 DEFAULT_MIX。

## 测试

- `test-redesign-browser.mjs` 更新到新规则：名称唯一、标签 ⊆ 可见模型、effort 与 effortOf 一致、重叠检测改 text 级（group bbox 含连接线，同模型重合锚点必交叠）、去 `recomputeDom` 调用、覆盖率完整性（named∪dropped == 可见 base 模型、报告 == DOM）、轴区侵入断言（页面与 oracle 同一套投影数学）、3D 往返/亮暗主题/窄视口三个真实点击场景。41 checks 全绿。
- `test-axis-domain.mjs`、`test-pricing.mjs` 全绿。
- 视觉目检：cost 线性/log、tok、亮色主题截图均通过；轴标题/刻度不再被标签压住。

## 踩坑记录

- CDP `Emulation.setDeviceMetricsOverride` 跨 ego-browser 调用持久；crash 后残留 override 让「全尺寸」验证实际跑在 1100×700。显式 `setDeviceMetricsOverride` 回 1470×837 才复位。
- ego `nodejs` 管道脚本对 top-level await 的支持取决于内部包装，加 `--input-type=module` 反而炸 wrapper；保持原样用 `tee | ego-browser nodejs`。
- `vector.project(camera)` 不用对象自身 matrixWorld，但 sprite 局部坐标 ≠ 世界坐标（group 有变换时），必须 `getWorldPosition`；本页 group 为 identity 时二者等价。

## Cost 审计（4 worker 并行，报告在 .agents/notes/cost-check-*.md）

数据更正**未应用**，留用户决策（详见最终报告）。唯一当 bug 修的是订阅来源覆盖（#5）。

## 独立 review 修复（gpt-6.1-sol review，判定需修改 → 已全部落实）

1. **放置优先级反向**：`(a.front - b.front)` 把非前沿排在前面，与注释声明相反。改 `(b.front - a.front)`；修复后 MiMo-V2.6-Pro 等前沿名在密集场景不再丢。
2. **覆盖断言补强**：新增锚点级覆盖（带标签锚点 ≥ 75% 去重锚点数，effort 标签不能集体消失）；丢名界限 ceil → floor（单点前沿不可丢名）；窄视口场景显式宽松界限。
3. **材质/状态条断言**：前沿线必须实线、主题色、opacity ≥ 0.9；axisRects 补入 #state DOM 矩形。共享公式风险已知接受，靠截图目检补偿。
4. **测试时序修复**：settle 等待 `!flight && (3D || labelSignature !== '')`；CDP 模拟尺寸不触发 window resize，窄视口场景手动 `dispatchEvent(new Event('resize'))` 走真实处理器；测试开头固定 1470×837 防 override 残留。

## 未做

- 未应用任何价格数据更正（OpenAI cache write 1.25×、Qwen3 Coder Next、Sarvam 105B、Mercury 2.5、Nemotron 价、Nova/Gemma/Llama cache read 异常、gpt-oss-20b 漏采、Anthropic sourceDate 2026-10-05）。
- 未提交/PR/发布；主工作区只读。
