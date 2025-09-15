const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const GameEngine = require('./src/game/GameEngine');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const PORT = process.env.PORT || 3000;

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// Game instances for each player
const gameInstances = new Map();

// Socket connection handling
io.on('connection', (socket) => {
    console.log('Player connected:', socket.id);

    // Create new game instance for player
    const game = new GameEngine(socket.id);
    gameInstances.set(socket.id, game);

    // Send initial game state
    socket.emit('gameState', game.getState());

    // Handle player actions
    socket.on('action', (data) => {
        const game = gameInstances.get(socket.id);
        if (game) {
            const result = game.handleAction(data);
            socket.emit('actionResult', result);
            socket.emit('gameState', game.getState());
        }
    });

    // Handle save game
    socket.on('saveGame', () => {
        const game = gameInstances.get(socket.id);
        if (game) {
            const saveData = game.save();
            socket.emit('gameSaved', saveData);
        }
    });

    // Handle load game
    socket.on('loadGame', (saveData) => {
        const game = gameInstances.get(socket.id);
        if (game) {
            game.load(saveData);
            socket.emit('gameState', game.getState());
        }
    });

    // Handle disconnect
    socket.on('disconnect', () => {
        console.log('Player disconnected:', socket.id);
        const game = gameInstances.get(socket.id);
        if (game) {
            game.stop();
            gameInstances.delete(socket.id);
        }
    });
});

// Start game loop for all instances
setInterval(() => {
    gameInstances.forEach((game, socketId) => {
        game.update();
        const socket = io.sockets.sockets.get(socketId);
        if (socket) {
            socket.emit('gameState', game.getState());
        }
    });
}, 1000); // Update every second

server.listen(PORT, () => {
    console.log(`Dimensional Explorer server running on port ${PORT}`);
});