// Game state variables
let gameState = null;
let selectedCell = null;
let validMoves = [];

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

            // Add event listener for cell click
            cell.addEventListener('click', () => { handleCellClick(row, col); });

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

// Handle cell click events
function handleCellClick(row, col) {
    // If game is over, do nothing
    if (gameState.status !== 'in_progress') {
        return;
    }

    const clickedPiece = gameState.board[row][col];


    // If a piece is already selected
    if (selectedCell) {

        // Clear the selection if there is clicked again
        clearSelection();

        if (clickedPiece) {
            selectCell(row, col);
        } else {
            clearSelection();
        }
    } else {
        if (clickedPiece) {
            selectCell(row, col);
        }
    }
}

// Clear the current selection
function clearSelection() {
    if (selectedCell) {
        const cell = getCellElement(selectedCell.row, selectedCell.col);
        if (cell.firstChild) {
            cell.firstChild.classList.remove('selected');
        }
    }
}

// Get a cell element by row and column
function getCellElement(row, col) {
    return board.querySelector(`[data-row="${row}"][data-col="${col}"]`);
}

// Select a cell with a piece
function selectCell(row, col) {
    selectedCell = { row, col };

    // Highlight the selected piece
    const cell = getCellElement(row, col);
    if (cell.firstChild) {
        cell.firstChild.classList.add('selected');
    }

    console.log(`Selected cell: ${row}, ${col}`);
}