# Spec — model-killing-line v6：cost 轴 $/task 切换

日期：2026-09-28
状态：已实施 + playwright 实测通过
工作目录：`.agents/skills/model-killing-line/prototype-4d-3d.html`（非 git 仓库，直接落工作区）

## 决策记录（grilling 确认）

| # | 决策 | 结论 |
|---|------|------|
| Q1 | 与价格模式关系 | **独立 toggle**，与四价格模式正交组合（2×4=8 态），非第五 pill |
| Q2 | 值域 | 完全自适应：`recomputeDom()` + niceCeil，与价格模式切换行为一致 |
| Q3 | 前沿/hover 联动 | 全走 `costOf` 唯一取值口，零特殊分支 |
| Q4 | 单位换算 | `cost/task = 单价($/M tok) × tok ÷ 1e6`，单位 $/task |
| Q5 | 按钮 | 价格组后 `.sep` + 单 pill「$/task」，dataset 键 `pertask`，默认**关** |
| Q6 | 轴标题 | 开 → `Cost 综合 × tok/task $/task ← log（…）`；关 → 现有 `$/M tok` 文案 |
| Q7 | tooltip | 主 cost 行换算 + `/task` 后缀；三价单价行、tok 行不动 |

## 数据前提（sub-agent 核实）

- `ROWS_RAW.tok` 即每任务输出 token 数（per-effort 真值，2k–120k，`MODELS` 已过滤 null/0）——每行自带，无缺测风险
- 单价字段 `pin/pout/pcache/pblend` 单位 $/M tok，故 ÷1e6

## 实施锚点（全部在 prototype-4d-3d.html）

1. `fmtCost`（:120）：新增 `<0.001 → toFixed(4)` 档，覆盖 $/task 低值
2. `S.perTask:false`（:232）+ `costOf`（:242）：`S.perTask ? m[priceField()] * m.tok / 1e6 : m[priceField()]`
3. cost 轴标题（:446）：`S.perTask` 分支拼 `× tok/task $/task`
4. tooltip 主行（:796）：`S.perTask` 时价格 label 后加 `/task`
5. bar（价格组高亮行后）：`mkBtn("$/task", {pertask:"1"})`，onclick 翻转 `S.perTask` → `recomputeDom()` → `rebuild({keepCamera:true})`

`recomputeDom` / 前沿 / 2D 虚线 / hover 辅助线均消费 `costOf`，无改动自动联动。

## 实测结果（playwright，npx http-server :8931）

- 初始态：perTask 关，costMax=2，前沿 15
- blend×perTask：costMax=0.1，前沿 15→17（换算后重排），`costOf(MODELS[0]) = 0.376 × 119166 / 1e6 = 0.0448` ✓
- out×perTask：2.383 ✓；cache×perTask：0.0238 ✓；关 toggle：回 costMax=2、前沿 15、pill 高亮灭 ✓
- fmtCost：`0.0005→$0.0005`、`0.0048→$0.005`、`0.0448→$0.04` ✓
- 真实鼠标 hover：tooltip 显示 `Index 58 · $0.04 综合/task`，三价行保持 `$/M tok` ✓
- 2D Cost–Metric 视图 + perTask：虚线前沿/点位联动正常 ✓
- console：仅 favicon 404（既有）

## 回归注意

- `build-proto.mjs` 原地改写 html：若重跑管线，需确认本次 5 处编辑仍在（本次改动在 ROWS_RAW 之后的手写代码区，理论安全，重跑后 diff 核对）
- 重跑 `fetch-prices.mjs` 仍会缺 quasar-438b / nemotron-3-ultra-550b-a55b 两价（v5 handoff 已知）
