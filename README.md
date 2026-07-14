# NeuroScan Frontend — Setup Guide

This is a real, working frontend: it runs your **actual trained Keras model** in the browser using TensorFlow.js — not a simulated demo.

## Step 1 — Export your model from Colab
At the very end of `03_Brain_Tumor_Detection.ipynb`, run the last cell:
**"EXPORT MODEL FOR THE WEB FRONTEND (TensorFlow.js)"**

This will:
1. Convert your best trained model (EfficientNetB0 → MobileNetV2 → ResNet50, whichever exists) into TensorFlow.js format.
2. Save the class label mapping (`class_indices.json`) so the frontend shows the right tumor names.
3. Zip everything into `tfjs_model.zip` and download it to your computer.

## Step 2 — Add the model files to this folder
Unzip `tfjs_model.zip` so you end up with this structure:

```
frontend/
├── index.html
├── README.md
└── tfjs_model/
    ├── model.json
    ├── group1-shard1of1.bin   (one or more weight shard files)
    └── class_indices.json
```

## Step 3 — Serve it (don't just double-click index.html)
Browsers block `fetch()` requests for local files opened directly (`file://...`), so you need to serve this folder over `http://`. Easiest options:

**Option A — Python (already on most machines):**
```bash
cd frontend
python3 -m http.server 8000
```
Then open `http://localhost:8000` in your browser.

**Option B — VS Code Live Server extension:** right-click `index.html` → "Open with Live Server".

**Option C — GitHub Pages:** push this whole `frontend/` folder (including `tfjs_model/`) to your GitHub repo, then enable GitHub Pages in repo Settings → Pages. Your live demo URL will work the same way, and you can link it directly from your LinkedIn post / GitHub README.

## How it works
- On page load, the page fetches `tfjs_model/model.json` and `class_indices.json`. The status pill top-right turns green ("MODEL LOADED · READY") once successful, or red with an on-page explanation if the files aren't found.
- When you upload an MRI image and click **Run Analysis**, the image is resized to 150×150 and normalized exactly like during training, then run through the real model in your browser (no server round-trip, no API calls — everything happens client-side).
- The confidence bars and predicted class shown are the model's actual output probabilities.

## Note on file size
CNN backbones like ResNet50/EfficientNetB0 convert to a few MB to tens of MB in TF.js format. First load may take a couple of seconds — that's normal.
