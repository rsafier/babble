import React from 'react';

const TileRack = ({ 
  tiles, 
  selectedTiles, 
  onTileSelect, 
  onTileDragStart,
  isMyTurn 
}) => {
  // Check if a tile is selected
  const isTileSelected = (tile) => {
    return selectedTiles.some(t => t.id === tile.id);
  };
  
  // Handle drag start event with proper data transfer
  const handleDragStart = (e, tile) => {
    if (!isMyTurn || isTileSelected(tile)) return;
    
    // Set drag image
    const dragImage = e.target.cloneNode(true);
    dragImage.style.position = 'absolute';
    dragImage.style.top = '-1000px';
    document.body.appendChild(dragImage);
    e.dataTransfer.setDragImage(dragImage, 25, 25);
    
    // Set data for the drag operation
    e.dataTransfer.setData('text/plain', JSON.stringify(tile));
    e.dataTransfer.effectAllowed = 'move';
    
    // Call the parent handler
    onTileDragStart(tile);
    
    // Clean up the drag image after a short delay
    setTimeout(() => {
      document.body.removeChild(dragImage);
    }, 0);
  };
  
  return (
    <div className="tile-rack">
      <div className="rack-label">YOUR TILES</div>
      <div className="rack-tiles">
        {tiles.map((tile) => (
          <div 
            key={tile.id}
            className={`rack-tile ${isTileSelected(tile) ? 'selected' : ''} ${isMyTurn ? 'draggable' : ''}`}
            onClick={() => isMyTurn && onTileSelect(tile)}
            draggable={isMyTurn && !isTileSelected(tile)}
            onDragStart={(e) => handleDragStart(e, tile)}
            title={isMyTurn ? 'Drag to board or click to select' : 'Wait for your turn'}
          >
            <span className="tile-letter">{tile.letter}</span>
            <span className="tile-value">{tile.value}</span>
          </div>
        ))}
      </div>
      {isMyTurn && (
        <div className="tile-instructions">
          Drag tiles to the board or click to select, then click on the board to place
        </div>
      )}
    </div>
  );
};

export default TileRack;
