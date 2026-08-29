#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
batch_image_gen.py — 批量生图脚本（示例骨架）
==============================================
用途：批量调用 OpenAI 兼容的生图接口（如 gpt-image-2 / 即梦 / 可灵 等），
      为阶段四~八的资产（色卡/总调度图/场景图/角色图/道具图）批量出图。
      仅标准库，无第三方依赖。

【重要】本脚本是骨架示例，使用前必须：
  1. 设置环境变量 IMAGE_API_KEY（生图接口的 Key）
  2. 按你的服务商修改 IMAGE_BASE_URL 与 IMAGE_MODEL
  3. 自行确认接口的请求/响应格式（各家略有差异）

用法示例：
  set IMAGE_API_KEY=sk-xxx
  python batch_image_gen.py assets.json -o output_dir

输入 JSON 结构（每条一个资产）：
  [
    {"name": "色卡_全片", "prompt": "专业色彩方案色板图：...", "aspect": "16:9"},
    {"name": "场景_01_村口田埂", "prompt": "屋外场景参考图：...", "aspect": "9:16"}
  ]

输出：output_dir/ 下按 name 命名的图片文件（PNG）。
"""

import argparse
import base64
import json
import os
import sys
import time
import urllib.request

# ============ 按你的服务商修改 ============
IMAGE_BASE_URL = os.environ.get("IMAGE_BASE_URL", "https://api.openai.com/v1/images/generations")
IMAGE_MODEL = os.environ.get("IMAGE_MODEL", "gpt-image-2")
# ==========================================


def gen_image(prompt, out_path, aspect="16:9", size="2048x1152"):
    """调用 OpenAI 兼容生图接口，保存图片到 out_path。"""
    api_key = os.environ.get("IMAGE_API_KEY")
    if not api_key:
        sys.exit("缺少环境变量 IMAGE_API_KEY")

    body = {
        "model": IMAGE_MODEL,
        "prompt": prompt,
        "size": size,  # 2K 近似：16:9 -> 2048x1152；9:16 -> 1152x2048
        "quality": "high",
        "n": 1,
        "response_format": "b64_json",
    }
    req = urllib.request.Request(
        IMAGE_BASE_URL,
        data=json.dumps(body).encode("utf-8"),
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {api_key}",
        },
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=300) as resp:
        data = json.loads(resp.read().decode("utf-8"))

    # 兼容 b64_json 或 url 两种返回
    item = data["data"][0]
    if "b64_json" in item:
        img_bytes = base64.b64decode(item["b64_json"])
        with open(out_path, "wb") as f:
            f.write(img_bytes)
    elif "url" in item:
        with urllib.request.urlopen(item["url"], timeout=120) as r:
            with open(out_path, "wb") as f:
                f.write(r.read())
    else:
        sys.exit(f"无法识别接口返回格式：{list(item.keys())}")


def size_for(aspect):
    return {"16:9": "2048x1152", "9:16": "1152x2048", "1:1": "2048x2048"}.get(
        aspect, "2048x1152"
    )


def main():
    parser = argparse.ArgumentParser(description="批量生图（OpenAI 兼容接口）")
    parser.add_argument("input", help="资产清单 JSON 文件")
    parser.add_argument("-o", "--output", default="assets", help="输出目录（默认 assets）")
    args = parser.parse_args()

    with open(args.input, "r", encoding="utf-8") as f:
        items = json.load(f)

    os.makedirs(args.output, exist_ok=True)
    for i, it in enumerate(items, 1):
        name = it["name"]
        prompt = it["prompt"]
        aspect = it.get("aspect", "16:9")
        out_path = os.path.join(args.output, f"{name}.png")
        print(f"[{i}/{len(items)}] 生成 {name} ...")
        gen_image(prompt, out_path, aspect=aspect, size=size_for(aspect))
        print(f"  ✅ {out_path}")
        time.sleep(1)  # 温和限速，避免触发限流

    print(f"✅ 全部完成，共 {len(items)} 张 → {args.output}")


if __name__ == "__main__":
    main()
