# 🏗️ 班迪 AI 技能库 · Bandy AI Skills

> **多技能商业开源仓库** | 由班迪创作系统 (Bandy Creation System) 维护
> 纯本地 · 纯文本 · 可移植到任何智能体 —— 不依赖任何平台、API 或授权码

---

## 🏆 赞助商 Sponsors

感谢以下伙伴支持本开源项目持续更新 👇

| | | |
|:-:|:-:|:-:|
| **赞助商位 A**<br>空缺待招 | **赞助商位 B**<br>空缺待招 | **赞助商位 C**<br>空缺待招 |

> **成为赞助商**:在仓库顶部获得 Logo 展示 + 链接(展示位置永久保留于 README 与官网首页)。赞助合作请联系微信(见文末"联系我")。

---

## 📖 项目介绍

**班迪 AI 技能库**是一系列面向**影视与内容创作**的 AI 智能体技能(Skill)合集,由班迪创作系统出品。

每个技能都是一套**纯文本指令**,载入任意智能体即可运行——不锁定平台、不依赖 API、不需要授权码,你的工作流永远属于你自己。

### 本仓库收录

| 技能 | 一句话说明 | 状态 |
|------|-----------|------|
| 🎬 **bendi-vido · 班迪一键成片** | 剧本 → 影视前制全套资产(场景图/角色定妆/色卡/调度图)+ 2 分钟以上长视频分镜生成 | ✅ 已开源 |

> 更多技能(编剧系统、分镜助手、宣发物料等)陆续入驻,敬请期待。

### 技能目录结构(统一规范)

```
skills/
└── <技能名>/
    ├── SKILL.md                  ← 技能主指令(流程主控)
    ├── references/
    │   └── *.md                  ← 模板库 / 参考资料
    └── scripts/
        └── *.py                  ← 可选脚本增强(无脚本也可完整运行)
```

---

## 🌐 在线展示

仓库内 `docs/index.html` 为单文件展示页,已配置 **GitHub Pages 自动部署**(内置 `.github/workflows/pages.yml`,push 到 `main` 自动构建发布):

- **在线地址**:`https://<你的用户名>.github.io/bandy-ai-skills/`(首次推送后生效)
- **首次启用(只需一步)**:仓库 **Settings → Pages → Source 选择 "GitHub Actions"** → 保存,即自动触发部署
- **备用预览**(未启用 Pages 前):<https://htmlpreview.github.io/?https://github.com/<你的用户名>/bandy-ai-skills/blob/main/docs/index.html>

---

## 🚀 快速开始

以 WorkBuddy 为例,将技能目录放入用户级技能目录:

```bash
# Linux / macOS
mkdir -p ~/.workbuddy/skills
cp -r skills/bendi-vido ~/.workbuddy/skills/

# Windows
# 将 skills/bendi-vido 复制到 C:\Users\<你的用户名>\.workbuddy\skills\
```

然后在对话中调用 `/bendi-vido` 即可。详见各技能目录内 `SKILL.md`。

---

## 📜 开源协议

本仓库采用 **班迪多技能开源协议 v1.0 (BMSOL-1.0)**,一句话版:

- ✅ **个人商用:免费,无需授权**(个人开发者 / 个人工作室 / 自由职业)
- ❌ **大规模商用:须取得书面授权**(企业/组织商用、产品化分发、转售、规模化服务)
- 📝 使用须保留署名与版权声明

完整条款见 [LICENSE](./LICENSE)。

---

## 💝 打赏支持

如果这些技能帮你省下了时间,欢迎请我喝杯咖啡 ☕ 打赏是**自愿且免费**的,不影响任何授权条款。

<p align="center">
  <img src="docs/assets/contact/reward-qr.svg" alt="打赏二维码" width="180" />
  <br /><em>微信扫码打赏(请替换为你自己的打赏二维码)</em>
</p>

---

## 📞 联系我

**授权 / 商务合作 / 赞助 / 意见反馈**,扫码添加微信:

<p align="center">
  <img src="docs/assets/contact/wechat-qr.svg" alt="联系微信" width="180" />
  <br /><em>微信扫码联系(请替换为你自己的微信二维码)</em>
</p>

- 个人商用免授权,直接开干;
- 企业商用、赞助、合作:微信备注说明来意,24 小时内回复。

---

## ⭐ 支持我们

如果这个项目对你有帮助,请点亮 Star ⭐,让更多创作者看到它。

**班迪创作系统 · Bandy Creation System**
"让每一个普通人都能低成本做出好内容。"
