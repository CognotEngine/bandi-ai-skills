#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
gen_shot_prompts.py — 批量生成分镜提示词
========================================
用途：把镜头清单（CSV/JSON）按六要素模板批量组装成完整的视频提示词，
      供逐镜生成视频使用。本脚本是班迪一键成片技能（bendi-vido）
      阶段九的可选增强，不依赖任何第三方库（仅标准库）。

用法示例：
  python gen_shot_prompts.py shots.csv -o prompts.csv
  python gen_shot_prompts.py shots.json -o prompts.json

输入 CSV 列（表头固定）：
  镜号,时长,段落,景别运镜,画面内容,情绪基调,转场

输入 JSON 结构（列表，字段同上）：
  [
    {"镜号": "01", "时长": "8s", "段落": "开场钩子",
     "景别运镜": "近景/推", "画面内容": "麦娘攥拳怒视远处",
     "情绪基调": "隐忍与不甘", "转场": "硬切"},
    ...
  ]

输出：每个镜头一条完整提示词，格式：
  [景别+运镜]。[画面内容]，[光影色彩]，[质感氛围]，[情绪基调]。
  光影/质感来自 --style 参数（风格锚），可放全片统一风格。
"""

import argparse
import csv
import json
import os
import sys


def build_prompt(shot, style, aspect):
    """按六要素模板组装单镜头提示词。"""
    # 六要素：镜头语言 / 主体动作 / 场景环境 / 光影色彩 / 质感氛围 / 情绪基调
    scene = shot.get("画面内容", "").strip()
    cam = shot.get("景别运镜", "").strip() or "固定镜头"
    mood = shot.get("情绪基调", "").strip() or "自然"
    # 风格锚（光影+质感）统一附加，保证全片一致性；段间用句号分隔
    parts = [f"{cam}。{scene}。"]
    if style:
        parts.append(style + "。")
    parts.append(f"情绪：{mood}。")
    prompt = "".join(parts)
    return prompt


def load_shots(path):
    """按扩展名读取镜头清单，返回 dict 列表。"""
    ext = os.path.splitext(path)[1].lower()
    if ext == ".json":
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    elif ext == ".csv":
        with open(path, "r", encoding="utf-8-sig", newline="") as f:
            return list(csv.DictReader(f))
    else:
        sys.exit(f"不支持的输入格式：{ext}（仅支持 .csv / .json）")


def main():
    parser = argparse.ArgumentParser(description="批量生成分镜视频提示词")
    parser.add_argument("input", help="镜头清单文件（.csv 或 .json）")
    parser.add_argument("-o", "--output", help="输出文件（.csv 或 .json）")
    parser.add_argument(
        "--style",
        default="",
        help="全片风格锚（光影+质感），如：'金色侧逆光，浅景深，胶片颗粒'",
    )
    parser.add_argument(
        "--aspect", default="9:16", help="画幅（写入输出备注，默认 9:16）"
    )
    args = parser.parse_args()

    shots = load_shots(args.input)
    if not shots:
        sys.exit("镜头清单为空")

    for s in shots:
        s["完整提示词"] = build_prompt(s, args.style, args.aspect)

    out = args.output or args.input.rsplit(".", 1)[0] + "_prompts.csv"
    ext = os.path.splitext(out)[1].lower()
    if ext == ".json":
        with open(out, "w", encoding="utf-8") as f:
            json.dump(shots, f, ensure_ascii=False, indent=2)
    else:
        # 保持输入列顺序，把完整提示词放最后
        fieldnames = [k for k in shots[0].keys() if k != "完整提示词"] + ["完整提示词"]
        with open(out, "w", encoding="utf-8-sig", newline="") as f:
            w = csv.DictWriter(f, fieldnames=fieldnames)
            w.writeheader()
            w.writerows(shots)

    print(f"✅ 已生成 {len(shots)} 条提示词 → {out}")


if __name__ == "__main__":
    main()
