// Utility function to show one view and hide others
function showView(viewId) {
  document.querySelectorAll('.view').forEach(view => {
    view.classList.remove('active');
  });
  document.getElementById(viewId).classList.add('active');
}

// Button references
const startButton = document.getElementById('startButton');
const multiplayerButton = document.getElementById('multiplayerButton');
const backToMenuButtonLocal = document.getElementById('backToMenuButtonLocal');
const backToMenuButtonOnline = document.getElementById('backToMenuButtonOnline');
const cancelMatchmakingButton = document.getElementById('cancelMatchmakingButton');

// Views
const menuView = document.getElementById('menuView');
const localGameView = document.getElementById('localGameView');
const onlineLobbyView = document.getElementById('onlineLobbyView');

// Grid for local game
const localGameGrid = document.getElementById('localGameGrid');

// Game state
let currentPlayer = 'X';
let board = Array(9).fill(null);
let gameOver = false;

let socket = null;
let myMark = null;
let roomId = null;

// Event Listeners
startButton.addEventListener('click', () => {
  showView('localGameView');
  startLocalGame();
});

multiplayerButton.addEventListener('click', () => {
  showView('onlineLobbyView');
  startOnlineMatchmaking();
});

backToMenuButtonLocal.addEventListener('click', () => {
  showView('menuView');
});

backToMenuButtonOnline.addEventListener('click', () => {
  exitOnlineGame();
});

cancelMatchmakingButton.addEventListener('click', () => {
  exitOnlineGame();
});

// Function to disconnect socket and return to menu
function exitOnlineGame() {
  if (socket && socket.connected) {
    socket.disconnect();
  }
  showView('menuView');
}

// Local game logic
function startLocalGame() {
  currentPlayer = 'X';
  board = Array(9).fill(null);
  gameOver = false;
  renderBoard();
}

function renderBoard() {
  localGameGrid.innerHTML = ''; // Clear old cells

  board.forEach((value, index) => {
    const cell = document.createElement('div');
    cell.classList.add('cell');
    cell.textContent = value || '';
    cell.addEventListener('click', () => handleCellClick(index));
    localGameGrid.appendChild(cell);
  });
}

function handleCellClick(index) {
  if (board[index] || gameOver) return;

  board[index] = currentPlayer;
  renderBoard();

  if (checkWinner()) {
    setTimeout(() => alert(`${currentPlayer} wins!`), 10);
    gameOver = true;
  } else if (board.every(cell => cell)) {
    setTimeout(() => alert("It's a draw!"), 10);
    gameOver = true;
  } else {
    currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
  }
}

function checkWinner() {
  const winPatterns = [
    [0,1,2], [3,4,5], [6,7,8], // rows
    [0,3,6], [1,4,7], [2,5,8], // columns
    [0,4,8], [2,4,6]           // diagonals
  ];

  return winPatterns.some(pattern => {
    const [a, b, c] = pattern;
    return board[a] && board[a] === board[b] && board[b] === board[c];
  });
}

// Online matchmaking
function startOnlineMatchmaking() {
  socket = io();

  socket.on('connect', () => {
    console.log('Connected to server');
  });

  socket.on('waiting', () => {
    console.log('Waiting for opponent...');
    document.getElementById('matchmakingMessage').textContent = 'Waiting for opponent...';
  });

  socket.on('match-found', ({ room }) => {
    roomId = room;
    console.log('Room joined:', room);
    document.getElementById('matchmakingMessage').textContent = 'Match found!';
  });

  socket.on('game-start', ({ mark, opponentId }) => {
    myMark = mark;
    board = Array(9).fill(null);
    gameOver = false;
    showView('localGameView');
    renderOnlineBoard();
    alert(`Game started! You are ${myMark}`);
  });

  socket.on('opponent-move', ({ index }) => {
    if (!gameOver && board[index] === null) {
      board[index] = myMark === 'X' ? 'O' : 'X';
      renderOnlineBoard();
      checkOnlineGameState();
    }
  });

  socket.on('disconnect', () => {
    alert('Disconnected from server');
    exitOnlineGame();
  });
}

function renderOnlineBoard() {
  localGameGrid.innerHTML = '';

  board.forEach((value, index) => {
    const cell = document.createElement('div');
    cell.classList.add('cell');
    cell.textContent = value || '';

    // Only allow your own move if it's your turn
    const isMyTurn = (board.filter(Boolean).length % 2 === (myMark === 'X' ? 0 : 1));

    if (!value && !gameOver && isMyTurn) {
      cell.addEventListener('click', () => {
        board[index] = myMark;
        socket.emit('make-move', { room: roomId, index });
        renderOnlineBoard();
        checkOnlineGameState();
      });
    }

    localGameGrid.appendChild(cell);
  });
}

function checkOnlineGameState() {
  if (checkWinner()) {
    alert(`${myMark} wins!`);
    gameOver = true;
  } else if (board.every(cell => cell)) {
    alert("It's a draw!");
    gameOver = true;
  }
}

// Show menu on start
showView('menuView');
