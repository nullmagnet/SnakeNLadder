const BOARD_SIZE = 10;
const TOTAL_CELLS = BOARD_SIZE * BOARD_SIZE;

const snakes = {
    17: 7, 54: 34, 62: 19, 64: 60, 87: 24, 93: 73, 95: 75, 98: 79
};

const ladders = {
    1: 38, 4: 14, 9: 31, 21: 42, 28: 84, 36: 44, 51: 67, 71: 91, 80: 100
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
const themeSelect = document.getElementById('theme-select');

// Initialize Game
function init() {
    createBoard();
    createPlayersList();
    createTokens();
    drawSnakesAndLadders();
    updateTurnUI();
    setupThemeSwitcher();
}

function setupThemeSwitcher() {
    themeSelect.addEventListener('change', (e) => {
        document.body.className = e.target.value;
        // Redraw SVG to pick up new variable colors if needed
        // (Gradients and patterns will pick up automatically if they use currentcolor or vars)
        drawSnakesAndLadders();
    });
}

function createBoard() {
    boardEl.innerHTML = '';
    for (let i = TOTAL_CELLS; i >= 1; i--) {
        const cell = document.createElement('div');
        cell.className = 'cell';
        cell.id = `cell-${i}`;
        const row = Math.floor((i - 1) / 10);
        const col = (i - 1) % 10;
        if ((row + col) % 2 === 0) cell.classList.add('cell-dark');
        cell.innerHTML = `<span>${i}</span>`;
        boardEl.appendChild(cell);
    }
    const cells = Array.from(boardEl.children);
    boardEl.innerHTML = '';
    for (let r = 0; r < 10; r++) {
        let rowCells = cells.slice(r * 10, (r + 1) * 10);
        if (r % 2 !== 0) rowCells.reverse();
        rowCells.forEach(c => boardEl.appendChild(c));
    }
}

function createPlayersList() {
    playersContainer.innerHTML = '';
    players.forEach((player, index) => {
        const item = document.createElement('div');
        item.className = `player-list-item ${index === currentPlayerIndex ? 'active' : ''}`;
        item.innerHTML = `<span>${player.name}</span><div class="player-marker" style="background: ${player.color}"></div>`;
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
        token.innerText = player.id;
        tokensContainer.appendChild(token);
        moveTokenToCell(player.id, player.position);
    });
}

function moveTokenToCell(playerId, position) {
    const token = document.getElementById(`token-${playerId}`);
    const cell = document.getElementById(`cell-${position}`);
    if (!token || !cell) return;
    const rect = cell.getBoundingClientRect();
    const bRect = boardEl.getBoundingClientRect();
    const x = rect.left - bRect.left + rect.width / 2;
    const y = rect.top - bRect.top + rect.height / 2;
    const offset = (playerId - 1) * 8;
    token.style.left = `${x - 18 + offset}px`;
    token.style.top = `${y - 18 + offset}px`;
}

function drawSnakesAndLadders() {
    svgEl.innerHTML = '';
    const style = getComputedStyle(document.body);
    const snakeColor = style.getPropertyValue('--snake-color').trim();
    const snakeColorDark = style.getPropertyValue('--snake-color-dark').trim();
    const ladderColor = style.getPropertyValue('--ladder-color').trim();
    const ladderRung = style.getPropertyValue('--ladder-rung').trim();

    const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
    
    // Scale Pattern
    const scalesPattern = document.createElementNS("http://www.w3.org/2000/svg", "pattern");
    scalesPattern.setAttribute("id", "scalesPattern");
    scalesPattern.setAttribute("patternUnits", "userSpaceOnUse");
    scalesPattern.setAttribute("width", "12");
    scalesPattern.setAttribute("height", "12");
    scalesPattern.innerHTML = `<circle cx="6" cy="6" r="5" fill="${snakeColor}" /><circle cx="6" cy="6" r="2" fill="${snakeColorDark}" opacity="0.6" />`;
    defs.appendChild(scalesPattern);

    // Snake Gradient
    const snakeGrad = document.createElementNS("http://www.w3.org/2000/svg", "linearGradient");
    snakeGrad.setAttribute("id", "snakeBodyGradient");
    snakeGrad.innerHTML = `<stop offset="0%" stop-color="${snakeColor}" /><stop offset="100%" stop-color="${snakeColorDark}" />`;
    defs.appendChild(snakeGrad);
    svgEl.appendChild(defs);

    Object.entries(ladders).forEach(([start, end]) => {
        const s = document.getElementById(`cell-${start}`), e = document.getElementById(`cell-${end}`);
        if (s && e) {
            const b = boardEl.getBoundingClientRect(), sr = s.getBoundingClientRect(), er = e.getBoundingClientRect();
            drawLadder(sr.left - b.left + sr.width/2, sr.top - b.top + sr.height/2, er.left - b.left + er.width/2, er.top - b.top + er.height/2, ladderColor, ladderRung);
        }
    });

    Object.entries(snakes).forEach(([start, end]) => {
        const s = document.getElementById(`cell-${start}`), e = document.getElementById(`cell-${end}`);
        if (s && e) {
            const b = boardEl.getBoundingClientRect(), sr = s.getBoundingClientRect(), er = e.getBoundingClientRect();
            drawSnake(sr.left - b.left + sr.width/2, sr.top - b.top + sr.height/2, er.left - b.left + er.width/2, er.top - b.top + er.height/2, snakeColor, snakeColorDark);
        }
    });
}

function drawLadder(x1, y1, x2, y2, color, rungColor) {
    const dx = x2 - x1, dy = y2 - y1, dist = Math.sqrt(dx*dx + dy*dy), ang = Math.atan2(dy, dx), off = 15;
    const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
    group.style.filter = "drop-shadow(0 4px 6px rgba(0,0,0,0.4))";
    group.appendChild(createLine(x1 + Math.cos(ang + Math.PI/2) * off, y1 + Math.sin(ang + Math.PI/2) * off, x2 + Math.cos(ang + Math.PI/2) * off, y2 + Math.sin(ang + Math.PI/2) * off, color, 8));
    group.appendChild(createLine(x1 + Math.cos(ang - Math.PI/2) * off, y1 + Math.sin(ang - Math.PI/2) * off, x2 + Math.cos(ang - Math.PI/2) * off, y2 + Math.sin(ang - Math.PI/2) * off, color, 8));
    const rSpacing = 25, nRungs = Math.floor(dist / rSpacing);
    for (let i = 1; i < nRungs; i++) {
        const r = i / nRungs, rx = x1 + dx * r, ry = y1 + dy * r;
        group.appendChild(createLine(rx + Math.cos(ang + Math.PI/2) * off, ry + Math.sin(ang + Math.PI/2) * off, rx + Math.cos(ang - Math.PI/2) * off, ry + Math.sin(ang - Math.PI/2) * off, rungColor, 4));
    }
    svgEl.appendChild(group);
}

function drawSnake(x1, y1, x2, y2, color, colorDark) {
    const dx = x2 - x1, dy = y2 - y1, cp1x = x1 + dx * 0.3 - dy * 0.3, cp1y = y1 + dy * 0.3 + dx * 0.3, cp2x = x1 + dx * 0.7 + dy * 0.3, cp2y = y1 + dy * 0.7 - dx * 0.3;
    const group = document.createElementNS("http://www.w3.org/2000/svg", "g"), d = `M ${x1} ${y1} C ${cp1x} ${cp1y} ${cp2x} ${cp2y} ${x2} ${y2}`;
    const base = document.createElementNS("http://www.w3.org/2000/svg", "path");
    base.setAttribute("d", d); base.setAttribute("stroke", colorDark); base.setAttribute("stroke-width", "22"); base.setAttribute("fill", "none"); base.setAttribute("stroke-linecap", "round");
    group.appendChild(base);
    const body = document.createElementNS("http://www.w3.org/2000/svg", "path");
    body.setAttribute("d", d); body.setAttribute("stroke", "url(#scalesPattern)"); body.setAttribute("stroke-width", "18"); body.setAttribute("fill", "none"); body.setAttribute("stroke-linecap", "round");
    group.appendChild(body);
    const hGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
    const t = document.createElementNS("http://www.w3.org/2000/svg", "path");
    t.setAttribute("d", "M 0 0 L 0 -15 M 0 -15 L -5 -22 M 0 -15 L 5 -22"); t.setAttribute("stroke", "#ff4757"); t.setAttribute("stroke-width", "2"); t.setAttribute("fill", "none");
    hGroup.appendChild(t);
    const hs = document.createElementNS("http://www.w3.org/2000/svg", "ellipse");
    hs.setAttribute("cx", "0"); hs.setAttribute("cy", "-5"); hs.setAttribute("rx", "18"); hs.setAttribute("ry", "22"); hs.setAttribute("fill", "url(#snakeBodyGradient)"); hs.setAttribute("stroke", colorDark); hs.setAttribute("stroke-width", "2");
    hGroup.appendChild(hs);
    const cEye = (x) => {
        const e = document.createElementNS("http://www.w3.org/2000/svg", "circle"); e.setAttribute("cx", x); e.setAttribute("cy", "-12"); e.setAttribute("r", "5"); e.setAttribute("fill", "white"); hGroup.appendChild(e);
        const p = document.createElementNS("http://www.w3.org/2000/svg", "circle"); p.setAttribute("cx", x); p.setAttribute("cy", "-13"); p.setAttribute("r", "2.5"); p.setAttribute("fill", "black"); hGroup.appendChild(p);
    };
    cEye(-7); cEye(7);
    const ang = Math.atan2(cp1y - y1, cp1x - x1) * (180 / Math.PI);
    hGroup.setAttribute("transform", `translate(${x1}, ${y1}) rotate(${ang + 90})`);
    group.appendChild(hGroup);
    svgEl.appendChild(group);
}

function createLine(x1, y1, x2, y2, c, w) {
    const l = document.createElementNS("http://www.w3.org/2000/svg", "line");
    l.setAttribute("x1", x1); l.setAttribute("y1", y1); l.setAttribute("x2", x2); l.setAttribute("y2", y2); l.setAttribute("stroke", c); l.setAttribute("stroke-width", w); l.setAttribute("stroke-linecap", "round");
    return l;
}

function addLog(msg) {
    const e = document.createElement('div'); e.className = 'log-entry'; e.innerText = msg; logsEl.appendChild(e); logsEl.scrollTop = logsEl.scrollHeight;
}

function updateTurnUI() {
    const p = players[currentPlayerIndex]; currentPlayerNameEl.innerText = p.name; currentPlayerAvatarEl.style.backgroundColor = p.color; createPlayersList();
}

async function rollDice() {
    if (isRolling) return; isRolling = true; rollBtn.disabled = true; diceEl.classList.add('rolling');
    const res = Math.floor(Math.random() * 6) + 1;
    const rots = { 1: '0,0', 2: '90,0', 3: '0,-90', 4: '0,90', 5: '-90,0', 6: '180,0' };
    const [x, y] = rots[res].split(',');
    await new Promise(r => setTimeout(r, 1000));
    diceEl.classList.remove('rolling'); diceEl.style.transform = `rotateX(${x}deg) rotateY(${y}deg)`;
    await new Promise(r => setTimeout(r, 500));
    const p = players[currentPlayerIndex]; addLog(`${p.name} rolled a ${res}`); await movePlayer(p, res);
    if (p.position === 100) { showWinModal(p.name); return; }
    currentPlayerIndex = (currentPlayerIndex + 1) % players.length; updateTurnUI(); isRolling = false; rollBtn.disabled = false;
}

async function movePlayer(p, steps) {
    let nPos = p.position + steps;
    if (nPos > 100) { addLog(`${p.name} needs ${100 - p.position} to win!`); return; }
    for (let i = p.position + 1; i <= nPos; i++) { p.position = i; moveTokenToCell(p.id, i); await new Promise(r => setTimeout(r, 200)); }
    if (snakes[p.position]) { addLog(`Oh no! ${p.name} hit a snake!`); p.position = snakes[p.position]; await new Promise(r => setTimeout(r, 500)); moveTokenToCell(p.id, p.position); }
    else if (ladders[p.position]) { addLog(`Yay! ${p.name} found a ladder!`); p.position = ladders[p.position]; await new Promise(r => setTimeout(r, 500)); moveTokenToCell(p.id, p.position); }
}

function showWinModal(n) { document.getElementById('winner-name').innerText = `${n} Wins!`; document.getElementById('win-modal').classList.remove('hidden'); }
function restartGame() { players.forEach(p => p.position = 1); currentPlayerIndex = 0; document.getElementById('win-modal').classList.add('hidden'); init(); rollBtn.disabled = false; isRolling = false; addLog('Game restarted!'); }

rollBtn.addEventListener('click', rollDice);
document.getElementById('restart-btn').addEventListener('click', restartGame);
window.addEventListener('resize', () => { drawSnakesAndLadders(); players.forEach(p => moveTokenToCell(p.id, p.position)); });
window.onload = init;
