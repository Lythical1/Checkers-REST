DROP DATABASE IF EXISTS checkers;

CREATE DATABASE IF NOT EXISTS checkers;

USE checkers;

CREATE TABLE games (
    game_id VARCHAR(64) UNIQUE NOT NULL PRIMARY KEY DEFAULT '' COMMENT 'Custom game identifier',
    game_state JSON NOT NULL COMMENT 'Full game state as JSON',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    did_white_win BOOLEAN DEFAULT NULL COMMENT 'True if white won, false if black won, null if game is still in progress'
);
