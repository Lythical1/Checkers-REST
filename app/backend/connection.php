<?php

function getDbConnection()
{
    $host = 'db';
    $dbname = 'checkers';
    $username = 'bit_academy';
    $password = 'bit_academy';
    
    try {
        $pdo = new PDO("mysql:host=$host;dbname=$dbname", $username, $password);
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        return $pdo;
    } catch (PDOException $e) {
        // Log database connection errors
        error_log("Database connection error: " . $e->getMessage());
        return null;
    }
}