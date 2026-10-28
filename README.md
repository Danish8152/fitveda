# FITVEDA

**An AI movement coach that lives in your browser.** Paste a YouTube link to any workout or dance routine, and FITVEDA plays it next to your webcam, compares your pose to the instructor's in real time, scores every move, and coaches you out loud.

No app to install and no sensors. Pose tracking runs on your device, and your webcam video never leaves your browser.

---

## Contents

- [What it does](#what-it-does)
- [How it works](#how-it-works)
- [Tech stack](#tech-stack)
- [Getting started](#getting-started)
- [Environment variables](#environment-variables)
- [Using the app](#using-the-app)
- [Project structure](#project-structure)
- [API routes](#api-routes)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)
- [Known limitations](#known-limitations)
- [Scripts](#scripts)

---

## What it does

| Feature | Description |
|---|---|
| **YouTube URL mode** | Paste any YouTube link. The server downloads the video, the browser extracts the instructor's poses from it, and you follow along with a live webcam skeleton on the other side. |
| **Live scoring** | Your pose is compared with the reference limb by limb (arms, legs, torso). You get a rolling 0-100 score, per-move ratings (Perfect, Great, OK, Almost, Miss), points and combo streaks. |
| **AI coach** | Short coaching lines such as "Lift that left arm higher", written by an LLM and spoken aloud. Different tone for **gym** and **dance** videos, which are detected automatically from the video's title and description. |
| **Move queue** | A strip of upcoming key poses from the reference video, each with your best match score. Click a card to jump there. |
| **Gesture control** | Control playback without touching the keyboard. Flick a wrist above your shoulder to play or pause, swipe with your left hand to skip 5 seconds, and hold both hands above your head for 2 seconds to restart. |
| **Record and replay** | Record your pose track, save it as a file, and replay it later against the reference. |
| **End-of-session report** | A graded report card (S to D) with your best and weakest limb, a persona, and three tips for next time. |
| **AI Generate** | Describe a workout ("5-minute beginner core workout") and FITVEDA generates a short reference video for it with Magic Hour (or xAI Grok as a fallback). |
| **Live Class** | Coach yourself against a live online class: join a meeting inside the app, or capture a class window from your screen. |
| **Chrome extension** | One click on any YouTube tab opens it in FITVEDA (see [`extension/`](extension)). |
| **Responsive layout** | Full-screen arena on laptops and desktops, stacked scrolling layout on phones. |

---

## How it works

```
 YouTube URL
     |
     v
 /api/download --- yt-dlp + ffmpeg ---> {VIDEO_DIR}/{id}.mp4     (deleted 1 hour after last use)
     |                                          |
     | classified: gym | dance (Groq)           v
     v                                   /api/video/{id}  (HTTP range requests)
 Mode overlay                                   |
                                                v
                                Browser: MediaPipe Pose on the video  -->  reference poses
                                                |
 Webcam --> MediaPipe Pose (on device) --------+--> compare + score  --> skeleton, points, move queue
                                                |
                                                v
                                         /api/coach
                              LLM writes a line --> Sarvam speaks it
```

- **Pose detection runs in the browser** (MediaPipe WASM, served from `public/`). The server never sees your webcam.
- **The server's jobs** are downloading the video, serving it with range requests, and calling the AI providers with your keys.
- **Text provider fallback:** the coach, report and video script try **Sarvam**, then **Groq**, then **OpenAI**. A provider that fails on billing or a bad key is skipped for 10 minutes.
- **Video storage is temporary.** Files older than one hour are deleted automatically (the clock restarts whenever a video is played).

---

## Tech stack

- **Framework:** Next.js 16 (App Router), React 19, TypeScript
- **Styling:** Tailwind CSS 4
- **Pose tracking:** MediaPipe Pose (WASM, self-hosted)
- **Voice:** Sarvam AI text-to-speech (`bulbul:v3`)
- **Text AI:** Sarvam (`sarvam-105b-conversations`), Groq (`gpt-oss-20b`), OpenAI (`gpt-4o-mini`) via one OpenAI-compatible client
- **Video generation:** Magic Hour (preferred) or xAI Grok
- **Downloads:** yt-dlp and ffmpeg on the server
- **Tests:** Vitest

---

## Getting started

### Prerequisites

| Tool | Version | Why |
|---|---|---|
| Node.js | **22 or newer** | Runs the app. yt-dlp also needs Node 22+ (or Deno) to solve YouTube's JavaScript challenges. |
| yt-dlp | latest, installed as `yt-dlp[default]` | Downloads YouTube videos. The `[default]` extra includes the challenge solver. |
| ffmpeg | any recent build | Merges video and audio streams. |
| A webcam | | Pose tracking. Must be served over **HTTPS or `localhost`**. |

### Install

```bash
git clone https://github.com/Danish8152/fitveda.git
cd fitveda
npm install
```

Install the download tools:

```bash
# Windows (PowerShell)
pip install -U "yt-dlp[default]"
winget install Gyan.FFmpeg

# macOS
brew install yt-dlp ffmpeg

# Debian / Ubuntu
sudo apt install ffmpeg && pip install -U "yt-dlp[default]"
```

Open a **new terminal** afterwards so the updated PATH is picked up, then check:

```bash
yt-dlp --version
ffmpeg -version
```

### Configure

```bash
cp .env.example .env
```

Fill in at least the keys marked **required** in [Environment variables](#environment-variables).

### Run

```bash
npm run dev
```

Open <http://localhost:3000>, allow camera access, and paste a YouTube link.

---

## Environment variables

Copy `.env.example` to `.env`. Never commit `.env`. It is already in `.gitignore`.

| Variable | Required | Used for |
|---|---|---|
| `SARVAM_API_KEY` | **Yes** | Coach voice (text-to-speech), and the first choice for coach text, the report and the video script. |
| `GROQ_API_KEY` | Recommended | Backup text provider, gym/dance detection, live vision scoring. |
| `OPENAI_API_KEY` | No | Last-resort text provider. Skipped when empty or out of credit. |
| `MAGICHOUR_API_KEY` | For AI Generate | Default video generation key. Users can also paste their own key in the in-app **Settings** (gear icon), which overrides this one. |
| `MAGICHOUR_MODEL` | No | Magic Hour model. Defaults to `default`. Use e.g. `ltx-2.5` for cheaper clips. |
| `XAI_API_KEY` | No | Fallback video provider when no Magic Hour key is available. |
| `PERPLEXITY_API_KEY` | No | Adds web research to AI Generate scripts. Skipped when empty. |
| `ZOOM_SDK_KEY`, `ZOOM_SDK_SECRET` | For "Join Online Meeting" | Meeting SDK credentials. "Capture Online Window" needs no keys. |
| `YTDLP_COOKIES_B64` | Usually on a server | Base64 of a Netscape `cookies.txt` from a logged-in YouTube session. Lets downloads pass YouTube's bot check on server IPs. |
| `YTDLP_PROXY` | No | Proxy URL for yt-dlp, e.g. `http://user:pass@host:port`. Residential proxies work best. |
| `VIDEO_DIR` | No | Where downloaded videos are stored. Defaults to the OS temp folder plus `/fitveda`. |

> **Tip: the Magic Hour key in the browser.** Click the gear icon in the header and paste your Magic Hour key. It is saved only in your browser and sent with each AI Generate request, so you can change it any time without touching the server or redeploying.

---

## Using the app

1. **Pick a mode** with the tabs at the top: *YouTube URL*, *AI Generate* or *Live Class*.
2. **YouTube URL:** paste a link and press **Load**. Wait for the download and the "Analyzing moves" step.
3. **Allow the camera** and stand back so your whole body is in the frame.
4. **Move.** Press play on the reference video. Your score, the coach and the move queue react as you follow along.
5. **Finish** the video to get your report card.

Tips:

- Use the **Speed** slider to slow a hard section down to 0.25x.
- Good lighting and a plain background help pose tracking.
- The coach only talks while the reference video is playing and your body is visible.

---

## Project structure

```
app/
  page.tsx               Main screen: tabs, state, scoring loop
  layout.tsx, globals.css
  api/                   Server routes (see below)
  components/            UI: panels, coach bar, move queue, report cards, settings, live class
  lib/                   Pose extraction and comparison, scoring, coach client, LLM and
                         video-provider clients, yt-dlp helper, video cleanup
  shared/                Scoring, coaching, speech and pose code shared with the Live Class tab
instrumentation.ts       Starts the old-video cleanup when the server boots
public/
  pose*.js, *.wasm, ...  Self-hosted MediaPipe files
  zoom-embed.html        Meeting SDK page used inside the Live Class tab
  score/                 Score popup artwork
extension/               Chrome extension (opens the current YouTube tab in FITVEDA)
Dockerfile               Production image (Node 22 + ffmpeg + yt-dlp)
render.yaml              Render blueprint
```

---

## API routes

| Route | Method | Purpose |
|---|---|---|
| `/api/download` | POST | Downloads a YouTube video with yt-dlp. Streams progress and a gym/dance classification as server-sent events. |
| `/api/video/[id]` | GET | Serves a downloaded or generated video with range-request support. |
| `/api/coach` | POST | Writes one coaching line from a pose summary and returns it with Sarvam voice audio. |
| `/api/report` | POST | Turns session stats into a graded report card. |
| `/api/score` | POST | Compares a reference frame and a webcam frame with a vision model. |
| `/api/generate` | POST | AI Generate: script, then video, then saved file. Streams progress. Accepts an `x-magichour-key` header. |
| `/api/zoom-signature` | POST | Signs a meeting-join token for the Live Class tab. |

---

## Deployment

FITVEDA needs a **long-running server** (it spawns yt-dlp and writes video files), so serverless hosts such as Vercel are a poor fit. Use Docker on a VPS or a container host (Coolify, Render, Railway, Fly).

### Docker

```bash
docker build -t fitveda .
docker run -d --name fitveda --restart unless-stopped \
  --env-file .env -p 3000:3000 \
  -v fitveda-videos:/tmp/fitveda fitveda
```

The image is based on `node:22-slim` and includes ffmpeg and yt-dlp. Put a reverse proxy (Caddy, Nginx, or Coolify's built-in Traefik) in front of it for **HTTPS**. Browsers block webcam access on plain HTTP.

### Coolify

1. Create an **Application** from your Git repo and set **Build Pack = Dockerfile**.
2. Set **Ports Exposes** to `3000` and add your domain with `https://`.
3. Add the environment variables from the table above. You need at least `SARVAM_API_KEY`.
4. Under **Storages**, add a Volume Mount at `/tmp/fitveda` (optional, keeps videos across redeploys).
5. Deploy. After changing environment variables, redeploy.

### YouTube blocks server IPs

Cloud and VPS addresses often get *"Sign in to confirm you're not a bot"* from YouTube. Fix it with one of these, then redeploy:

- **Cookies (free):** export `cookies.txt` from a throwaway Google account in a private window, encode it (`[Convert]::ToBase64String([IO.File]::ReadAllBytes("cookies.txt"))` in PowerShell), and set `YTDLP_COOKIES_B64`. The cookies expire eventually and need re-exporting.
- **Proxy (more reliable):** set `YTDLP_PROXY` to a residential proxy URL.

### Disk space

Downloaded and generated videos are deleted **one hour after they were last used**. Old Docker images and build cache are the bigger disk hog on small servers. Turn on Docker cleanup in your host, or run `docker system prune -af` occasionally.

---

## Troubleshooting

| Symptom | Cause and fix |
|---|---|
| `spawn yt-dlp ENOENT` | yt-dlp is not installed or not on PATH. Install it, then open a new terminal and restart `npm run dev`. |
| `Sign in to confirm you're not a bot` | YouTube is blocking the server's IP. Set `YTDLP_COOKIES_B64` or `YTDLP_PROXY`. |
| `Requested format is not available` | yt-dlp cannot solve YouTube's challenges. Use Node 22 or newer and install `yt-dlp[default]`. |
| The coach says nothing | The video must be playing and your body visible. Check that at least one of `SARVAM_API_KEY`, `GROQ_API_KEY` or `OPENAI_API_KEY` is valid and has credit. Check the server log for `[llm]` lines. |
| Coach text appears but no voice | `SARVAM_API_KEY` is missing or invalid, or the coach speaker button is muted. |
| Camera does not start | The page must be on HTTPS or `localhost`, and no other app can be holding the camera. |
| AI Generate fails with "rejected the API key" or "credits are used up" | Open **Settings** (gear icon) and paste a valid Magic Hour key. |
| The download works but the progress bar stalls | Check `yt-dlp --version` on the server, and update it (`pip install -U "yt-dlp[default]"`). YouTube changes often. |

---

## Known limitations

- **Gym/dance detection and live vision scoring** call Groq models (`llama-3.1-8b-instant` and `llama-4-scout`). If your Groq key does not have them, detection defaults to "dance" and the score uses pose geometry only. Everything else still works.
- **Downloading YouTube videos** may breach YouTube's terms of service. Use it for personal practice and do not redistribute downloaded videos. Files are deleted automatically after an hour.
- **AI Generate costs money** per clip, and the endpoint has no login or rate limit. If you run a public site, set spending limits on your video provider account.
- **Browser support:** tested in Chrome. Other Chromium browsers such as Edge should work. Safari and Firefox are untested.

---

## Scripts

| Command | Does |
|---|---|
| `npm run dev` | Development server on port 3000 |
| `npm run build` | Production build |
| `npm start` | Run the production build |
| `npm run typecheck` | TypeScript check |
| `npm run lint` | ESLint |
| `npm test` | Vitest |

---

Started as a hackathon project (TreeHacks 2026). See [`PRD.md`](PRD.md) for the original product notes.
