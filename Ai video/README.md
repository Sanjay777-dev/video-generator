# VidForge

VidForge is a personal AI video generation studio. The web app uses Next.js 14 and TypeScript; FastAPI handles the API, Celery and Redis run generation jobs, SQLAlchemy stores job state in SQLite, and generated files are kept in the local `storage/` directory.

## Run with MockProvider (no GPU)

The mock provider creates a short sample MP4 with FFmpeg so the generation queue, polling, playback, download, and thumbnail flow can be tested without an AI model or GPU.

### Windows: Docker Desktop (recommended)

1. Install [Docker Desktop](https://www.docker.com/products/docker-desktop/) and start it.
2. Copy `.env.example` to `.env` in PowerShell:

   ```powershell
   Copy-Item .env.example .env
   ```

3. Build and start the app from the project directory:

   ```powershell
   docker compose up --build
   ```

4. Open [http://localhost:3000](http://localhost:3000). Submit a prompt, wait for the job to complete, then play or download the sample video.
5. Check the API at [http://localhost:8000/health](http://localhost:8000/health) and interactive API docs at [http://localhost:8000/docs](http://localhost:8000/docs).
6. Stop the services with `Ctrl+C`; run `docker compose down` when you want to stop/remove the containers. Your media and database persist in mounted storage and Docker volumes.

### Run the frontend/backend directly on Windows

Install Python 3.11, Node.js 20, Redis, and FFmpeg; make sure `ffmpeg.exe` and `redis-server.exe` are on `PATH`. Copy `.env.example` to `.env` and set `REDIS_URL=redis://localhost:6379/0`, `DATABASE_URL=sqlite:///./vidforge.db`, and `STORAGE_DIR=../storage` for the backend's working directory. Then run each command in its own PowerShell window:

```powershell
cd backend
py -3.11 -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

```powershell
cd backend
.\.venv\Scripts\Activate.ps1
celery -A app.workers.celery_app.celery_app worker --loglevel=INFO --pool=solo
```

```powershell
cd frontend
npm install
npm run dev
```

Browse to `http://localhost:3000`.

## Switch to a real GPU model

The optional `LocalProvider` uses Diffusers and Wan2.1. It requires a supported NVIDIA GPU, CUDA-enabled PyTorch, enough GPU memory for the chosen model, and a model configuration compatible with the installed Diffusers release.

1. Install the NVIDIA driver and NVIDIA Container Toolkit on a Linux host, then verify Docker can see the GPU with `docker run --rm --gpus all nvidia/cuda:12.4.1-base-ubuntu22.04 nvidia-smi`.
2. Ensure `backend/requirements.txt` uses the CUDA-enabled PyTorch wheel appropriate for your host; follow the official [PyTorch installation selector](https://pytorch.org/get-started/locally/) if you need to change the pinned `torch` and `torchvision` packages.
3. In `.env`, set `PROVIDER=local`. Set `LOCAL_MODEL_ID` and `LOCAL_I2V_MODEL_ID` to compatible Diffusers model repositories if you want to use different text-to-video and image-to-video pipelines; set `LOCAL_DEVICE=cuda`.
4. Start/rebuild the backend and worker with the GPU override so both load the provider configuration:

   ```powershell
   docker compose -f docker-compose.yml -f docker-compose.gpu.yml up --build
   ```

The first request may download model weights. The default local text-to-video model is Wan2.1 1.3B; image-to-video uses the Wan2.1 14B I2V model, which needs significantly more GPU memory. Both can be configured independently. The 14B image model may not fit on smaller GPUs.

To enable an administrator, set both `ADMIN_EMAIL` and `ADMIN_PASSWORD` before registering the matching account. The password must also meet the account's 8-character minimum. Change `JWT_SECRET` to a long random value before using accounts beyond a local development machine. `RATE_LIMIT_PER_HOUR=0` means unlimited; a positive integer caps authenticated users' job submissions per rolling hour. Guests remain unlimited.

For prompt enhancement without a remote service, leave `PROMPT_ENHANCER_URL` empty; VidForge applies a local descriptive enhancement template. To use an Ollama-compatible local API, point the setting to its generation endpoint (for example `http://host.docker.internal:11434/api/generate`) and ensure the selected model is available. Requests to a configured endpoint fail visibly if the local service is unavailable.

## API

- `POST /api/generate` accepts `multipart/form-data`: `prompt`, `negative_prompt`, `duration` (3/5/8), `aspect_ratio` (16:9/9:16/1:1), `resolution` (480p/720p), optional `seed`, and optional PNG/JPEG/WebP `image` (10 MB max).
- `GET /api/jobs/{job_id}` returns state (`queued`, `processing`, `done`, or `failed`) and progress.
- Completed media is served from `/media/videos/...` and thumbnails from `/media/thumbnails/...`.

Prompt length is capped at 2,000 characters; negative prompts at 1,000. Configuration is available through environment variables in `.env`.

## Project layout

```text
frontend/                 Next.js application
backend/app/              FastAPI app and generation pipeline
backend/app/providers/    VideoProvider, MockProvider, LocalProvider
backend/app/workers/      Celery configuration and generation task
backend/app/services/     Pipeline, prompt enhancement, storage abstraction
storage/videos/           Generated MP4 files
storage/thumbnails/       FFmpeg-generated poster images
storage/uploads/          Uploaded source images
docker-compose.yml        Redis, API, worker, and frontend
```
