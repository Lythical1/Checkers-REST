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

const gameIdValue = document.getElementById('game-id-value');
const savedGameId = document.getElementById('saved-game-id');

const newGameButton = document.getElementById('new-game-btn');
const loadButton = document.getElementById('load-game-btn');
const copyButton = document.getElementById('copy-button');

// Initialize the game
document.addEventListener('DOMContentLoaded', () => {
    initGame();

    newGameButton.addEventListener('click', initGame);
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

    const piecesWithCapture = checkForMandatoryCaptures().map(piece => {
        return {
            row: piece.row,
            col: piece.col,
            moves: piece.moves
        };
    }
    );

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

                // Add red highlight for pieces with capture moves available
                if (piecesWithCapture.some(p => p.row === row && p.col === col)) {
                    pieceElement.classList.add('must-capture');
                }

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
    const mandatoryCaptures = checkForMandatoryCaptures();


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

        // If clicking on another valid piece, select it (only if it has capture moves when mandatory captures exist)
        if (clickedPiece && clickedPiece.color === gameState.currentTurn) {
            // If there are mandatory captures, only allow selecting pieces with capture moves
            if (mandatoryCaptures.length > 0) {
                const canCapture = mandatoryCaptures.some(piece => piece.row === row && piece.col === col);
                if (canCapture) {
                    selectCell(row, col);
                } else {
                    statusMessage.textContent = 'Capture is mandatory! Select a piece that can capture.';
                }
            } else {
                selectCell(row, col);
            }
        }
    }
    else if (clickedPiece && clickedPiece.color === gameState.currentTurn) {
        // If there are mandatory captures, only allow selecting pieces with capture moves
        if (mandatoryCaptures.length > 0) {
            const canCapture = mandatoryCaptures.some(piece => piece.row === row && piece.col === col);
            if (canCapture) {
                selectCell(row, col);
            } else {
                statusMessage.textContent = 'Capture is mandatory! Select a piece that can capture.';
            }
        } else {
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
    if (piece.king) {
        // Kings can move multiple steps in all 4 diagonal directions
        directions.push({ dr: -1, dc: -1 }, { dr: -1, dc: 1 }, { dr: 1, dc: -1 }, { dr: 1, dc: 1 });
        // Check all cells in each direction until blocked or capture is possible
        directions.forEach(dir => {
            let r = row + dir.dr;
            let c = col + dir.dc;

            while (isValidCell(r, c)) {
                if (gameState.board[r][c] === null) {
                    regularMoves.push({ row: r, col: c, capture: false });
                } else {
                    const capturedPiece = gameState.board[r][c];
                    // Check if the captureable piece is of the opposite color
                    if (capturedPiece && capturedPiece.color !== piece.color) {
                        let r2 = r + dir.dr;
                        let c2 = c + dir.dc;
                        // Loop until finding another roadblock or invalid cell
                        while (isValidCell(r2, c2) && gameState.board[r2][c2] === null) {
                            captureMoves.push({ row: r2, col: c2, capture: true });
                            r2 += dir.dr;
                            c2 += dir.dc;
                        }
                    }
                    break; // Stop checking further in this direction
                }
                r += dir.dr;
                c += dir.dc;
            }
        });
        return captureMoves.length > 0 ? captureMoves : regularMoves;
    
    } else if (piece.color === 'light') {
        // Light pieces move up
        directions.push({ dr: -1, dc: -1 }, { dr: -1, dc: 1 });
    } else if (piece.color === 'dark') {
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
        const piece = gameState.board[fromRow][fromCol];

        // Handle capture
        if (Math.abs(fromRow - toRow) > 1 && Math.abs(fromCol - toCol) > 1) {
            const rowDirection = Math.sign(toRow - fromRow);
            const colDirection = Math.sign(toCol - fromCol);

            let currentRow = fromRow + rowDirection;
            let currentCol = fromCol + colDirection;

            while (currentRow !== toRow && currentCol !== toCol) {
                const capturedPiece = gameState.board[currentRow][currentCol];
                if (capturedPiece && capturedPiece.color !== piece.color) {
                    // Remove captured piece
                    gameState.board[currentRow][currentCol] = null;
                    gameState.capturedPieces[gameState.currentTurn]++;
                }
                currentRow += rowDirection;
                currentCol += colDirection;
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

        // Update last move
        gameState.lastMove = {
            fromRow: fromRow,
            fromCol: fromCol,
            toRow: toRow,
            toCol: toCol
        };

        // Add to move history
        if (!gameState.movesHistory) {
            gameState.movesHistory = [];
        }
        gameState.movesHistory.push({
            from: { row: fromRow, col: fromCol },
            to: { row: toRow, col: toCol },
            player: piece.color,
            time: new Date().toISOString()
        });

        // Make sure we have a gameId
        if (!gameState.gameId) {
            gameState.gameId = gameState.game_id || `game_${Date.now()}`;
        }

        // Update UI first for better user experience
        renderBoard();
        updateGameInfo();

        // Then send to server to save
        const response = await fetch('/api/move.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                gameState: gameState,
                gameId: gameState.gameId
            })
        });

        if (!response.ok) {
            throw new Error(`Server error: ${response.status}`);
        }

        const result = await response.json();
        if (result.success) {
            gameState = result.gameState;
            if (Math.abs(fromRow - toRow) > 1) {
                statusMessage.textContent = 'Piece captured!';
            }
        } else {
            statusMessage.textContent = result.message || 'Failed to save move';
        }

        gameIdValue.textContent = gameState.gameId;
        copyButton.style.display = 'block';
        copyButton.onclick = () => {
            navigator.clipboard.writeText(gameState.gameId)
                .then(() => {
                    statusMessage.textContent = 'Game ID copied to clipboard!';
                })
                .catch(err => {
                    console.error('Failed to copy: ', err);
                    statusMessage.textContent = 'Failed to copy Game ID.';
                });
        };

    } catch (error) {
        console.error('Move error:', error);
        statusMessage.textContent = `Error: ${error.message}`;

        // Continue with the local move even if server save fails
        renderBoard();
        updateGameInfo();
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

// Check if the current player has any mandatory captures
function checkForMandatoryCaptures() {
    const mandatoryCapturePieces = [];

    // Iterate through all pieces of current player
    for (let row = 0; row < 10; row++) {
        for (let col = 0; col < 10; col++) {
            const piece = gameState.board[row][col];
            if (piece && piece.color === gameState.currentTurn) {
                const validMoves = findValidMoves(row, col);
                if (validMoves.some(move => move.capture)) {
                    mandatoryCapturePieces.push({ row, col, moves: validMoves });
                }
            }
        }
    }
    return mandatoryCapturePieces;
}

async function loadGame() {
    try {
        const gameId = savedGameId.value;
        if (!gameId) {
            statusMessage.textContent = "Please enter a game ID";
            return;
        }
        
        statusMessage.textContent = "Loading game...";
        
        const response = await fetch(`/api/loadGame.php?game_id=${gameId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error("Server error response:", errorText);
            throw new Error(`Failed to load game (${response.status}): ${errorText}`);
        }
        
        // Get the response data
        const responseData = await response.json();
        console.log("Raw server response:", responseData);
        
        // Check if the game_state is a string that needs parsing
        if (responseData.game_state && typeof responseData.game_state === 'string') {
            try {
                // Parse the JSON string into an object
                gameState = JSON.parse(responseData.game_state);
            } catch (e) {
                console.error("Failed to parse game state:", e);
                throw new Error("Invalid game state data");
            }
        } else if (responseData.board) {
            // If the response itself contains the game state properties
            gameState = responseData;
        } else {
            throw new Error("Invalid game data format");
        }
        
        // Make sure we have the game ID available
        if (responseData.game_id) {
            gameState.gameId = responseData.game_id;
        }
        
        console.log("Processed game state:", gameState);
        
        // Now render the board with the properly parsed game state
        renderBoard();
        updateGameInfo();
        statusMessage.textContent = "Game loaded successfully!";
        
        // Update game ID display
        gameIdValue.textContent = gameState.gameId || gameState.game_id;
        copyButton.style.display = 'block';
    } catch (error) {
        console.error('Error loading game:', error);
        statusMessage.textContent = `Error: ${error.message}`;
    }
}