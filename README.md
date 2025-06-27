```markdown
# ♟️ Checkers REST API

A simple Checkers game built with a RESTful architecture. The backend is written in **PHP**, while the frontend is built using **vanilla JavaScript**. Everything runs locally via **Docker**, making it easy to set up and test the game.

## 🚀 Features

- Turn-based Checkers game logic
- RESTful API to manage game state
- Local play in the browser
- Clean separation of backend and frontend
- Lightweight and self-contained

## 🧱 Tech Stack

- **Backend:** PHP (no framework)
- **Frontend:** HTML, CSS, JavaScript
- **Containerization:** Docker & Docker Compose

## 📦 Getting Started

### Requirements

- [Docker](https://www.docker.com/)
- [Docker Compose](https://docs.docker.com/compose/)

### Run Locally

Clone the repository:

```bash
git clone https://github.com/Lythical1/Checkers-REST.git
cd Checkers-REST
```

Start the containers:

```bash
docker-compose up --build
```

Once running, open your browser and navigate to:

```
http://localhost:8080
```

You should see the Checkers UI and be able to start a new game.

## 🛠️ API Overview

The backend exposes RESTful endpoints to:

- Start a new game
- Make moves
- Get the current board state
- Reset the game

Example (GET current game state):

```http
GET /api/game
```

Returns JSON:

```json
{
  "board": [[...]],
  "turn": "red",
  "winner": null,
  "move_history[[...]]
}
```
