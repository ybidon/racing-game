const socket = io();
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const waitingMessage = document.getElementById('waitingMessage');

let playerNumber;
let players = [];
const carWidth = 40;
const carHeight = 20;
const speed = 5;
const turnSpeed = 3;

const keys = {
    ArrowUp: false,
    ArrowDown: false,
    ArrowLeft: false,
    ArrowRight: false
};

// Car image
const carImage = new Image();
carImage.src = 'data:image/svg+xml;base64,' + btoa(`
    <svg width="40" height="20" xmlns="http://www.w3.org/2000/svg">
        <rect x="5" y="5" width="30" height="10" fill="red"/>
        <circle cx="12" cy="15" r="3" fill="black"/>
        <circle cx="28" cy="15" r="3" fill="black"/>
    </svg>
`);

socket.on('playerNumber', (number) => {
    playerNumber = number;
    waitingMessage.textContent = `You are Player ${number}! Waiting for opponent...`;
});

socket.on('gameFull', () => {
    waitingMessage.textContent = 'Game is full!';
});

socket.on('gameState', (gamePlayers) => {
    players = gamePlayers;
    if (players.length === 2) {
        waitingMessage.style.display = 'none';
    }
});

document.addEventListener('keydown', (e) => {
    if (keys.hasOwnProperty(e.key)) {
        keys[e.key] = true;
    }
});

document.addEventListener('keyup', (e) => {
    if (keys.hasOwnProperty(e.key)) {
        keys[e.key] = false;
    }
});

function updateCarPosition() {
    const player = players.find(p => p.number === playerNumber);
    if (!player) return;

    let dx = 0;
    let dy = 0;
    let rotation = 0;

    if (keys.ArrowUp) dy -= speed;
    if (keys.ArrowDown) dy += speed;
    if (keys.ArrowLeft) rotation -= turnSpeed;
    if (keys.ArrowRight) rotation += turnSpeed;

    player.position.x += dx;
    player.position.y += dy;
    player.rotation += rotation;

    // Keep car within canvas bounds
    player.position.x = Math.max(0, Math.min(canvas.width - carWidth, player.position.x));
    player.position.y = Math.max(0, Math.min(canvas.height - carHeight, player.position.y));

    socket.emit('updatePosition', {
        position: player.position,
        rotation: player.rotation
    });
}

function drawCar(player) {
    ctx.save();
    ctx.translate(player.position.x + carWidth/2, player.position.y + carHeight/2);
    ctx.rotate(player.rotation * Math.PI / 180);
    ctx.drawImage(carImage, -carWidth/2, -carHeight/2, carWidth, carHeight);
    ctx.restore();
}

function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw track
    ctx.fillStyle = '#666';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#fff';
    ctx.setLineDash([20, 20]);
    ctx.beginPath();
    ctx.moveTo(canvas.width/2, 0);
    ctx.lineTo(canvas.width/2, canvas.height);
    ctx.stroke();

    players.forEach(drawCar);
    updateCarPosition();
    requestAnimationFrame(gameLoop);
}

gameLoop(); 