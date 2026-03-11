"""
PocketDex AI — LFM2-VL Inference Server
========================================
Runs LiquidAI/LFM2-VL-450M locally via HuggingFace Transformers.
The React Native app sends a base64-encoded image to this server
and receives a structured animal identification JSON response.

Usage:
    python main.py

The server binds to 0.0.0.0:8000 so your phone (on the same WiFi)
can reach it via your machine's local IP address.
"""

import base64
import io
import json
import logging
import os
import re
import time
from contextlib import asynccontextmanager
from typing import Optional

import torch
from PIL import Image
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from transformers import AutoProcessor, AutoModelForVision2Seq

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger(__name__)

# ─── Model config ─────────────────────────────────────────────────────────────

MODEL_ID = os.environ.get("MODEL_ID", "LiquidAI/LFM2-VL-450M")
DEVICE   = "cuda" if torch.cuda.is_available() else ("mps" if torch.backends.mps.is_available() else "cpu")

# ─── System prompt ────────────────────────────────────────────────────────────

SYSTEM_PROMPT = """You are an expert wildlife biologist and field naturalist with encyclopedic knowledge of animals worldwide.

Analyse the image provided and identify the animal. Respond ONLY with a valid JSON object — no markdown, no extra text.

Use exactly this schema:
{
  "animalName": "Common English name",
  "scientificName": "Genus species",
  "description": "Informative 2-3 sentence description of the species",
  "habitat": "Primary habitat description",
  "diet": "Diet description starting with the feeding type (e.g. Carnivorous — ...)",
  "behavior": "Key behavioural traits",
  "rarity": "Common | Uncommon | Rare | Epic | Legendary",
  "biome": "Forest | Wetland | Urban | Grassland | Mountain | Coastal | Desert | Unknown",
  "confidence": 0.00
}

Rarity guide:
- Common: seen daily in many environments (pigeons, sparrows, dogs)
- Uncommon: requires some searching (foxes, herons, deer)
- Rare: specialist habitat, declining populations (otters, peregrine falcon)
- Epic: very hard to find, regionally scarce (golden eagle, wildcat)
- Legendary: exceptionally rare or a remarkable sighting (snow leopard, wolverine)

confidence: your 0.0-1.0 confidence in the identification based on image quality and distinctiveness.

If the image does not clearly show an animal, still return valid JSON with animalName "Unknown Animal" and confidence 0.1."""

# ─── Lifespan: load model once at startup ─────────────────────────────────────

model = None
processor = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    global model, processor

    logger.info(f"Loading {MODEL_ID} on {DEVICE}…")
    t0 = time.time()

    processor = AutoProcessor.from_pretrained(MODEL_ID)

    model = AutoModelForVision2Seq.from_pretrained(
        MODEL_ID,
        torch_dtype=torch.float16 if DEVICE in ("cuda", "mps") else torch.float32,
        device_map=DEVICE,
    )
    model.eval()

    logger.info(f"Model ready in {time.time() - t0:.1f}s on {DEVICE}")
    yield
    # Cleanup on shutdown
    del model, processor


# ─── App ──────────────────────────────────────────────────────────────────────

app = FastAPI(title="PocketDex AI — LFM2-VL Server", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─── Schemas ──────────────────────────────────────────────────────────────────

class AnalyzeRequest(BaseModel):
    image_base64: str          # base64-encoded image data
    image_mime: str = "image/jpeg"


class AnimalStats(BaseModel):
    power: int
    agility: int
    intelligence: int
    camouflage: int
    friendliness: int
    rarityScore: int


class AnalyzeResponse(BaseModel):
    animalName: str
    scientificName: str
    description: str
    habitat: str
    diet: str
    behavior: str
    rarity: str
    biome: str
    confidence: float
    stats: AnimalStats


# ─── Stat generation (mirrors utils/statGenerator.ts) ─────────────────────────

import random

RARITY_BASE_STATS: dict[str, dict] = {
    "Common":    dict(power=30, agility=45, intelligence=40, camouflage=35, friendliness=55, rarityScore=12),
    "Uncommon":  dict(power=45, agility=55, intelligence=55, camouflage=50, friendliness=48, rarityScore=38),
    "Rare":      dict(power=60, agility=65, intelligence=65, camouflage=65, friendliness=40, rarityScore=62),
    "Epic":      dict(power=75, agility=78, intelligence=75, camouflage=72, friendliness=30, rarityScore=80),
    "Legendary": dict(power=90, agility=88, intelligence=85, camouflage=80, friendliness=15, rarityScore=95),
}

RARITY_VARIANCE: dict[str, int] = {
    "Common": 16, "Uncommon": 13, "Rare": 10, "Epic": 7, "Legendary": 4,
}


def jitter(base: int, variance: int) -> int:
    delta = (random.random() * 2 - 1) * variance
    return max(1, min(100, round(base + delta)))


def generate_stats(rarity: str) -> dict:
    base = RARITY_BASE_STATS.get(rarity, RARITY_BASE_STATS["Common"])
    v    = RARITY_VARIANCE.get(rarity, 16)
    return {k: jitter(base[k], v) for k in base}


# ─── JSON extraction helper ────────────────────────────────────────────────────

def extract_json(text: str) -> Optional[dict]:
    """Extract the first valid JSON object from model output."""
    # Try to find JSON block
    match = re.search(r'\{[\s\S]*\}', text)
    if not match:
        return None
    try:
        return json.loads(match.group())
    except json.JSONDecodeError:
        # Attempt to salvage truncated JSON
        snippet = match.group().rstrip().rstrip(',').rstrip('{').strip()
        try:
            return json.loads(snippet + "}")
        except Exception:
            return None


# ─── Inference ────────────────────────────────────────────────────────────────

def run_inference(image: Image.Image) -> dict:
    """Run LFM2-VL inference and return parsed result dict."""

    # Build the message in the standard chat/VLM format
    messages = [
        {
            "role": "user",
            "content": [
                {"type": "image"},
                {"type": "text", "text": SYSTEM_PROMPT},
            ],
        }
    ]

    # Apply chat template
    text_input = processor.apply_chat_template(
        messages, add_generation_prompt=True
    )

    inputs = processor(
        text=text_input,
        images=[image],
        return_tensors="pt",
    ).to(DEVICE)

    with torch.no_grad():
        output_ids = model.generate(
            **inputs,
            max_new_tokens=512,
            do_sample=False,        # greedy for consistent structured output
            temperature=1.0,
            repetition_penalty=1.1,
        )

    # Decode only the newly generated tokens
    input_len  = inputs["input_ids"].shape[1]
    new_tokens = output_ids[0][input_len:]
    raw_output = processor.decode(new_tokens, skip_special_tokens=True)

    logger.info(f"Raw model output: {raw_output[:300]}")

    parsed = extract_json(raw_output)
    if not parsed:
        logger.warning("Could not parse model JSON — using fallback")
        parsed = {
            "animalName": "Unknown Animal",
            "scientificName": "Species indeterminate",
            "description": "The image could not be confidently analysed.",
            "habitat": "Unknown",
            "diet": "Unknown",
            "behavior": "Unknown",
            "rarity": "Common",
            "biome": "Unknown",
            "confidence": 0.1,
        }

    # Sanitise rarity
    valid_rarities = {"Common", "Uncommon", "Rare", "Epic", "Legendary"}
    if parsed.get("rarity") not in valid_rarities:
        parsed["rarity"] = "Common"

    # Sanitise biome
    valid_biomes = {"Forest", "Wetland", "Urban", "Grassland", "Mountain", "Coastal", "Desert", "Unknown"}
    if parsed.get("biome") not in valid_biomes:
        parsed["biome"] = "Unknown"

    # Clamp confidence
    parsed["confidence"] = max(0.0, min(1.0, float(parsed.get("confidence", 0.5))))

    return parsed


# ─── Routes ───────────────────────────────────────────────────────────────────

@app.get("/health")
def health():
    return {
        "status": "ok",
        "model": MODEL_ID,
        "device": DEVICE,
        "model_loaded": model is not None,
    }


@app.post("/analyze", response_model=AnalyzeResponse)
def analyze(req: AnalyzeRequest):
    if model is None or processor is None:
        raise HTTPException(status_code=503, detail="Model not loaded")

    # Decode base64 image
    try:
        image_bytes = base64.b64decode(req.image_base64)
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid image data: {e}")

    # Resize to reasonable size (LFM2-VL-450M is efficient but 1024px is plenty)
    max_size = 1024
    if max(image.size) > max_size:
        image.thumbnail((max_size, max_size), Image.LANCZOS)

    t0 = time.time()
    result = run_inference(image)
    logger.info(f"Inference took {time.time() - t0:.2f}s — identified: {result.get('animalName')}")

    # Generate game stats from rarity
    stats = generate_stats(result["rarity"])

    return AnalyzeResponse(
        animalName   = result.get("animalName", "Unknown Animal"),
        scientificName = result.get("scientificName", "Species unknown"),
        description  = result.get("description", ""),
        habitat      = result.get("habitat", ""),
        diet         = result.get("diet", ""),
        behavior     = result.get("behavior", ""),
        rarity       = result.get("rarity", "Common"),
        biome        = result.get("biome", "Unknown"),
        confidence   = result["confidence"],
        stats        = AnimalStats(**stats),
    )


# ─── Entry point ──────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import uvicorn
    # Bind to all interfaces so physical devices on the same WiFi can reach it
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=False)
