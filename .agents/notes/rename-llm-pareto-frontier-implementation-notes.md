# Skill 更名实现记录

## 目标

将 skill 名称及目录统一为 `llm-pareto-frontier`，在 README 致谢上游 `orionpax1997/model-killing-line`。仅修改本地文件，不提交、不推送、不调整现有发布分支或历史。

## 决策

- 同步调整 SKILL.md、marketplace、README 和 `.gitignore` 白名单，避免名称与安装路径不一致。
- 保留 `MKL_DIR`、内部 MKL 标识和默认临时数据目录，避免无关的缓存或业务行为变化。
- README 区分 plugin 的带 namespace 调用与个人 skill 调用；用 Context7 查询 Claude Code 官方文档确认格式。

## 进度

- 已更名 skill 目录，更新 frontmatter、标题、安装路径、marketplace 插件名及 `.gitignore` 白名单。
- README 已致谢 `orionpax1997/model-killing-line`，区分 plugin namespace 调用和个人 skill 调用。
- 已同步 `.claude/skills/`、`.pi/skills/` 的链接名称和目标；个人工具目录继续忽略，不放行到发布内容。
- 顾问复核指出浏览器回归脚本的默认 HTML 路径与另一脚本的示例注释需同步；已完成这两处路径文字替换，未改测试逻辑。
- 更名前保存 SHA-256 快照；迁移后 133 个文件全部保留，除两处预期脚本路径变化外均与快照相同（SKILL.md 在快照前已完成更名编辑）。
- 新路径下定价 CLI 回归通过，两个浏览器脚本语法检查通过，manifest 和链接解析检查通过，`git diff --check` 通过。
- 第一次忽略检查使用 symlink 后的 `SKILL.md` 路径，被 Git 拒绝；改为检查链接本身后通过。个人 skills 忽略、自有 skill 白名单有效。
- 未实际安装 plugin、未执行浏览器 UI 验收；本次未提交、未推送、未修改 bookmarks 或历史。

## Deviations

- 当前工作副本仍在旧历史链，干净 `main` 是独立 root；本次不运行会自动 snapshot 的 jj 命令，不把旧链内容带入发布分支。
