# Blockprint

Generate Minecraft building blueprints from an image using AI. Upload a sketch or reference image, get a parametric blueprint with dimensions and materials, preview it visually, and optionally build it in-game via RCON.

## Prerequisites

- **Python 3.10+** (backend)
- **Node.js 18+** and npm (frontend)
- An **API key** from either [OpenAI](https://platform.openai.com/api-keys) or [Google AI Studio](https://aistudio.google.com/app/apikey) (Gemini, free tier works)

## Quick Start

### 1. Backend

```bash
cd backend
python -m venv venv
```

**Windows (PowerShell):**
```powershell
.\venv\Scripts\Activate.ps1
```

**Linux / macOS:**
```bash
source venv/bin/activate
```

```bash
pip install -r requirements.txt
cp .env.example .env
```

Edit `.env` and set your AI provider and key.

**Using Gemini (recommended, free tier):**
```env
AI_PROVIDER=gemini
AI_API_KEY=AIzaSy-your-gemini-key-here
AI_MODEL=gemini-2.5-flash
```

**Using OpenAI:**
```env
AI_PROVIDER=openai
AI_API_KEY=sk-your-openai-key-here
AI_MODEL=gpt-4-vision-preview
```

Start the API:
```bash
uvicorn app.main:app --reload --port 8000
```

Backend runs at **http://localhost:8000**. API docs: **http://localhost:8000/docs**.

### 2. Frontend

In a **new terminal**:

```bash
cd app
npm install
npm run dev
```

Frontend runs at **http://localhost:5173**. The dev server proxies `/api` to the backend, so the app talks to `http://localhost:8000` automatically.

### 3. Use the app

1. Open **http://localhost:5173** in your browser.
2. Upload an image (e.g. a front-view building sketch).
3. Choose a style (e.g. Ghibli) and click **Generate blueprint**.
4. View the **Visual Preview** (with roof as stair blocks) and **Blueprint JSON**, then copy or use the blueprint as needed.

## Project layout

| Path       | Description                    |
|-----------|--------------------------------|
| `app/`    | React + TypeScript + Vite UI  |
| `backend/`| FastAPI API, AI, validation    |
| `TechSpec.md` | Technical specification   |

## Environment (backend `.env`)

| Variable           | Description |
|--------------------|-------------|
| `AI_PROVIDER`      | `openai` or `gemini` |
| `AI_API_KEY`       | Your API key |
| `AI_MODEL`         | e.g. `gemini-2.5-flash` or `gpt-4-vision-preview` |
| `CORS_ORIGINS`     | Comma-separated origins (default includes `http://localhost:5173`) |
| `RCON_*`           | Only needed if you use “Build in Minecraft” (Minecraft + RCON). |

## Optional: Build in Minecraft

To build the blueprint in-game:

1. Run a Minecraft server with RCON enabled.
2. In backend `.env`, set `RCON_HOST`, `RCON_PORT`, and `RCON_PASSWORD`.
3. Use the **Build in Minecraft** flow in the app (sends the blueprint to the server via RCON).

## Scripts

**Frontend**
- `npm run dev` — development server (with API proxy)
- `npm run build` — production build
- `npm run preview` — preview production build

**Backend**
- `uvicorn app.main:app --reload --port 8000` — run API with auto-reload

## Minecraft Server Info
Server IP: 31.214.162.8:26134
Minecraft 1.21.10

### Test RCON: http://localhost:8000/docs
/api/build 

```
{
  "blueprint": {
    "view": "front",
    "building": {
      "width_blocks": 24,
      "wall_height_blocks": 12,
      "depth_blocks": 10,
      "roof": {
        "type": "gable",
        "height_blocks": 7,
        "overhang": 1
      },
      "openings": [
        {
          "type": "window",
          "x": 6,
          "y": 5,
          "w": 3,
          "h": 3
        },
        {
          "type": "door",
          "x": 16,
          "y": 0,
          "w": 2,
          "h": 4
        }
      ]
    },
    "style": {
      "theme": "ghibli",
      "materials": {
        "foundation": "mossy_cobblestone",
        "wall": "oak_planks",
        "trim": "stripped_oak_log",
        "roof": "spruce_stairs",
        "window": "glass_pane",
        "door": "oak_door"
      },
      "decor": [
        "lantern",
        "leaves"
      ],
      "variation": 0.15
    }
  },
  "origin": {
    "x": 100,
    "y": 70,
    "z": 100
  }
}
```