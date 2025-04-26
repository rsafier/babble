/**
 * Scrabble Helper Functions
 * Contains utility functions for the Scrabble game
 */

const scrabble = require('./scrabbleLogic');
const { isValidWord } = require('./dictionary');

/**
 * Generate a bot move for Scrabble
 * @param {Object} gameState - The current game state
 * @param {Array} playerTiles - The bot's tiles
 * @param {Boolean} isFirstMove - Whether this is the first move in the game
 * @returns {Object} The bot's move
 */
function generateBotMove(gameState, playerTiles, isFirstMove) {
  // Simple bot strategy: Try to place a single word if possible
  // For a more advanced bot, we would need more sophisticated word finding algorithms
  
  // For simplicity, if it's the first move, try to place a word in the center
  if (isFirstMove) {
    // Find a valid word that can be formed from the bot's tiles
    const possibleWords = findPossibleWords(playerTiles);
    
    if (possibleWords.length > 0) {
      // Sort by length (prefer longer words)
      possibleWords.sort((a, b) => b.word.length - a.word.length);
      
      // Take the first word that fits on the board through the center
      for (const wordObj of possibleWords) {
        const word = wordObj.word;
        
        // Check if the word can be placed horizontally through the center
        if (word.length <= scrabble.BOARD_SIZE - scrabble.CENTER_TILE) {
          const placedTiles = [];
          
          // Calculate starting column to place the word through the center
          const startCol = Math.max(0, scrabble.CENTER_TILE - Math.floor(word.length / 2));
          
          // Create placed tiles
          for (let i = 0; i < word.length; i++) {
            const col = startCol + i;
            if (col < scrabble.BOARD_SIZE) {
              // Find the tile in the player's rack
              const tileIndex = wordObj.tileIndices[i];
              const tile = playerTiles[tileIndex];
              
              placedTiles.push({
                row: scrabble.CENTER_TILE,
                col,
                letter: tile.letter,
                value: tile.value,
                id: tile.id
              });
            }
          }
          
          // If we could place all tiles, return the move
          if (placedTiles.length === word.length) {
            return {
              placedTiles,
              tilesUsed: wordObj.tileIndices.map(index => playerTiles[index])
            };
          }
        }
      }
    }
  } else {
    // For non-first moves, try to build off existing words
    // This is a simplified version - a real bot would be more sophisticated
    
    // Find a spot on the board where we can place a word
    const boardSpots = findPotentialBoardSpots(gameState.gameBoard);
    
    if (boardSpots.length > 0) {
      // Try each spot with the bot's tiles
      for (const spot of boardSpots) {
        const { row, col, direction } = spot;
        
        // Try to form a word using the bot's tiles and the existing letter
        const possibleWords = findPossibleWordsWithConstraint(
          playerTiles, 
          gameState.gameBoard[row][col].letter,
          spot.position
        );
        
        if (possibleWords.length > 0) {
          // Sort by score potential (simplified)
          possibleWords.sort((a, b) => b.word.length - a.word.length);
          
          // Take the first valid word
          const wordObj = possibleWords[0];
          const placedTiles = [];
          
          // Create placed tiles based on direction
          if (direction === 'horizontal') {
            for (let i = 0; i < wordObj.word.length; i++) {
              const currentCol = col + i;
              
              // Skip if there's already a tile or we're off the board
              if (currentCol >= scrabble.BOARD_SIZE || 
                  gameState.gameBoard[row][currentCol].letter) {
                continue;
              }
              
              // Find the tile in the player's rack
              const tileIndex = wordObj.tileIndices[i];
              const tile = playerTiles[tileIndex];
              
              placedTiles.push({
                row,
                col: currentCol,
                letter: tile.letter,
                value: tile.value,
                id: tile.id
              });
            }
          } else { // vertical
            for (let i = 0; i < wordObj.word.length; i++) {
              const currentRow = row + i;
              
              // Skip if there's already a tile or we're off the board
              if (currentRow >= scrabble.BOARD_SIZE || 
                  gameState.gameBoard[currentRow][col].letter) {
                continue;
              }
              
              // Find the tile in the player's rack
              const tileIndex = wordObj.tileIndices[i];
              const tile = playerTiles[tileIndex];
              
              placedTiles.push({
                row: currentRow,
                col,
                letter: tile.letter,
                value: tile.value,
                id: tile.id
              });
            }
          }
          
          // If we placed at least one tile, return the move
          if (placedTiles.length > 0) {
            return {
              placedTiles,
              tilesUsed: placedTiles.map(pt => 
                playerTiles.find(t => t.id === pt.id)
              )
            };
          }
        }
      }
    }
  }
  
  // If no move was found, pass the turn
  return { pass: true };
}

/**
 * Find all possible words that can be formed from the given tiles
 * @param {Array} tiles - The player's tiles
 * @returns {Array} Array of possible words with their tile indices
 */
function findPossibleWords(tiles) {
  const possibleWords = [];
  const letters = tiles.map(t => t.letter);
  
  // For simplicity, we'll just check a few common words
  // In a real implementation, this would use a more sophisticated algorithm
  const commonWords = [
    'the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'any', 'can', 
    'had', 'her', 'was', 'one', 'our', 'out', 'day', 'get', 'has', 'him', 
    'his', 'how', 'man', 'new', 'now', 'old', 'see', 'two', 'way', 'who', 
    'boy', 'did', 'its', 'let', 'put', 'say', 'she', 'too', 'use'
  ];
  
  // Check each word to see if it can be formed from the tiles
  for (const word of commonWords) {
    if (canFormWord(letters, word)) {
      const tileIndices = getTileIndicesForWord(tiles, word);
      if (tileIndices.length === word.length) {
        possibleWords.push({
          word,
          tileIndices
        });
      }
    }
  }
  
  return possibleWords;
}

/**
 * Check if a word can be formed from the given letters
 * @param {Array} letters - Available letters
 * @param {String} word - Word to check
 * @returns {Boolean} Whether the word can be formed
 */
function canFormWord(letters, word) {
  const letterCounts = {};
  
  // Count available letters
  for (const letter of letters) {
    letterCounts[letter] = (letterCounts[letter] || 0) + 1;
  }
  
  // Check if we have enough of each letter
  for (const char of word) {
    if (!letterCounts[char]) {
      return false;
    }
    letterCounts[char]--;
  }
  
  return true;
}

/**
 * Get the indices of tiles needed to form a word
 * @param {Array} tiles - The player's tiles
 * @param {String} word - The word to form
 * @returns {Array} Indices of tiles to use
 */
function getTileIndicesForWord(tiles, word) {
  const result = [];
  const usedIndices = new Set();
  
  // For each character in the word
  for (const char of word) {
    let found = false;
    
    // Find a tile with this letter that hasn't been used yet
    for (let i = 0; i < tiles.length; i++) {
      if (!usedIndices.has(i) && tiles[i].letter.toLowerCase() === char.toLowerCase()) {
        result.push(i);
        usedIndices.add(i);
        found = true;
        break;
      }
    }
    
    // If we couldn't find a tile for this letter
    if (!found) {
      // Check for blank tiles
      for (let i = 0; i < tiles.length; i++) {
        if (!usedIndices.has(i) && tiles[i].letter === ' ') {
          result.push(i);
          usedIndices.add(i);
          found = true;
          break;
        }
      }
      
      // If still not found, we can't form the word
      if (!found) {
        return [];
      }
    }
  }
  
  return result;
}

/**
 * Find potential spots on the board where a word could be placed
 * @param {Array} gameBoard - The current game board
 * @returns {Array} Array of potential spots
 */
function findPotentialBoardSpots(gameBoard) {
  const spots = [];
  
  // Scan the board for letters with empty adjacent cells
  for (let row = 0; row < scrabble.BOARD_SIZE; row++) {
    for (let col = 0; col < scrabble.BOARD_SIZE; col++) {
      if (gameBoard[row][col].letter) {
        // Check horizontal spots
        if (col > 0 && !gameBoard[row][col-1].letter) {
          spots.push({ row, col, direction: 'horizontal', position: 'before' });
        }
        if (col < scrabble.BOARD_SIZE - 1 && !gameBoard[row][col+1].letter) {
          spots.push({ row, col, direction: 'horizontal', position: 'after' });
        }
        
        // Check vertical spots
        if (row > 0 && !gameBoard[row-1][col].letter) {
          spots.push({ row, col, direction: 'vertical', position: 'before' });
        }
        if (row < scrabble.BOARD_SIZE - 1 && !gameBoard[row+1][col].letter) {
          spots.push({ row, col, direction: 'vertical', position: 'after' });
        }
      }
    }
  }
  
  return spots;
}

/**
 * Find possible words that can be formed with the given constraint
 * @param {Array} tiles - The player's tiles
 * @param {String} constraintLetter - The letter that must be included
 * @param {String} position - Where the constraint letter is ('before' or 'after')
 * @returns {Array} Array of possible words
 */
function findPossibleWordsWithConstraint(tiles, constraintLetter, position) {
  // This is a simplified implementation
  // A real version would be much more sophisticated
  
  const possibleWords = [];
  const letters = tiles.map(t => t.letter);
  
  // Add the constraint letter
  letters.push(constraintLetter);
  
  // For simplicity, we'll just check a few common words
  const commonWords = [
    'the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'any', 'can', 
    'had', 'her', 'was', 'one', 'our', 'out', 'day', 'get', 'has', 'him', 
    'his', 'how', 'man', 'new', 'now', 'old', 'see', 'two', 'way', 'who', 
    'boy', 'did', 'its', 'let', 'put', 'say', 'she', 'too', 'use'
  ];
  
  // Check each word to see if it can be formed from the tiles
  for (const word of commonWords) {
    // Check if the word contains the constraint letter
    if (word.includes(constraintLetter.toLowerCase())) {
      if (canFormWord(letters, word)) {
        // Get indices of tiles to use (excluding the constraint letter)
        const tileIndices = [];
        const letterCounts = {};
        
        // Count available letters
        for (let i = 0; i < tiles.length; i++) {
          const letter = tiles[i].letter.toLowerCase();
          letterCounts[letter] = letterCounts[letter] || [];
          letterCounts[letter].push(i);
        }
        
        // For each character in the word
        let valid = true;
        for (const char of word.toLowerCase()) {
          if (char === constraintLetter.toLowerCase()) {
            // Skip the constraint letter (it's already on the board)
            continue;
          }
          
          if (letterCounts[char] && letterCounts[char].length > 0) {
            tileIndices.push(letterCounts[char].pop());
          } else {
            valid = false;
            break;
          }
        }
        
        if (valid) {
          possibleWords.push({
            word,
            tileIndices
          });
        }
      }
    }
  }
  
  return possibleWords;
}

module.exports = {
  generateBotMove,
  findPossibleWords,
  canFormWord,
  getTileIndicesForWord,
  findPotentialBoardSpots,
  findPossibleWordsWithConstraint
};
