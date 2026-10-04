#!/usr/bin/env python3
"""
Asteria SDXL Image Generation Server
Runs on http://localhost:7860
Endpoints:
  POST /generate   { prompt, negative_prompt, steps, width, height, seed, style }
  GET  /health
  GET  /status
"""

import base64
import io
import json
import logging
import threading
import time
from http.server import BaseHTTPRequestHandler, HTTPServer

import torch
from diffusers import StableDiffusionXLPipeline

logging.basicConfig(level=logging.INFO, format="[SDXL] %(message)s")
log = logging.getLogger("sdxl")

# ── Style presets (appended to prompt) ────────────────────────────
STYLE_SUFFIX = {
    "Realistic":  "photorealistic, 8k, ultra detailed, sharp focus, DSLR",
    "Artistic":   "digital painting, concept art, artstation, vibrant colors",
    "Minimal":    "minimal, clean, white background, simple design",
    "Dark":       "dark atmosphere, dramatic lighting, noir, cinematic",
    "Cinematic":  "cinematic film still, anamorphic lens, movie lighting, 35mm",
}

NEGATIVE_BASE = (
    "nsfw, ugly, blurry, watermark, signature, deformed, bad anatomy, "
    "low quality, jpeg artifacts, worst quality, lowres, text, logo"
)

PORT = 7860
MODEL_ID = "stabilityai/stable-diffusion-xl-base-1.0"

pipe = None
model_status = {"loaded": False, "loading": False, "error": None}


def load_model():
    global pipe
    model_status["loading"] = True
    model_status["error"] = None
    try:
        log.info("Loading SDXL... this may take a moment on first run.")
        pipe = StableDiffusionXLPipeline.from_pretrained(
            MODEL_ID,
            torch_dtype=torch.float16,
            use_safetensors=True,
        ).to("cuda")
        pipe.enable_vae_slicing()
        pipe.enable_attention_slicing()
        model_status["loaded"] = True
        log.info("SDXL ready")
    except Exception as exc:
        model_status["error"] = str(exc)
        log.error(f"Failed to load model: {exc}")
    finally:
        model_status["loading"] = False


class Handler(BaseHTTPRequestHandler):
    def log_message(self, fmt, *args):
        pass  # silence default HTTP log

    def send_json(self, code, data):
        body = json.dumps(data).encode()
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def do_GET(self):
        if self.path == "/health":
            self.send_json(200, {"ok": True})
        elif self.path == "/status":
            self.send_json(200, model_status)
        else:
            self.send_json(404, {"error": "not found"})

    def do_POST(self):
        if self.path != "/generate":
            self.send_json(404, {"error": "not found"})
            return

        length = int(self.headers.get("Content-Length", 0))
        try:
            body = json.loads(self.rfile.read(length))
        except Exception:
            self.send_json(400, {"error": "invalid JSON"})
            return

        if not model_status["loaded"]:
            if model_status["loading"]:
                self.send_json(503, {"error": "Model is still loading, please wait"})
            else:
                self.send_json(503, {"error": model_status.get("error") or "Model not loaded"})
            return

        prompt   = body.get("prompt", "").strip()
        negative = body.get("negative_prompt", "").strip() or NEGATIVE_BASE
        steps    = max(10, min(int(body.get("steps", 30)), 60))
        width    = int(body.get("width",  1024))
        height   = int(body.get("height", 1024))
        seed     = body.get("seed")
        style    = body.get("style", "Realistic")

        if not prompt:
            self.send_json(400, {"error": "prompt is required"})
            return

        suffix = STYLE_SUFFIX.get(style, "")
        full_prompt = f"{prompt}, {suffix}" if suffix else prompt
        generator = torch.Generator("cuda").manual_seed(int(seed)) if seed is not None else None

        t0 = time.time()
        try:
            result = pipe(
                prompt=full_prompt,
                negative_prompt=negative,
                num_inference_steps=steps,
                width=width,
                height=height,
                generator=generator,
            )
            image = result.images[0]
        except Exception as exc:
            log.error(f"Generation error: {exc}")
            self.send_json(500, {"error": str(exc)})
            return

        elapsed = round(time.time() - t0, 1)
        buf = io.BytesIO()
        image.save(buf, format="PNG")
        b64 = base64.b64encode(buf.getvalue()).decode()

        self.send_json(200, {
            "image": f"data:image/png;base64,{b64}",
            "elapsed": elapsed,
            "width": width,
            "height": height,
            "seed": seed,
            "style": style,
        })
        log.info(f"Generated {width}x{height} in {elapsed}s [{style}]")


if __name__ == "__main__":
    threading.Thread(target=load_model, daemon=True).start()
    server = HTTPServer(("127.0.0.1", PORT), Handler)
    log.info(f"Asteria SDXL server on http://127.0.0.1:{PORT}")
    server.serve_forever()
