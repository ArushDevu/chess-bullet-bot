# Software Requirements Specification (SRS) - Chess Bullet Bot

This document outlines the functional requirements, non functional requirements, and project constraints for the **Chess Bullet Bot** application.

## Project Overview
Chess Bullet Bot is a web application that allows a user to play bullet chess online or against AI bots trained using Arush Mishra's games. Instead of playing optimally, the bot is trained on a specific user's historical PGN game data to replicate their unique playstyle, including opening preferences, move timing distributions, premove habits and blunders under time constraints.

---

## Functional Requirements (FR)

### 1 Data Processing & Model Training (`bot/`)
* **FR-1.1 PGN Ingestion:** The system must accept raw PGN files exported from chess platforms (Lichess/Chess.com) placed in the `data/raw/` directory.
* **FR-1.2 Data Parsing:** The data pipeline must extract the board position (FEN), the move played, the remaining clock time and premove flags for every move in the dataset.
* **FR-1.3 Move Prediction Training:** The model must train on historical positions to predict the user's most likely move choice.
* **FR-1.4 Time Behavior Training:** The system must model and predict move latency based on the current position complexity, remaining clock time and historical habits.

### 2 Game Engine & Backend (`backend/`)
* **FR-2.1 State Management:** The backend must track active game sessions, board states and synchronization of both player clocks.
* **FR-2.2 WebSocket Communication:** The server must use WebSockets to handle real time and low latency game events, including: move broadcasting, clock updates and game over triggers.
* **FR-2.3 Bot Move Generation:** When it is the bot's turn, the backend must query the trained model to retrieve the predicted move and the simulated think time delay.
* **FR-2.4 Premoves & Blunders:** The bot engine must execute immediate responses if the model predicts a historical "premove" condition and lower move quality when the bot's clock time is low.

### 3 User Interface (`frontend/`)
* **FR-3.1 Interactive Chessboard:** The UI must render a responsive chessboard to drag and drop or click-click move inputs.
* **FR-3.2 Bullet Clocks:** The client must display countdown timers for both sides.
* **FR-3.3 Live Sync:** The UI must reflect bot and player moves immediately upon receipt of the WebSocket message.

---

## Non-Functional Requirements (NFR)

### 1 Performance & Latency
* **NFR-1.1 Round-Trip Latency:** WebSocket messages for moves must process and transmit within **under 50 milliseconds** (excluding intentional bot think-time delays) to ensure a smooth bullet experience.
* **NFR-1.2 Inference Speed:** The model inference step must take **less than 10 milliseconds** per move to prevent unintended technical lag on top of simulated think times.

### 2 Usability & Compatibility
* **NFR-2.1 Responsive Design:** The chessboard and clock layout must scale elegantly to fit standard desktop screens and modern laptop resolutions.
* **NFR-2.2 Browser Support:** The frontend web application must fully support modern evergreen browsers.

### 3 Reliability & Data Handling
* **NFR-3.1 Clock Synchronization:** Server-side clocks must manage game termination to prevent client-side latency manipulation or cheating.
* **NFR-3.2 Storage Isolation:** Large dataset files and raw PGNs must be safely excluded from version control.

---

## Constraints & System Environment

* **C-1 Language Constraints:** The backend must rely on **Python+**, and the frontend client must utilize **TypeScript via React and Vite**.
* **C-2 Local Database:** Data storage must be compatible with and scale to **MongoDB** in production.
