# chess-bullet-bot

A chess website where you can play bullet against a bot trained on my own bullet game history. The bot doesn't try to play *perfect* chess — it tries to play like me: same openings, same time usage, same premoves, and yes, the same blunders under time pressure.

>Work in progress

## Features

- **Play bullet vs. the bot** (1+0) in the browser
- **Human-like move choice** — predicts the move I'd most likely play, not the engine's best move
- **Realistic clock behavior** — move times sampled from how long I actually take in similar positions
- **Premoves & time-scramble blunders** modeled from real games
- *(Planned)* Stats page comparing the bot's play to my real games

## How it works

1. **Data** — My bullet games are exported as PGNs (e.g. from Lichess/Chess.com) into `data/`.
2. **Processing** — Games are parsed into positions, the move I played, and my clock time at each move.
3. **Model** — A move-prediction model is trained on those positions (see `bot/`).
4. **Play** — The backend serves the bot's moves (with a delay matching its predicted think time) to the frontend over WebSockets.

## Tech stack

| Layer    | Tech |
|----------|------|
| Frontend | React + TypeScript (Vite), chessground / react-chessboard, chess.js |
| Backend  | Python, FastAPI, WebSockets |
| Bot      | python-chess, PyTorch |
| Database | PostgreSQL (or SQLite for local dev) |

## Project structure

```
chess-bullet-bot/
├── backend/     # API server: game sessions, clocks, move endpoints
├── bot/         # data processing, model training, inference
├── data/        # raw PGNs + processed datasets (large files gitignored)
├── frontend/    # web client
├── tests/       # backend + bot tests
├── .env.example # copy to .env and fill in
└── requirements.txt
```

## Getting started

### Prerequisites
- Python 3.11+
- Node.js 20+

### Backend
```bash
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
uvicorn backend.main:app --reload
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

### Train the bot
```bash
# put your PGNs in data/raw/
python -m bot.prepare_data
python -m bot.train
```

## Roadmap

- [ ] Parse PGNs + clock times into a dataset
- [ ] Baseline bot (opening book from my games + engine fallback)
- [ ] Playable board with bullet clocks
- [ ] Trained move-prediction model
- [ ] Human-like move timing and premoves
- [ ] Deploy

## Contributors

- Arush Mishra
- Arsh Gupta

## License

See [LICENSE](LICENSE).
