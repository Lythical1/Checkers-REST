<?php

require_once 'connection.php';

// API Endpoint Handler
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

try {
    $pdo = getDbConnection(); // Get the connection properly
    
    if (!$pdo) {
        throw new Exception("Database connection failed");
    }
    
    $gameId = $_GET['game_id'] ?? null;

    if (!$gameId) {
        throw new Exception("Game ID is required.");
    }

    $stmt = $pdo->prepare("SELECT * FROM games WHERE game_id = :id");
    $stmt->execute(['id' => $gameId]);
    $gameState = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$gameState) {
        throw new Exception("Game not found.");
    }

    echo json_encode($gameState);
} catch (Exception $e) {
    // Log error
    error_log('Error in loadGame.php: ' . $e->getMessage());
    
    // Send error response
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}