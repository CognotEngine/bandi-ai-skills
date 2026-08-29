---
name: auto-drama-writing
description: 短剧/小说自动定时写作引擎。12位AI专家作为子代理(subagent)多轮协作讨论，把剧本迭代到最完美。支持故事大纲生成、逐集自动写作、专家评审团、质量飞轮迭代、全局一致性检查，并可配合定时任务实现自动定时写作。当用户要求"自动写剧本/小说"、"批量生成剧集"、"定时写作"、"12位专家讨论改剧本"、"把剧本改到完美"、"自动产出短剧"时触发。适用于短剧剧本、网络小说的自动化批量创作与精修场景。
author: Bandy Creation System
license: BMSOL-1.0 (https://github.com/<your-username>/bandy-ai-skills/blob/main/LICENSE)
homepage: https://github.com/<your-username>/bandy-ai-skills
---

# 短剧自动定时写作引擎 (Auto Drama Writing)

> © 2026 班迪创作系统 (Bandy Creation System) · 本技能遵循 **班迪多技能开源协议 v1.0 (BMSOL-1.0)**:个人商用免费,无需授权;大规模商用(企业/组织商用、产品化分发、转售、规模化服务)须取得书面授权。使用须保留署名与本声明。

## 概述

本技能实现短剧/小说的端到端自动创作：从一个故事创意出发，自动生成完整大纲，逐集撰写正文，每集由 12 位 AI 专家（创意总监/剧本策划/场景导演/台词指导/表演顾问/视觉设计师/情绪指导/动作导演/世界观策划/剪辑指导/人物设定师/剧本审核）作为子代理多轮协作评审，按评审意见重写，再用质量飞轮迭代到目标分数，最后做全局一致性检查，产出可交付的完整剧本。

核心特色：**专家真正"自行讨论"**——每轮专家能看到彼此上一轮意见并补充/反驳/修正，直到收敛或达到最大轮数，而非各自孤立发言。

## 触发场景

- "帮我自动写一个20集的短剧"
- "定时每天写2集，把这部小说写完"
- "用12位专家讨论，把我的剧本改到最完美"
- "我有个故事创意，自动生成完整剧本"
- "批量生成这部短剧的1-10集，每集都要专家评审"

## 工作流决策树

```
用户请求自动写作
    │
    ▼
[阶段1] 收集参数（故事创意/大纲/风格/集数范围/质量阈值/迭代次数）
    │
    ▼
[阶段2] 准备大纲 ── 无大纲 → 自动生成5章节大纲（故事梗概/世界观/人物/整体大纲/分集线）
    │                有大纲 → 直接使用
    ▼
[阶段3] 逐集自动写作（循环 startEpisode → endEpisode）
    │   ├─ (a) 生成初稿
    │   ├─ (b) 12专家子代理多轮评审 ← 核心
    │   ├─ (c) 按评审意见重写
    │   └─ (d) 质量飞轮迭代（评分→不达标→重写→再评分）
    ▼
[阶段4] 全局一致性检查（剧本审核专家扫描全集）
    ▼
[阶段5] 输出完整剧本文件 + 评分报告
    ▼
（可选）配置定时任务，每天/每周自动写N集
```

## 阶段1：收集参数

向用户确认以下参数（未提供则用默认值）：

| 参数 | 说明 | 默认值 |
|------|------|--------|
| projectType | `script`(短剧) 或 `novel`(小说) | `script` |
| storyIdea | 故事创意/核心设定（无大纲时必填） | — |
| outline | 已有大纲（可选，有则跳过生成） | — |
| advisorStyle | 写作风格ID（见 references/writing-styles.md） | script→`hollywood`, novel→`web_xianxia` |
| startEpisode | 起始集号 | 1 |
| endEpisode | 结束集号（含） | 10 |
| totalEpisodes | 总集数 | =endEpisode |
| maxDiscussionRounds | 专家讨论最大轮数 | 2 |
| maxQualityIterations | 质量飞轮迭代次数 | 2 |
| targetScore | 目标综合评分（达标即停） | 80 |
| reviewExperts | 参与评审的专家（默认6人核心团，可扩到12人） | 6人核心团 |

**默认6人核心评审团**（覆盖主要维度，平衡成本与质量）：
剧本策划(结构)、人物设定师(人物)、台词指导(台词)、剪辑指导(节奏)、情绪指导(情感)、剧本审核(一致性)。
需要全面评审时扩展到全部12人。

## 阶段2：准备大纲

- **有大纲**：直接进入阶段3。
- **无大纲**：生成完整5章节大纲。结构见 references/pipeline.md。
  - 第一章：故事梗概（核心设定/主要人物/核心冲突/故事走向）
  - 第二章：世界观设定（时代背景/势力分布/核心规则/地理）
  - 第三章：人物小传（主角/女主/配角/反派，含性格/背景/弧线）
  - 第四章：整体大纲（三幕结构，分阶段关键情节节点）
  - 第五章：分集故事线（每集核心故事+悬念钩子）

## 阶段3：逐集自动写作（核心）

对每一集（从 startEpisode 到 endEpisode）执行以下子流程：

### (a) 生成初稿（含集间衔接硬性要求）

基于大纲、本集故事线、上一集结尾，生成该集初稿。
- 短剧：约1200字，2-3个场景，专业剧本格式
- 小说：约2000字，注意段落和节奏

**集间衔接硬性要求**（解决"上下集不连贯"问题）：
- 生成第N集时，必须注入第N-1集的**最后1-2个场景全文**（非仅末尾1000字），作为 `previousEpisodeEnding`
- userInstruction 必须明确："本集开头必须自然承接上一集结尾的时间线/地点/情节/情绪，不得跳过中间关键情节（如挂电话后如何约见、如何过渡到下一场景）"
- 禁止突然跳到新时间/地点而无过渡交代
- 示例：第N-1集结尾是"打电话联络"，第N集不能直接跳到"已约好面谈"，必须交代中间过程
- 代码实现：`autoWritingOrchestrator.ts` 的 `extractLastScenes()` 提取上一集最后场景全文注入；`paopaolili-runner.mjs` 走该逻辑
- 智能体路径：Claude 编排时同样取上一集最后场景全文注入下一集 prompt

### (b) 12专家子代理多轮评审 ← 核心

**用 Agent tool 并行 spawn 专家子代理**（用户选定方案：每专家1个真 subagent）：

1. 从 `scripts/expert-data.json` 读取选定的专家列表（默认6人核心团，用户要求"12位"时用全部12人）。
2. **并行** spawn 每位专家一个子代理（在单条消息中发出多个 Agent tool 调用）。每个子代理的 prompt 构造：
   - `subagent_type`: `general-purpose`（需要能读文件/思考；若仅需纯文本评审用 `lite` 模型降本）
   - `prompt` 包含：
     - 专家 systemPrompt（角色设定，来自 expert-data.json）
     - 评审任务：大纲摘要 + 本集故事线 + 本集初稿 + 写作风格指令
     - 输出要求：从该专家专业角度指出问题 + 给出具体修改建议（200字内，第2轮起要先回顾上一轮其他专家意见并补充/反驳）
3. **多轮**：
   - 第1轮：各专家独立发表初步意见。
   - 第2轮起：把上一轮所有专家意见注入每个子代理 prompt，让其补充/反驳/修正。
   - 每轮后可做收敛判断（询问一个轻量子代理"专家意见是否已收敛"），收敛则提前结束。
   - 达到 maxDiscussionRounds 或收敛后停止。
4. 收集所有轮次意见，整合成结构化修改方案（共识/分歧/具体修改建议）。

**子代理 prompt 模板**（第1轮）：
```
你是【{专家名}】，{专家systemPrompt}

你的专长：{specialties}
你的指导原则：{guidelines}

请评审以下剧本内容，从你的专业角度指出问题并给出具体修改建议（200字以内，直接给建议，不要寒暄）：

【大纲摘要】
{outline.slice(0,2000)}

【本集故事线】
{episodeLine}

【本集初稿】（第{ep}集）
{draft.slice(0,2500)}

【写作风格】
{styleInstruction}
```

**子代理 prompt 模板**（第2轮起，增加上一轮意见）：
```
...（同上角色设定）...
这是第{round}轮讨论。请先简要回顾上一轮其他专家意见中你认同或不认同的部分，然后给出补充、反驳或修正（200字内，聚焦增量观点，不要重复自己上一轮说过的话）。

【上一轮其他专家的意见】
{previousOpinions}
```

### (c) 按评审意见重写

把整合后的专家修改方案作为指令，重写本集内容。保持剧情主线和人物设定不变，只针对专家指出的问题优化。

### (d) 质量飞轮迭代（含硬扣分检查）

1. AI 评分（5维度0-100：情节/人物/节奏/台词/一致性 + 综合）。
2. **硬扣分检查**（script 模式默认启用，借鉴班迪编剧机械逻辑锁）：
   - **物理连续性**：角色位置/姿态/手持物跳变、无交代移动、道具凭空出现 → critical
   - **台词归属与意图**：说话人不在人物列表、意图翻转（方向/极性/人称）、主控占比过低 → critical
   - **对话自然度**：语音指纹不可辨、笼统情绪词(平静/淡淡/很轻/低声/直接/认真)≥3次、缺不完美对话特征 → major
3. **达标判定**（两条都满足才停止）：
   - 综合分 ≥ targetScore
   - 且无 critical/major 级硬扣分问题
4. 不达标 → 把改进建议+硬扣分问题转为重写指令（硬扣分优先修复），重写 → 再评分。
5. 重复直到达标或达到 maxQualityIterations。critical 级问题会强制压低综合分到59分以下，必须重写。

详细规则见 `references/short-drama-rules.md`。

记录该集：集号、标题、最终内容、评分、迭代次数、是否达标。

## 阶段4：全局一致性检查

全部集数完成后，用「剧本审核」专家扫描全集：
- 人物设定是否 OOC
- 时间线是否矛盾
- 地点逻辑是否一致
- 情节连贯性、伏笔回收
- 设定自洽

输出全局一致性报告。

## 阶段5：输出与交付（文件夹结构，一集一个TXT）

创建项目文件夹，结构如下：
```
{项目名或时间戳}/
├── 大纲.md              # 故事大纲（5章节）
├── 第01集_标题.txt       # 纯剧本正文，一集一个文件
├── 第02集_标题.txt
├── ...
└── 评审报告.md           # 各集评分 + 专家评审 + 全局一致性检查
```

- **每集单独一个 .txt**（纯剧本正文，方便单独分发/拍摄/修改）
- 大纲单独 .md
- 评审报告单独 .md（含各集评分、专家评审意见、硬扣分检查、全局一致性检查）
- 用 present_files 交付文件夹内的关键文件
- **智能体路径**：每集写完立即落盘对应 txt（支持中断续写，中断只丢当前集）
- **脚本路径**：`paopaolili-runner.mjs` 自动创建文件夹结构（`writeResultToFolder` 逻辑已内置）
- 文件命名：集号两位补零 + 标题，如 `第01集_笔尖悬停.txt`

## 定时自动化配置

用户要求"定时写作"时，用 `automation_update` 工具创建定时任务：

- **每天写N集**：`scheduleType=recurring`, `rrule=FREQ=DAILY;HOUR=9`（每天9点）
- **每周写**：`rrule=FREQ=WEEKLY;BYDAY=MO,WE,FR;HOUR=20`
- **自定义**：见 assets/automation-template.json

automation 的 prompt 应包含：故事创意、风格、当前进度（已写到第几集）、目标集数、质量参数。每次运行自动续写下一批集数。

**进度续写**：定时任务每次运行时，先读取上次输出的剧本文件，确定已完成的集号，从下一集继续。

## 加速路径：paopaolili 项目内

若检测到当前工作目录是 paopaolili 项目（存在 `src/services/autoWritingOrchestrator.ts`），可直接调用项目内编排器，无需手动 spawn 子代理：

```bash
# 用项目内的 autoWriteDrama 一次性跑完全流程
NODE_PATH=./node_modules node -e "
import('./src/services/autoWritingOrchestrator.ts').then(async m => {
  const result = await m.autoWriteDrama({
    projectType: 'script',
    storyIdea: '用户的故事创意',
    advisorStyle: 'hollywood',
    startEpisode: 1,
    endEpisode: 10,
    maxDiscussionRounds: 2,
    maxQualityIterations: 2,
    targetScore: 80,
  }, p => console.log(JSON.stringify(p)));
  console.log(m.formatAutoWritingResult(result));
});
"
```

注意：此路径需项目已配置 AI 模型（管理后台「AI 配置」+「API Key 管理」）。TS 文件需用 tsx/ts-node 运行，或先编译。推荐用 `npx tsx scripts/paopaolili-runner.mjs`。

**通用路径**（任何智能体）：用上述阶段1-5的 Agent tool 编排，不依赖项目代码。

## 资源说明

### scripts/
- `expert-data.json` — 12位专家完整数据（id/name/systemPrompt/specialties/guidelines），构建子代理 prompt 时直接读取。
- `paopaolili-runner.mjs` — paopaolili 项目内加速运行脚本，直接调用 autoWriteDrama。

### references/
- `experts.md` — 12位专家详细设定与适用场景。
- `writing-styles.md` — 14种写作风格指令（7剧本+7小说），注入生成上下文。
- `pipeline.md` — 自动写作流水线设计、阶段详解、质量评分标准。
- `short-drama-rules.md` — 短剧机械逻辑锁规则（借鉴班迪编剧V2.3）：物理状态锚定锁/台词归属意图锁/语音指纹7维度/对话自然度6规则/开篇钩子/冲突密度/安全合规/自检12条。专家评审和生成的硬约束参考，部分已由 qualityAgent 自动检查。

### assets/
- `config.template.json` — 写作配置模板（所有参数+注释）。
- `automation-template.json` — 定时任务配置模板（含常见 RRULE 示例）。

## 重要约束

- **专家讨论必须多轮**：第2轮起专家要能看到彼此上一轮意见，这是"自行讨论"的关键，不能只做单轮并行发言。
- **质量飞轮必须真迭代**：评分不达标要真正重写，不能只评分不修改。
- **集间衔接硬性要求**：生成第N集必须注入第N-1集最后1-2个场景全文（非仅末尾1000字），开头必须承接上一集时间线/地点/情节/情绪，不得跳过中间关键情节。代码用 `extractLastScenes()`，智能体路径取上一集 txt 末尾场景注入。
- **硬扣分一票否决**：script 模式下，物理连续性/台词归属意图/对话自然度出现 critical 级问题，即使综合分达标也强制重写。详见 `references/short-drama-rules.md`。
- **输出完整剧本文件**：最终必须用 present_files 交付一个可读的 Markdown 剧本文件。
- **成本提示**：12专家×多轮×多集×质量迭代，AI 调用量大。默认用6人核心团+2轮+2次迭代平衡成本。用户明确要"最完美"时才用12人+3轮+3次迭代。
