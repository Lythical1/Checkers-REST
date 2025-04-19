<?php

require_once './connection.php';

// API Endpoint Handler
// Set headers to allow CORS and specify JSON response
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");


$jsonFile = __DIR__ . '/starting_game_state.json';

try {
    if (file_exists($jsonFile)) {
        $jsonData = file_get_contents($jsonFile);
        $gameState = json_decode($jsonData, true);
        
        // Add timestamps
        $now = date('Y-m-d H:i:s');
        $gameState['createdAt'] = $now;
        $gameState['lastUpdated'] = $now;
        $gameState['gameId'] = uniqid('game_');
        
        return $gameState;
    } 
} catch (Exception $e) {
    // Log the error message
    error_log("Error reading starting game state file: " . $e->getMessage());
}
