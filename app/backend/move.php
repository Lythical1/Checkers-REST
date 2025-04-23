<?php

// Prevent any output before our JSON
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    echo json_encode(['success' => true]);
    exit;
}

try {
    // Check request method
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        throw new Exception('Only POST method is allowed');
    }

    // Get raw POST data
    $jsonData = file_get_contents('php://input');
    
    // Log raw input for debugging
    error_log("Raw input: " . substr($jsonData, 0, 100) . "...");
    
    // Parse JSON
    $data = json_decode($jsonData, true);
    
    // Check if JSON parsing was successful
    if (json_last_error() !== JSON_ERROR_NONE) {
        throw new Exception('Invalid JSON: ' . json_last_error_msg());
    }

    // Validate data
    if (!isset($data['gameState'])) {
        throw new Exception('Missing gameState in request');
    }

    // Database operation
    require_once 'connection.php';
    $pdo = getDbConnection();
    if ($pdo === null) {
        throw new Exception('Database connection failed');
    }

    $gameState = $data['gameState'];

    // Make sure game_id exists
    if (!isset($gameState['gameId'])) {
        $gameState['gameId'] = uniqid('game_');
    }

    // Add game to the database if it doesn't exist
    $stmt = $pdo->prepare("SELECT * FROM games WHERE game_id = :game_id");
    $stmt->bindParam(':game_id', $gameState['gameId']);
    $stmt->execute();

    if ($stmt->rowCount() === 0) {
        $stmt = $pdo->prepare("INSERT INTO games (game_id, game_state) VALUES (:game_id, :game_state)");
        $stmt->bindParam(':game_id', $gameState['gameId']);
        $gameStateJson = json_encode($gameState);
        $stmt->bindParam(':game_state', $gameStateJson);
        $stmt->execute();
    } else {
        // Update existing game state
        $stmt = $pdo->prepare("UPDATE games SET game_state = :game_state WHERE game_id = :game_id");
        $stmt->bindParam(':game_id', $gameState['gameId']);
        $gameStateJson = json_encode($gameState);
        $stmt->bindParam(':game_state', $gameStateJson);
        $stmt->execute();
    }

    // Send success response
    echo json_encode([
        'success' => true,
        'message' => 'Move saved successfully',
        'gameState' => $gameState
    ]);
} catch (Exception $e) {
    // Log error
    error_log('Error in move.php: ' . $e->getMessage());
    
    // Send error response
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}
?>
