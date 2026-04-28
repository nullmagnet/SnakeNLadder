const BOARD_SIZE = 10;
const TOTAL_CELLS = BOARD_SIZE * BOARD_SIZE;

const snakes = {
    17: 7,
    54: 34,
    62: 19,
    64: 60,
    87: 24,
    93: 73,
    95: 75,
    98: 79
};

const ladders = {
    1: 38,
    4: 14,
    9: 31,
    21: 42,
    28: 84,
    36: 44,
    51: 67,
    71: 91,
    80: 100
};

const players = [
    { id: 1, name: 'Red Phoenix', color: '#ff4757', position: 1 },
    { id: 2, name: 'Blue Dragon', color: '#2e86de', position: 1 }
];

let currentPlayerIndex = 0;
let isRolling = false;

const boardEl = document.getElementById('board');
const diceEl = document.getElementById('dice');
const rollBtn = document.getElementById('roll-btn');
const tokensContainer = document.getElementById('tokens-container');
const logsEl = document.getElementById('logs');
const currentPlayerNameEl = document.getElementById('active-player-name');
const currentPlayerAvatarEl = document.getElementById('active-player-avatar');
const playersContainer = document.getElementById('players-container');
const svgEl = document.getElementById('snakes-ladders-svg');

// Initialize Game
function init() {
    createBoard();
    createPlayersList();
    createTokens();
    drawSnakesAndLadders();
    updateTurnUI();
}

function createBoard() {
    for (let i = TOTAL_CELLS; i >= 1; i--) {
        const cell = document.createElement('div');
        cell.className = 'cell';
        cell.id = `cell-${i}`;
        
        // Calculate zig-zag display
        const row = Math.floor((i - 1) / 10);
        const col = (i - 1) % 10;
        
        // This logic is for the DOM order, we need to adjust for display
        // Standard grid is top-to-bottom, left-to-right
        // Our cells are numbered 1-100 bottom-to-top
        
        cell.innerHTML = `<span>${i}</span>`;
        boardEl.appendChild(cell);
    }
    
    // Adjust cell display order to match traditional board
    const cells = Array.from(boardEl.children);
    boardEl.innerHTML = '';
    
    for (let r = 0; r < 10; r++) {
        let rowCells = cells.slice(r * 10, (r + 1) * 10);
        // Even rows (from top, starting 0) are 100-91, 80-71, etc.
        // If row is even (from top), it's 100-91 (left to right)
        // If row is odd, it's 81-90 (left to right)
        if (r % 2 !== 0) {
            rowCells.reverse();
        }
        rowCells.forEach(c => boardEl.appendChild(c));
    }
}

function createPlayersList() {
    playersContainer.innerHTML = '';
    players.forEach((player, index) => {
        const item = document.createElement('div');
        item.className = `player-list-item ${index === currentPlayerIndex ? 'active' : ''}`;
        item.innerHTML = `
            <span>${player.name}</span>
            <div class="player-marker" style="background: ${player.color}"></div>
        `;
        playersContainer.appendChild(item);
    });
}

function createTokens() {
    tokensContainer.innerHTML = '';
    players.forEach(player => {
        const token = document.createElement('div');
        token.className = 'token';
        token.id = `token-${player.id}`;
        token.style.backgroundColor = player.color;
        token.style.color = 'white';
        token.innerText = player.id;
        tokensContainer.appendChild(token);
        moveTokenToCell(player.id, player.position);
    });
}

function moveTokenToCell(playerId, position) {
    const token = document.getElementById(`token-${playerId}`);
    const cell = document.getElementById(`cell-${position}`);
    const rect = cell.getBoundingClientRect();
    const boardRect = boardEl.getBoundingClientRect();
    
    const x = rect.left - boardRect.left + rect.width / 2;
    const y = rect.top - boardRect.top + rect.height / 2;
    
    // Add small offset for multiple tokens in same cell
    const offset = (playerId - 1) * 8;
    token.style.left = `${x - 18 + offset}px`;
    token.style.top = `${y - 18 + offset}px`;
}

function drawSnakesAndLadders() {
    svgEl.innerHTML = '';
    
    // Draw Ladders
    Object.entries(ladders).forEach(([start, end]) => {
        drawPath(start, end, '#2ecc71', 'ladder');
    });
    
    // Draw Snakes
    Object.entries(snakes).forEach(([start, end]) => {
        drawPath(start, end, '#e74c3c', 'snake');
    });
}

function drawPath(start, end, color, type) {
    const startCell = document.getElementById(`cell-${start}`);
    const endCell = document.getElementById(`cell-${end}`);
    const boardRect = boardEl.getBoundingClientRect();
    
    const sRect = startCell.getBoundingClientRect();
    const eRect = endCell.getBoundingClientRect();
    
    const x1 = sRect.left - boardRect.left + sRect.width / 2;
    const y1 = sRect.top - boardRect.top + sRect.height / 2;
    const x2 = eRect.left - boardRect.left + eRect.width / 2;
    const y2 = eRect.top - boardRect.top + eRect.height / 2;
    
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    
    if (type === 'snake') {
        // Controlled S-curve for snake
        const midX = (x1 + x2) / 2;
        const midY = (y1 + y2) / 2;
        const dx = x2 - x1;
        const dy = y2 - y1;
        
        // Offset for the curve
        const offsetX = dy * 0.2;
        const offsetY = -dx * 0.2;
        
        path.setAttribute("d", `M ${x1} ${y1} Q ${midX + offsetX} ${midY + offsetY} ${x2} ${y2}`);
        path.setAttribute("stroke-dasharray", "8,4");
        path.setAttribute("stroke-width", "5");
    } else {
        // Straight line for ladder
        path.setAttribute("d", `M ${x1} ${y1} L ${x2} ${y2}`);
        path.setAttribute("stroke-width", "8");
    }
    
    path.setAttribute("stroke", color);
    path.setAttribute("fill", "none");
    path.setAttribute("stroke-linecap", "round");
    path.setAttribute("opacity", "0.7");
    path.setAttribute("filter", "drop-shadow(0 0 5px rgba(0,0,0,0.5))");
    svgEl.appendChild(path);
}

function addLog(msg) {
    const entry = document.createElement('div');
    entry.className = 'log-entry';
    entry.innerText = msg;
    logsEl.appendChild(entry);
    logsEl.scrollTop = logsEl.scrollHeight;
}

function updateTurnUI() {
    const player = players[currentPlayerIndex];
    currentPlayerNameEl.innerText = player.name;
    currentPlayerAvatarEl.style.backgroundColor = player.color;
    createPlayersList();
}

async function rollDice() {
    if (isRolling) return;
    
    isRolling = true;
    rollBtn.disabled = true;
    diceEl.classList.add('rolling');
    
    const result = Math.floor(Math.random() * 6) + 1;
    
    // Animate dice rotation
    const rotations = {
        1: 'rotateX(0deg) rotateY(0deg)',
        2: 'rotateX(90deg) rotateY(0deg)',
        3: 'rotateX(0deg) rotateY(-90deg)',
        4: 'rotateX(0deg) rotateY(90deg)',
        5: 'rotateX(-90deg) rotateY(0deg)',
        6: 'rotateX(180deg) rotateY(0deg)'
    };
    
    await new Promise(r => setTimeout(r, 1000));
    diceEl.classList.remove('rolling');
    diceEl.style.transform = rotations[result];
    
    await new Promise(r => setTimeout(r, 500));
    
    const player = players[currentPlayerIndex];
    addLog(`${player.name} rolled a ${result}`);
    
    await movePlayer(player, result);
    
    // Check if game won
    if (player.position === 100) {
        showWinModal(player.name);
        return;
    }
    
    // Next Turn
    currentPlayerIndex = (currentPlayerIndex + 1) % players.length;
    updateTurnUI();
    isRolling = false;
    rollBtn.disabled = false;
}

async function movePlayer(player, steps) {
    let newPos = player.position + steps;
    
    if (newPos > 100) {
        addLog(`${player.name} needs ${100 - player.position} to win!`);
        return;
    }
    
    // Animate step by step
    for (let i = player.position + 1; i <= newPos; i++) {
        player.position = i;
        moveTokenToCell(player.id, i);
        await new Promise(r => setTimeout(r, 200));
    }
    
    // Check for snakes or ladders
    if (snakes[player.position]) {
        addLog(`Oh no! ${player.name} hit a snake!`);
        player.position = snakes[player.position];
        await new Promise(r => setTimeout(r, 500));
        moveTokenToCell(player.id, player.position);
    } else if (ladders[player.position]) {
        addLog(`Yay! ${player.name} found a ladder!`);
        player.position = ladders[player.position];
        await new Promise(r => setTimeout(r, 500));
        moveTokenToCell(player.id, player.position);
    }
}

function showWinModal(name) {
    document.getElementById('winner-name').innerText = `${name} Wins!`;
    document.getElementById('win-modal').classList.remove('hidden');
}

function restartGame() {
    players.forEach(p => p.position = 1);
    currentPlayerIndex = 0;
    document.getElementById('win-modal').classList.add('hidden');
    init();
    rollBtn.disabled = false;
    isRolling = false;
    addLog('Game restarted!');
}

rollBtn.addEventListener('click', rollDice);
document.getElementById('restart-btn').addEventListener('click', restartGame);

// Handle window resize to redraw SVG
window.addEventListener('resize', () => {
    drawSnakesAndLadders();
    players.forEach(p => moveTokenToCell(p.id, p.position));
});

window.onload = init;
