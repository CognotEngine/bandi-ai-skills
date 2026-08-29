#!/usr/bin/env node
/**
 * paopaolili-runner.mjs
 *
 * 在 paopaolili 项目内直接调用 src/services/autoWritingOrchestrator.ts 的 autoWriteDrama，
 * 一次性跑完"大纲→逐集写作→12专家评审→质量飞轮→全局检查"全流程，输出剧本 Markdown 文件。
 *
 * 这是"加速路径"：复用项目已完善的编排器和 AI 配置，无需手动 spawn 子代理。
 * 通用路径（任何智能体）见 SKILL.md 的阶段1-5，用 Agent tool 编排。
 *
 * 用法：
 *   npx tsx scripts/paopaolili-runner.mjs <config.json> [output.md]
 *
 * config.json 参考 assets/config.template.json。
 * 需在 paopaolili 项目根目录运行，且已配置 AI 模型（管理后台「AI 配置」+「API Key 管理」）。
 *
 * 若无 tsx，可: node --experimental-strip-types scripts/paopaolili-runner.mjs (Node 22.6+)
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 解析参数
const configPath = process.argv[2];
const outputPath = process.argv[3];

if (!configPath) {
  console.error('用法: npx tsx scripts/paopaolili-runner.mjs <config.json> [output.md]');
  console.error('config.json 参考 assets/config.template.json');
  process.exit(1);
}

// 读取配置
const configAbsPath = resolve(process.cwd(), configPath);
if (!existsSync(configAbsPath)) {
  console.error(`配置文件不存在: ${configAbsPath}`);
  process.exit(1);
}
const config = JSON.parse(readFileSync(configAbsPath, 'utf-8'));

// 尝试加载 TS 编排器（需要 tsx 或 Node 原生 TS 支持）
let autoWriteDrama, formatAutoWritingResult;
try {
  // 方式1: 用 tsx 的 register（如果安装了 tsx）
  const require = createRequire(import.meta.url);
  try {
    const tsx = require('tsx/cjs');
    if (tsx && typeof tsx.register === 'function') tsx.register();
  } catch {
    // tsx 未安装，尝试方式2
  }

  // 方式2: 动态 import（Node 22.6+ 用 --experimental-strip-types 可直接 import .ts）
  // 项目根目录 = 当前工作目录（需在 paopaolili 项目根运行）
  const orchestratorPath = resolve(process.cwd(), 'src/services/autoWritingOrchestrator.ts');
  if (!existsSync(orchestratorPath)) {
    throw new Error(`未找到编排器: ${orchestratorPath}\n请确认在 paopaolili 项目根目录运行，或此项目未集成自动写作编排器。`);
  }
  const mod = await import(orchestratorPath);
  autoWriteDrama = mod.autoWriteDrama;
  formatAutoWritingResult = mod.formatAutoWritingResult;
} catch (err) {
  console.error('═══════════════════════════════════════════════════');
  console.error(' 无法加载自动写作编排器');
  console.error('═══════════════════════════════════════════════════');
  console.error(`错误: ${err.message}`);
  console.error('');
  console.error('解决方案（任选其一）:');
  console.error('  1. 用 tsx 运行: npx tsx scripts/paopaolili-runner.mjs <config.json>');
  console.error('  2. Node 22.6+: node --experimental-strip-types scripts/paopaolili-runner.mjs <config.json>');
  console.error('  3. 放弃加速路径，改用通用路径: 让 Claude 用 Agent tool 编排（见 SKILL.md 阶段1-5）');
  console.error('═══════════════════════════════════════════════════');
  process.exit(1);
}

console.log('═══════════════════════════════════════════');
console.log('  短剧自动写作引擎 启动');
console.log('═══════════════════════════════════════════');
console.log(`项目类型: ${config.projectType || 'script'}`);
console.log(`集数范围: 第${config.startEpisode || 1}集 ~ 第${config.endEpisode}集`);
console.log(`写作风格: ${config.advisorStyle || '默认'}`);
console.log(`专家评审: ${config.expertReviewEnabled !== false ? `启用, ${config.maxDiscussionRounds || 2}轮, ${(config.reviewExperts || []).length || 6}位专家` : '关闭'}`);
console.log(`质量飞轮: ${config.qualityFlywheelEnabled !== false ? `启用, 最多${config.maxQualityIterations || 2}次, 目标${config.targetScore || 80}分` : '关闭'}`);
console.log(`全局检查: ${config.globalConsistencyCheck !== false ? '启用' : '关闭'}`);
console.log('═══════════════════════════════════════════\n');

const startTime = Date.now();

try {
  const result = await autoWriteDrama(config, (progress) => {
    const pct = progress.percent != null ? `[${progress.percent}%]` : '';
    const ep = progress.episodeNumber ? `第${progress.episodeNumber}集 ` : '';
    const score = progress.score ? ` (评分${progress.score.overall})` : '';
    console.log(`${pct} ${ep}${progress.message}${score}`);
  });

  const elapsed = Math.round((Date.now() - startTime) / 1000);
  console.log(`\n耗时: ${elapsed}s`);

  if (result.success) {
    // 输出文件夹结构：一集一个 txt + 大纲 + 评审报告
    const folderName = outputPath
      ? resolve(process.cwd(), outputPath)
      : resolve(process.cwd(), `drama-${Date.now()}`);
    if (!existsSync(folderName)) mkdirSync(folderName, { recursive: true });

    // 1. 大纲.md
    writeFileSync(resolve(folderName, '大纲.md'), `# 故事大纲\n\n${result.outline}\n`, 'utf-8');

    // 2. 每集一个 txt（纯剧本正文，方便单独分发/拍摄）
    result.episodes.forEach(e => {
      const numStr = String(e.episodeNumber).padStart(2, '0');
      const safeTitle = e.title.replace(/[\\/:*?"<>|]/g, '_');
      writeFileSync(resolve(folderName, `第${numStr}集_${safeTitle}.txt`), e.content, 'utf-8');
    });

    // 3. 评审报告.md（评分 + 专家评审 + 一致性检查）
    const reportLines = [];
    reportLines.push('# 自动写作评审报告\n');
    reportLines.push(`共 ${result.episodes.length} 集, 平均评分: ${result.episodes.length > 0 ? Math.round(result.episodes.reduce((a, e) => a + e.score.overall, 0) / result.episodes.length) : 0}/100\n`);
    reportLines.push('## 各集评分\n');
    result.episodes.forEach(e => {
      reportLines.push(`### 第${e.episodeNumber}集 ${e.title}`);
      reportLines.push(`- 综合: ${e.score.overall} ${e.converged ? '✓达标' : ''}（迭代${e.qualityIterations}次）`);
      reportLines.push(`- 情节/人物/节奏/台词/一致性: ${e.score.plot}/${e.score.character}/${e.score.pacing}/${e.score.dialogue}/${e.score.consistency}`);
      if (e.expertReviewSummary) {
        reportLines.push(`\n**专家评审:**\n${e.expertReviewSummary}\n`);
      }
      reportLines.push('');
    });
    if (result.globalConsistencyReport) {
      reportLines.push('## 全局一致性检查\n');
      reportLines.push(result.globalConsistencyReport);
    }
    writeFileSync(resolve(folderName, '评审报告.md'), reportLines.join('\n'), 'utf-8');

    console.log(`\n✅ 完成！剧本已保存到文件夹: ${folderName}`);
    console.log(`  ├── 大纲.md`);
    result.episodes.forEach(e => {
      const numStr = String(e.episodeNumber).padStart(2, '0');
      const safeTitle = e.title.replace(/[\\/:*?"<>|]/g, '_');
      console.log(`  ├── 第${numStr}集_${safeTitle}.txt  (${e.score.overall}分)`);
    });
    console.log(`  └── 评审报告.md`);
    console.log(`共 ${result.episodes.length} 集, 平均评分: ${result.episodes.length > 0 ? Math.round(result.episodes.reduce((a, e) => a + e.score.overall, 0) / result.episodes.length) : 0}/100`);
  } else {
    console.error(`\n❌ 失败: ${result.error || result.summary}`);
    process.exit(1);
  }
} catch (err) {
  console.error(`\n❌ 运行异常: ${err.message}`);
  console.error(err.stack);
  process.exit(1);
}
