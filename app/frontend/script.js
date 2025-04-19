// Game state variables
let gameState = null;
let selectedCell = null;
let validMoves = [];

// DOM elements
const boardElement = document.getElementById('board');
const turnDisplay = document.getElementById('turn-display');
const statusMessage = document.getElementById('status-message');
const lightCaptured = document.getElementById('light-captured');
const darkCaptured = document.getElementById('dark-captured');

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
            boardElement.appendChild(cell);
        }
    }
}

// Check if cell coordinates are valid
function isValidCell(row, col) {
    return row >= 0 && row < 10 && col >= 0 && col < 10;
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
        // Check if the clicked cell is a valid move destination
        const isValidMove = validMoves.some(move => move.row === row && move.col === col);
        
        if (isValidMove) {
            // Make the move
            makeMove(selectedCell.row, selectedCell.col, row, col);
            clearSelection();
            return;
        }
        
        // If not a valid move, clear the selection
        clearSelection();
        
        // If clicking on another piece of the current player's color, select it
        if (clickedPiece && clickedPiece.color === gameState.currentTurn) {
            selectCell(row, col);
        }
    } 
    // If no piece is selected yet and clicked on the current player's piece
    else if (clickedPiece && clickedPiece.color === gameState.currentTurn) {
        selectCell(row, col);
    }
}

// Clear the current selection
function clearSelection() {
    if (selectedCell) {
        const cell = getCellElement(selectedCell.row, selectedCell.col);
        if (cell.firstChild) {
            cell.firstChild.classList.remove('selected');
        }

        // Remove highlights from valid moves
        validMoves.forEach(move => {
            const moveCell = getCellElement(move.row, move.col);
            moveCell.classList.remove('valid-move');
        });

        selectedCell = null;
        validMoves = [];
    }
}

// Get a cell element by row and column
function getCellElement(row, col) {
    return boardElement.querySelector(`[data-row="${row}"][data-col="${col}"]`);
}

// Select a cell with a piece
function selectCell(row, col) {
    selectedCell = { row, col };

    // Highlight the selected piece
    const cell = getCellElement(row, col);
    if (cell.firstChild) {
        cell.firstChild.classList.add('selected');
    }


    // Find valid moves
    validMoves = findValidMoves(row, col);

    // Highlight valid moves
    validMoves.forEach(move => {
        const moveCell = getCellElement(move.row, move.col);
        moveCell.classList.add('valid-move');
    });

}

function findValidMoves(row, col) {
    const regularMoves = [];
    const captureMoves = [];
    const piece = gameState.board[row][col];

    if (!piece) return [];

    // Direction of movement depends on piece color and if it's a king
    const directions = [];

    if (piece.color === 'light') {
        // Light pieces move up
        directions.push({ dr: -1, dc: -1 }, { dr: -1, dc: 1 });
    }
    else if (piece.color === 'dark') {
        // Dark pieces move down
        directions.push({ dr: 1, dc: -1 }, { dr: 1, dc: 1 });
    } else {

        console.error('Unexpected piece color:', piece.color);
        return [];
    }

    // Check each direction
    directions.forEach(dir => {
        // Regular move (1 square)
        const r1 = row + dir.dr;
        const c1 = col + dir.dc;

        if (isValidCell(r1, c1) && gameState.board[r1][c1] === null) {
            regularMoves.push({ row: r1, col: c1, capture: false });
        }

        // Capture move (2 squares)
        const r2 = row + 2 * dir.dr;
        const c2 = col + 2 * dir.dc;

        if (isValidCell(r2, c2) && gameState.board[r2][c2] === null) {
            const capturedPiece = gameState.board[r1][c1];
            if (capturedPiece && capturedPiece.color !== piece.color) {
                captureMoves.push({ row: r2, col: c2, capture: true });
            }
        }
    });

    // If there are capture moves, those are the only valid moves (mandatory capture)
    return captureMoves.length > 0 ? captureMoves : regularMoves;
}

async function makeMove(fromRow, fromCol, toRow, toCol) {
    try {
        // Send move to server
        const response = await fetch('move.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                gameState: gameState,
                fromRow: fromRow,
                fromCol: fromCol,
                toRow: toRow,
                toCol: toCol
            })
        });

        if (!response.ok) {
            throw new Error('Failed to make move');
        }

        const result = await response.json();

        if (result.success) {
            // Update game state
            gameState = result.gameState;
            renderBoard();
            updateGameInfo();

            // Handle captures
            if (Math.abs(fromRow - toRow) === 2) {
                statusMessage.textContent = 'Piece captured!';
            } else {
                statusMessage.textContent = '';
            }
        } else {
            statusMessage.textContent = result.message || 'Invalid move';
        }
    } catch (error) {
        // For demo purposes, we'll simulate the move client-side if the server call fails
        simulateMove(fromRow, fromCol, toRow, toCol);
        statusMessage.textContent = `Note: Move simulated client-side due to server error: ${error.message}`;
        console.error(error);
    }
}

// Update game information display
function updateGameInfo() {
    // Update turn display
    if (turnDisplay) {
        turnDisplay.textContent = gameState.currentTurn.charAt(0).toUpperCase() + gameState.currentTurn.slice(1);
        turnDisplay.style.color = gameState.currentTurn === 'light' ? '#333' : '#333';
    }

    // Update captured pieces only if those elements exist
    if (lightCaptured) {
        lightCaptured.textContent = gameState.capturedPieces.light;
    }
    
    if (darkCaptured) {
        darkCaptured.textContent = gameState.capturedPieces.dark;
    }

    // Check game status
    if (statusMessage) {
        if (gameState.status === 'light_won') {
            statusMessage.textContent = 'Light player wins!';
        } else if (gameState.status === 'dark_won') {
            statusMessage.textContent = 'Dark player wins!';
        } else if (Math.abs(gameState.lastMove?.fromRow - gameState.lastMove?.toRow) === 2) {
            statusMessage.textContent = 'Piece captured!';
        } else {
            statusMessage.textContent = '';
        }
    }
}

// Simulate move client-side (for demo purposes)
function simulateMove(fromRow, fromCol, toRow, toCol) {
    const piece = gameState.board[fromRow][fromCol];

    // Handle capture
    if (Math.abs(fromRow - toRow) === 2 && Math.abs(fromCol - toCol) === 2) {
        const midRow = (fromRow + toRow) / 2;
        const midCol = (fromCol + toCol) / 2;
        const capturedPiece = gameState.board[midRow][midCol];

        if (capturedPiece) {
            // Remove captured piece
            gameState.board[midRow][midCol] = null;
            gameState.capturedPieces[piece.color]++;
        }
    }

    // Move piece
    gameState.board[toRow][toCol] = piece;
    gameState.board[fromRow][fromCol] = null;

    // Check if piece becomes king
    if ((piece.color === 'light' && toRow === 0) || (piece.color === 'dark' && toRow === 9)) {
        piece.king = true;
    }

    // Switch turns
    gameState.currentTurn = gameState.currentTurn === 'light' ? 'dark' : 'light';

    // Update last updated timestamp
    gameState.lastUpdated = new Date().toISOString();

    // Add move to history
    gameState.movesHistory.push({
        from: { row: fromRow, col: fromCol },
        to: { row: toRow, col: toCol },
        player: piece.color,
        time: new Date().toISOString()
    });

    // Render the updated state
    renderBoard();
    updateGameInfo();
}