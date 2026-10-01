"""
Download all rated 1+0 Chess.com games for an account into one PGN file.

Output:
    data/raw/chesscom_games.pgn

Usage:
    pip install -r requirements.txt
    python -m bot.fetch_games

API docs:
    https://www.chess.com/news/view/published-data-api
"""

import time
from pathlib import Path

import requests


# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

CHESSCOM_USERNAME = "chikki2021"

# Contact info requested by Chess.com for API clients.
CONTACT_INFO = "github.com/ArushDevu"

# Resolve paths relative to the repository root.
REPO_ROOT = Path(__file__).resolve().parent.parent
OUTPUT_FILE = REPO_ROOT / "data" / "raw" / "chesscom_games.pgn"

API_BASE_URL = "https://api.chess.com/pub"

# Chess.com encodes time controls as "<base seconds>+<increment seconds>" and
# drops the "+0" when there's no increment. So "60" means exactly 1+0.
# We filter on this instead of Chess.com's "bullet" category, because
# "bullet" also includes 30-second, 1+1, and 2+1 games.
TARGET_TIME_CONTROL = "60"

REQUEST_TIMEOUT_SECONDS = 30
MAX_ATTEMPTS_PER_REQUEST = 4

# Avoid sending requests too quickly.
SECONDS_BETWEEN_REQUESTS = 0.5

# 429 means "too many requests" and 5xx codes mean a temporary server
# problem; both are worth retrying after a wait. Other errors, such as a
# 404 from a misspelled username, won't fix themselves, so we don't retry.
RETRYABLE_STATUS_CODES = {429, 500, 502, 503, 504}


# ---------------------------------------------------------------------------
# HTTP helpers
# ---------------------------------------------------------------------------

def create_session() -> requests.Session:
    """Create an HTTP session with the headers Chess.com expects.

    A single reused session keeps the connection open between requests,
    which is faster than reconnecting for every month.
    """
    session = requests.Session()
    session.headers.update({
        "User-Agent": (
            f"chess-bullet-bot/0.1 "
            f"(username: {CHESSCOM_USERNAME}; contact: {CONTACT_INFO})"
        ),
        "Accept": "application/json",
    })
    return session


def wait_before_retry(attempt: int, base_seconds: float) -> None:
    """Sleep with exponential backoff: base, 2x base, 4x base, ...

    Skips the sleep after the final attempt, since no retry follows it.
    """
    if attempt >= MAX_ATTEMPTS_PER_REQUEST:
        return

    wait_seconds = base_seconds * 2 ** (attempt - 1)
    print(f"  Retrying in {wait_seconds:g}s...")
    time.sleep(wait_seconds)


def fetch_json(session: requests.Session, url: str) -> dict | None:
    """GET a URL and return its parsed JSON body.

    Retries network errors and the status codes in RETRYABLE_STATUS_CODES.
    Returns None if the request fails permanently or runs out of attempts,
    leaving it to the caller to decide whether that's fatal.
    """
    for attempt in range(1, MAX_ATTEMPTS_PER_REQUEST + 1):
        try:
            response = session.get(url, timeout=REQUEST_TIMEOUT_SECONDS)
            
        except requests.RequestException as error:    
            print(f"  Network error (attempt {attempt}/{MAX_ATTEMPTS_PER_REQUEST}): {error}")
            wait_before_retry(attempt, base_seconds=1)
            continue

        if response.status_code == 200:
            return response.json()

        if response.status_code in RETRYABLE_STATUS_CODES:
            print(
                f"  HTTP {response.status_code} "
                f"(attempt {attempt}/{MAX_ATTEMPTS_PER_REQUEST})"
            )
            # Longer base wait than for network errors: if we're being rate
            # limited, retrying quickly just gets us rate limited again.
            wait_before_retry(attempt, base_seconds=5)
            continue

        # Non-retryable error. Print the start of the response body, since
        # Chess.com usually explains the problem there.
        print(f"  HTTP {response.status_code} for {url}")
        print(f"  Response body: {response.text[:200]}")
        return None

    print(f"  Giving up on {url} after {MAX_ATTEMPTS_PER_REQUEST} attempts.")
    return None


# ---------------------------------------------------------------------------
# Chess.com-specific logic
# ---------------------------------------------------------------------------

def fetch_archive_urls(session: requests.Session) -> list[str] | None:
    """Return the monthly archive URLs for the configured user, oldest first.

    Returns None if the list couldn't be fetched (e.g. the username is wrong).
    """
    url = f"{API_BASE_URL}/player/{CHESSCOM_USERNAME}/games/archives"
    data = fetch_json(session, url)
    if data is None:
        return None
    return data.get("archives", [])


def month_label(archive_url: str) -> str:
    """Turn an archive URL into a short label for log messages.

    Example: ".../games/2024/03" -> "2024/03"
    """
    year, month = archive_url.rstrip("/").split("/")[-2:]
    return f"{year}/{month}"


def is_rated_one_minute_game(game: dict) -> bool:
    """Return True if a game is one we want to train the bot on."""
    is_one_plus_zero = game.get("time_control") == TARGET_TIME_CONTROL

    # "rules" is "chess" for standard games. Other values are variants
    # (chess960, crazyhouse, bughouse, ...) whose positions would confuse
    # the model.
    is_standard_chess = game.get("rules") == "chess"

    is_rated = game.get("rated", False)

    # A game can occasionally be missing its PGN (e.g. aborted games).
    # Without the PGN there's nothing to save, so skip it.
    has_pgn = "pgn" in game

    return is_one_plus_zero and is_standard_chess and is_rated and has_pgn


def extract_target_pgns(month_data: dict) -> list[str]:
    """Return the PGN text of every game in one month that passes the filter."""
    return [
        game["pgn"].strip()
        for game in month_data.get("games", [])
        if is_rated_one_minute_game(game)
    ]


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main() -> None:
    session = create_session()

    print(f"Fetching game archives for {CHESSCOM_USERNAME}...")
    archive_urls = fetch_archive_urls(session)
    if archive_urls is None:
        print("Couldn't fetch the archive list. Check the username and your internet connection.")
        return

    total_months = len(archive_urls)
    print(f"Found {total_months} months of history.\n")

    OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)

    total_games_saved = 0
    failed_months = []

    # Overwrite so repeated runs don't create duplicates.
    with open(OUTPUT_FILE, "w", encoding="utf-8") as output:
        for month_number, archive_url in enumerate(archive_urls, start=1):
            label = month_label(archive_url)

            month_data = fetch_json(session, archive_url)
            if month_data is None:
                failed_months.append(label)
                print(f"[{month_number}/{total_months}] {label}: FAILED")
                continue

            pgns = extract_target_pgns(month_data)
            for pgn in pgns:
                # PGN files separate games with a blank line.
                output.write(pgn + "\n\n")

            total_games_saved += len(pgns)
            print(f"[{month_number}/{total_months}] {label}: {len(pgns)} games")

            time.sleep(SECONDS_BETWEEN_REQUESTS)

    print(f"\nSaved {total_games_saved} rated 1+0 games to {OUTPUT_FILE}")

    if failed_months:
        print("\nWARNING: these months failed to download and are missing from the file:")
        print("  " + ", ".join(failed_months))
        print("Re-run the script to try again.")


if __name__ == "__main__":
    main()