import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/router';
import io from 'socket.io-client';
import Head from 'next/head';
import PlayerList from '../../components/PlayerList';
import ScrabbleGame from '../../components/ScrabbleGame';

import config from '../../config';

const socket = io(config.socketUrl, {
  withCredentials: true,
  transports: ['polling', 'websocket'],
  reconnection: true,
  reconnectionAttempts: 15,
  reconnectionDelay: 1000,
  timeout: 30000,
});

const GameRoom = () => {
  const router = useRouter();
  const { roomId: urlRoomId, creatorId } = router.query;
  const [roomId, setRoomId] = useState(urlRoomId || null);
  const [roomName, setRoomName] = useState('');
  const [players, setPlayers] = useState([]);
  const [roundNum, setRoundNum] = useState(0);
  const [gameState, setGameState] = useState('waiting');
  const [results, setResults] = useState(null);
  const [winner, setWinner] = useState(null);
  const [isCreator, setIsCreator] = useState(false);
  const [hasJoined, setHasJoined] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [isConnected, setIsConnected] = useState(true);
  const [playerName, setPlayerName] = useState('');
  const [nameSet, setNameSet] = useState(false);
  const [timeLeft, setTimeLeft] = useState(null);
  const [gameStarted, setGameStarted] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedCreator = sessionStorage.getItem('isCreator') === 'true';
      setIsCreator(storedCreator);
    }

    if (!urlRoomId || hasJoined) return;

    socket.on('connect', () => {
      setIsConnected(true);
      if (urlRoomId && !hasJoined) {
        socket.emit('joinRoom', { roomId: urlRoomId, creatorId });
      }
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    socket.on('roomJoined', ({ roomId, isCreator: serverIsCreator, roomName }) => {
      setRoomId(roomId);
      setIsCreator(serverIsCreator);
      setRoomName(roomName);
      sessionStorage.setItem('isCreator', serverIsCreator);
    });

    socket.on('roomNotFound', () => {
      alert('Room not found!');
      router.push('/');
    });

    socket.on('playerUpdate', ({ players, roomName }) => {
      setPlayers(players);
      setRoomName(roomName);
      const currentPlayer = players.find(p => p.id === socket.id);
      if (currentPlayer && currentPlayer.name) setNameSet(true);
    });

    socket.on('creatorUpdate', (newCreatorId) => {
      setIsCreator(socket.id === newCreatorId);
      sessionStorage.setItem('isCreator', socket.id === newCreatorId);
    });

    socket.on('gameStarted', () => {
      setGameStarted(true);
    });

    socket.on('newRound', ({ roundNum, timeLeft: initialTime }) => {
      console.log('New round received:', { roundNum });
      setRoundNum(roundNum);
      setTimeLeft(initialTime);
    });

    socket.on('timeUpdate', ({ timeLeft }) => {
      setTimeLeft(timeLeft);
    });

    socket.on('gameUpdate', (gameData) => {
      console.log('Game update received:', gameData);
      // Update players if provided in game update
      if (gameData.players) {
        setPlayers(gameData.players);
      }
    });

    socket.on('gameEnd', ({ winner }) => {
      setWinner(winner);
      setGameState('ended');
      setGameStarted(false);
    });

    socket.on('gameReset', () => {
      setGameStarted(false);
      setGameState('waiting');
      setRoundNum(0);
      setWinner(null);
      setResults(null);
      setIsStarting(false);
    });

    socket.emit('joinRoom', { roomId: urlRoomId, creatorId });
    setHasJoined(true);

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('roomJoined');
      socket.off('roomNotFound');
      socket.off('playerUpdate');
      socket.off('creatorUpdate');
      socket.off('gameStarted');
      socket.off('newRound');
      socket.off('timeUpdate');
      socket.off('gameUpdate');
      socket.off('gameEnd');
      socket.off('gameReset');
    };
  }, [urlRoomId, router, creatorId]);

  const debounce = (func, delay) => {
    let timeout;
    return (...args) => {
      if (timeout) clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), delay);
    };
  };

  const startGame = useCallback(
    debounce(() => {
      if (roomId && isCreator && !isStarting) {
        setIsStarting(true);
        socket.emit('startGame', roomId);
        setTimeout(() => setIsStarting(false), 1000);
      }
    }, 300),
    [roomId, isCreator, isStarting]
  );

  const leaveRoom = () => {
    if (roomId) {
      socket.emit('leaveRoom', roomId);
      setRoomId(null);
      setRoomName('');
      setPlayers([]);
      setGameState('waiting');
      setGameStarted(false);
      setHasJoined(false);
      sessionStorage.clear();
      router.push('/');
    }
  };

  const resetGame = () => {
    socket.emit('resetGame', { roomId });
  };

  const setName = () => {
    if (playerName.trim() && roomId) {
      socket.emit('setName', { roomId, name: playerName });
      setNameSet(true);
      setPlayerName('');
    }
  };

  const inviteLink = roomId ? `${window.location.origin}/room/${roomId}` : '';

  return (
    <>
      <Head>
        <title>{`Acrophylia - Room ${roomId || ''}`}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        {/* Move this to _document.js as per Next.js recommendation */}
        <link
          href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;700&family=Space+Mono:wght@400;700&display=swap"
          rel="stylesheet"
        />
        <style>{`
          @media (max-width: 768px) {
            .container { padding: 1rem; }
            .title { font-size: 1.75rem; }
            .subtitle { font-size: 1.25rem; }
            .input { padding: 0.5rem; }
            .button { padding: 0.5rem 1rem; }
          }
          @keyframes pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.05); }
            100% { transform: scale(1); }
          }
          @keyframes shake {
            0%, 100% { transform: translateX(0); }
            10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
            20%, 40%, 60%, 80% { transform: translateX(5px); }
          }
          button:hover {
            transform: translate(-2px, -2px);
            box-shadow: 6px 6px 0px var(--text);
          }
          button:active {
            transform: translate(2px, 2px);
            box-shadow: 2px 2px 0px var(--text);
          }
        `}</style>
      </Head>
      <div className="game-room-container">
        {roomId ? (
          <>
            <header className="header">
              <div className="room-info-container">
                <h1 className="room-title">
                  {roomName || `Room ${roomId}`}
                </h1>
              </div>
              <div className="header-controls">
                {nameSet && (
                  <button onClick={leaveRoom} className="button leave-button">
                    LEAVE ROOM
                  </button>
                )}
              </div>
            </header>

            {!gameStarted && (
              <div className="invite-container">
                <div className="invite-header">
                  <h3 className="invite-title">INVITE FRIENDS</h3>
                </div>
                <div className="invite-content">
                  <input className="invite-input" type="text" value={inviteLink} readOnly />
                  <button
                    className="button"
                    onClick={() => {
                      navigator.clipboard.writeText(inviteLink);
                      const btn = event.target;
                      const originalText = btn.textContent;
                      btn.textContent = 'COPIED';
                      btn.disabled = true;
                      setTimeout(() => {
                        btn.textContent = originalText;
                        btn.disabled = false;
                      }, 3000);
                    }}
                  >
                    COPY LINK
                  </button>
                </div>
                <div className="info-box">
                  Share this link with friends to invite them to your game room!
                </div>
              </div>
            )}

            {!nameSet && gameState === 'waiting' && (
              <div className="container">
                <div className="game-section">
                  <div className="name-set-form">
                    <h3 className="section-header">YOUR NAME</h3>
                    <input
                      className="main-input"
                      type="text"
                      value={playerName}
                      onChange={(e) => setPlayerName(e.target.value)}
                      placeholder="Enter your name"
                      maxLength={20}
                      onKeyPress={(e) => e.key === 'Enter' && playerName.trim() && setName()}
                    />
                    <button
                      className="button"
                      onClick={setName}
                      disabled={!playerName.trim()}
                    >
                      Set Name
                    </button>
                  </div>
                  <div className="info-box">
                    Enter a name to join the game. You'll be able to play once the room creator starts the game.
                  </div>
                </div>
              </div>
            )}

            {nameSet && !gameStarted && (
              <div className="container">
                <div className="game-section">
                  <div className="waiting-header">
                    <h3 className="waiting-title">WAITING FOR PLAYERS</h3>
                  </div>
                  <div className="waiting-info">
                    <div className="info-box">
                      Game starts with 4 players. Bots will be added if needed.
                    </div>
                    <div className="player-count">
                      <span className="player-count-label">PLAYERS:</span>
                      <span className="player-count-value">{players.length}/4</span>
                    </div>
                  </div>
                  {isCreator ? (
                    <button
                      className={`button ${players.length >= 2 && !isStarting ? 'pulse-animation' : ''} ${isStarting ? 'opacity-70' : ''}`}
                      onClick={startGame}
                      disabled={isStarting}
                    >
                      {isStarting ? 'STARTING...' : 'START GAME'}
                    </button>
                  ) : (
                    <div className="creator-note">
                      <div className="creator-icon">👑</div>
                      <div className="creator-text">
                        Waiting for the room creator to start the game...
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Only show player list if game hasn't started */}
            {!gameStarted && (
              <PlayerList players={players} leaveRoom={leaveRoom} />
            )}

            {/* When game is started, only show the Scrabble board and hide other UI elements */}
            {gameStarted ? (
              <div className="game-section scrabble-container full-width">
                <ScrabbleGame
                  socket={socket}
                  roomId={roomId}
                  playerId={socket.id}
                  gameState={{
                    players: players,
                    roomName: roomName
                  }}
                  setGameState={() => {}}
                />
              </div>
            ) : null}
          </>
        ) : (
          <p className="loading-message">Loading room...</p>
        )}
      </div>
    </>
  );
};

export default GameRoom;