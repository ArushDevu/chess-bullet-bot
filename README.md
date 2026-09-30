# chess-bullet-bot

A web app for playing 1+0 bullet chess against a bot trained on my own game history. The goal isn't perfect chess. It's a bot that plays like me: the same openings, the same time usage, and the same mistakes under time pressure.

> **Status:** Early development. Game data collection works. The model, game logic, and playable board are not built yet. See the [Roadmap](#roadmap).

## How it will work

1. **Collect.** Download my rated 1+0 games from the Chess.com public API as PGN.
2. **Process.** Parse each game into positions, the move I played, and my remaining clock time.
3. **Train.** Fit a move-prediction model that outputs the move I'm most likely to play, not the engine's best move.
4. **Play.** A backend serves the bot's moves to the browser, delayed to match how long I'd take in that position.

## Current state

| Component | Status |
|---|---|
| Game download (`bot/fetch_games.py`) | Working |
| Data processing | Not started |
| Move-prediction model | Not started |
| Backend API | FastAPI scaffold with a `/health` endpoint |
| Frontend | Vite + React scaffold only |

## Tech stack

**In use:** Python, `requests`, FastAPI, uvicorn, React, Vite, oxlint

**Planned:** python-chess, PyTorch, WebSockets for live games, a React chessboard component

## Repository layout

```
chess-bullet-bot/
├── bot/
│   └── fetch_games.py   # downloads rated 1+0 games from Chess.com
├── backend/
│   └── main.py          # FastAPI app (health check only so far)
├── frontend/            # React + Vite client
├── requirements.txt
└── README.md
```

Downloaded games are written to `data/raw/`. That folder is gitignored and gets created the first time you run the fetch script.

## Getting started

### Prerequisites

- Python 3.11+
- Node.js 20.19+ or 22.12+ (required by Vite 8)

### Set up Python

```bash
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

### Download game data

```bash
python -m bot.fetch_games
```

This saves every rated, standard-rules 1+0 game for the account set in `CHESSCOM_USERNAME` (top of `bot/fetch_games.py`) to `data/raw/chesscom_games.pgn`. Re-running the script overwrites the file.

### Run the backend

With the virtual environment active, from the repository root:

```bash
uvicorn backend.main:app --reload
```

Check it's running at http://127.0.0.1:8000/health, which should return `{"status": "ok"}`.

### Run the frontend

```bash
cd frontend
npm install
npm run dev
```

## Roadmap

- [x] Download rated 1+0 games from Chess.com
- [ ] Parse PGNs and clock times into a training dataset
- [ ] Baseline bot: opening book from my games, engine fallback
- [ ] Playable board with bullet clocks
- [ ] Backend serving bot moves over WebSockets
- [ ] Trained move-prediction model
- [ ] Human-like move timing and premoves
- [ ] Stats page comparing the bot to my real games
- [ ] Deploy

## Contributing

Work happens on feature branches and is merged into `main` through pull requests.

## Authors

- Arush Mishra
- Arsh Gupta

## License

See [LICENSE](LICENSE).