import React, { useState, useEffect } from 'react';
import ScrabbleBoard from './ScrabbleBoard';

const ScrabbleGame = ({ 
  socket, 
  roomId, 
  playerId,
  gameState,
  setGameState
}) => {
  const [playerTiles, setPlayerTiles] = useState([]);
  const [gameBoard, setGameBoard] = useState(null);
  const [bonusBoard, setBonusBoard] = useState(null);
  const [currentTurn, setCurrentTurn] = useState(null);
  const [tilesRemaining, setTilesRemaining] = useState(0);
  const [isFirstMove, setIsFirstMove] = useState(true);
  const [lastMove, setLastMove] = useState(null);
  const [timeLeft, setTimeLeft] = useState(null);
  const [gameLog, setGameLog] = useState([]);
  const [errorMessage, setErrorMessage] = useState(null);
  // Removed challenge word state

  // Set up socket event listeners
  useEffect(() => {
    if (!socket || !roomId || !playerId) return;
    
    // Initialize default boards if needed
    initializeDefaultBoards();
    
    // Request tile synchronization when joining
    console.log('Requesting tile sync on component mount');
    socket.emit('requestTileSync', { roomId });

    // Listen for game state updates
    socket.on('gameStateUpdate', (data) => {
      console.log('Game state update received:', data);
      if (data.gameBoard) {
        console.log('Setting game board from update');
        setGameBoard(data.gameBoard);
      }
      if (data.bonusBoard) setBonusBoard(data.bonusBoard);
      if (data.currentTurn) setCurrentTurn(data.currentTurn);
      if (data.tilesRemaining !== undefined) setTilesRemaining(data.tilesRemaining);
      if (data.isFirstMove !== undefined) setIsFirstMove(data.isFirstMove);
      
      // Add initial game log entry if this is the first update
      if (!gameLog.length) {
        setGameLog([{
          type: 'info',
          message: 'Game has started. Place tiles to form words and score points!'
        }]);
      }
    });

    // Listen for player tiles updates
    socket.on('updatePlayerTiles', (data) => {
      console.log('Received updated tiles from server:', data.tiles);
      console.log('Updated player tiles:', data.tiles);
      console.log('Player tiles length:', data.tiles.length);
      setPlayerTiles(data.tiles);
    });

    // Listen for turn updates
    socket.on('turnUpdate', (data) => {
      console.log('Turn update received:', data);
      setCurrentTurn(data.currentTurn);
      setTimeLeft(data.timeLeft);
      
      // Add to game log
      const isMyTurn = data.currentTurn === playerId;
      setGameLog(prev => [
        ...prev, 
        {
          type: 'turn',
          message: isMyTurn ? 'It\'s your turn!' : `It's ${getPlayerName(data.currentTurn)}'s turn`
        }
      ]);

      // Clear any error messages
      setErrorMessage(null);
    });
    
    // Listen for time penalty events
    socket.on('timePenalty', (data) => {
      console.log('Time penalty received:', data);
      
      // Add to game log
      setGameLog(prev => [
        ...prev, 
        {
          type: 'penalty',
          playerName: data.playerName,
          penalty: data.penalty,
          message: `${data.playerName} ran out of time and lost ${data.penalty} points!`
        }
      ]);
    });
    
    // Listen for player resignation events
    socket.on('playerResigned', (data) => {
      console.log('Player resigned:', data);
      
      // Add to game log
      setGameLog(prev => [
        ...prev, 
        {
          type: 'resign',
          playerName: data.playerName,
          message: `${data.playerName} resigned from the game!`
        }
      ]);
    });

    // Listen for time updates
    socket.on('turnTimeUpdate', (data) => {
      setTimeLeft(data.timeLeft);
    });

    // Listen for move made
    socket.on('moveMade', (data) => {
      console.log('Move made event received:', data);
      
      // Update the game board with the new state from server
      // This ensures tiles are permanently added to the board
      setGameBoard(data.gameBoard);
      
      // Store the last move details
      setLastMove({
        playerId: data.playerId,
        playerName: data.playerName,
        words: data.words,
        score: data.score,
        placedTiles: data.placedTiles // Store the placed tiles
      });
      
      // Add to game log with more details for better feedback
      setGameLog(prev => [
        ...prev, 
        {
          type: 'move',
          playerName: data.playerName,
          words: data.words,
          score: data.score,
          message: `${data.playerName} played ${data.words.join(', ')} for ${data.score} points`
        }
      ]);
      
      // Reset local tile state if this was our move
      if (data.playerId === playerId) {
        // The server will also send updated tiles via updatePlayerTiles event
        console.log('My move was accepted by the server');
      }
    });

    // Listen for tiles swapped
    socket.on('tilesSwapped', (data) => {
      // Add to game log
      setGameLog(prev => [
        ...prev, 
        {
          type: 'swap',
          playerName: data.playerName,
          count: data.count
        }
      ]);
    });

    // Listen for turn passed
    socket.on('turnPassed', (data) => {
      // Add to game log
      setGameLog(prev => [
        ...prev, 
        {
          type: 'pass',
          playerName: data.playerName,
          passCount: data.passCount
        }
      ]);
    });

    // Listen for word challenged
    socket.on('wordChallenged', (data) => {
      // Add to game log
      setGameLog(prev => [
        ...prev, 
        {
          type: 'challenge',
          challengerName: data.challengerName,
          word: data.word,
          isValid: data.isValid,
          message: data.message
        }
      ]);
    });

    // Listen for move rejected
    socket.on('moveRejected', (data) => {
      console.error('Move rejected:', data);
      setErrorMessage(data.reason);
      
      // Add to game log for better visibility
      setGameLog(prev => [
        ...prev, 
        {
          type: 'error',
          message: `Move rejected: ${data.reason}`
        }
      ]);
    });

    // Cleanup
    return () => {
      socket.off('gameStateUpdate');
      socket.off('updatePlayerTiles');
      socket.off('turnUpdate');
      socket.off('turnTimeUpdate');
      socket.off('moveMade');
      socket.off('tilesSwapped');
      socket.off('turnPassed');
      socket.off('wordChallenged');
      socket.off('moveRejected');
    };
  }, [socket, playerId]);

  // Helper function to get player name
  const getPlayerName = (id) => {
    const player = gameState.players.find(p => p.id === id);
    return player ? player.name || 'Player' : 'Unknown Player';
  };

  // Handle placing tiles
  const handlePlaceTiles = (placedTiles) => {
    if (!socket || !roomId) return;
    
    console.log('Placing tiles:', placedTiles);
    
    // Send the placed tiles to the server
    // The server will validate, update the game state, and respond with moveMade event
    socket.emit('placeTiles', { roomId, placedTiles });
    
    // We'll get confirmation and game state update via the moveMade event
    // The updatePlayerTiles event will give us our new tiles
  };

  // Handle swapping tiles
  const handleSwapTiles = (tileIds) => {
    if (!socket || !roomId || currentTurn !== playerId) return;
    
    socket.emit('swapTiles', { roomId, tileIds });
  };

  // Handle passing turn
  const handlePassTurn = () => {
    if (!socket || !roomId) return;
    
    socket.emit('passTurn', { roomId });
  };

  const handleResignGame = () => {
    if (!socket || !roomId) return;
    
    if (window.confirm('Are you sure you want to resign? You will forfeit the game.')) {
      socket.emit('resignGame', { roomId });
    }
  };

  // Handle word validation
  const handleValidateWord = (word) => {
    if (!socket) return;
    
    socket.emit('validateWord', { word });
  };

  // Initialize a default board if none is provided yet
  useEffect(() => {
    if (!gameBoard) {
      // Create an empty 15x15 game board
      const emptyBoard = Array(15).fill().map(() => Array(15).fill().map(() => ({ letter: null })));
      setGameBoard(emptyBoard);
    }
    
    if (!bonusBoard) {
      // Create default bonus board
      const defaultBonusBoard = [
        [4, 0, 0, 1, 0, 0, 0, 4, 0, 0, 0, 1, 0, 0, 4], // Row 0
        [0, 3, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 3, 0], // Row 1
        [0, 0, 3, 0, 0, 0, 1, 0, 1, 0, 0, 0, 3, 0, 0], // Row 2
        [1, 0, 0, 3, 0, 0, 0, 1, 0, 0, 0, 3, 0, 0, 1], // Row 3
        [0, 0, 0, 0, 3, 0, 0, 0, 0, 0, 3, 0, 0, 0, 0], // Row 4
        [0, 2, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 2, 0], // Row 5
        [0, 0, 1, 0, 0, 0, 1, 0, 1, 0, 0, 0, 1, 0, 0], // Row 6
        [4, 0, 0, 1, 0, 0, 0, 5, 0, 0, 0, 1, 0, 0, 4], // Row 7 (center)
        [0, 0, 1, 0, 0, 0, 1, 0, 1, 0, 0, 0, 1, 0, 0], // Row 8
        [0, 2, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 2, 0], // Row 9
        [0, 0, 0, 0, 3, 0, 0, 0, 0, 0, 3, 0, 0, 0, 0], // Row 10
        [1, 0, 0, 3, 0, 0, 0, 1, 0, 0, 0, 3, 0, 0, 1], // Row 11
        [0, 0, 3, 0, 0, 0, 1, 0, 1, 0, 0, 0, 3, 0, 0], // Row 12
        [0, 3, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 3, 0], // Row 13
        [4, 0, 0, 1, 0, 0, 0, 4, 0, 0, 0, 1, 0, 0, 4]  // Row 14
      ];
      setBonusBoard(defaultBonusBoard);
    }
  }, [gameBoard, bonusBoard]);

  // Generate random tiles if none are provided by the server
  useEffect(() => {
    if (playerTiles.length === 0) {
      // Generate random tiles with proper letter distribution and values
      const letterDistribution = {
        'A': { count: 9, value: 1 },
        'B': { count: 2, value: 3 },
        'C': { count: 2, value: 3 },
        'D': { count: 4, value: 2 },
        'E': { count: 12, value: 1 },
        'F': { count: 2, value: 4 },
        'G': { count: 3, value: 2 },
        'H': { count: 2, value: 4 },
        'I': { count: 9, value: 1 },
        'J': { count: 1, value: 8 },
        'K': { count: 1, value: 5 },
        'L': { count: 4, value: 1 },
        'M': { count: 2, value: 3 },
        'N': { count: 6, value: 1 },
        'O': { count: 8, value: 1 },
        'P': { count: 2, value: 3 },
        'Q': { count: 1, value: 10 },
        'R': { count: 6, value: 1 },
        'S': { count: 4, value: 1 },
        'T': { count: 6, value: 1 },
        'U': { count: 4, value: 1 },
        'V': { count: 2, value: 4 },
        'W': { count: 2, value: 4 },
        'X': { count: 1, value: 8 },
        'Y': { count: 2, value: 4 },
        'Z': { count: 1, value: 10 }
      };
      
      // Create a pool of letters based on distribution
      let letterPool = [];
      Object.entries(letterDistribution).forEach(([letter, { count, value }]) => {
        for (let i = 0; i < count; i++) {
          letterPool.push({ letter, value });
        }
      });
      
      // Shuffle the pool
      letterPool = letterPool.sort(() => Math.random() - 0.5);
      
      // Take 7 tiles for the player
      const randomTiles = [];
      for (let i = 0; i < 7; i++) {
        if (letterPool.length > 0) {
          const { letter, value } = letterPool.pop();
          randomTiles.push({
            id: `tile-${Date.now()}-${i}`,
            letter,
            value
          });
        }
      }
      
      setPlayerTiles(randomTiles);
      console.log('Generated random tiles:', randomTiles);
    }
  }, [playerTiles]);

  // Initialize default game board and bonus board if they don't exist yet
  useEffect(() => {
    // If we have player tiles but no game board, the game has started but the board isn't initialized
    if (playerTiles.length > 0 && (!gameBoard || !bonusBoard)) {
      console.log('Initializing default game board');
      initializeDefaultBoards();
    }
  }, [playerTiles, gameBoard, bonusBoard]);
  
  // Function to initialize default boards
  const initializeDefaultBoards = () => {
    if (!gameBoard) {
      // Create an empty 15x15 game board
      const emptyBoard = Array(15).fill().map(() => Array(15).fill().map(() => ({ letter: null })));
      setGameBoard(emptyBoard);
    }
    
    if (!bonusBoard) {
      // Create default bonus board
      const defaultBonusBoard = [
        [4, 0, 0, 1, 0, 0, 0, 4, 0, 0, 0, 1, 0, 0, 4], // Row 0
        [0, 3, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 3, 0], // Row 1
        [0, 0, 3, 0, 0, 0, 1, 0, 1, 0, 0, 0, 3, 0, 0], // Row 2
        [1, 0, 0, 3, 0, 0, 0, 1, 0, 0, 0, 3, 0, 0, 1], // Row 3
        [0, 0, 0, 0, 3, 0, 0, 0, 0, 0, 3, 0, 0, 0, 0], // Row 4
        [0, 2, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 2, 0], // Row 5
        [0, 0, 1, 0, 0, 0, 1, 0, 1, 0, 0, 0, 1, 0, 0], // Row 6
        [4, 0, 0, 1, 0, 0, 0, 5, 0, 0, 0, 1, 0, 0, 4], // Row 7 (center)
        [0, 0, 1, 0, 0, 0, 1, 0, 1, 0, 0, 0, 1, 0, 0], // Row 8
        [0, 2, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 2, 0], // Row 9
        [0, 0, 0, 0, 3, 0, 0, 0, 0, 0, 3, 0, 0, 0, 0], // Row 10
        [1, 0, 0, 3, 0, 0, 0, 1, 0, 0, 0, 3, 0, 0, 1], // Row 11
        [0, 0, 3, 0, 0, 0, 1, 0, 1, 0, 0, 0, 3, 0, 0], // Row 12
        [0, 3, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 3, 0], // Row 13
        [4, 0, 0, 1, 0, 0, 0, 4, 0, 0, 0, 1, 0, 0, 4]  // Row 14
      ];
      setBonusBoard(defaultBonusBoard);
    }
  };
  
  // Render a loading state if game board is still not available after initialization
  if (!gameBoard || !bonusBoard) {
    return (
      <div className="scrabble-loading">
        <h3>Loading Scrabble Board...</h3>
      </div>
    );
  }

  // Word to challenge state is initialized at the top with other state variables

  return (
    <div className="scrabble-game-container">
      {errorMessage && (
        <div className="error-message">
          {errorMessage}
        </div>
      )}
      
      <div className="game-info">
        <div className="turn-info">
          <h3 className="turn-indicator">
            {currentTurn === playerId 
              ? "YOUR TURN" 
              : currentTurn 
                ? `${getPlayerName(currentTurn).toUpperCase()}'S TURN` 
                : playerTiles.length > 0
                  ? "GAME IN PROGRESS..." 
                  : "WAITING FOR GAME TO START..."}
          </h3>
          {timeLeft !== null && (
            <div className="timer">Time: {timeLeft}s</div>
          )}
        </div>
        
        <div className="game-stats">
          <div className="tiles-remaining">
            Tiles Remaining: {tilesRemaining || 100}
          </div>
        </div>
      </div>
      
      {/* Scoreboard */}
      <div className="scoreboard">
        <h3 className="scoreboard-title">SCOREBOARD</h3>
        <div className="scoreboard-players">
          {gameState.players.sort((a, b) => b.score - a.score).map(player => (
            <div 
              key={player.id} 
              className={`scoreboard-player ${player.id === currentTurn ? 'current-player' : ''} ${player.id === playerId ? 'my-player' : ''}`}
            >
              <div className="player-name">{player.name || `Player ${player.id.substring(0, 4)}`}</div>
              <div className="player-score">{player.score}</div>
              {player.id === currentTurn && <div className="player-turn-indicator">→</div>}
            </div>
          ))}
        </div>
      </div>
      
      <ScrabbleBoard
        gameBoard={gameBoard}
        bonusBoard={bonusBoard}
        playerTiles={playerTiles}
        isMyTurn={currentTurn === playerId}
        onPlaceTiles={handlePlaceTiles}
        onSwapTiles={handleSwapTiles}
        onPassTurn={handlePassTurn}
        onResignGame={handleResignGame}
      />
      
      {/* Challenge word UI removed as requested */}
      
      {/* Show only the most recent game log entry */}
      {gameLog.length > 0 && (
        <div className="recent-action">
          {(() => {
            const entry = gameLog[gameLog.length - 1];
            if (entry.type === 'turn') {
              return <span>{entry.message}</span>;
            } else if (entry.type === 'move') {
              return <span><strong>{entry.playerName}</strong> played {entry.words?.join(', ') || 'a word'} for {entry.score} points</span>;
            } else if (entry.type === 'swap') {
              return <span><strong>{entry.playerName}</strong> swapped {entry.count} tiles</span>;
            } else if (entry.type === 'pass') {
              return <span><strong>{entry.playerName}</strong> passed their turn{entry.passCount > 1 && ` (${entry.passCount} consecutive passes)`}</span>;
            } else if (entry.type === 'challenge') {
              return <span><strong>{entry.challengerName}</strong> challenged "{entry.word}". {entry.message}</span>;
            } else if (entry.type === 'penalty') {
              return <span><strong>{entry.playerName}</strong> ran out of time and lost {entry.penalty} points!</span>;
            } else if (entry.type === 'resign') {
              return <span><strong>{entry.playerName}</strong> resigned from the game!</span>;
            }
            return null;
          })()}
        </div>
      )}
    </div>
  );
};

export default ScrabbleGame;
