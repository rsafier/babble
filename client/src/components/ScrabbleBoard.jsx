import React, { useState, useEffect } from 'react';
import TileRack from './TileRack';

const BOARD_SIZE = 15;

const ScrabbleBoard = ({ 
  gameBoard, 
  bonusBoard, 
  playerTiles, 
  isMyTurn, 
  onPlaceTiles,
  onSwapTiles,
  onPassTurn,
  onResignGame
}) => {
  const [selectedTile, setSelectedTile] = useState(null);
  const [placedTiles, setPlacedTiles] = useState([]);
  const [selectedRackTiles, setSelectedRackTiles] = useState([]);
  const [draggedTile, setDraggedTile] = useState(null);
  
  // Reset placed tiles when it's not the player's turn
  useEffect(() => {
    if (!isMyTurn) {
      setPlacedTiles([]);
      setSelectedRackTiles([]);
    }
  }, [isMyTurn]);
  
  // Get the bonus type name for styling
  const getBonusName = (bonusType) => {
    switch (bonusType) {
      case 1: return 'double-letter';
      case 2: return 'triple-letter';
      case 3: return 'double-word';
      case 4: return 'triple-word';
      case 5: return 'center';
      default: return '';
    }
  };
  
  // Handle clicking on a board cell
  const handleCellClick = (row, col) => {
    if (!isMyTurn) return;
    
    // If there's already a permanent tile in this cell, do nothing
    if (gameBoard[row][col].letter) return;
    
    // If there's a placed tile in this cell, remove it
    const existingPlacedTileIndex = placedTiles.findIndex(
      tile => tile.row === row && tile.col === col
    );
    
    if (existingPlacedTileIndex !== -1) {
      // Remove the tile from placed tiles and add it back to the rack
      const removedTile = placedTiles[existingPlacedTileIndex];
      setPlacedTiles(placedTiles.filter((_, index) => index !== existingPlacedTileIndex));
      
      // Find the tile in selected rack tiles and remove it
      const tileIndex = selectedRackTiles.findIndex(t => t.id === removedTile.id);
      if (tileIndex !== -1) {
        setSelectedRackTiles(selectedRackTiles.filter((_, index) => index !== tileIndex));
      }
      return;
    }
    
    // If we have a selected tile from the rack, place it
    if (selectedTile) {
      console.log(`Placing tile ${selectedTile.letter} at position [${row},${col}]`);
      const newPlacedTile = {
        ...selectedTile,
        row,
        col
      };
      
      setPlacedTiles([...placedTiles, newPlacedTile]);
      setSelectedRackTiles([...selectedRackTiles, selectedTile]);
      setSelectedTile(null);
    }
  };
  
  // Handle drag start from rack
  const handleTileDragStart = (tile) => {
    setDraggedTile(tile);
  };
  
  // Handle drag over for board cells
  const handleCellDragOver = (e, row, col) => {
    e.preventDefault();
    // Only allow dropping if the cell is empty
    if (!gameBoard[row][col].letter && !placedTiles.some(t => t.row === row && t.col === col)) {
      e.dataTransfer.dropEffect = 'move';
      // Add visual indicator for valid drop target
      e.currentTarget.classList.add('drag-over');
    } else {
      e.dataTransfer.dropEffect = 'none';
    }
  };
  
  // Handle drag leave
  const handleCellDragLeave = (e) => {
    // Remove visual indicator
    e.currentTarget.classList.remove('drag-over');
  };
  
  // Handle drop on board cell
  const handleCellDrop = (e, row, col) => {
    e.preventDefault();
    e.currentTarget.classList.remove('drag-over');
    
    // Try to get the tile data from the dataTransfer
    let tile = draggedTile;
    if (!tile) {
      try {
        const tileData = e.dataTransfer.getData('text/plain');
        if (tileData) {
          tile = JSON.parse(tileData);
        }
      } catch (err) {
        console.error('Error parsing dropped tile data:', err);
      }
    }
    
    if (!tile) {
      console.log('No tile data found');
      return;
    }
    
    // Check if it's the player's turn
    if (!isMyTurn) {
      console.log('Not your turn, cannot place tiles');
      return;
    }
    
    // Check if the cell is already occupied with a permanent tile
    if (gameBoard[row][col].letter) {
      console.log('Cell already occupied');
      return;
    }
    
    // Check if there's already a placed tile here
    if (placedTiles.some(t => t.row === row && t.col === col)) {
      console.log('Tile already placed here');
      return;
    }
    
    console.log(`Dropping tile ${tile.letter} at position [${row},${col}]`);
    
    // Add to placedTiles - include the original server-assigned ID and value
    const newPlacedTile = {
      id: tile.id,
      letter: tile.letter,
      value: tile.value,
      row,
      col
    };
    
    setPlacedTiles(prev => [...prev, newPlacedTile]);
    
    // Update selectedRackTiles if necessary
    if (!selectedRackTiles.some(t => t.id === tile.id)) {
      setSelectedRackTiles(prev => [...prev, tile]);
    }
    
    setDraggedTile(null);
  };
  
  // Handle selecting a tile from the rack
  const handleRackTileSelect = (tile, index) => {
    // Only allow selection during player's turn
    if (!isMyTurn) {
      console.log('Not your turn, cannot select tiles');
      return;
    }
    
    console.log(`Selected rack tile: ${tile.letter} (${tile.id})`);
    
    // Toggle selection state
    if (selectedRackTiles.some(t => t.id === tile.id)) {
      setSelectedRackTiles(prev => prev.filter(t => t.id !== tile.id));
    } else {
      setSelectedRackTiles(prev => [...prev, tile]);
    }
  };
  
  // Submit the current move
  const handleSubmitMove = () => {
    if (placedTiles.length === 0) {
      console.log('No tiles placed, cannot submit move');
      return;
    }
    
    console.log(`Submitting move with ${placedTiles.length} placed tiles:`, placedTiles);
    console.log(`Is my turn? ${isMyTurn ? 'YES' : 'NO'}`);
    
    // Send the placed tiles to the server and clear local state
    onPlaceTiles(placedTiles);
    
    // Clear state to allow for next move
    setPlacedTiles([]);
    setSelectedRackTiles([]);
    setSelectedTile(null);
    
    // The server will update the gameBoard via the moveMade event
    // which will be handled in the ScrabbleGame component
  };
  
  // Swap selected tiles
  const handleSwapTiles = () => {
    if (selectedRackTiles.length === 0) return;
    
    onSwapTiles(selectedRackTiles.map(tile => tile.id));
    setPlacedTiles([]);
    setSelectedRackTiles([]);
  };
  
  // Pass turn
  const handlePassTurn = () => {
    onPassTurn();
    setPlacedTiles([]);
    setSelectedRackTiles([]);
  };
  
  // Reset the current move
  const handleResetMove = () => {
    setPlacedTiles([]);
    setSelectedRackTiles([]);
    setSelectedTile(null);
  };
  
  // Render the board
  return (
    <div className="scrabble-game-container">
      <div className="scrabble-board">
        {Array(BOARD_SIZE).fill().map((_, rowIndex) => (
          <div key={`row-${rowIndex}`} className="board-row">
            {Array(BOARD_SIZE).fill().map((_, colIndex) => {
              // Check if there's a permanent tile from the game board
              const permanentTile = gameBoard[rowIndex][colIndex].letter 
                ? gameBoard[rowIndex][colIndex] 
                : null;
              
              // Check if there's a temporary placed tile
              const placedTile = placedTiles.find(
                tile => tile.row === rowIndex && tile.col === colIndex
              );
              
              // Get the bonus type for this cell
              const bonusType = bonusBoard ? bonusBoard[rowIndex][colIndex] : 0;
              const bonusClass = getBonusName(bonusType);
              
              return (
                <div 
                  key={`cell-${rowIndex}-${colIndex}`}
                  className={`board-cell ${bonusClass} ${permanentTile || placedTile ? 'has-tile' : ''}`}
                  onClick={() => handleCellClick(rowIndex, colIndex)}
                  onDragOver={(e) => handleCellDragOver(e, rowIndex, colIndex)}
                  onDragLeave={handleCellDragLeave}
                  onDragEnter={(e) => e.preventDefault()}
                  onDrop={(e) => handleCellDrop(e, rowIndex, colIndex)}
                  data-row={rowIndex}
                  data-col={colIndex}
                >
                  {permanentTile ? (
                    <div className="tile permanent-tile">
                      <span className="tile-letter">{permanentTile.letter}</span>
                      <span className="tile-value">{permanentTile.value}</span>
                    </div>
                  ) : placedTile ? (
                    <div className="tile placed-tile">
                      <span className="tile-letter">{placedTile.letter}</span>
                      <span className="tile-value">{placedTile.value}</span>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        ))}
      </div>
      
      <TileRack 
        tiles={playerTiles}
        selectedTiles={selectedRackTiles}
        onTileSelect={handleRackTileSelect}
        onTileDragStart={handleTileDragStart}
        isMyTurn={isMyTurn}
      />
      
      <div className="game-controls">
        <button 
          className="control-button submit-button"
          onClick={handleSubmitMove}
          disabled={!isMyTurn || placedTiles.length === 0}
        >
          Submit Move
        </button>
        <button 
          className="control-button swap-button"
          onClick={handleSwapTiles}
          disabled={!isMyTurn || selectedRackTiles.length === 0}
        >
          Swap Tiles
        </button>
        <button 
          className="control-button pass-button"
          onClick={handlePassTurn}
          disabled={!isMyTurn}
        >
          Pass Turn
        </button>
        <button 
          className="control-button reset-button"
          onClick={handleResetMove}
          disabled={!isMyTurn || placedTiles.length === 0}
        >
          Reset Move
        </button>
        <button 
          className="control-button resign-button"
          onClick={onResignGame}
        >
          Resign Game
        </button>
      </div>
    </div>
  );
};

export default ScrabbleBoard;
