const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

app.use(express.static('public'));

const players = new Map();

io.on('connection', (socket) => {
    console.log('Player connected:', socket.id);

    if (players.size >= 2) {
        socket.emit('gameFull');
        return;
    }

    const playerNumber = players.size + 1;
    players.set(socket.id, {
        id: socket.id,
        number: playerNumber,
        position: { x: 100, y: playerNumber === 1 ? 300 : 400 },
        rotation: 0
    });

    socket.emit('playerNumber', playerNumber);
    io.emit('gameState', Array.from(players.values()));

    socket.on('updatePosition', (data) => {
        const player = players.get(socket.id);
        if (player) {
            player.position = data.position;
            player.rotation = data.rotation;
            io.emit('gameState', Array.from(players.values()));
        }
    });

    socket.on('disconnect', () => {
        players.delete(socket.id);
        io.emit('gameState', Array.from(players.values()));
        console.log('Player disconnected:', socket.id);
    });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
}); 