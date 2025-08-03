const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

const PORT = process.env.PORT || 3000;
app.use(express.static('public'));

let waitingPlayer = null;

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  if (waitingPlayer) {
    const room = `room-${waitingPlayer.id}-${socket.id}`;
    socket.join(room);
    waitingPlayer.join(room);

    io.to(room).emit('match-found', { room });

    // Assign marks
    waitingPlayer.emit('game-start', { mark: 'X', opponentId: socket.id });
    socket.emit('game-start', { mark: 'O', opponentId: waitingPlayer.id });

    waitingPlayer = null;
  } else {
    waitingPlayer = socket;
    socket.emit('waiting');
  }

  socket.on('make-move', ({ room, index }) => {
    socket.to(room).emit('opponent-move', { index });
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    if (waitingPlayer && waitingPlayer.id === socket.id) {
      waitingPlayer = null;
    }
  });
});

http.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
