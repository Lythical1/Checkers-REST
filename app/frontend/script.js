// Game state variables
let gameState = null;


// DOM elements
const boardElement = document.getElementById('board');
const turnDisplay = document.getElementById('turn-display');
const statusMessage = document.getElementById('status-message');

const newGameButton = document.getElementById('new-game-btn');
const loadButton = document.getElementById('load-game-btn');


// Initialize the game
document.addEventListener('DOMContentLoaded', () => {
    initGame();

    newGameButton.addEventListener('click', initGame);
    // loadButton.addEventListener('click', loadGame);
});

// Initialize or reset the game
async function initGame() {
    try {
        // Use the correct API endpoint path according to your nginx configuration
        const response = await fetch('/api/boardSetup.php', {
            method: 'GET',
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch game data: ${response.status}`);
        }

        // The response.json() already parses JSON to an object
        gameState = await response.json();
        console.log('Game state:', gameState);

        renderBoard();
        statusMessage.textContent = 'New game started!';

    } catch (error) {
        statusMessage.textContent = `Error: ${error.message}`;
        console.error(error);
    }
}

function renderBoard() {
    // Clear the board first
    boardElement.innerHTML = '';

    // Create cells and pieces
    for (let row = 0; row < 10; row++) {
        for (let col = 0; col < 10; col++) {
            // Create cell
            const cell = document.createElement('div');
            cell.classList.add('cell');
            cell.classList.add((row + col) % 2 === 0 ? 'light-cell' : 'dark-cell');
            cell.dataset.row = row;
            cell.dataset.col = col;

            // Check if there's a piece at this position
            const piece = gameState.board[row][col];
            if (piece) {
                const pieceElement = document.createElement('div');
                pieceElement.classList.add('piece');
                pieceElement.classList.add(`${piece.color}-piece`);


                if (piece.king) {
                    pieceElement.classList.add('king');
                }

                cell.appendChild(pieceElement);
            }

            // Add to board
            board.appendChild(cell);
        }
    }
}