# Babble: Multiplayer Scrabble Game PRD

## Overview

Babble is a multiplayer Scrabble game that allows 2-4 players to compete in real-time. The application uses websocket infrastructure for real-time communication and implements standard Scrabble game rules. The game features a virtual game board with letter tiles, scoring, and turn-based gameplay.

## Game Rules

### Standard Scrabble Rules

1. **Players**: 2-4 players per game
2. **Game Board**: 15×15 grid with bonus squares (Double Letter, Triple Letter, Double Word, Triple Word)
3. **Letter Tiles**: 100 tiles total with different point values
4. **Starting**: Each player draws 7 random tiles
5. **Turns**: Players take turns placing words on the board
6. **Scoring**: Points are calculated based on letter values and bonus squares
7. **Game End**: Game ends when all tiles are used or no more valid moves are possible
8. **Winner**: Player with the highest score wins

### Letter Distribution and Point Values

- **1 point**: E×12, A×9, I×9, O×8, N×6, R×6, T×6, L×4, S×4, U×4
- **2 points**: D×4, G×3
- **3 points**: B×2, C×2, M×2, P×2
- **4 points**: F×2, H×2, V×2, W×2, Y×2
- **5 points**: K×1
- **8 points**: J×1, X×1
- **10 points**: Q×1, Z×1
- **Blank**: 2 tiles (0 points, can represent any letter)

## Technical Architecture

### Dictionary Implementation

1. **Word Database**:

   - Built-in dictionary with 2,000-5,000 common English words
   - JSON format for easy loading and lookup
   - Optional API integration for expanded dictionary in future versions

2. **Validation Logic**:

   - O(1) lookup using JavaScript Set/Object
   - Case-insensitive word matching
   - Support for word challenges between players
   - Validation for all words formed in a single move

3. **Dictionary Events**:
   - Word validation during turn submission
   - Challenge system for disputing words
   - Dictionary lookup for learning purposes

### Server-side Changes

1. **Game State**:

   - Game board representation (15×15 grid)
   - Tile bag with appropriate letter distribution
   - Player racks (7 tiles per player)
   - Current player turn tracking
   - Score tracking
   - Dictionary for word validation

2. **Game Logic**:

   - Word validation using built-in dictionary
   - Scoring calculation
   - Tile placement validation
   - Turn management
   - Game end conditions
   - Word challenge system

3. **Socket Events**:
   - `startGame`: Initialize the Scrabble game (requires at least 2 players)
   - `placeTiles`: Handle player tile placement
   - `validateWord`: Check if placed word(s) exist in dictionary
   - `swapTiles`: Allow players to exchange tiles
   - `skipTurn`: Allow players to pass their turn
   - `challengeWord`: Allow players to challenge words

### Client-side Changes

1. **UI Components**:

   - Scrabble board (15×15 grid)
   - Player tile rack
   - Score display
   - Game controls (submit word, exchange tiles, pass turn)
   - Timer for turns

2. **Interaction**:
   - Drag-and-drop tiles from rack to board
   - Horizontal/vertical word placement
   - Visual feedback for valid/invalid placements
   - Preview scoring before submission

## User Experience

### Game Flow

1. **Room Creation**: Players create or join a game room
2. **Waiting Room**: Game requires at least 2 players to start
3. **Game Start**: Once at least 2 players have joined, the room creator can start the game
4. **Gameplay**:
   - When the game starts, only the Scrabble board and game controls are displayed
   - Players receive 7 random tiles
   - First player places a word through the center square
   - Subsequent players build off existing words
   - After each valid move, player draws new tiles to maintain 7 in their rack
5. **Game End**: Game concludes when tile bag is empty and one player uses all their tiles, or when all players pass twice in succession
6. **Results**: Final scores are displayed and winner is announced

### Game Interface

1. **Main Board View**:
   - Central 15×15 Scrabble board
   - Clearly marked bonus squares
   - Current words placed on the board

2. **Player Area**:
   - Personal tile rack (7 tiles)
   - Score display
   - Game controls

3. **Game Information**:
   - Remaining tiles in bag (count)
   - Current player turn indicator
   - Timer for current turn
   - Game history/log showing moves made
   - Word validation feedback

## Implementation Plan

### Phase 1: Core Game Mechanics

1. Implement basic game board and tile system
2. Set up turn-based gameplay for 2-4 players
3. Implement core tile placement rules
4. Create basic UI for board and tiles

### Phase 2: Game Rules and Validation

1. Implement dictionary and word validation
2. Add scoring system with bonus squares
3. Create tile swapping and passing functionality
4. Implement game end conditions

### Phase 3: UI and UX Improvements

1. Improve board and tile visuals
2. Add animations and feedback
3. Implement drag-and-drop functionality
4. Enhance player information displays

### Phase 4: Additional Features

1. Add word challenges with penalties
2. Implement expanded dictionary with definitions
3. Add game statistics and leaderboards
4. Timer for turns with adjustable time limits

## Implementation TODO List

### Completed Tasks

1. **Server-side Changes**:
   - [x] Create data structures for Scrabble board
   - [x] Implement tile distribution and randomization
   - [x] Develop word placement validation logic
   - [x] Build scoring algorithm
   - [x] Modify socket events for Scrabble gameplay
   - [x] Create built-in dictionary with common English words
   - [x] Implement word validation against dictionary
   - [x] Build word challenge system

2. **Client-side Changes**:
   - [x] Create initial Scrabble board UI component
   - [x] Create tile rack component
   - [x] Add basic CSS styles for Scrabble game
   - [x] Implement basic game state management

### Current Priority Tasks

1. **Client UI Improvements**:
   - [ ] Update layout to be full-width to accommodate Scrabble board
   - [ ] Improve Scrabble board styling with better visual hierarchy
   - [ ] Add clear visual indicators for bonus squares
   - [ ] Enhance tile design with more realistic appearance
   - [ ] Improve responsive design for different screen sizes
   - [ ] Add visual feedback for valid/invalid tile placements
   - [ ] Create a more intuitive game control panel
   - [ ] Implement proper game state indicators (current turn, scores)
   - [ ] Add animations for tile placement and movement
   - [ ] Implement a game log/history panel

2. **Client Interaction**:
   - [ ] Complete drag-and-drop functionality for tiles
   - [ ] Fix tile selection and placement issues
   - [ ] Implement proper tile snapping to board cells
   - [ ] Add keyboard navigation for accessibility
   - [ ] Implement intuitive controls for swapping tiles
   - [ ] Add visual confirmation for successful moves
   - [ ] Implement proper error handling and user feedback
   - [ ] Add tooltips for game controls and bonus squares
   - [ ] Create a turn timer display with visual countdown

3. **Game Features**:
   - [ ] Implement blank tile selection interface
   - [ ] Add word validation feedback with dictionary lookup
   - [ ] Create a challenge interface for disputing words
   - [ ] Implement a score calculation preview
   - [ ] Add a tile bag display showing remaining tiles
   - [ ] Create player statistics panel
   - [ ] Implement game end sequence with animations
   - [ ] Add sound effects for tile placement and game events

4. **Layout and Integration**:
   - [ ] Reorganize the game room layout for better space utilization
   - [ ] Move player list to a sidebar or collapsible panel
   - [ ] Create a responsive layout that works on tablets
   - [ ] Implement a game settings panel
   - [ ] Add a help/rules section accessible during gameplay
   - [ ] Create a proper game header with scores and turn information
   - [ ] Design a better game-over screen with detailed statistics

5. **Bug Fixes and Optimization**:
   - [ ] Fix JSX syntax errors in GameRoom component
   - [ ] Resolve issues with conditional rendering
   - [ ] Fix tile selection and placement bugs
   - [ ] Optimize rendering performance for board updates
   - [ ] Fix socket event handling for game state updates
   - [ ] Ensure proper cleanup of event listeners
   - [ ] Fix any CSS conflicts or styling issues
   - [ ] Ensure proper mobile touch support
   - [ ] Remove all remaining AI/bot code from the codebase

6. **Testing**:
   - [ ] Test multiplayer functionality with multiple clients
   - [ ] Validate word placement rules in various scenarios
   - [ ] Test scoring accuracy with bonus squares
   - [ ] Verify game end conditions and winner determination
   - [ ] Test browser compatibility (Chrome, Firefox, Safari)
   - [ ] Test responsive design on different devices
   - [ ] Perform usability testing with sample users
