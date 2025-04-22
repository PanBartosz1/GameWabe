const canvas = document.getElementById('tetris');
const context = canvas.getContext('2d');
context.scale(20, 20);

const matrixes = {
    T: [[0,1,0],[1,1,1],[0,0,0]],
    O: [[1,1],[1,1]],
    L: [[0,0,1],[1,1,1],[0,0,0]],
    J: [[1,0,0],[1,1,1],[0,0,0]],
    I: [[0,0,0,0],[1,1,1,1],[0,0,0,0],[0,0,0,0]],
    S: [[0,1,1],[1,1,0],[0,0,0]],
    Z: [[1,1,0],[0,1,1],[0,0,0]]
};

const colors = {
    T: '#800080',
    O: '#FFD700',
    L: '#FFA500',
    J: '#0000FF',
    I: '#00FFFF',
    S: '#00FF00',
    Z: '#FF0000'
};

const arena = createMatrix(12, 20);
let dropCounter = 0;
let dropInterval = 1000;
let lastTime = 0;
let paused = false;

const player = {
    pos: {x:0, y:0},
    matrix: null,
    color: ''
};

function createMatrix(w, h) {
    const matrix = [];
    while (h--) matrix.push(new Array(w).fill(0));
    return matrix;
}

function collide(arena, player) {
    const [m, o] = [player.matrix, player.pos];
    for (let y = 0; y < m.length; ++y) {
        for (let x = 0; x < m[y].length; ++x) {
            if (m[y][x] !== 0 && (arena[y + o.y] && arena[y + o.y][x + o.x]) !== 0) return true;
        }
    }
    return false;
}

function merge(arena, player) {
    player.matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) arena[y + player.pos.y][x + player.pos.x] = player.color;
        });
    });
}

function rotate(matrix) {
    for (let y = 0; y < matrix.length; ++y) {
        for (let x = 0; x < y; ++x) [matrix[x][y], matrix[y][x]] = [matrix[y][x], matrix[x][y]];
    }
    matrix.forEach(row => row.reverse());
}

function playerDrop() {
    player.pos.y++;
    if (collide(arena, player)) {
        player.pos.y--;
        merge(arena, player);
        playerReset();
        arenaSweep();
    }
    dropCounter = 0;
}

function playerMove(dir) {
    player.pos.x += dir;
    if (collide(arena, player)) player.pos.x -= dir;
}

function playerRotate() {
    const pos = player.pos.x;
    rotate(player.matrix);
    let offset = 1;
    while (collide(arena, player)) {
        player.pos.x += offset;
        offset = -(offset + (offset > 0 ? 1 : -1));
        if (offset > player.matrix[0].length) {
            rotate(player.matrix);
            rotate(player.matrix);
            rotate(player.matrix);
            player.pos.x = pos;
            return;
        }
    }
}

function playerReset() {
    const pieces = Object.keys(matrixes);
    const name = pieces[Math.floor(Math.random() * pieces.length)];
    player.matrix = matrixes[name].map(row => [...row]);
    player.color = colors[name];
    player.pos.y = 0;
    player.pos.x = (arena[0].length / 2 | 0) - (player.matrix[0].length / 2 | 0);
    if (collide(arena, player)) {
        arena.forEach(row => row.fill(0));
        alert('Koniec gry!');
    }
}

function arenaSweep() {
    outer: for (let y = arena.length - 1; y >= 0; --y) {
        if (arena[y].every(cell => cell !== 0)) {
            arena.splice(y, 1);
            arena.unshift(new Array(12).fill(0));
            y++;
        }
    }
}

function drawMatrix(matrix, offset, color) {
    matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                context.fillStyle = color;
                context.fillRect(x + offset.x, y + offset.y, 1, 1);
            }
        });
    });
}

function draw() {
    context.fillStyle = '#111';
    context.fillRect(0, 0, canvas.width, canvas.height);

    arena.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                context.fillStyle = value;
                context.fillRect(x, y, 1, 1);
            }
        });
    });

    drawMatrix(player.matrix, player.pos, player.color);
}

function update(time = 0) {
    if (paused) return;
    const deltaTime = time - lastTime;
    lastTime = time;

    dropCounter += deltaTime;
    if (dropCounter > dropInterval) {
        playerDrop();
    }

    draw();
    requestAnimationFrame(update);
}

function startGame() {
    if (!player.matrix) playerReset();
    paused = false;
    update();
}

function togglePause() {
    paused = !paused;
    if (!paused) update();
}

function resetGame() {
    arena.forEach(row => row.fill(0));
    playerReset();
    paused = false;
    update();
}

document.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft') playerMove(-1);
    else if (e.key === 'ArrowRight') playerMove(1);
    else if (e.key === 'ArrowDown') playerDrop();
    else if (e.key === 'ArrowUp') playerRotate();
});
