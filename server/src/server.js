const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
// Bot logic removed
// Content generators removed
const scrabble = require('./utils/scrabbleLogic');
const { dictionary, isValidWord } = require('./utils/dictionary');
// Bot move generation removed
const { DEFAULT_TURN_TIME } = require('./utils/turnTimer');

require('dotenv').config();

const app = express();
const server = http.createServer(app);

const allowedOrigins = [
  "http://localhost:3000",
  "https://urban-succotash-p9rqv5qxxg5cr4v4-3000.app.github.dev",
  "https://acrophylia-5sij2fzvc-davincidreams-projects.vercel.app",
  "https://acrophylia.vercel.app",
  "https://*.vercel.app",
  "https://acrophylia-plum.vercel.app"

];

app.use(cors({
  origin: allowedOrigins,
  methods: ["GET", "POST"],
  credentials: true
}));

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true
  }
});

app.get('/', (req, res) => {
  res.send('Scrabble Game Server is running. Connect via the frontend.');
});

const rooms = new Map();

// AI code removed

// Content generation functions moved to utils/contentGenerators.js

io.on('connection', (socket) => {
  console.debug('New client connected:', socket.id);

  socket.on('createRoom', () => {
    const roomId = Math.random().toString(36).substr(2, 9);
    rooms.set(roomId, {
      name: `Room ${roomId}`, // Default name
      creatorId: socket.id,
      players: [{ id: socket.id, name: '', score: 0 }],
      gameType: 'scrabble',
      started: false,
      // Scrabble specific properties
      scrabble: {
        bonusBoard: null,         // Will be initialized when game starts
        gameBoard: null,          // Will be initialized when game starts
        tileBag: null,            // Will be initialized when game starts
        playerTiles: new Map(),   // Maps player ID to their tiles
        currentTurn: null,        // Player ID whose turn it is
        turnTimer: null,          // Timer for current turn
        moveHistory: [],          // History of moves
        isFirstMove: true,        // Whether this is the first move
        passCount: 0,             // Count of consecutive passes
        lastWords: [],            // Words formed in the last move
        lastScore: 0,             // Score from the last move
        challengedWords: new Set() // Words that have been challenged
      },
      chatMessages: [],
    });
    socket.join(roomId);
    socket.emit('roomCreated', roomId);
    io.to(roomId).emit('playerUpdate', { players: rooms.get(roomId).players, roomName: rooms.get(roomId).name });
  });

  socket.on('configureGame', ({ turnTimeLimit }) => {
    // Store the custom turn time limit in the socket for later use
    socket.turnTimeLimit = turnTimeLimit || DEFAULT_TURN_TIME;
    console.log(`Player ${socket.id} configured turn time limit to ${socket.turnTimeLimit} seconds`);
  });

  socket.on('joinRoom', ({ roomId, creatorId }) => {
    let room = rooms.get(roomId);
    if (!room) {
      room = {
        name: `Room ${roomId}`,
        creatorId: null,
        players: [],
        gameType: 'scrabble',
        started: false,
        // Scrabble specific properties
        scrabble: {
          bonusBoard: null,         // Will be initialized when game starts
          gameBoard: null,          // Will be initialized when game starts
          tileBag: null,            // Will be initialized when game starts
          playerTiles: new Map(),   // Maps player ID to their tiles
          currentTurn: null,        // Player ID whose turn it is
          turnTimer: null,          // Timer for current turn
          moveHistory: [],          // History of moves
          isFirstMove: true,        // Whether this is the first move
          passCount: 0,             // Count of consecutive passes
          lastWords: [],            // Words formed in the last move
          lastScore: 0,             // Score from the last move
          challengedWords: new Set() // Words that have been challenged
        },
        chatMessages: [],
      };
      rooms.set(roomId, room);
    }

    const isOriginalCreator = creatorId && creatorId === room.creatorId;
    const playerExists = room.players.some(player => player.id === socket.id);

    if (isOriginalCreator && room.creatorId !== socket.id) {
      const oldCreatorIndex = room.players.findIndex(p => p.id === room.creatorId);
      if (oldCreatorIndex !== -1) {
        room.players[oldCreatorIndex].id = socket.id;
        room.creatorId = socket.id;
      }
    } else if (!playerExists) {
      room.players.push({ id: socket.id, name: '', score: 0 });
    }

    if (!room.creatorId && room.players.length > 0) {
      room.creatorId = room.players[0].id;
    }

    socket.join(roomId);
    const isCreator = socket.id === room.creatorId;
    socket.emit('roomJoined', { roomId, isCreator, roomName: room.name });

    io.to(roomId).emit('playerUpdate', { players: room.players, roomName: room.name });
    if (room.started) {
      socket.emit('gameStarted');
      if (room.round > 0) {
        socket.emit('newRound', {
          roundNum: room.round,
          gameType: room.currentGameType,
          content: room.currentGameType === 'acronym' ? room.letters : room.content,
          timeLeft: room.submissionTimer
            ? Math.max(0, Math.floor((room.submissionTimer._idleStart + room.submissionTimer._idleTimeout - Date.now()) / 1000))
            : room.votingTimer
            ? Math.max(0, Math.floor((room.votingTimer._idleStart + room.votingTimer._idleTimeout - Date.now()) / 1000))
            : 0,
          category: room.category,
        });
        if (room.submissions.size > 0) {
          socket.emit('submissionsReceived', Array.from(room.submissions));
          if (room.votes.size > 0) socket.emit('votingStart');
        }
      }
    }
  });

  socket.on('setRoomName', ({ roomId, roomName }) => {
    const room = rooms.get(roomId);
    if (room && socket.id === room.creatorId && !room.started) {
      room.name = roomName.trim().substring(0, 20); // Sanitize and limit length
      io.to(roomId).emit('playerUpdate', { players: room.players, roomName: room.name });
    }
  });
  
  socket.on('setGameOptions', ({ roomId, rounds, gameTypes }) => {
    const room = rooms.get(roomId);
    if (room && socket.id === room.creatorId && !room.started) {
      // Validate rounds
      if ([3, 5, 7, 10].includes(rounds)) {
        room.totalRounds = rounds;
      }
      
      // Validate game types
      const validGameTypes = ['acronym', 'date', 'movie'];
      const selectedGameTypes = gameTypes.filter(type => validGameTypes.includes(type));
      
      // Ensure at least one game type is selected
      if (selectedGameTypes.length > 0) {
        room.gameTypes = selectedGameTypes;
      }
      
      // Emit updated game options to all clients in the room
      io.to(roomId).emit('gameOptionsUpdated', { 
        totalRounds: room.totalRounds, 
        gameTypes: room.gameTypes 
      });
    }
  });

  socket.on('setName', ({ roomId, name }) => {
    const room = rooms.get(roomId);
    if (room) {
      const player = room.players.find(p => p.id === socket.id);
      if (player) {
        player.name = name.trim().substring(0, 20);
        io.to(roomId).emit('playerUpdate', { players: room.players, roomName: room.name });
      }
    }
  });

  socket.on('startGame', (roomId) => {
    const room = rooms.get(roomId);
    if (room && room.players.length >= 2 && socket.id === room.creatorId) {
      startGame(roomId);
    } else if (room && room.players.length < 2) {
      // Inform the user they need at least 2 players
      socket.emit('chatMessage', {
        senderId: 'system',
        senderName: 'System',
        message: 'You need at least 2 players to start the game.'
      });
    }
  });

  socket.on('resetGame', (roomId) => {
    const room = rooms.get(roomId);
    if (room && socket.id === room.creatorId) {
      if (room.submissionTimer) clearInterval(room.submissionTimer);
      if (room.votingTimer) clearInterval(room.votingTimer);
      room.round = 0;
      room.letters = [];
      room.submissions.clear();
      room.votes.clear();
      room.started = false;
      room.category = '';
      room.players.forEach(player => { player.score = 0 });
      io.to(roomId).emit('playerUpdate', { players: room.players, roomName: room.name });
      io.to(roomId).emit('gameReset');
    }
  });

  socket.on('submitContent', ({ roomId, submission }) => {
    const room = rooms.get(roomId);
    if (room && room.started && room.round > 0 && !room.submissions.has(socket.id)) {
      room.submissions.set(socket.id, submission);
      if (room.submissions.size === room.players.length && room.submissionTimer) {
        clearInterval(room.submissionTimer);
        room.submissionTimer = null;
        startVoting(roomId);
      }
    }
  });

  socket.on('vote', ({ roomId, submissionId }) => {
    const room = rooms.get(roomId);
    if (room && room.started) {
      if (!room.votes.has(socket.id)) {
        room.votes.set(socket.id, submissionId);
        if (room.votes.size === room.players.length) {
          if (room.votingTimer) clearInterval(room.votingTimer);
          endVoting(roomId);
        }
      }
    }
  });

  socket.on('requestResults', (roomId) => {
    const room = rooms.get(roomId);
    if (room && room.votes.size === room.players.length) {
      const results = calculateResults(room);
      socket.emit('roundResults', results);
    }
  });

  socket.on('placeTiles', ({ roomId, placedTiles }) => {
    console.log(`Player ${socket.id} placing tiles in room ${roomId}:`, placedTiles);
    
    // Get the room and log its state for debugging
    const room = rooms.get(roomId);
    if (!room) {
      console.error(`Room ${roomId} not found for placeTiles`);
      socket.emit('moveRejected', { reason: 'Room not found' });
      return;
    }
    
    console.log(`Current turn is: ${room.scrabble.currentTurn}, Player ID: ${socket.id}`);
    console.log(`Is player's turn? ${room.scrabble.currentTurn === socket.id ? 'YES' : 'NO'}`);
    
    // Process the move and get the result
    const result = handlePlaceTiles(roomId, socket.id, placedTiles);
    
    // If the move was rejected, notify the client
    if (!result || !result.valid) {
      console.error(`Move rejected for player ${socket.id}: ${result ? result.reason : 'Unknown error'}`);
      socket.emit('moveRejected', { 
        reason: result ? result.reason : 'Move could not be processed'
      });
    } else {
      console.log(`Move accepted for player ${socket.id}`);
    }
  });
  
  socket.on('passTurn', ({ roomId }) => {
    console.log(`Player ${socket.id} passing turn in room ${roomId}`);
    handlePassTurn(roomId, socket.id);
  });
  
  socket.on('resignGame', ({ roomId }) => {
    console.log(`Player ${socket.id} resigning from game in room ${roomId}`);
    handleResignGame(roomId, socket.id);
  });
  
  socket.on('swapTiles', ({ roomId, tileIds }) => {
    const room = rooms.get(roomId);
    if (!room || !room.started || room.scrabble.currentTurn !== socket.id) {
      socket.emit('moveRejected', { reason: 'Not your turn' });
      return;
    }
    
    // Handle tile swapping
    const result = handleSwapTiles(roomId, socket.id, tileIds);
    
    if (!result.valid) {
      socket.emit('moveRejected', { reason: result.reason });
    }
  });
  
  socket.on('validateWord', ({ word }) => {
    // Check if the word is valid in our dictionary
    const result = { valid: isValidWord(word.toLowerCase()) };
    socket.emit('wordValidated', result);
  });
  
  // Handle tile synchronization request
  socket.on('requestTileSync', ({ roomId }) => {
    const room = rooms.get(roomId);
    if (!room || !room.started) {
      console.log(`Tile sync requested for non-existent or not-started room: ${roomId}`);
      return;
    }
    
    console.log(`Tile sync requested by player ${socket.id} for room ${roomId}`);
    
    // Send game state to ensure client has latest board
    socket.emit('gameStateUpdate', {
      gameBoard: room.scrabble.gameBoard,
      bonusBoard: room.scrabble.bonusBoard,
      currentTurn: room.scrabble.currentTurn,
      tilesRemaining: room.scrabble.tileBag.length,
      isFirstMove: room.scrabble.isFirstMove
    });
    
    // Send player their personal tiles
    const playerTiles = room.scrabble.playerTiles.get(socket.id) || [];
    console.log(`Syncing ${playerTiles.length} tiles to player ${socket.id}:`, 
      playerTiles.map(t => ({ id: t.id, letter: t.letter })));
    
    socket.emit('updatePlayerTiles', { tiles: playerTiles });
  });
  
  socket.on('challengeWord', ({ roomId, word }) => {
    const room = rooms.get(roomId);
    if (!room || !room.started) {
      socket.emit('challengeRejected', { reason: 'Game not in progress' });
      return;
    }
    
    // Handle word challenge
    const result = handleChallengeWord(roomId, socket.id, word);
    
    if (!result.valid) {
      socket.emit('challengeRejected', { reason: result.reason });
    }
  });

  socket.on('sendMessage', ({ roomId, message }) => {
    const room = rooms.get(roomId);
    if (room) {
      const player = room.players.find(p => p.id === socket.id);
      if (player) {
        const senderName = player.name || socket.id;
        io.to(roomId).emit('chatMessage', { senderId: socket.id, senderName, message });
      }
    }
  });

  socket.on('leaveRoom', (roomId) => {
    const room = rooms.get(roomId);
    if (room) {
      const playerIndex = room.players.findIndex(p => p.id === socket.id);
      if (playerIndex !== -1) {
        room.players.splice(playerIndex, 1);
        socket.leave(roomId);
        io.to(roomId).emit('playerUpdate', { players: room.players, roomName: room.name });
        if (socket.id === room.creatorId && room.players.length > 0) {
          room.creatorId = room.players[0].id;
          io.to(roomId).emit('creatorUpdate', room.creatorId);
        }
      }
    }
  });

  socket.on('disconnect', () => {
    rooms.forEach((room, roomId) => {
      const playerIndex = room.players.findIndex(p => p.id === socket.id);
      if (playerIndex !== -1) {
        room.players.splice(playerIndex, 1);
        io.to(roomId).emit('playerUpdate', { players: room.players, roomName: room.name });
        if (socket.id === room.creatorId && room.players.length > 0) {
          room.creatorId = room.players[0].id;
          io.to(roomId).emit('creatorUpdate', room.creatorId);
        }
      }
    });
  });
});

async function startGame(roomId) {
  const room = rooms.get(roomId);
  
  // Initialize Scrabble game
  const bonusBoard = scrabble.initializeBonusBoard();
  const tileBag = scrabble.createTileBag();
  const gameBoard = Array(scrabble.BOARD_SIZE).fill().map(() => 
    Array(scrabble.BOARD_SIZE).fill().map(() => ({ letter: null, value: 0, id: null }))
  );
  
  // Assign tiles to players with detailed logging
  room.players.forEach(player => {
    const playerTiles = scrabble.drawTiles(tileBag, 7);
    console.log(`Initial tiles for player ${player.id}:`, playerTiles.map(t => ({ id: t.id, letter: t.letter })));
    room.scrabble.playerTiles.set(player.id, playerTiles);
  });
  
  console.log('All players have been assigned tiles. Player count:', room.players.length);
  console.log('Player IDs with tiles:', Array.from(room.scrabble.playerTiles.keys()));
  
  // Set game state
  room.scrabble.bonusBoard = bonusBoard;
  room.scrabble.gameBoard = gameBoard;
  room.scrabble.tileBag = tileBag;
  room.scrabble.currentTurn = room.players[0].id; // First player starts
  room.scrabble.isFirstMove = true;
  room.scrabble.passCount = 0;
  room.started = true;
  
  // Notify clients
  io.to(roomId).emit('playerUpdate', { players: room.players, roomName: room.name });
  io.to(roomId).emit('gameStarted');
  io.to(roomId).emit('gameStateUpdate', {
    gameBoard: room.scrabble.gameBoard,
    bonusBoard: room.scrabble.bonusBoard,
    currentTurn: room.scrabble.currentTurn,
    tilesRemaining: room.scrabble.tileBag.length,
    isFirstMove: true
  });
  
  // Send each player their tiles
  room.players.forEach(player => {
    io.to(player.id).emit('updatePlayerTiles', {
      tiles: room.scrabble.playerTiles.get(player.id) || []
    });
  });
  
  // Set current turn and notify clients
  room.scrabble.currentTurn = room.players[0].id;
  
  // Immediately enable the first player to take their turn by sending these events first
  io.to(roomId).emit('turnUpdate', { 
    currentTurn: room.players[0].id,
    timeLeft: DEFAULT_TURN_TIME
  });
  
  // Add a very small delay before starting the timer to allow UI to update
  setTimeout(() => {
    // Double check the game hasn't ended
    if (room.started) {
      // Start turn timer
      startTurnTimer(roomId, room.players[0].id);
    }
  }, 100);
}

function startTurnTimer(roomId, playerId) {
  const room = rooms.get(roomId);
  if (!room || !room.started) return;
  
  // Clear any existing timer
  if (room.scrabble.turnTimer) {
    clearInterval(room.scrabble.turnTimer);
    room.scrabble.turnTimer = null;
  }
  
  // Set the current turn
  room.scrabble.currentTurn = playerId;
  console.log(`Setting current turn for room ${roomId} to player ${playerId}`);
  
  // Notify clients about whose turn it is
  io.to(roomId).emit('turnUpdate', { 
    currentTurn: playerId,
    timeLeft: DEFAULT_TURN_TIME
  });
  console.log(`Turn update emitted to all clients: currentTurn=${playerId}`);
  
  // Start the timer
  let timeLeft = DEFAULT_TURN_TIME;
  room.scrabble.turnTimer = setInterval(() => {
    timeLeft--;
    io.to(roomId).emit('turnTimeUpdate', { timeLeft });
    
    // If time is up, apply penalty and move to the next player
    if (timeLeft <= 0) {
      clearInterval(room.scrabble.turnTimer);
      room.scrabble.turnTimer = null;
      
      // Find the current player and apply penalty
      const player = room.players.find(p => p.id === playerId);
      if (player) {
        // Apply 10-point penalty
        player.score = Math.max(0, player.score - 10);
        
        // Notify clients about the time penalty
        io.to(roomId).emit('timePenalty', {
          playerId: player.id,
          playerName: player.name || player.id.substr(0, 4),
          penalty: 10
        });

        // Add to move history
        room.scrabble.moveHistory.push({
          playerId,
          playerName: player.name || player.id.substr(0, 4),
          timeOut: true,
          penalty: 10
        });

        // Update player info
        io.to(roomId).emit('playerUpdate', { 
          players: room.players, 
          roomName: room.name 
        });
        
        // Emit turnSkipped event
        io.to(roomId).emit('turnSkipped', {
          playerId,
          playerName: player.name || player.id.substr(0, 4)
        });
        
        // Increment pass count but NEVER end the game due to timeouts
        room.scrabble.passCount++;
        
        // Log consecutive turn skips but don't reset
        if (room.scrabble.passCount > 0 && room.scrabble.passCount % room.players.length === 0) {
          io.to(roomId).emit('consecutiveTurnSkip', {
            passCount: room.scrabble.passCount / room.players.length
          });
        }
      }
      
      // Find the current player index
      const currentPlayerIndex = room.players.findIndex(p => p.id === playerId);
      if (currentPlayerIndex >= 0) {
        const nextPlayerIndex = (currentPlayerIndex + 1) % room.players.length;
        const nextPlayerId = room.players[nextPlayerIndex].id;
        
        // Start the next player's turn
        // We use setTimeout to avoid possible recursion issues
        setTimeout(() => {
          // Double check the game hasn't ended
          if (room.started) {
            room.scrabble.currentTurn = nextPlayerId;
            startTurnTimer(roomId, nextPlayerId);
          }
        }, 100);
      }
    }
  }, 1000);
}

// Handle a player placing tiles
function handlePlaceTiles(roomId, playerId, placedTiles) {
  const room = rooms.get(roomId);
  
  // Log detailed information for debugging
  console.log(`handlePlaceTiles called - Room: ${roomId}, Player: ${playerId}`);
  console.log(`Room exists: ${!!room}, Game started: ${room ? room.started : false}, Current turn: ${room ? room.scrabble.currentTurn : 'N/A'}`);
  
  // Enhanced validation with detailed feedback
  if (!room) return { valid: false, reason: 'Room not found' };
  if (!room.started) return { valid: false, reason: 'Game not started' };
  if (room.scrabble.currentTurn !== playerId) {
    console.log(`Turn mismatch - Expected player: ${room.scrabble.currentTurn}, Actual player: ${playerId}`);
    return { valid: false, reason: 'Not your turn' };
  }
  
  // Get the player's tiles
  const playerTiles = room.scrabble.playerTiles.get(playerId) || [];
  
  // Log player tiles and placed tiles for debugging
  console.log('Player tiles:', playerTiles.map(t => ({ id: t.id, letter: t.letter })));
  console.log('Placed tiles:', placedTiles.map(t => ({ id: t.id, letter: t.letter })));
  
  // Even more flexible tile validation with detailed logging
  // Track which letters we've already matched to avoid duplicates
  const usedPlayerTileIndices = new Set();
  const tilesValid = placedTiles.every(placedTile => {
    console.log(`Validating placed tile: ${placedTile.letter} (${placedTile.id})`);
    
    // Try to find an exact ID match first
    const exactMatchIndex = playerTiles.findIndex(pt => pt.id === placedTile.id);
    if (exactMatchIndex !== -1 && !usedPlayerTileIndices.has(exactMatchIndex)) {
      console.log(`Found exact match at index ${exactMatchIndex}`);
      usedPlayerTileIndices.add(exactMatchIndex);
      return true;
    }
    
    // If no exact match, look for any tile with the same letter
    for (let i = 0; i < playerTiles.length; i++) {
      if (usedPlayerTileIndices.has(i)) continue; // Skip already used tiles
      
      if (playerTiles[i].letter === placedTile.letter) {
        console.log(`Found letter match at index ${i}`);
        // Update the placedTile to match the server's version for consistency
        placedTile.id = playerTiles[i].id;
        placedTile.value = playerTiles[i].value;
        usedPlayerTileIndices.add(i);
        return true;
      }
    }
    
    console.log(`No match found for ${placedTile.letter}`);
    return false;
  });
  
  if (!tilesValid) {
    console.error('Invalid tiles - player does not have these tiles');
    const playerLetters = playerTiles.map(t => t.letter).join(', ');
    return { valid: false, reason: `Invalid tiles - your rack has: ${playerLetters}` };
  }
  
  // Validate the placement
  const validationResult = scrabble.validatePlacement(
    room.scrabble.gameBoard, 
    placedTiles, 
    room.scrabble.isFirstMove
  );
  
  if (!validationResult.valid) return validationResult;
  
  // Get words formed by this move
  const formedWords = scrabble.getFormedWords(room.scrabble.gameBoard, placedTiles);
  
  // Validate words against dictionary
  const wordValidation = scrabble.validateWords(formedWords);
  
  if (!wordValidation.valid) {
    return { 
      valid: false, 
      reason: 'Invalid words', 
      invalidWords: wordValidation.invalidWords.map(w => w.word) 
    };
  }
  
  // Calculate score
  const score = scrabble.calculateScore(formedWords, room.scrabble.bonusBoard, room.scrabble.isFirstMove);
  
  // Update the game state
  
  // 1. Place tiles on the board permanently
  placedTiles.forEach(tile => {
    // Ensure we have valid coordinates
    if (tile.row >= 0 && tile.row < scrabble.BOARD_SIZE && 
        tile.col >= 0 && tile.col < scrabble.BOARD_SIZE) {
      // Update the game board with the placed tile
      room.scrabble.gameBoard[tile.row][tile.col] = {
        letter: tile.letter,
        value: tile.value,
        id: tile.id
      };
      console.log(`Placed tile ${tile.letter} at [${tile.row},${tile.col}]`);
    } else {
      console.error(`Invalid tile placement position: [${tile.row},${tile.col}]`);
    }
  });
  
  // 2. Remove used tiles from player's rack - use IDs that we synchronized above
  // Track which tiles to remove by index for better accuracy
  const tilesToRemove = new Set();
  placedTiles.forEach(placedTile => {
    const index = playerTiles.findIndex(pt => pt.id === placedTile.id);
    if (index !== -1) {
      tilesToRemove.add(index);
    }
  });
  
  const updatedTiles = playerTiles.filter((_, index) => !tilesToRemove.has(index));
  console.log(`Removed ${tilesToRemove.size} tiles from player's rack, ${updatedTiles.length} tiles remaining`);
  
  // 3. Draw new tiles
  const newTiles = scrabble.drawTiles(room.scrabble.tileBag, placedTiles.length);
  console.log(`Drew ${newTiles.length} new tiles from bag:`, newTiles.map(t => t.letter).join(', '));
  updatedTiles.push(...newTiles);
  room.scrabble.playerTiles.set(playerId, updatedTiles);
  console.log(`Player ${playerId} now has ${updatedTiles.length} tiles`);
  
  // 4. Update player score
  const player = room.players.find(p => p.id === playerId);
  player.score += score;
  
  // 5. Update game state
  room.scrabble.isFirstMove = false;
  room.scrabble.passCount = 0;
  room.scrabble.lastWords = formedWords;
  room.scrabble.lastScore = score;
  room.scrabble.moveHistory.push({
    playerId,
    playerName: player.name,
    words: formedWords.map(w => w.word),
    score,
    tiles: placedTiles
  });
  
  // Notify ALL clients about the game board update first
  io.to(roomId).emit('gameStateUpdate', {
    gameBoard: room.scrabble.gameBoard,
  });
  
  // Then send the detailed move information
  // This ensures all clients update their game boards correctly
  io.to(roomId).emit('moveMade', {
    playerId,
    playerName: player.name || player.id.substr(0, 4),
    placedTiles,  // Include the exact tiles that were placed
    words: formedWords.map(w => w.word),
    score,
    gameBoard: room.scrabble.gameBoard,  // Send the FULL updated game board
    tilesRemaining: room.scrabble.tileBag.length  // Optional: let clients know how many tiles remain
  });
  
  // Send the player their new tiles - handles rack updates
  io.to(playerId).emit('updatePlayerTiles', {
    tiles: updatedTiles
  });
  
  console.log(`Player ${playerId} successfully placed tiles and scored ${score} points with words: ${formedWords.map(w => w.word).join(', ')}`);
  
  
  // Update player info
  io.to(roomId).emit('playerUpdate', { 
    players: room.players, 
    roomName: room.name 
  });
  
  // Check if game is over
  if (checkGameEnd(room)) {
    endGame(roomId);
    return { valid: true };
  }
  
  // Move to the next player
  const nextPlayerIndex = (room.players.findIndex(p => p.id === playerId) + 1) % room.players.length;
  const nextPlayerId = room.players[nextPlayerIndex].id;
  
  // Start the next turn
  startTurnTimer(roomId, nextPlayerId);
  
  return { valid: true };
}

// Handle a player swapping tiles
function handleSwapTiles(roomId, playerId, tileIds) {
  const room = rooms.get(roomId);
  if (!room || !room.started || room.scrabble.currentTurn !== playerId) return { valid: false, reason: 'Not your turn' };
  
  // Check if there are enough tiles in the bag
  if (room.scrabble.tileBag.length < tileIds.length) {
    return { valid: false, reason: 'Not enough tiles in the bag' };
  }
  
  // Get the player's tiles
  const playerTiles = room.scrabble.playerTiles.get(playerId) || [];
  
  // Validate that the player has these tiles
  const tilesToSwap = [];
  const remainingTiles = [];
  
  playerTiles.forEach(tile => {
    if (tileIds.includes(tile.id)) {
      tilesToSwap.push(tile);
    } else {
      remainingTiles.push(tile);
    }
  });
  
  if (tilesToSwap.length !== tileIds.length) {
    return { valid: false, reason: 'Invalid tiles' };
  }
  
  // Draw new tiles
  const newTiles = scrabble.drawTiles(room.scrabble.tileBag, tilesToSwap.length);
  
  // Put the swapped tiles back in the bag and shuffle
  room.scrabble.tileBag.push(...tilesToSwap);
  room.scrabble.tileBag = scrabble.shuffleArray(room.scrabble.tileBag);
  
  // Update player's tiles
  const updatedTiles = [...remainingTiles, ...newTiles];
  room.scrabble.playerTiles.set(playerId, updatedTiles);
  
  // Add to move history
  const player = room.players.find(p => p.id === playerId);
  room.scrabble.moveHistory.push({
    playerId,
    playerName: player.name,
    swap: true,
    count: tilesToSwap.length
  });
  
  // Notify clients
  io.to(roomId).emit('tilesSwapped', { 
    playerId,
    playerName: player.name,
    count: tilesToSwap.length
  });
  
  // Send the player their new tiles
  console.log(`Sending updated tiles to player ${playerId}:`, updatedTiles.map(t => ({ id: t.id, letter: t.letter })));
  io.to(playerId).emit('updatePlayerTiles', {
    tiles: updatedTiles
  });
  
  // Log all players' current tiles for debugging
  console.log('Current player tile counts:');
  room.players.forEach(p => {
    const pTiles = room.scrabble.playerTiles.get(p.id) || [];
    console.log(`- Player ${p.id}: ${pTiles.length} tiles`);
  });
  
  // Reset pass count since this is an action
  room.scrabble.passCount = 0;
  
  // Move to the next player
  const nextPlayerIndex = (room.players.findIndex(p => p.id === playerId) + 1) % room.players.length;
  const nextPlayerId = room.players[nextPlayerIndex].id;
  
  // Start the next turn
  startTurnTimer(roomId, nextPlayerId);
  
  return { valid: true };
}

// Handle a player passing their turn
function handlePassTurn(roomId, playerId) {
  const room = rooms.get(roomId);
  if (!room || !room.started) return;
  
  // Make sure we're handling the current player's turn
  if (room.scrabble.currentTurn !== playerId) {
    return;
  }
  
  // Increment pass count
  room.scrabble.passCount++;
  
  // Add to move history
  const player = room.players.find(p => p.id === playerId);
  if (!player) return;
  
  room.scrabble.moveHistory.push({
    type: 'pass',
    playerId,
    playerName: player.name,
    passCount: room.scrabble.passCount
  });
  
  // Notify clients
  io.to(roomId).emit('turnPassed', {
    playerName: player.name || player.id.substr(0, 4),
    playerId: player.id,
    passCount: room.scrabble.passCount
  });
  
  // Check if the game should end based on tiles/bag state
  if (checkGameEnd(room)) {
    endGame(roomId);
    return;
  }
  
  // Move to the next player
  const nextPlayerIndex = (room.players.findIndex(p => p.id === playerId) + 1) % room.players.length;
  const nextPlayerId = room.players[nextPlayerIndex].id;
  
  // Start the next turn
  startTurnTimer(roomId, nextPlayerId);
}

// Check if the game should end
function checkGameEnd(room) {
  // Game ends if:
  // 1. A player has used all their tiles and the bag is empty
  // 2. A player has resigned
  
  // Check if any player has no tiles
  const emptyRack = room.players.some(player => {
    const tiles = room.scrabble.playerTiles.get(player.id) || [];
    return tiles.length === 0;
  });
  
  // Check if the bag is empty
  const emptyBag = room.scrabble.tileBag.length === 0;
  
  // Check if any player has resigned
  const hasResigned = room.scrabble.resigned || false;
  
  // Game only ends if all tiles are played or someone resigns
  return (emptyRack && emptyBag) || hasResigned;
}

// Handle word challenge
function handleChallengeWord(roomId, challengerId, word) {
  const room = rooms.get(roomId);
  if (!room || !room.started) return { valid: false, reason: 'Game not in progress' };
  
  // Check if the word has already been challenged
  if (room.scrabble.challengedWords.has(word)) {
    return { valid: false, reason: 'Word has already been challenged' };
  }
  
  // Validate the word
  const isValid = isValidWord(word.toLowerCase());
  
  // Add to challenged words
  room.scrabble.challengedWords.add(word);
  
  // Get the challenger
  const challenger = room.players.find(p => p.id === challengerId);
  
  // Apply score penalty or bonus based on challenge result
  if (isValid) {
    // Word is valid, challenger loses points
    challenger.score = Math.max(0, challenger.score - 5);
    
    // Notify clients
    io.to(roomId).emit('wordChallenged', {
      challengerId,
      challengerName: challenger.name,
      word,
      isValid: true,
      message: `${word} is a valid word. ${challenger.name} loses 5 points.`
    });
  } else {
    // Word is invalid, challenger gains points
    challenger.score += 10;
    
    // Find the last player who played this word
    let lastPlayer = null;
    for (let i = room.scrabble.moveHistory.length - 1; i >= 0; i--) {
      const move = room.scrabble.moveHistory[i];
      if (move.words && move.words.includes(word)) {
        lastPlayer = room.players.find(p => p.id === move.playerId);
        break;
      }
    }
    
    // If we found the player, they lose points
    if (lastPlayer) {
      lastPlayer.score = Math.max(0, lastPlayer.score - 10);
    }
    
    // Notify clients
    io.to(roomId).emit('wordChallenged', {
      challengerId,
      challengerName: challenger.name,
      word,
      isValid: false,
      message: `${word} is not a valid word. ${challenger.name} gains 10 points.${lastPlayer ? ` ${lastPlayer.name} loses 10 points.` : ''}`
    });
  }
  
  // Update player info
  io.to(roomId).emit('playerUpdate', { 
    players: room.players, 
    roomName: room.name 
  });
  
  return { valid: true, wordValid: isValid };
}

// Handle a player resigning from the game
function handleResignGame(roomId, playerId) {
  const room = rooms.get(roomId);
  if (!room || !room.started) return;
  
  // Mark the game as resigned
  room.scrabble.resigned = true;
  
  // Find the player who resigned
  const player = room.players.find(p => p.id === playerId);
  const playerName = player ? player.name : 'Unknown player';
  
  // Add to move history
  room.scrabble.moveHistory.push({
    playerId,
    playerName,
    resigned: true
  });
  
  // Notify clients about the resignation
  io.to(roomId).emit('playerResigned', {
    playerId,
    playerName
  });
  
  // End the game
  endGame(roomId, playerId);
}

// End the game and calculate final scores
function endGame(roomId, resignedPlayerId = null) {
  const room = rooms.get(roomId);
  if (!room) return;
  
  // Clear any timers
  if (room.scrabble.turnTimer) {
    clearInterval(room.scrabble.turnTimer);
    room.scrabble.turnTimer = null;
  }
  
  // Calculate final scores
  // In Scrabble, players lose points for unused tiles at the end
  room.players.forEach(player => {
    const tiles = room.scrabble.playerTiles.get(player.id) || [];
    const unusedPoints = tiles.reduce((sum, tile) => sum + tile.value, 0);
    
    // If a player resigned, they automatically lose (set score to 0)
    if (resignedPlayerId && player.id === resignedPlayerId) {
      player.score = 0;
    } else {
      player.score = Math.max(0, player.score - unusedPoints);
    }
  });
  
  // Find the winner(s)
  const maxScore = Math.max(...room.players.map(p => p.score));
  const winners = room.players.filter(p => p.score === maxScore);
  
  // Determine end reason
  let endReason = 'complete';
  if (resignedPlayerId) {
    endReason = 'resigned';
  }
  
  // Notify clients
  io.to(roomId).emit('gameEnd', { 
    winners,
    players: room.players,
    finalBoard: room.scrabble.gameBoard,
    endReason
  });
  
  // Reset game state for a new game
  room.started = false;
}

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT} - v1.0 with custom room name UI`);
});