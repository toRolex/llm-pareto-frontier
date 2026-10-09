# 当前交付

根目录 /tmp/llm-pareto-label-scale-fix。源基准 main 0e0a2293e3fb44f05a927d07c67c9ae042b134c8。只读git archive提取指定skill，不接触主目录缺失skills，不恢复、不提交、不snapshot。

# Ground 与根因证据

HTML是现有构建器的真实模板兼产物。build-proto.mjs读取当前HTML并替换数据和定价模块，没有另一份模板。

旧recomputeDom使用MODELS全量，不是visible或当前指标有效行。隐藏outlier仍把costMax撑大。baseline.html中真实函数执行10、20、隐藏10000，cost范围8至10000，保留两点占轴0.0010008006405123338。repro-before.txt保存断言失败。

旧buildWorld的norm轴固定0至100。绝对值模式的刻度取整也扩张域。costMax niceCeil额外扩张。标签原始updateLabels创建rect，名称含括号effort且填充主题白色。

# 数据形状与设计

AxisDomain为{min,max,project(value)}。axes按cost/tok/idx组织，每次buildWorld先从同一个当前有效rows重算。DOM仅轴刻度读取兼容口，xn统一投影供点、网格、前沿和辅助线使用。

候选一为各渲染处局部min/max。候选二为共享AxisDomain。选后者，避免刻度和点各自log变换。单独axis-domain.mjs由真实构建器内联到HTML，测试直接运行同源实现。

成本与token反向轴，idx正向轴。正常正数log采用自然对数，含零集合采用log1p(value/最小正数)，零保持实际零值而非伪造正数。变换域6%边距，不按漂亮刻度放大域。单值采用相对小边距，空集有效默认域，性能负值线性支持。

updateLabels保留前沿与Top10选集、投影和避碰。移除rect，名称厂商色，effort为第二行9px。hover源代码不修改。BASE名称保留原始非effort后缀如0902。

# 构建与验证

MKL_SNAPSHOT=1允许离线重建现有内嵌数据，仅更新运行源码，不引入/tmp陈旧抓取结果。不改变ROWS_RAW/METRICS_DATA/ARENA_DATA。默认构建仍支持现有抓取JSON。

test-axis-domain.mjs验证保留选集占轴、margin、null/NaN/Infinity、空集、单值、微小价格、零价log和真实HTML内联实现一致。test-redesign-browser.mjs更新文本bbox与独立log1p oracle，增加无框和双行断言。浏览器脚本由主agent在独立或既有验收空间执行，本agent未操作space2。

# Deviations

用户明确把原始浏览器复现与最终浏览器验收交给主agent，因此本agent只执行代码复现与单元测试，不冒称浏览器通过。

architect配置k3及grok额度耗尽，低成本glm定向只读helper被接受但启动一直不确定；没有重派或依赖其结论。两候选由本agent比较，不扩大调查。

无提交与PR，按授权跳过工作流发布步骤。未移植旧model-killing-line副本，实际项目已改名，用户要求当前llm-pareto-frontier真正模板。
