/**
 * Turn Timer for Scrabble Game
 * Handles the timer for each player's turn
 */

// Default turn time in seconds
const DEFAULT_TURN_TIME = 30;

/**
 * Start a turn timer for a room
 * @param {Object} io - Socket.io instance
 * @param {Object} room - The game room
 * @param {String} roomId - The room ID
 * @param {Function} onTimeUp - Callback when time is up
 */
function startTurnTimer(io, room, roomId, onTimeUp) {
  // Clear any existing timer
  if (room.scrabble.turnTimer) {
    clearInterval(room.scrabble.turnTimer);
    room.scrabble.turnTimer = null;
  }
  
  // Set time limit
  let timeLeft = DEFAULT_TURN_TIME;
  
  // Start the timer
  room.scrabble.turnTimer = setInterval(() => {
    timeLeft--;
    
    // Emit time update to all players
    io.to(roomId).emit('turnTimeUpdate', { timeLeft });
    
    // Check if time is up
    if (timeLeft <= 0) {
      clearInterval(room.scrabble.turnTimer);
      room.scrabble.turnTimer = null;
      
      // Call the callback function
      onTimeUp(room, roomId);
    }
  }, 1000);
  
  // Return the initial time
  return DEFAULT_TURN_TIME;
}

/**
 * Stop a turn timer for a room
 * @param {Object} room - The game room
 */
function stopTurnTimer(room) {
  if (room.scrabble.turnTimer) {
    clearInterval(room.scrabble.turnTimer);
    room.scrabble.turnTimer = null;
  }
}

module.exports = {
  DEFAULT_TURN_TIME,
  startTurnTimer,
  stopTurnTimer
};
