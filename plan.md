# 朋友圈智能排版器：产品与技术方案（V0.1）

> 状态：第一版讨论稿  
> 日期：2026-11-24  
> 当前假设：面向个人用户，先做响应式 Web MVP；核心体验是“上传照片后，自动给出可直接发布的排版与文案，用户仍可手动调整”。

## 1. 产品一句话

用户一次上传一组照片，系统自动挑选最合适的 1/4/6/9 张，完成质量筛选、去重、故事排序、九宫格预览和文案推荐，并提供轻量拼图、涂鸦、贴纸和模板能力，最终导出适合朋友圈发布的图片与文案。

## 2. 产品目标

### 2.1 核心目标

- 让用户在 1～3 分钟内，从一批原始照片得到一套“可以直接发”的朋友圈方案。
- 自动推荐不是黑盒结论：每张图显示入选原因，允许替换、拖拽排序和重新生成。
- 同一次上传至少生成 3 套差异明确的方案，例如“故事感”“氛围感”“人物优先”。
- 同时解决两个不同问题：
  - **发布张数**：朋友圈最终发布 1、4、6、9 张等。
  - **单图拼图**：把多张素材合成一张长图、四宫格、胶片或海报。
- 文案和排版互相匹配，而不是独立随机生成。

### 2.2 MVP 非目标

- 不做完整的 Photoshop/Canva 替代品。
- 不做复杂视频剪辑和动态模板。
- 不在第一期训练自有大模型。
- 不在第一期做社交关系、内容社区或代发朋友圈。
- 不追求自动修改人脸、身材等高风险美化能力。

### 2.3 成功指标

- 推荐方案采用率：用户未完全推翻推荐、只做轻量调整后导出的比例 ≥ 50%。
- 首次可用结果时间：20 张常规手机照片在 15 秒内返回初版推荐（不含弱网络上传时间）。
- 导出成功率 ≥ 99%。
- 推荐理由可理解率：测试用户能说出“为什么选这张/为什么这样排”的比例 ≥ 80%。
- 用户从上传完成到导出，P50 ≤ 3 分钟。

## 3. 用户与典型场景

### 3.1 目标用户

- 旅行、探店、聚会、亲子、宠物、日常记录用户。
- 拍了很多照片但不擅长筛选和排序的人。
- 对审美有要求，但不愿使用专业设计软件的人。

### 3.2 核心场景

1. 旅行回来有 30～80 张照片，希望选出 9 张并形成一条故事线。
2. 一次聚会有大量相似连拍，希望去掉重复、闭眼和模糊照片。
3. 只有 4～6 张不错的照片，希望系统判断“直接多图发布”还是“拼成一张更好”。
4. 只有一张主图，希望增加留白、日期、地点、贴纸或简短文案。
5. 不知道配什么文字，希望得到克制、自然、不“AI 味”的多种文案。

## 4. 产品方案选择

### 4.1 方案 A：规则驱动的本地/Java 图像分析

使用清晰度、曝光、分辨率、重复度、人脸状态、主色等可解释规则评分。

- 优点：成本低、响应快、隐私可控、容易解释。
- 缺点：对“氛围感”“高级感”和语义故事的判断有限。
- 适合：快速做出稳定 MVP。

### 4.2 方案 B：Java 主服务 + 独立 Python 视觉推理服务

Spring Boot 负责编排、业务和权限；Python 服务运行美学评分、CLIP/视觉模型、人脸与构图模型。

- 优点：算法迭代空间最大，模型生态丰富，可逐步提高推荐质量。
- 缺点：部署和监控更复杂，初期开发成本更高。
- 适合：验证市场后，构建长期算法壁垒。

### 4.3 方案 C：外部多模态模型直接分析

将压缩图及元数据发送给外部视觉模型，生成选图、排序、理由和文案。

- 优点：最容易获得语义理解和文案能力，原型速度最快。
- 缺点：成本、延迟、隐私和结果稳定性需要额外治理。
- 适合：内测阶段验证“智能推荐是否有价值”。

### 4.4 第一版建议：可替换的混合架构

推荐采用 **A + C 起步，平滑演进到 B**：

- 清晰度、曝光、尺寸、相似度、基础人脸状态等确定性指标在本地或 Java 服务完成。
- “主题识别、故事性、氛围与文案”通过统一 `AiProvider` 接口接入外部多模态模型。
- 所有模型结果进入统一评分结构，业务层不依赖具体供应商。
- 数据量和成本达到阈值后，将高频视觉能力迁移到 Python/ONNX 推理服务。

这样能较快验证产品，又不会把后续技术路线锁死。

## 5. 核心用户流程

1. **新建作品**：选择场景（旅行/探店/聚会/日常/亲子/宠物/自定义）或直接上传。
2. **上传照片**：支持拖拽、批量选择、粘贴；展示数量、大小和上传进度。
3. **智能分析**：执行格式校验、方向修正、缩略图、质量评分、去重、内容标签和安全检测。
4. **推荐方案**：默认给出 3 套：
   - 故事感：按时间/场景形成开场—展开—收尾。
   - 氛围感：颜色、光线和构图统一。
   - 人物优先：优先保留表情、合照和人物主体。
5. **选择发布形态**：1/4/6/9 张直接发布，或把多张拼成 1 张。
6. **编辑排版**：替换照片、拖拽排序、裁剪、留白、滤镜、涂鸦、贴纸、模板。
7. **选择文案**：短句、叙事、幽默、克制、诗意等风格；支持重写和编辑。
8. **预览与导出**：模拟朋友圈缩略图和点开效果，导出图片、复制文案，并提示推荐发布顺序。

## 6. 选图、选数量与排序算法

### 6.1 图片分析特征

每张图片生成统一 `ImageAnalysis`：

- 基础信息：宽高、比例、文件大小、拍摄时间、方向、GPS（若用户允许）。
- 技术质量：清晰度、噪点、曝光、动态范围、分辨率、压缩损伤。
- 主体质量：主体显著性、遮挡、裁剪风险、人物数量、人脸清晰度、闭眼概率。
- 美学特征：构图、色彩协调、光线、景深、留白、视觉重心。
- 内容标签：人物、食物、建筑、风景、宠物、夜景、室内等。
- 相似度：感知哈希、视觉向量、连拍时间间隔。
- 风险标记：截图、二维码、明显水印、隐私信息、疑似不适宜内容。

### 6.2 单图基础评分

MVP 可使用可配置权重，后续基于用户行为学习：

```text
baseScore =
  0.22 * sharpness
+ 0.15 * exposure
+ 0.12 * resolutionAndCropSafety
+ 0.16 * subjectClarity
+ 0.15 * aestheticScore
+ 0.10 * faceQuality
+ 0.10 * composition
- duplicatePenalty
- riskPenalty
```

说明：没有人脸的照片，`faceQuality` 权重按比例分配给主体清晰度、美学和构图，避免风景照天然吃亏。

### 6.3 去重与组内优选

- 先用拍摄时间窗口和感知哈希形成候选组。
- 再用视觉向量相似度合并近似图。
- 每组保留基础评分最高的 1～2 张；如果表情或构图差异明显，可同时保留。
- UI 显示“与另外 4 张相似，已为你保留更清晰的一张”，允许展开恢复。

### 6.4 发布张数推荐

算法不要强行凑满九张，而应同时计算信息密度、质量下限和重复度。

| 张数 | 推荐场景 | 排版策略 |
|---|---|---|
| 1 张 | 有明显主图、其他图质量差，或希望突出情绪 | 大图 + 轻量留白/文字/贴纸 |
| 2 张 | 对比、前后、人物与环境 | 成对关系，不建议强行拼图 |
| 3 张 | 开场—细节—收尾 | 横向故事或三连画 |
| 4 张 | 内容集中且构图统一 | 2×2 对称，适合探店/穿搭/聚会 |
| 6 张 | 两组内容或横竖图混合 | 3×2，按主题成对或按节奏交替 |
| 8 张 | 有一张明显主图但总素材丰富 | 可发布 8 张，或用主图 + 七张形成节奏 |
| 9 张 | 内容丰富、质量稳定、主题完整 | 3×3 九宫格，重点控制重复与颜色节奏 |

默认候选只突出 1、4、6、9 张，其他张数作为“更多方案”，降低选择负担。

### 6.5 多图集合评分

```text
setScore =
  0.38 * averageQuality
+ 0.20 * contentDiversity
+ 0.16 * visualHarmony
+ 0.14 * storyCoverage
+ 0.12 * layoutFitness
- similarityPenalty
- weakImagePenalty
```

- `contentDiversity`：人物、环境、细节、食物等信息是否互补。
- `visualHarmony`：色温、亮度、饱和度和比例是否能形成统一或有意的节奏。
- `storyCoverage`：是否包含开场、主体、细节和收尾。
- `layoutFitness`：横竖比例、主体位置是否适合目标格子裁剪。
- `weakImagePenalty`：为凑数量加入明显低质量图时要强惩罚。

### 6.6 九宫格排序

- **第 1 张（左上）**：封面，优先最能概括主题且点开后仍有冲击力的照片。
- **第 5 张（中心）**：视觉锚点，可放人物主图、标志性场景或颜色最突出的图。
- **第 9 张（右下）**：收尾，适合背影、夜景、合照、票根或留白较多的图。
- 其余位置平衡横竖比例、明暗、冷暖、远景/近景和人物/环境。
- 有可靠拍摄时间时，故事方案优先遵循时间线；氛围方案可以牺牲时间线换取视觉和谐。
- 排序结果返回逐位理由，并允许“一键换一种顺序”。

### 6.7 约束求解思路

MVP 先用“候选集合生成 + 启发式排序”而不是复杂全局优化：

1. 从每个相似组取 Top-K，生成质量足够的候选池。
2. 用贪心方式逐张加入，最大化边际集合得分。
3. 对选中集合执行多次排序种子：时间线、颜色节奏、人物优先。
4. 使用位置权重与相邻冲突惩罚进行局部交换，保留得分最高的 3 个结果。
5. 记录用户替换和移动行为，为以后训练排序模型准备反馈数据。

## 7. 文案生成

### 7.1 输入

- 用户选择的场景、时间、地点和可选关键词。
- 入选照片的内容标签、颜色、人物关系和故事顺序。
- 用户选择的语气与长度。
- 用户明确禁止出现的信息，例如具体地点、人物称谓或商业表达。

### 7.2 输出规格

每次返回 6 条，保证差异明显：

1. 极简：8～20 字。
2. 自然口语：20～50 字。
3. 小故事：50～100 字。
4. 幽默：轻松但不油腻。
5. 克制诗意：不堆砌辞藻。
6. 信息型：适合探店、旅行攻略或活动记录。

每条包含：正文、可选 emoji、可选话题标签、适配理由。默认不堆 emoji、不使用过度网络化表达、不虚构用户没提供的事实。

### 7.3 文案安全与质量

- 不推断敏感身份、关系或精确地址。
- 不擅自给陌生人物命名。
- 不生成虚假的探店评价、价格或旅行信息。
- 用户可选择“更像我”：保存语气偏好，不默认保存历史照片内容。
- 支持“更短、少一点 AI 味、再自然一点、保留这句话重写”等局部指令。

## 8. 图片美化与编辑器能力

### 8.1 MVP 必做

- 拖拽排序与图片替换。
- 自由裁剪、固定比例裁剪、旋转、缩放和焦点位置。
- 亮度、对比度、饱和度、色温、阴影、高光的轻量调整。
- 统一滤镜强度，并支持“只应用到这一张”。
- 留白、圆角、间距和背景色。
- 文本、基础涂鸦笔、撤销/重做。
- 一套通用贴纸和 6～10 个高质量模板。
- 原图/编辑结果对比和高分辨率导出。

### 8.2 第二阶段

- 智能扩图、消除路人/杂物、天空与背景优化。
- 自动统一一组照片的色调。
- 节日、旅行、探店、亲子等主题模板包。
- 自定义贴纸、品牌字体和模板市场。
- 多端草稿同步。

### 8.3 模板原则

- 模板服务于照片，不用大面积装饰抢主体。
- 默认保持原图比例，必要裁剪前展示安全区域。
- 导出结果不带平台水印。
- 模板参数化：格子、间距、圆角、背景、文字区、贴纸槽位均为结构化数据。

## 9. UI/UX 方向：Google Material 3

### 9.1 视觉定位

- 关键词：Material 3、轻盈、可信、摄影优先、留白、圆角、低干扰、智能但可控。
- 主色建议：Google Blue 风格 `#0B57D0`。
- 主色容器：`#D3E3FD`；页面背景：`#F8FAFD`；正文：`#1F1F1F`；次级文字：`#5F6368`。
- 使用 Material 色彩角色而非到处写死颜色，支持浅色/深色主题。
- 字体：中文使用 Noto Sans SC/系统无衬线，英文与数字使用 Roboto。
- 圆角：卡片 16px，主要容器 24px，按钮/Chip 使用全圆角。
- 阴影克制，优先用 surface container 层级区分区域。
- 图标使用 Material Symbols Rounded。
- 小字号正文保持足够对比度，交互目标不小于 44×44px。

### 9.2 桌面端主编辑器布局

```text
┌──────────────── 顶栏：Logo / 项目名 / 撤销重做 / 导出 ────────────────┐
│ 左侧素材栏          │ 中间画布与朋友圈预览             │ 右侧智能建议面板       │
│ - 全部照片          │ - 1/4/6/9 张切换                │ - 推荐方案             │
│ - 已选/未选         │ - 九宫格拖拽                    │ - 入选理由             │
│ - 相似照片组        │ - 单图点开预览                  │ - 文案候选             │
│ - 低质量提示        │ - 拼图画布                      │ - 美化/模板/贴纸       │
└───────────────────────────────────────────────────────────────┘
```

### 9.3 移动端流程

- 使用分步流程：上传 → 推荐 → 微调 → 文案 → 导出。
- 底部操作栏固定显示“换方案”“编辑”“下一步”。
- 编辑功能用 Bottom Sheet 展开，避免把桌面三栏强行缩小。
- 关键选择以大图卡片呈现，避免密集表格和小图标。

### 9.4 关键页面

1. **首页/上传页**：单一主 CTA“选择照片”，下方展示三步流程和示例结果。
2. **分析中页面**：用阶段进度表达“去重—质量分析—生成方案”，允许后台继续。
3. **推荐页**：横向对比 3 个方案，展示张数、风格、缩略图、推荐理由。
4. **编辑页**：照片画布为主，AI 建议是辅助，不遮挡内容。
5. **文案页**：用风格 Chip 筛选，候选卡支持复制、收藏、局部改写。
6. **导出页**：展示发布顺序、图片包、文案复制按钮和隐私清理状态。

### 9.5 交互细节

- 自动淘汰的照片不能直接消失，应进入“未入选/相似照片”区域。
- 每个推荐结论都提供一句人能理解的原因。
- 分析结果逐步返回；不必等待所有文案生成后才显示图片方案。
- 修改一张图片后，只重算受影响部分，避免整个方案跳动。
- 导出前提示图片顺序，并提供带序号的临时预览；正式图片不带序号。

## 10. UI 生成提示词

### 10.1 中文总提示词

```text
设计一个名为「拾光排版」的响应式 Web 应用，用于朋友圈照片智能筛选、九宫格排序、拼图和文案生成。整体采用 Google Material Design 3 风格：明亮克制、摄影内容优先、充足留白、圆角卡片、柔和 surface container 层级、Material Symbols Rounded 图标。主色使用 #0B57D0，primary container 使用 #D3E3FD，背景 #F8FAFD，正文 #1F1F1F，次级文字 #5F6368；中文字体 Noto Sans SC，英文字体 Roboto。

桌面端采用三栏专业编辑器布局：左侧是上传素材、相似照片组和未入选照片；中间是主要画布，展示真实的 1 张、4 张、6 张和 9 张朋友圈网格预览，可拖拽排序和替换；右侧是 AI 智能建议、入选理由、文案候选、模板、贴纸和基础美化。顶栏包含项目名、保存状态、撤销/重做、预览和高强调“导出”按钮。

重点设计推荐结果页：一次呈现“故事感、氛围感、人物优先”三套方案，每套显示缩略网格、建议发布张数、评分和一句自然的推荐理由。选择方案后进入编辑器。AI 建议必须可解释、可撤销，不能像聊天机器人占据主界面。照片是视觉主角，避免渐变滥用、玻璃拟态、荧光色、厚重阴影和过度装饰。

同时给出移动端适配：上传、推荐、微调、文案、导出五步流程，底部固定主要操作，编辑能力使用 Bottom Sheet。包含空状态、上传进度、分析骨架屏、失败重试、深色模式和无障碍对比。输出高保真 UI，使用真实中文文案和真实摄影占位图，展示 1440px 桌面版及 390px 移动版。
```

### 10.2 English master prompt

```text
Design a responsive web app named “拾光排版 / MomentGrid” for intelligent WeChat Moments photo curation, grid sequencing, collage editing, and caption generation. Follow Google Material Design 3 with a calm, trustworthy, photography-first visual language: generous whitespace, rounded containers, subtle surface hierarchy, minimal elevation, and Material Symbols Rounded. Use #0B57D0 as primary, #D3E3FD as primary container, #F8FAFD as background, #1F1F1F for primary text, and #5F6368 for secondary text. Use Noto Sans SC for Chinese and Roboto for Latin characters.

Create a desktop three-panel editor: the left panel contains uploaded assets, duplicate groups, selected and rejected photos; the center is the main canvas with realistic 1-photo, 2x2, 3x2, and 3x3 WeChat Moments previews with drag-and-drop reordering; the right panel contains explainable AI recommendations, selection reasons, caption candidates, templates, stickers, and lightweight photo adjustments. The top app bar contains project title, save status, undo/redo, preview, and a prominent Export button.

Create a recommendation screen that compares three clearly differentiated plans: Story, Visual Mood, and People First. Each plan shows a photo grid, recommended photo count, confidence score, and one human-readable reason. AI should feel assistive and reversible, never dominate the interface like a chatbot. Photos are the hero. Avoid excessive gradients, glassmorphism, neon colors, heavy shadows, and decorative clutter.

Also provide a 390px mobile flow with five steps: Upload, Recommendations, Fine-tune, Captions, Export. Use bottom sheets for editing controls and a fixed bottom action bar. Include empty states, upload progress, analysis skeletons, retry states, dark mode, accessible contrast, and realistic Chinese microcopy. Deliver high-fidelity desktop 1440px and mobile 390px screens.
```

### 10.3 分页面提示词：推荐方案页

```text
为「拾光排版」设计 Material 3 风格的智能推荐页面。顶部显示“已从 28 张照片中整理出 3 套方案”，右侧是重新分析和筛选条件。主体使用三张大方案卡：故事感 9 张、氛围感 6 张、人物优先 4 张。每张卡展示真实照片网格、推荐标签、简短理由、被排除的模糊/重复照片数量，以及“使用这套方案”按钮。卡片之间差异清楚但视觉统一。下方提供可折叠的“为什么这样选”和相似照片组。强调可解释、可恢复和低学习成本。
```

### 10.4 分页面提示词：编辑器

```text
设计一个摄影优先的 Material 3 桌面编辑器。中间画布占最大空间，显示 3x3 九宫格和朋友圈真实预览；照片可拖拽，选中格子有蓝色描边和裁剪焦点。左侧素材栏按全部、已选、相似、未入选四类组织照片。右侧用 Tabs 切换“智能建议、调整、模板、贴纸、文案”，默认展示三条可操作建议，例如“第 3 张与第 7 张色调接近，建议替换”。底部显示缩放、适应画布和原图对比。界面克制，避免像传统复杂修图软件。
```

### 10.5 负面提示词

```text
不要玻璃拟态，不要霓虹渐变，不要赛博朋克，不要厚重投影，不要密集小图标，不要复杂仪表盘，不要聊天机器人主界面，不要用大量紫色 AI 光效，不要让装饰抢过照片，不要英文占位文案，不要不可读的小字号，不要模拟 iOS 风格。
```

## 11. 技术选型

### 11.1 前端推荐

| 领域 | 选择 | 原因 |
|---|---|---|
| 应用框架 | React + TypeScript + Vite | 适合高交互 SPA，类型清晰，构建简单；不需要 SEO 优先的 SSR |
| UI | MUI（Material UI）+ 自定义 Material 3 tokens | 快速获得成熟组件，并保持设计令牌统一 |
| 状态 | Zustand | 编辑器局部状态直接，避免过早引入复杂全局状态框架 |
| 服务端数据 | TanStack Query | 统一缓存、轮询、错误重试和任务状态 |
| 路由 | React Router | 满足工作台型应用路由需求 |
| 画布编辑 | Konva + react-konva | 适合拖拽、图层、裁剪、涂鸦、文本、贴纸和高分辨率导出 |
| 上传 | Uppy 或自研分片上传封装 | 支持批量、进度、失败重试和断点续传 |
| 测试 | Vitest + Testing Library + Playwright | 单元、组件和端到端覆盖 |

不建议第一期使用 Next.js：本产品的核心是登录后的高交互编辑器，SEO 与服务端渲染收益有限，会增加图像画布的客户端边界复杂度。若以后需要内容营销站，可独立建设站点或再引入 SSR。

### 11.2 后端推荐

| 领域 | 选择 |
|---|---|
| 语言/运行时 | Java 21 LTS |
| 框架 | Spring Boot 4.2.x |
| 构建 | Maven |
| Web/API | Spring MVC + Jakarta Validation + springdoc-openapi |
| 安全 | Spring Security + JWT/OAuth2 Resource Server |
| 数据库 | PostgreSQL |
| 缓存/任务状态 | Redis |
| 对象存储 | S3 兼容存储；本地开发使用 MinIO |
| 数据访问 | Spring Data JPA；复杂查询再引入 jOOQ |
| 异步任务 | MVP 使用数据库任务表 + Spring Scheduler；规模扩大后迁移 RabbitMQ/Kafka |
| 图像基础处理 | libvips/ImageMagick sidecar 或 Java 图像封装；避免仅依赖 ImageIO 处理大图 |
| 模型推理 | 统一 `AiProvider` 接口；本地模型使用 ONNX Runtime，复杂视觉模型可拆为 Python 服务 |
| 可观测性 | Spring Boot Actuator + Micrometer + OpenTelemetry |
| 测试 | JUnit 5 + Testcontainers + WireMock |

### 11.3 为什么不把所有图片处理都放进 Spring Boot 进程

- 大图解码、缩放和模型推理容易带来内存尖峰与 GC 压力。
- 业务 API 和图片任务应有独立并发限制，避免导出任务拖垮登录、项目查询等接口。
- MVP 可以同机部署，但通过任务队列和进程边界保留拆分能力。

## 12. 建议架构

```text
React Web
  ├─ Upload / Recommendation / Editor / Caption / Export
  └─ Local preview + canvas state
            │ REST + SSE
Spring Boot API
  ├─ Auth & User Preference
  ├─ Project & Asset
  ├─ Analysis Orchestrator
  ├─ Recommendation Engine
  ├─ Caption Service
  ├─ Template Service
  └─ Export Job
      │          │             │
 PostgreSQL    Redis       S3 / MinIO
      │
 Worker / AI Adapter
  ├─ deterministic image metrics
  ├─ duplicate clustering
  ├─ external multimodal provider
  └─ future Python / ONNX inference service
```

- 客户端通过 SSE 获取分析阶段与部分结果；首个可用方案完成后立即展示。
- 原图走预签名 URL 直传对象存储，避免所有大文件穿过 API 服务器。
- 后端仅向 AI 服务发送压缩图和必要元数据，并记录用户授权与供应商。
- 任务必须幂等，重复回调或客户端重试不能生成重复资产。

## 13. 领域模型草案

- `User`：账户、偏好、文案风格、隐私设置。
- `Project`：一次朋友圈作品，包含场景、状态、目标平台和导出记录。
- `Asset`：原图、缩略图、EXIF、存储位置、上传状态。
- `ImageAnalysis`：质量分、内容标签、人脸/主体信息、向量引用、风险标记。
- `SimilarityGroup`：相似/连拍照片组及组内排序。
- `RecommendationPlan`：目标张数、入选图片、顺序、布局、分项得分和理由。
- `CaptionCandidate`：风格、正文、emoji、标签、生成来源和用户反馈。
- `EditDocument`：非破坏式编辑 JSON，包括裁剪、滤镜、图层、涂鸦与贴纸。
- `Template`：参数化模板定义、封面、适用张数和版本。
- `ExportJob`：导出规格、状态、文件列表、失败原因和过期时间。

## 14. API 草案

```text
POST   /api/v1/projects
GET    /api/v1/projects/{projectId}
POST   /api/v1/projects/{projectId}/assets/upload-requests
POST   /api/v1/projects/{projectId}/assets/complete
POST   /api/v1/projects/{projectId}/analysis-jobs
GET    /api/v1/projects/{projectId}/analysis-events       # SSE
GET    /api/v1/projects/{projectId}/recommendations
POST   /api/v1/projects/{projectId}/recommendations/regenerate
PUT    /api/v1/projects/{projectId}/recommendations/{planId}
POST   /api/v1/projects/{projectId}/captions
POST   /api/v1/projects/{projectId}/captions/{captionId}/rewrite
GET    /api/v1/templates?photoCount=9&scene=travel
PUT    /api/v1/projects/{projectId}/edit-document
POST   /api/v1/projects/{projectId}/export-jobs
GET    /api/v1/projects/{projectId}/export-jobs/{jobId}
DELETE /api/v1/projects/{projectId}
```

关键约束：

- 所有异步创建接口支持 `Idempotency-Key`。
- 所有 Project/Asset 访问必须校验资源归属。
- 分析结果包含 `modelVersion`、`algorithmVersion` 和分项得分，便于复现。
- 不直接暴露永久对象存储地址，使用短期签名 URL。

## 15. 代码仓库建议

```text
moment-grid/
├─ apps/
│  ├─ web/                         # React + TypeScript
│  │  └─ src/
│  │     ├─ app/                   # 路由、主题、全局 Provider
│  │     ├─ features/upload/
│  │     ├─ features/recommendation/
│  │     ├─ features/editor/
│  │     ├─ features/caption/
│  │     └─ features/export/
│  └─ api/                         # Spring Boot
│     └─ src/main/java/.../
│        ├─ project/
│        ├─ asset/
│        ├─ analysis/
│        ├─ recommendation/
│        ├─ caption/
│        ├─ template/
│        └─ export/
├─ packages/
│  ├─ api-contract/                # OpenAPI 生成的前端类型
│  └─ design-tokens/               # Material 3 tokens
├─ infra/
│  ├─ docker-compose.yml           # PostgreSQL/Redis/MinIO
│  └─ migrations/
└─ docs/
   ├─ product/
   ├─ api/
   └─ adr/
```

后端优先采用“按业务能力分包”，而不是把所有 controller/service/repository 分成三个超大目录。

## 16. 隐私、安全与生命周期

- 上传前明确说明照片如何处理，外部 AI 分析需单独披露。
- 默认剥离导出图片中的 GPS 等敏感 EXIF；用户可选择保留拍摄时间。
- 原图与导出文件默认在项目删除后立即进入清理队列；未登录临时项目 24 小时自动清理。
- 对象存储私有，短期签名 URL，数据库只保存对象键。
- 日志禁止记录图片 URL 查询签名、文案中的隐私内容和原始 EXIF。
- 文件类型以魔数校验，限制单文件大小、总数量和解压炸弹风险。
- AI 供应商故障时仍能返回基础质量筛选方案。
- 支持用户一键删除项目、图片、分析结果和生成文案。

## 17. MVP 分期

### 阶段 0：交互原型（3～5 天）

- 完成首页、推荐页、三栏编辑器、文案页和导出页高保真原型。
- 用固定样例数据验证 1/4/6/9 张方案切换与拖拽排序。
- 找 5～8 位目标用户测试“看不看得懂推荐原因”和“是否愿意采用方案”。

### 阶段 1：项目基础与上传（1 周）

- 建立 React/Vite 与 Spring Boot 项目。
- 完成 PostgreSQL、Redis、MinIO 本地环境。
- 项目、资产、预签名上传、缩略图、任务状态和 SSE 基础链路。
- 完成格式、大小、数量限制和失败重试。

### 阶段 2：基础分析与推荐（1～2 周）

- 清晰度、曝光、分辨率、比例、感知哈希、相似组。
- 1/4/6/9 张推荐，三套排序策略和可解释理由。
- 推荐方案页、手动替换、拖拽排序与反馈记录。

### 阶段 3：编辑器与导出（1～2 周）

- 裁剪、缩放、留白、间距、圆角、基础调整。
- 文本、涂鸦、基础贴纸和首批模板。
- 非破坏性编辑文档、撤销/重做、高分辨率导出。

### 阶段 4：语义分析与文案（1 周）

- 接入可替换的多模态与文本模型。
- 场景理解、故事方案、六类文案、局部重写。
- 隐私披露、超时/限流、成本统计和降级逻辑。

### 阶段 5：Beta 与质量优化（1～2 周）

- 真实照片集评测、性能压测和端到端测试。
- 调整评分权重与解释文案。
- 完成埋点、错误监控、数据删除和灰度发布。

## 18. MVP 验收标准

- 用户可以上传 1～50 张 JPG/PNG/WebP/HEIC 手机照片。
- 系统能识别明显模糊、过暗、重复和连拍照片，并允许恢复。
- 30 张素材至少返回 3 套可区分方案，覆盖 1/4/6/9 张中的合理数量。
- 每张入选图、每个排序结果都有简短理由。
- 用户可以替换、排序、裁剪并完成基础美化。
- 至少有 6 个模板、20 个贴纸和 6 种文案风格。
- 导出文件顺序清晰，图片无强制水印，文案可一键复制。
- 外部 AI 不可用时，基础选图、排序和导出仍可工作。
- 删除项目后，用户无法再访问对应资源，后台清理任务可追踪。

## 19. 测试策略

- **算法单元测试**：极端曝光、无脸风景、多张连拍、全是低质量图、横竖图混合、少于目标张数。
- **后端集成测试**：PostgreSQL/Redis/MinIO 使用 Testcontainers；验证幂等、权限、任务重试和清理。
- **前端组件测试**：上传队列、方案切换、拖拽排序、撤销重做、文案局部重写。
- **端到端测试**：上传样例集 → 获取推荐 → 编辑 → 导出 → 删除。
- **视觉回归**：桌面 1440px、平板 1024px、移动 390px，覆盖浅色/深色模式。
- **算法评测集**：按旅行、人物、食物、夜景等场景建立经人工标注的内部数据集。
- **性能测试**：50 张高分辨率照片、并发分析、并发导出和 AI 超时降级。

## 20. 风险与应对

| 风险 | 应对 |
|---|---|
| “最好看”高度主观 | 提供三套策略、展示理由、支持快速替换，并学习用户反馈 |
| AI 成本与延迟 | 先规则后语义、缩略图推理、缓存结果、按需生成文案 |
| 图片隐私 | 私有存储、短期 URL、EXIF 清理、可见的数据生命周期和一键删除 |
| 大图导致内存峰值 | 直传对象存储、限制并发、流式处理、独立 Worker |
| 画布导出与预览不一致 | 统一编辑文档模型，建立像素/视觉回归测试 |
| HEIC 与色彩空间兼容 | 服务端统一转码到 sRGB，并保留原图作为不可变资产 |
| 推荐看似合理但缺少故事 | 将时间、地点和用户场景纳入故事方案，并允许用户指定主图 |

## 21. 下一步决策

在创建项目之前，建议按顺序确认：

1. 产品是否只做 Web，还是第一期就要兼顾微信小程序。
2. 图片是否允许发送到外部多模态模型；若不允许，需要提前采用本地视觉服务路线。
3. 首个重点场景是旅行、探店、聚会还是通用日常，这会影响评测集和模板优先级。
4. 是否需要登录；若以匿名试用为主，需优先设计临时项目和 24 小时清理机制。
5. 是否接受推荐技术栈：React + TypeScript + Vite + MUI + Konva，Java 21 + Spring Boot 4.2 + PostgreSQL + Redis + MinIO。

## 22. 官方资料基线

- Material Design 3 色彩系统：<https://m3.material.io/styles/color/the-color-system>
- Material Design 3 字体与可访问性：<https://m3.material.io/styles/typography/applying-type>
- Spring Boot 系统要求：<https://docs.spring.io/spring-boot/system-requirements.html>
- React TypeScript：<https://react.dev/learn/typescript>
- React 安装与框架建议：<https://react.dev/learn/installation>
- react-konva 官方说明：<https://konvajs.org/docs/react/index.html>

