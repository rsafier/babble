/**
 * Scrabble Game Logic
 * Handles board representation, tile distribution, word validation, and scoring
 */

// Board size constants
const BOARD_SIZE = 15;
const CENTER_TILE = 7; // 0-indexed, so 7 is the center (8th position)

// Bonus square types
const BONUS_TYPES = {
  NONE: 0,
  DOUBLE_LETTER: 1,
  TRIPLE_LETTER: 2,
  DOUBLE_WORD: 3,
  TRIPLE_WORD: 4,
  CENTER: 5, // Center square (counts as double word on first play)
};

// Tile point values
const TILE_VALUES = {
  A: 1,
  B: 3,
  C: 3,
  D: 2,
  E: 1,
  F: 4,
  G: 2,
  H: 4,
  I: 1,
  J: 8,
  K: 5,
  L: 1,
  M: 3,
  N: 1,
  O: 1,
  P: 3,
  Q: 10,
  R: 1,
  S: 1,
  T: 1,
  U: 1,
  V: 4,
  W: 4,
  X: 8,
  Y: 4,
  Z: 10,
  " ": 0, // Blank tile
};

// Tile distribution (how many of each letter)
const TILE_DISTRIBUTION = {
  A: 9,
  B: 2,
  C: 2,
  D: 4,
  E: 12,
  F: 2,
  G: 3,
  H: 2,
  I: 9,
  J: 1,
  K: 1,
  L: 4,
  M: 2,
  N: 6,
  O: 8,
  P: 2,
  Q: 1,
  R: 6,
  S: 4,
  T: 6,
  U: 4,
  V: 2,
  W: 2,
  X: 1,
  Y: 2,
  Z: 1,
  " ": 2, // Blank tile
};

// Initialize the bonus square layout for a standard Scrabble board
function initializeBonusBoard() {
  const board = Array(BOARD_SIZE)
    .fill()
    .map(() => Array(BOARD_SIZE).fill(BONUS_TYPES.NONE));

  // Triple Word Score
  const tripleWordSquares = [
    [0, 0],
    [0, 7],
    [0, 14],
    [7, 0],
    [7, 14],
    [14, 0],
    [14, 7],
    [14, 14],
  ];

  // Double Word Score
  const doubleWordSquares = [
    [1, 1],
    [2, 2],
    [3, 3],
    [4, 4],
    [1, 13],
    [2, 12],
    [3, 11],
    [4, 10],
    [10, 4],
    [11, 3],
    [12, 2],
    [13, 1],
    [10, 10],
    [11, 11],
    [12, 12],
    [13, 13],
  ];

  // Triple Letter Score
  const tripleLetterSquares = [
    [1, 5],
    [1, 9],
    [5, 1],
    [5, 5],
    [5, 9],
    [5, 13],
    [9, 1],
    [9, 5],
    [9, 9],
    [9, 13],
    [13, 5],
    [13, 9],
  ];

  // Double Letter Score
  const doubleLetterSquares = [
    [0, 3],
    [0, 11],
    [2, 6],
    [2, 8],
    [3, 0],
    [3, 7],
    [3, 14],
    [6, 2],
    [6, 6],
    [6, 8],
    [6, 12],
    [7, 3],
    [7, 11],
    [8, 2],
    [8, 6],
    [8, 8],
    [8, 12],
    [11, 0],
    [11, 7],
    [11, 14],
    [12, 6],
    [12, 8],
    [14, 3],
    [14, 11],
  ];

  // Set center square
  board[CENTER_TILE][CENTER_TILE] = BONUS_TYPES.CENTER;

  // Apply bonus squares
  tripleWordSquares.forEach(([row, col]) => {
    board[row][col] = BONUS_TYPES.TRIPLE_WORD;
  });

  doubleWordSquares.forEach(([row, col]) => {
    board[row][col] = BONUS_TYPES.DOUBLE_WORD;
  });

  tripleLetterSquares.forEach(([row, col]) => {
    board[row][col] = BONUS_TYPES.TRIPLE_LETTER;
  });

  doubleLetterSquares.forEach(([row, col]) => {
    board[row][col] = BONUS_TYPES.DOUBLE_LETTER;
  });

  return board;
}

// Create a new tile bag with the standard Scrabble distribution
function createTileBag() {
  const tileBag = [];

  Object.entries(TILE_DISTRIBUTION).forEach(([letter, count]) => {
    for (let i = 0; i < count; i++) {
      tileBag.push({
        letter,
        value: TILE_VALUES[letter],
        id: `${letter}_${i}`, // Unique ID for each tile
      });
    }
  });

  // Shuffle the tile bag
  return shuffleArray(tileBag);
}

// Fisher-Yates shuffle algorithm
function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Draw tiles from the bag
function drawTiles(tileBag, count) {
  if (count > tileBag.length) {
    count = tileBag.length; // Can't draw more tiles than are in the bag
  }

  const drawnTiles = tileBag.splice(0, count);
  return drawnTiles;
}

// Validate tile placement (basic validation)
function validatePlacement(board, tiles, isFirstMove) {
  // Check if tiles are placed in a line (horizontally or vertically)
  const rows = new Set(tiles.map((t) => t.row));
  const cols = new Set(tiles.map((t) => t.col));

  const isHorizontal = rows.size === 1;
  const isVertical = cols.size === 1;

  if (!isHorizontal && !isVertical) {
    return { valid: false, reason: "Tiles must be placed in a straight line" };
  }

  // Check if tiles are connected (no gaps)
  if (isHorizontal) {
    const row = [...rows][0];
    const colValues = [...tiles].map((t) => t.col).sort((a, b) => a - b);

    for (let i = colValues[0]; i <= colValues[colValues.length - 1]; i++) {
      if (!tiles.some((t) => t.col === i) && !board[row][i].letter) {
        return { valid: false, reason: "Tiles must be connected (no gaps)" };
      }
    }
  } else {
    // isVertical
    const col = [...cols][0];
    const rowValues = [...tiles].map((t) => t.row).sort((a, b) => a - b);

    for (let i = rowValues[0]; i <= rowValues[rowValues.length - 1]; i++) {
      if (!tiles.some((t) => t.row === i) && !board[i][col].letter) {
        return { valid: false, reason: "Tiles must be connected (no gaps)" };
      }
    }
  }

  // Check if first move includes center tile
  if (isFirstMove) {
    if (!tiles.some((t) => t.row === CENTER_TILE && t.col === CENTER_TILE)) {
      return {
        valid: false,
        reason: "First move must include the center tile",
      };
    }
  } else {
    // Check if tiles connect to existing tiles on the board
    // This is a simplified check - a more robust implementation would check all adjacent tiles
    let connected = false;
    for (const tile of tiles) {
      const { row, col } = tile;

      // Check adjacent cells (up, down, left, right)
      const adjacentCells = [
        { row: row - 1, col },
        { row: row + 1, col },
        { row, col: col - 1 },
        { row, col: col + 1 },
      ];

      for (const cell of adjacentCells) {
        if (
          cell.row >= 0 &&
          cell.row < BOARD_SIZE &&
          cell.col >= 0 &&
          cell.col < BOARD_SIZE &&
          board[cell.row][cell.col].letter &&
          !tiles.some((t) => t.row === cell.row && t.col === cell.col)
        ) {
          connected = true;
          break;
        }
      }

      if (connected) break;
    }

    if (!connected) {
      return {
        valid: false,
        reason: "New tiles must connect to existing tiles on the board",
      };
    }
  }

  return { valid: true };
}

// Get all words formed by a move
function getFormedWords(board, placedTiles) {
  const words = [];
  const boardWithNewTiles = JSON.parse(JSON.stringify(board));

  // Add placed tiles to the board copy
  placedTiles.forEach((tile) => {
    boardWithNewTiles[tile.row][tile.col] = { ...tile };
  });

  // Check if tiles are placed horizontally or vertically
  const rows = new Set(placedTiles.map((t) => t.row));
  const cols = new Set(placedTiles.map((t) => t.col));

  const isHorizontal = rows.size === 1;
  const isVertical = cols.size === 1;

  // Get the main word formed by the placed tiles
  if (isHorizontal) {
    const row = [...rows][0];
    let minCol = 0;
    let maxCol = BOARD_SIZE - 1;

    // Find the start of the word
    while (minCol < BOARD_SIZE && !boardWithNewTiles[row][minCol].letter) {
      minCol++;
    }

    // Find the end of the word
    while (maxCol >= 0 && !boardWithNewTiles[row][maxCol].letter) {
      maxCol--;
    }

    // Extract the word
    if (maxCol >= minCol) {
      const word = {
        word: "",
        tiles: [],
        start: { row, col: minCol },
        end: { row, col: maxCol },
        direction: "horizontal",
      };

      for (let col = minCol; col <= maxCol; col++) {
        if (boardWithNewTiles[row][col].letter) {
          word.word += boardWithNewTiles[row][col].letter;
          word.tiles.push({ ...boardWithNewTiles[row][col], row, col });
        } else {
          // If there's a gap, this is not a valid word
          break;
        }
      }

      if (word.word.length > 1) {
        words.push(word);
      }
    }

    // Check for vertical words formed by each placed tile
    placedTiles.forEach((placedTile) => {
      const { row, col } = placedTile;
      let minRow = 0;
      let maxRow = BOARD_SIZE - 1;

      // Find the start of the word
      while (minRow < BOARD_SIZE && !boardWithNewTiles[minRow][col].letter) {
        minRow++;
      }

      // Find the end of the word
      while (maxRow >= 0 && !boardWithNewTiles[maxRow][col].letter) {
        maxRow--;
      }

      // Extract the word
      if (maxRow >= minRow && maxRow !== minRow) {
        // Word must be at least 2 letters
        const word = {
          word: "",
          tiles: [],
          start: { row: minRow, col },
          end: { row: maxRow, col },
          direction: "vertical",
        };

        for (let r = minRow; r <= maxRow; r++) {
          if (boardWithNewTiles[r][col].letter) {
            word.word += boardWithNewTiles[r][col].letter;
            word.tiles.push({ ...boardWithNewTiles[r][col], row: r, col });
          } else {
            // If there's a gap, this is not a valid word
            break;
          }
        }

        if (word.word.length > 1) {
          words.push(word);
        }
      }
    });
  } else if (isVertical) {
    const col = [...cols][0];
    let minRow = 0;
    let maxRow = BOARD_SIZE - 1;

    // Find the start of the word
    while (minRow < BOARD_SIZE && !boardWithNewTiles[minRow][col].letter) {
      minRow++;
    }

    // Find the end of the word
    while (maxRow >= 0 && !boardWithNewTiles[maxRow][col].letter) {
      maxRow--;
    }

    // Extract the word
    if (maxRow >= minRow) {
      const word = {
        word: "",
        tiles: [],
        start: { row: minRow, col },
        end: { row: maxRow, col },
        direction: "vertical",
      };

      for (let row = minRow; row <= maxRow; row++) {
        if (boardWithNewTiles[row][col].letter) {
          word.word += boardWithNewTiles[row][col].letter;
          word.tiles.push({ ...boardWithNewTiles[row][col], row, col });
        } else {
          // If there's a gap, this is not a valid word
          break;
        }
      }

      if (word.word.length > 1) {
        words.push(word);
      }
    }

    // Check for horizontal words formed by each placed tile
    placedTiles.forEach((placedTile) => {
      const { row, col } = placedTile;
      let minCol = 0;
      let maxCol = BOARD_SIZE - 1;

      // Find the start of the word
      while (minCol < BOARD_SIZE && !boardWithNewTiles[row][minCol].letter) {
        minCol++;
      }

      // Find the end of the word
      while (maxCol >= 0 && !boardWithNewTiles[row][maxCol].letter) {
        maxCol--;
      }

      // Extract the word
      if (maxCol >= minCol && maxCol !== minCol) {
        // Word must be at least 2 letters
        const word = {
          word: "",
          tiles: [],
          start: { row, col: minCol },
          end: { row, col: maxCol },
          direction: "horizontal",
        };

        for (let c = minCol; c <= maxCol; c++) {
          if (boardWithNewTiles[row][c].letter) {
            word.word += boardWithNewTiles[row][c].letter;
            word.tiles.push({ ...boardWithNewTiles[row][c], row, col: c });
          } else {
            // If there's a gap, this is not a valid word
            break;
          }
        }

        if (word.word.length > 1) {
          words.push(word);
        }
      }
    });
  }

  return words;
}

// Calculate score for a move
function calculateScore(words, bonusBoard, isFirstMove) {
  let totalScore = 0;
  const usedBonuses = new Set(); // Track which bonus squares have been used

  words.forEach((word) => {
    let wordScore = 0;
    let wordMultiplier = 1;

    word.tiles.forEach((tile) => {
      const { row, col, value } = tile;
      let letterScore = value;
      const bonusType = bonusBoard[row][col];
      const bonusKey = `${row},${col}`;

      // Check if this is a newly placed tile (bonus applies)
      if (!usedBonuses.has(bonusKey)) {
        usedBonuses.add(bonusKey);

        // Apply letter multipliers
        if (bonusType === BONUS_TYPES.DOUBLE_LETTER) {
          letterScore *= 2;
        } else if (bonusType === BONUS_TYPES.TRIPLE_LETTER) {
          letterScore *= 3;
        } else if (bonusType === BONUS_TYPES.DOUBLE_WORD) {
          wordMultiplier *= 2;
        } else if (bonusType === BONUS_TYPES.TRIPLE_WORD) {
          wordMultiplier *= 3;
        } else if (bonusType === BONUS_TYPES.CENTER && isFirstMove) {
          wordMultiplier *= 2; // Center square counts as double word on first move
        }
      }

      wordScore += letterScore;
    });

    // Apply word multiplier
    wordScore *= wordMultiplier;
    totalScore += wordScore;
  });

  // Bonus for using all 7 tiles (50 points)
  if (usedBonuses.size === 7) {
    totalScore += 50;
  }

  return totalScore;
}

// Simple dictionary for word validation (to be expanded)
const dictionary = new Set([
  // Common words for testing
  "the",
  "of",
  "and",
  "a",
  "to",
  "in",
  "is",
  "you",
  "that",
  "it",
  "he",
  "was",
  "for",
  "on",
  "are",
  "as",
  "with",
  "his",
  "they",
  "at",
  "be",
  "this",
  "have",
  "from",
  "or",
  "one",
  "had",
  "by",
  "word",
  "but",
  "not",
  "what",
  "all",
  "were",
  "we",
  "when",
  "your",
  "can",
  "said",
  "there",
  "use",
  "an",
  "each",
  "which",
  "she",
  "do",
  "how",
  "their",
  "if",
  "will",
  "up",
  "other",
  "about",
  "out",
  "many",
  "then",
  "them",
  "these",
  "so",
  "some",
  "her",
  "would",
  "make",
  "like",
  "him",
  "into",
  "time",
  "has",
  "look",
  "two",
  "more",
  "write",
  "go",
  "see",
  "number",
  "no",
  "way",
  "could",
  "people",
  "my",
  "than",
  "first",
  "water",
  "been",
  "call",
  "who",
  "oil",
  "its",
  "now",
  "find",
  "long",
  "down",
  "day",
  "did",
  "get",
  "come",
  "made",
  "may",
  "part",
  "over",
  "new",
  "sound",
  "take",
  "only",
  "little",
  "work",
  "know",
  "place",
  "year",
  "live",
  "me",
  "back",
  "give",
  "most",
  "very",
  "after",
  "thing",
  "our",
  "just",
  "name",
  "good",
  "sentence",
  "man",
  "think",
  "say",
  "great",
  "where",
  "help",
  "through",
  "much",
  "before",
  "line",
  "right",
  "too",
  "mean",
  "old",
  "any",
  "same",
  "tell",
  "boy",
  "follow",
  "came",
  "want",
  "show",
  "also",
  "around",
  "form",
  "three",
  "small",
  "set",
  "put",
  "end",
  "does",
  "another",
  "well",
  "large",
  "must",
  "big",
  "even",
  "such",
  "because",
  "turn",
  "here",
  "why",
  "ask",
  "went",
  "men",
  "read",
  "need",
  "land",
  "different",
  "home",
  "us",
  "move",
  "try",
  "kind",
  "hand",
  "picture",
  "again",
  "change",
  "off",
  "play",
  "spell",
  "air",
  "away",
  "animal",
  "house",
  "point",
  "page",
  "letter",
  "mother",
  "answer",
  "found",
  "study",
  "still",
  "learn",
  "should",
  "america",
  "world",
]);

// Validate words against the dictionary
function validateWords(words) {
  const invalidWords = [];

  words.forEach((wordObj) => {
    const word = wordObj.word.toLowerCase();
    if (!dictionary.has(word)) {
      invalidWords.push(wordObj);
    }
  });

  return {
    valid: true || invalidWords.length === 0,
    invalidWords: [],
  };
}

// Initialize a new game state
function initializeGame(players) {
  const bonusBoard = initializeBonusBoard();
  const tileBag = createTileBag();

  // Initialize the game board (empty)
  const gameBoard = Array(BOARD_SIZE)
    .fill()
    .map(() =>
      Array(BOARD_SIZE)
        .fill()
        .map(() => ({ letter: null, value: 0, id: null }))
    );

  // Assign initial tiles to players
  const playerStates = {};
  players.forEach((player) => {
    playerStates[player.id] = {
      id: player.id,
      name: player.name,
      score: 0,
      tiles: drawTiles(tileBag, 7),
      isBot: player.isBot || false,
    };
  });

  return {
    bonusBoard,
    gameBoard,
    tileBag,
    players: playerStates,
    currentTurn: players[0].id, // First player starts
    moveHistory: [],
    isFirstMove: true,
    gameOver: false,
  };
}

module.exports = {
  BOARD_SIZE,
  CENTER_TILE,
  BONUS_TYPES,
  TILE_VALUES,
  initializeBonusBoard,
  createTileBag,
  drawTiles,
  validatePlacement,
  getFormedWords,
  calculateScore,
  validateWords,
  initializeGame,
  dictionary,
};
