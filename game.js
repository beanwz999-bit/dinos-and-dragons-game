const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game State
const game = {
    running: false,
    players: [],
    enemies: [],
    projectiles: [],
    particles: [],
    boss: null,
    miniBoss: null,
    miniBoss2: null,
    miniBoss3: null,
    heart: null,
    diamond: null,
    lightning: null,
    meteor: null,
    ringEffect: null,
    lightningEffect: null,
    meteorEffect: null,
    keys: {},
    wave: 1,
    score: 0,
    state: 'menu', // 'menu', 'playing', 'gameover_delay', 'gameover_fading', 'gameover_screen', 'victory', 'boss_warning_hold'
    warningTicks: 0,
    miniBossTriggered: false,
    miniBoss2Triggered: false,
    miniBoss3Triggered: false,
    bossWarningTicks: 0,
    bossTriggered: false,
    menuIndex: 0,
    menuOptions: ['1 Player', '2 Players'],
    difficultyIndex: 0,
    difficulties: ['Normal', 'Hard'],
    victoryTicks: 0,
    backgroundFadeTicks: 0,
    targetBackground: null,
    menuFlashing: false,
    menuFlashTicks: 0,
    fadeAlpha: 0,
    fadeDirection: 0,
    nextState: null,
    playerCount: 1,
    gameOverTicks: 0,
    diamondWave: 0,
    diamondSpawned: false,
    lightningWave: 0,
    lightningSpawned: false,
    meteorWave: 0,
    meteorSpawned: false,
    fadeSpeed: 0.05
};

// Load Images
const assets = {
    dino: { walk: null, attack: null },
    dragon: { walk: null, attack: null },
    catfish: { walk: null, attack: null },
    boss: null,
    miniBoss: null,
    miniBoss2: null,
    miniBoss3: null,
    background: new Image(),
    jungleBackground: new Image(),
    moonBackground: new Image(),
    bossBackground: new Image(),
    titleBackground: new Image(),
    underwaterBackground: new Image(),
    outerSpaceBackground: new Image(),
    rock: null,
    fireball: null,
    bee: null,
    alien_ufo: null,
    heart: null,
    diamond: null,
    lightning: null
};

const imageSources = {
    dino_walk: 'dino_walk.png',
    dino_attack: 'dino_attack.png',
    dragon_walk: 'dragon_walk.png',
    dragon_attack: 'dragon_attack.png',
    catfish_walk: 'catfish_walk.png',
    catfish_attack: 'catfish_attack.png',
    boss: 'boss_v2.png',
    rock: 'rock.png',
    fireball: 'fireball.png',
    miniBoss: 'robot_shark.png',
    miniBoss2: 'ladybug.png',
    miniBoss3: 'robot_turtle.png',
    bee: 'bee.png',
    alien_ufo: 'alien_ufo.png',
    heart: 'heart.png',
    diamond: 'diamond_v2.png',
    lightning: 'lightning.png'
};

assets.jungleBackground.src = 'background.png';
assets.moonBackground.src = 'moon_background.png';
assets.bossBackground.src = 'moon_background_volcanoes.png';
assets.titleBackground.src = 'title_background.png';
assets.underwaterBackground.src = 'underwater.png';
assets.outerSpaceBackground.src = 'outer_space.png';

assets.underwaterBackground.onload = () => { assets.background = assets.underwaterBackground; checkLoaded(); };
assets.underwaterBackground.onerror = () => { console.error('Failed to load underwater.png'); checkLoaded(); };
assets.outerSpaceBackground.onload = checkLoaded;
assets.outerSpaceBackground.onerror = () => { console.error('Failed to load outer_space.png'); checkLoaded(); };

let loadedCount = 0;
const totalAssets = 23;

function checkLoaded() {
    loadedCount++;
    console.log(`Loaded asset ${loadedCount}/23`);
    if (loadedCount === 23) {
        console.log('All images loaded');
        game.running = true;
        loop();
    }
}

assets.jungleBackground.onload = () => { checkLoaded(); };
assets.jungleBackground.onerror = () => { console.error('Failed to load background.png'); checkLoaded(); };
assets.moonBackground.onload = checkLoaded;
assets.moonBackground.onerror = () => { console.error('Failed to load moon_background.png'); checkLoaded(); };
assets.bossBackground.onload = checkLoaded;
assets.bossBackground.onerror = () => { console.error('Failed to load moon_background_volcanoes.png'); checkLoaded(); };
assets.titleBackground.onload = checkLoaded;
assets.titleBackground.onerror = () => { console.error('Failed to load title_background.png'); checkLoaded(); };

function makeTransparent(img, threshold = 150) {
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = img.width; tempCanvas.height = img.height;
    const tempCtx = tempCanvas.getContext('2d'); tempCtx.drawImage(img, 0, 0);
    const imageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
        const r = data[i]; const g = data[i + 1]; const b = data[i + 2];
        if (r > threshold && g > threshold && b > threshold) { data[i + 3] = 0; }
    }
    tempCtx.putImageData(imageData, 0, 0);
    return tempCanvas;
}

for (const [key, src] of Object.entries(imageSources)) {
    const img = new Image();
    img.src = src;
    img.onload = () => {
        let transparentCanvas;
        if (key === 'diamond' || key === 'lightning' || key === 'miniBoss2' || key === 'miniBoss3' || key === 'alien_ufo') { transparentCanvas = makeTransparent(img, 250); }
        else { transparentCanvas = makeTransparent(img, 150); }
        
        if (key === 'boss' || key === 'miniBoss' || key === 'miniBoss2' || key === 'miniBoss3' || key === 'bee' || key === 'alien_ufo' || key === 'heart' || key === 'diamond' || key === 'lightning') { assets[key] = transparentCanvas; }
        else if (key === 'rock' || key === 'fireball') { assets[key] = transparentCanvas; }
        else { const [char, action] = key.split('_'); assets[char][action] = transparentCanvas; }
        checkLoaded();
    };
    img.onerror = () => { console.error(`Failed to load image: ${src}`); checkLoaded(); };
}

class Character {
    constructor(x, y, width, height, assetKey) {
        this.x = x; this.y = y; this.width = width; this.height = height; this.assetKey = assetKey;
        this.speed = 3; this.maxHealth = 100; this.health = 100; this.currentAction = 'walk'; this.frameIndex = 0; this.tickCount = 0; this.ticksPerFrame = 40; this.moving = false; this.facing = 1;
        this.alpha = 1.0; this.dying = false;
    }
    draw() {
        const asset = assets[this.assetKey];
        let img = null;
        if (this.assetKey === 'boss' || this.assetKey === 'miniBoss' || this.assetKey === 'miniBoss2' || this.assetKey === 'miniBoss3' || this.assetKey === 'bee' || this.assetKey === 'alien_ufo' || this.assetKey === 'heart' || this.assetKey === 'diamond' || this.assetKey === 'lightning') { img = asset; }
        else { img = asset ? asset[this.currentAction] : null; }

        if (img) {
            ctx.save(); ctx.globalAlpha = this.alpha; ctx.translate(this.x + this.width / 2, this.y + this.height / 2); ctx.scale(this.facing, 1);
            if (this.assetKey === 'dino') { ctx.filter = 'hue-rotate(150deg)'; }
            if (this.assetKey === 'boss' || this.assetKey === 'miniBoss' || this.assetKey === 'miniBoss2' || this.assetKey === 'miniBoss3' || this.assetKey === 'bee' || this.assetKey === 'alien_ufo' || this.assetKey === 'heart' || this.assetKey === 'diamond' || this.assetKey === 'lightning') { ctx.drawImage(img, -this.width / 2, -this.height / 2, this.width, this.height); }
            else {
                const frameWidth = img.width / 2; const frameHeight = img.height / 2; const col = this.frameIndex % 2; const row = Math.floor(this.frameIndex / 2); const sx = col * frameWidth; const sy = row * frameHeight;
                ctx.drawImage(img, sx, sy, frameWidth, frameHeight, -this.width / 2, -this.height / 2, this.width, this.height);
            }
            ctx.restore();

            if (this.health < this.maxHealth || this.assetKey === 'catfish' || this.assetKey === 'bee' || this.assetKey === 'alien_ufo' || this.assetKey === 'dino' || this.assetKey === 'dragon') {
                ctx.fillStyle = 'red'; ctx.fillRect(this.x, this.y - 10, this.width, 5);
                ctx.fillStyle = 'green'; ctx.fillRect(this.x, this.y - 10, this.width * Math.max(0, this.health / this.maxHealth), 5);
            }
        } else { ctx.fillStyle = 'red'; ctx.fillRect(this.x, this.y, this.width, this.height); }
    }
    update() {
        this.tickCount++;
        let currentTicksPerFrame = this.ticksPerFrame;
        if (this.currentAction === 'attack') { currentTicksPerFrame = 5; }
        if (this.tickCount > currentTicksPerFrame) {
            this.tickCount = 0; this.frameIndex = (this.frameIndex + 1) % 4;
            if (this.currentAction === 'attack' && this.frameIndex === 0) { this.isAttacking = false; this.currentAction = 'walk'; }
        }
        this.x = Math.max(0, Math.min(canvas.width - this.width, this.x)); this.y = Math.max(0, Math.min(canvas.height - this.height, this.y));
    }
}

class Projectile {
    constructor(x, y, speedX, speedY, imageKey, owner) {
        this.x = x; this.y = y; this.imageKey = owner.assetKey === 'dino' ? 'rock' : 'fireball';
        this.width = 40; this.height = 40; this.speedX = speedX; this.speedY = speedY; this.owner = owner; this.active = true; this.facing = speedX > 0 ? 1 : -1;
    }
    draw() {
        const img = assets[this.imageKey];
        if (img) { ctx.save(); ctx.translate(this.x + this.width / 2, this.y + this.height / 2); ctx.scale(this.facing, 1); ctx.drawImage(img, -this.width / 2, -this.height / 2, this.width, this.height); ctx.restore(); }
        else { ctx.fillStyle = 'red'; ctx.fillRect(this.x, this.y, this.width, this.height); }
    }
    update() { this.x += this.speedX; this.y += this.speedY; if (this.x < 0 || this.x > canvas.width || this.y < 0 || this.y > canvas.height) { this.active = false; } }
}

class Particle {
    constructor(x, y, color) {
        this.x = x; this.y = y; this.color = color; this.radius = Math.random() * 3 + 2; this.speedX = Math.random() * 6 - 3; this.speedY = Math.random() * 6 - 3; this.alpha = 1; this.decay = Math.random() * 0.02 + 0.01;
    }
    update() { this.x += this.speedX; this.y += this.speedY; this.alpha -= this.decay; }
    draw() { ctx.save(); ctx.globalAlpha = this.alpha; ctx.fillStyle = this.color; ctx.beginPath(); ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2); ctx.fill(); ctx.restore(); }
}

class Player extends Character {
    constructor(x, y, assetKey, controls) {
        super(x, y, 100, 100, assetKey); this.controls = controls; this.attackBox = { x: this.x, y: this.y, width: 50, height: 50 }; this.superCooldown = 0; this.superCooldownMax = 60; this.kills = 0;
    }
    update() {
        if (this.health <= 0) return;
        this.moving = false;
        if (game.keys[this.controls.up]) { this.y -= this.speed; this.moving = true; }
        if (game.keys[this.controls.down]) { this.y += this.speed; this.moving = true; }
        if (game.keys[this.controls.left]) { this.x -= this.speed; this.moving = true; this.facing = -1; }
        if (game.keys[this.controls.right]) { this.x += this.speed; this.moving = true; this.facing = 1; }
        if (this.superCooldown > 0) this.superCooldown--;
        if (!this.isAttacking) {
            if (game.keys[this.controls.attack]) { this.startAttack('attack'); }
            else if (game.keys[this.controls.super] && this.superCooldown === 0) { this.startAttack('super'); this.useSuper(); }
        }
        if (this.isAttacking) { if (this.facing === 1) { this.attackBox.x = this.x + this.width; } else { this.attackBox.x = this.x - this.attackBox.width; } }
        super.update();
    }
    startAttack(type) {
        this.isAttacking = true; this.currentAction = 'attack'; this.frameIndex = 0; this.tickCount = 0;
        if (type === 'attack') { this.attackBox.width = 60; this.attackBox.height = 40; this.attackBox.y = this.y + 30; }
        else if (type === 'super') { this.attackBox.width = 0; this.attackBox.height = 0; }
    }
    useSuper() {
        if (this.assetKey === 'dino') { const speedX = this.facing * 4.2; const projectile = new Projectile(this.x + this.width / 2, this.y + this.height / 2, speedX, 0, 'rock', this); game.projectiles.push(projectile); }
        else if (this.assetKey === 'dragon') { const speedX = this.facing * 6.3; const projectile = new Projectile(this.x + this.width / 2, this.y + this.height / 2, speedX, 0, 'fireball', this); game.projectiles.push(projectile); }
        this.superCooldown = this.superCooldownMax;
    }
}

class Enemy extends Character {
    constructor(x, y, width, height, assetKey) { super(x, y, width, height, assetKey); this.speed = 1; }
    update() {
        let closestPlayer = null; let minDist = Infinity;
        game.players.forEach(player => { if (player.health > 0) { const dist = Math.hypot(player.x - this.x, player.y - this.y); if (dist < minDist) { minDist = dist; closestPlayer = player; } } });
        if (closestPlayer) {
            if (this.x < closestPlayer.x) { this.x += this.speed; this.facing = 1; }
            if (this.x > closestPlayer.x) { this.x -= this.speed; this.facing = -1; }
            if (this.y < closestPlayer.y) this.y += this.speed;
            if (this.y > closestPlayer.y) this.y -= this.speed;
        }
        game.enemies.forEach(other => {
            if (other !== this) {
                const dist = Math.hypot(other.x - this.x, other.y - this.y); const minDist = (this.width + other.width) / 2;
                if (dist < minDist && dist > 0) { const overlap = minDist - dist; const dirX = (this.x - other.x) / dist; const dirY = (this.y - other.y) / dist; this.x += dirX * overlap * 0.1; this.y += dirY * overlap * 0.1; }
            }
        });
        super.update();
    }
}

function checkCollision(rect1, rect2) {
    return rect1.x < rect2.x + rect2.width && rect1.x + rect1.width > rect2.x && rect1.y < rect2.y + rect2.height && rect1.y + rect1.height > rect2.y;
}

function spawnWave() {
    const multiplier = game.difficultyIndex === 1 ? 1.5 : 1.0;
    const baseCount = game.wave * 2 + 2;
    const count = Math.ceil(baseCount * multiplier);
    
    for (let i = 0; i < count; i++) {
        const x = Math.random() < 0.5 ? -100 : canvas.width + 100;
        const y = Math.random() * (canvas.height - 80);
        let assetKey = 'catfish';
        if (game.wave >= 4 && game.wave <= 6) { assetKey = 'bee'; }
        else if (game.wave >= 7) { assetKey = 'alien_ufo'; }
        
        const enemy = new Enemy(x, y, 80, 80, assetKey);
        enemy.maxHealth = 100 * multiplier;
        enemy.health = enemy.maxHealth;
        game.enemies.push(enemy);
    }
    if (game.wave === game.diamondWave && !game.diamondSpawned) { spawnDiamond(); game.diamondSpawned = true; }
    if (game.wave === game.lightningWave && !game.lightningSpawned) { spawnLightning(); game.lightningSpawned = true; }
    if (game.wave === game.meteorWave && !game.meteorSpawned) { spawnMeteor(); game.meteorSpawned = true; }
}

function createFirework(x, y) {
    const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff', '#ffd700'];
    const color = colors[Math.floor(Math.random() * colors.length)];
    for (let i = 0; i < 50; i++) { game.particles.push(new Particle(x, y, color)); }
}

function spawnMiniBoss() {
    const hpMultiplier = game.difficultyIndex === 1 ? 1.5 : 1.0;
    game.miniBoss = new Character(canvas.width - 250, 200, 220, 220, 'miniBoss');
    game.miniBoss.maxHealth = 500 * hpMultiplier; game.miniBoss.health = game.miniBoss.maxHealth; game.miniBoss.speed = 1.0;
    console.log('Mini-boss spawned!');
}

function spawnMiniBoss2() {
    const hpMultiplier = game.difficultyIndex === 1 ? 1.5 : 1.0;
    game.miniBoss2 = new Character(canvas.width - 250, 200, 260, 260, 'miniBoss2');
    game.miniBoss2.maxHealth = 650 * hpMultiplier; game.miniBoss2.health = game.miniBoss2.maxHealth; game.miniBoss2.speed = 0.9;
    console.log('Mini-boss 2 spawned!');
}

function spawnMiniBoss3() {
    const hpMultiplier = game.difficultyIndex === 1 ? 1.5 : 1.0;
    game.miniBoss3 = new Character(canvas.width - 250, 200, 260, 260, 'miniBoss3');
    game.miniBoss3.maxHealth = 650 * hpMultiplier; game.miniBoss3.health = game.miniBoss3.maxHealth; game.miniBoss3.speed = 0.9;
    console.log('Mini-boss 3 spawned!');
}

function spawnBoss() {
    const hpMultiplier = game.difficultyIndex === 1 ? 1.5 : 1.0;
    game.boss = new Character(canvas.width - 350, 100, 300, 300, 'boss');
    game.boss.maxHealth = 750 * hpMultiplier; game.boss.health = game.boss.maxHealth; game.boss.speed = 0.8;
    console.log('Boss spawned!');
}

function spawnHeart() { game.heart = { x: canvas.width / 2 - 25, y: canvas.height / 2 - 25, width: 50, height: 50, active: true }; console.log('Heart spawned!'); }
function spawnDiamond() { game.diamond = { x: Math.random() * (canvas.width - 150), y: Math.random() * (canvas.height - 150), width: 150, height: 150, active: true }; console.log('Diamond spawned!'); }
function spawnLightning() { game.lightning = { x: Math.random() * (canvas.width - 80), y: Math.random() * (canvas.height - 80), width: 80, height: 80, active: true }; console.log('Lightning spawned!'); }
function spawnMeteor() { game.meteor = { x: Math.random() * (canvas.width - 80), y: Math.random() * (canvas.height - 80), width: 80, height: 80, active: true }; console.log('Meteor spawned!'); }

function drawMeteorItem(x, y, width, height) {
    ctx.save();
    ctx.beginPath(); ctx.moveTo(x + width, y); ctx.lineTo(x + width * 0.2, y + height * 0.6); ctx.lineTo(x + width * 0.5, y + height * 0.5); ctx.lineTo(x + width * 0.1, y + height * 0.9); ctx.lineTo(x + width * 0.4, y + height * 0.7); ctx.lineTo(x + width * 0.3, y + height * 0.8); ctx.lineTo(x + width * 0.8, y + height * 0.2); ctx.closePath(); ctx.fillStyle = 'rgba(255, 50, 0, 0.9)'; ctx.fill();
    ctx.beginPath(); ctx.moveTo(x + width, y); ctx.lineTo(x + width * 0.3, y + height * 0.5); ctx.lineTo(x + width * 0.6, y + height * 0.4); ctx.lineTo(x + width * 0.2, y + height * 0.8); ctx.lineTo(x + width * 0.7, y + height * 0.3); ctx.closePath(); ctx.fillStyle = 'rgba(255, 150, 0, 0.9)'; ctx.fill();
    ctx.beginPath(); ctx.moveTo(x + width, y); ctx.lineTo(x + width * 0.5, y + height * 0.6); ctx.lineTo(x + width * 0.4, y + height * 0.7); ctx.closePath(); ctx.fillStyle = 'rgba(255, 255, 0, 0.9)'; ctx.fill();
    ctx.beginPath(); ctx.moveTo(x + width * 0.1, y + height * 0.7); ctx.lineTo(x + width * 0.3, y + height * 0.6); ctx.lineTo(x + width * 0.5, y + height * 0.8); ctx.lineTo(x + width * 0.4, y + height * 1.0); ctx.lineTo(x, y + height * 0.9); ctx.closePath(); ctx.fillStyle = '#696969'; ctx.fill(); ctx.strokeStyle = '#333'; ctx.lineWidth = 2; ctx.stroke();
    ctx.beginPath(); ctx.arc(x + width * 0.2, y + height * 0.8, 4, 0, Math.PI * 2); ctx.fillStyle = '#333'; ctx.fill();
    ctx.beginPath(); ctx.arc(x + width * 0.3, y + height * 0.9, 2, 0, Math.PI * 2); ctx.fillStyle = '#333'; ctx.fill();
    ctx.restore();
}

function triggerRingEffect(x, y, player) {
    game.ringEffect = { x: x, y: y, radius: 0, maxRadius: 2000, active: true };
    for (let i = game.enemies.length - 1; i >= 0; i--) {
        const enemy = game.enemies[i]; enemy.health -= 50;
        if (enemy.health <= 0) { killEnemy(i, player); }
    }
    if (game.miniBoss && !game.miniBoss.dying) {
        game.miniBoss.health -= 50;
        if (game.miniBoss.health <= 0) { handleBossDeath('miniBoss', player); }
    }
    if (game.miniBoss2 && !game.miniBoss2.dying) {
        game.miniBoss2.health -= 50;
        if (game.miniBoss2.health <= 0) { handleBossDeath('miniBoss2', player); }
    }
    if (game.miniBoss3 && !game.miniBoss3.dying) {
        game.miniBoss3.health -= 50;
        if (game.miniBoss3.health <= 0) { handleBossDeath('miniBoss3', player); }
    }
    if (game.boss && !game.boss.dying) {
        game.boss.health -= 50;
        if (game.boss.health <= 0) { handleBossDeath('boss', player); }
    }
}

function triggerLightningEffect(player) {
    game.lightningEffect = { active: true, ticks: 30, targets: [] };
    const generatePoints = (startX, startY, endX, endY) => {
        const points = []; let curY = startY; let curX = startX; points.push({x: curX, y: curY});
        while (curY < endY) { curY += 30; curX += Math.random() * 40 - 20; points.push({x: curX, y: curY}); }
        points.push({x: endX, y: endY}); return points;
    };
    for (let i = game.enemies.length - 1; i >= 0; i--) {
        const enemy = game.enemies[i]; const targetX = enemy.x + enemy.width / 2; const targetY = enemy.y + enemy.height / 2;
        game.lightningEffect.targets.push({ points: generatePoints(targetX, 0, targetX, targetY) });
        enemy.health -= 50;
        if (enemy.health <= 0) { killEnemy(i, player); }
    }
    if (game.miniBoss && !game.miniBoss.dying) {
        const targetX = game.miniBoss.x + game.miniBoss.width / 2; const targetY = game.miniBoss.y + game.miniBoss.height / 2;
        game.lightningEffect.targets.push({ points: generatePoints(targetX, 0, targetX, targetY) });
        game.miniBoss.health -= 50;
        if (game.miniBoss.health <= 0) { handleBossDeath('miniBoss', player); }
    }
    if (game.miniBoss2 && !game.miniBoss2.dying) {
        const targetX = game.miniBoss2.x + game.miniBoss2.width / 2; const targetY = game.miniBoss2.y + game.miniBoss2.height / 2;
        game.lightningEffect.targets.push({ points: generatePoints(targetX, 0, targetX, targetY) });
        game.miniBoss2.health -= 50;
        if (game.miniBoss2.health <= 0) { handleBossDeath('miniBoss2', player); }
    }
    if (game.miniBoss3 && !game.miniBoss3.dying) {
        const targetX = game.miniBoss3.x + game.miniBoss3.width / 2; const targetY = game.miniBoss3.y + game.miniBoss3.height / 2;
        game.lightningEffect.targets.push({ points: generatePoints(targetX, 0, targetX, targetY) });
        game.miniBoss3.health -= 50;
        if (game.miniBoss3.health <= 0) { handleBossDeath('miniBoss3', player); }
    }
    if (game.boss && !game.boss.dying) {
        const targetX = game.boss.x + game.boss.width / 2; const targetY = game.boss.y + game.boss.height / 2;
        game.lightningEffect.targets.push({ points: generatePoints(targetX, 0, targetX, targetY) });
        game.boss.health -= 50;
        if (game.boss.health <= 0) { handleBossDeath('boss', player); }
    }
}

function triggerMeteorEffect(player) {
    game.meteorEffect = { active: true, x: -100, y: -100, targetX: canvas.width / 2, targetY: canvas.height / 2, progress: 0, exploding: false, explosionRadius: 0, player: player, damaged: false };
}

function killEnemy(index, player) {
    const enemy = game.enemies[index];
    for (let i = 0; i < 20; i++) { game.particles.push(new Particle(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, '#ff4500')); }
    game.enemies.splice(index, 1); game.score += 10; player.kills++;
}

function handleBossDeath(bossKey, player) {
    const boss = game[bossKey];
    if (boss && !boss.dying) {
        boss.dying = true;
        game.score += (bossKey === 'boss') ? 100 : (bossKey === 'miniBoss2' || bossKey === 'miniBoss3' ? 75 : 50);
        player.kills++;
    }
}

function startGame(playerCount) {
    const p1Controls = { up: 'KeyW', down: 'KeyS', left: 'KeyA', right: 'KeyD', attack: 'KeyC', super: 'KeyV' };
    const p2Controls = { up: 'ArrowUp', down: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight', attack: 'KeyL', super: 'Semicolon' };
    const player1 = new Player(50, 200, 'dino', p1Controls); game.players.push(player1);
    if (playerCount === 2) { const player2 = new Player(150, 200, 'dragon', p2Controls); game.players.push(player2); }
    
    game.diamondWave = Math.floor(Math.random() * 6) + 1; game.diamondSpawned = false;
    do { game.lightningWave = Math.floor(Math.random() * 6) + 1; } while (game.lightningWave === game.diamondWave);
    game.lightningSpawned = false;
    do { game.meteorWave = Math.floor(Math.random() * 6) + 1; } while (game.meteorWave === game.diamondWave || game.meteorWave === game.lightningWave);
    game.meteorSpawned = false;
    
    console.log(`Diamond on wave ${game.diamondWave}, Lightning on wave ${game.lightningWave}, Meteor on wave ${game.meteorWave}`);
    spawnWave();
}

function resetGame() {
    game.state = 'menu'; game.wave = 1; game.score = 0; game.players = []; game.enemies = []; game.projectiles = []; game.particles = []; game.boss = null; game.miniBoss = null; game.miniBoss2 = null; game.miniBoss3 = null; game.heart = null; game.diamond = null; game.lightning = null; game.meteor = null; game.ringEffect = null; game.lightningEffect = null; game.meteorEffect = null; game.miniBossTriggered = false; game.miniBoss2Triggered = false; game.miniBoss3Triggered = false; game.bossTriggered = false; game.warningTicks = 0; game.bossWarningTicks = 0; game.gameOverTicks = 0; assets.background = assets.underwaterBackground;
}

function drawBg(bg, alpha) {
    if (!bg.complete) return;
    if (bg === assets.moonBackground || bg === assets.bossBackground) {
        ctx.fillStyle = '#111'; ctx.fillRect(0, 0, canvas.width, canvas.height); ctx.save(); ctx.globalAlpha = 0.7 * alpha; ctx.drawImage(bg, 0, 0, canvas.width, canvas.height); ctx.restore();
    }
    else if (bg === assets.underwaterBackground) {
        ctx.fillStyle = '#e0f7fa'; ctx.fillRect(0, 0, canvas.width, canvas.height); ctx.save(); ctx.globalAlpha = 0.4 * alpha; ctx.drawImage(bg, 0, 0, canvas.width, canvas.height); ctx.restore();
    }
    else if (bg === assets.outerSpaceBackground) {
        ctx.fillStyle = '#150a21'; ctx.fillRect(0, 0, canvas.width, canvas.height); ctx.save(); ctx.globalAlpha = 0.4 * alpha; ctx.drawImage(bg, 0, 0, canvas.width, canvas.height); ctx.restore();
    }
    else { ctx.save(); ctx.globalAlpha = alpha; ctx.drawImage(bg, 0, 0, canvas.width, canvas.height); ctx.restore(); }
}

function loop() {
    if (!game.running) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const controlsBtn = document.getElementById('controls-btn');
    if (game.state === 'menu') { controlsBtn.style.display = 'block'; }
    else { controlsBtn.style.display = 'none'; document.getElementById('controls-popup').classList.add('hidden'); }

    if (game.state === 'boss_warning_hold') {
        // Black screen with banner
        ctx.fillStyle = 'black';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        game.bossWarningTicks--;
        if (Math.floor(game.bossWarningTicks / 10) % 2 === 0) {
            ctx.save();
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.fillRect(0, canvas.height / 2 - 60, canvas.width, 120);
            ctx.fillStyle = 'red'; ctx.font = 'bold 70px Impact, Arial Black'; ctx.textAlign = 'center'; ctx.fillText('WARNING: BOSS IS COMING!', canvas.width / 2, canvas.height / 2 + 25);
            ctx.restore();
        }
        
        if (game.bossWarningTicks <= 0) {
            game.state = 'playing';
            game.wave++; // becomes 10
            assets.background = assets.bossBackground;
            spawnBoss();
            game.fadeDirection = -1; // Fade in to the new background!
            game.fadeAlpha = 1; // Start from full black
            game.nextState = null;
        }
    } else {
        if (game.backgroundFadeTicks > 0) {
            game.backgroundFadeTicks--; drawBg(assets.background, 1.0); const alpha = (60 - game.backgroundFadeTicks) / 60; drawBg(game.targetBackground, alpha);
            if (game.backgroundFadeTicks === 0) { assets.background = game.targetBackground; game.targetBackground = null; }
        } else { drawBg(assets.background, 1.0); }
    }

    if (game.state === 'menu') {
        document.getElementById('p1-health').innerText = ''; document.getElementById('p1-kills').innerText = ''; document.getElementById('p2-health').innerText = ''; document.getElementById('p2-kills').innerText = '';
        if (assets.titleBackground.complete) { ctx.drawImage(assets.titleBackground, 0, 0, canvas.width, canvas.height); }
        else if (assets.background.complete) { ctx.drawImage(assets.background, 0, 0, canvas.width, canvas.height); }
        else { ctx.fillStyle = '#222'; ctx.fillRect(0, 0, canvas.width, canvas.height); }
        
        ctx.save(); ctx.shadowColor = 'black'; ctx.shadowBlur = 10; ctx.shadowOffsetX = 4; ctx.shadowOffsetY = 4;
        ctx.fillStyle = '#ffd700'; ctx.font = 'bold 80px Impact, Arial Black'; ctx.textAlign = 'center'; ctx.fillText('Dinos and Dragons', canvas.width / 2, 150);
        ctx.fillStyle = 'white'; ctx.font = 'bold 40px Impact, Arial Black';
        game.menuOptions.forEach((option, index) => { ctx.fillText(option, canvas.width / 2, canvas.height / 2 + index * 60); });
        
        const diffY = canvas.height / 2 + game.menuOptions.length * 60 + 120;
        ctx.fillText(`Difficulty: < ${game.difficulties[game.difficultyIndex]} >`, canvas.width / 2, diffY);
        
        let showArrow = true;
        if (game.menuFlashing) {
            game.menuFlashTicks--; showArrow = Math.floor(game.menuFlashTicks / 5) % 2 === 0;
            if (game.menuFlashTicks === 0) { game.fadeDirection = 1; game.fadeAlpha = 0; game.nextState = 'playing'; game.playerCount = game.menuIndex + 1; game.menuFlashing = false; }
        }
        if (showArrow) { const arrowX = canvas.width / 2 - 120; const arrowY = canvas.height / 2 + game.menuIndex * 60; ctx.fillText('->', arrowX, arrowY); }
        ctx.restore();

    } else if (game.state === 'gameover_delay') {
        game.gameOverTicks--;
        if (game.gameOverTicks <= 0) { game.state = 'gameover_fading'; game.fadeDirection = 1; game.fadeAlpha = 0; game.nextState = 'gameover_screen'; }
        game.players.forEach(p => { if (p.health > 0) { p.draw(); } else { ctx.save(); ctx.globalAlpha = 0.3; p.draw(); ctx.restore(); } });
        game.enemies.forEach(e => e.draw()); if (game.miniBoss) game.miniBoss.draw(); if (game.miniBoss2) game.miniBoss2.draw(); if (game.miniBoss3) game.miniBoss3.draw(); if (game.boss) game.boss.draw(); game.projectiles.forEach(p => p.draw());

    } else if (game.state === 'gameover_fading') {
        game.players.forEach(p => { if (p.health > 0) { p.draw(); } else { ctx.save(); ctx.globalAlpha = 0.3; p.draw(); ctx.restore(); } });
        game.enemies.forEach(e => e.draw()); if (game.miniBoss) game.miniBoss.draw(); if (game.miniBoss2) game.miniBoss2.draw(); if (game.miniBoss3) game.miniBoss3.draw(); if (game.boss) game.boss.draw(); game.projectiles.forEach(p => p.draw());

    } else if (game.state === 'gameover_screen') {
        ctx.fillStyle = 'black'; ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = 'red'; ctx.font = 'bold 80px Impact, Arial Black'; ctx.textAlign = 'center'; ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2);
        ctx.fillStyle = 'white'; ctx.font = '20px Arial'; ctx.fillText('Press any key to return to menu', canvas.width / 2, canvas.height / 2 + 80); ctx.textAlign = 'left';

    } else if (game.state === 'victory') {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'; ctx.fillRect(0, 0, canvas.width, canvas.height);
        if (Math.random() < 0.05) { createFirework(Math.random() * canvas.width, Math.random() * canvas.height); }
        game.particles.forEach((p, index) => { p.update(); p.draw(); if (p.alpha <= 0) { game.particles.splice(index, 1); } });
        if (Math.floor(Date.now() / 200) % 2 === 0) { ctx.fillStyle = '#ffd700'; } else { ctx.fillStyle = '#ffffff'; }
        ctx.font = 'bold 100px Impact, Arial Black'; ctx.textAlign = 'center'; ctx.fillText('VICTORY', canvas.width / 2, canvas.height / 2 + 30);
        if (game.victoryTicks > 0) { game.victoryTicks--; } else { ctx.fillStyle = 'white'; ctx.font = '20px Arial'; ctx.textAlign = 'center'; ctx.fillText('Press any key to continue', canvas.width / 2, canvas.height / 2 + 100); }
        ctx.textAlign = 'left';

    } else if (game.state === 'playing') {
        if (game.players.length > 0 && game.players.every(p => p.health <= 0)) { game.state = 'gameover_delay'; game.gameOverTicks = 120; }

        // Delay wave spawning
        if (game.waveSpawnDelay > 0) {
            game.waveSpawnDelay--;
            if (game.waveSpawnDelay === 0) {
                spawnWave();
            }
        }

        // Wave progression...
        if (game.enemies.length === 0 && game.waveSpawnDelay === 0 && !game.boss && !game.miniBoss && !game.miniBoss2 && !game.miniBoss3 && game.warningTicks === 0 && game.bossWarningTicks === 0) {
            if (game.wave === 3 && !game.miniBossTriggered) { game.miniBossTriggered = true; game.warningTicks = 180; }
            else if (game.wave === 6 && !game.miniBoss2Triggered) { game.miniBoss2Triggered = true; game.warningTicks = 180; }
            else if (game.wave === 9 && !game.miniBoss3Triggered) { game.miniBoss3Triggered = true; game.warningTicks = 180; }
            else if (game.wave < 9) {
                game.wave++;
                game.waveSpawnDelay = 60; // Wait 1s before spawning next wave
                if (game.wave === 3 || game.wave === 6 || game.wave === 9) { spawnHeart(); }
            }
        }

        if (game.warningTicks > 0) {
            game.warningTicks--;
            if (game.warningTicks === 0) {
                if (game.wave === 3) { spawnMiniBoss(); }
                else if (game.wave === 6) { spawnMiniBoss2(); }
                else if (game.wave === 9) { spawnMiniBoss3(); }
            }
        }

        if (game.heart && game.heart.active) {
            const img = assets.heart;
            if (img) { ctx.drawImage(img, game.heart.x, game.heart.y, game.heart.width, game.heart.height); } else { ctx.fillStyle = 'red'; ctx.fillRect(game.heart.x, game.heart.y, game.heart.width, game.heart.height); }
            game.players.forEach(player => { if (player.health > 0 && checkCollision(player, game.heart)) { player.health = Math.min(player.maxHealth, player.health + 30); game.heart.active = false; } });
        }

        if (game.diamond && game.diamond.active) {
            const img = assets.diamond;
            if (img) { ctx.drawImage(img, game.diamond.x, game.diamond.y, game.diamond.width, game.diamond.height); } else { ctx.fillStyle = 'cyan'; ctx.fillRect(game.diamond.x, game.diamond.y, game.diamond.width, game.diamond.height); }
            game.players.forEach(player => { if (player.health > 0 && checkCollision(player, game.diamond)) { game.diamond.active = false; triggerRingEffect(player.x + player.width / 2, player.y + player.height / 2, player); } });
        }

        if (game.lightning && game.lightning.active) {
            const img = assets.lightning;
            if (img) { ctx.drawImage(img, game.lightning.x, game.lightning.y, game.lightning.width, game.lightning.height); } else { ctx.fillStyle = 'yellow'; ctx.fillRect(game.lightning.x, game.lightning.y, game.lightning.width, game.lightning.height); }
            game.players.forEach(player => { if (player.health > 0 && checkCollision(player, game.lightning)) { game.lightning.active = false; triggerLightningEffect(player); } });
        }

        if (game.meteor && game.meteor.active) {
            drawMeteorItem(game.meteor.x, game.meteor.y, game.meteor.width, game.meteor.height);
            game.players.forEach(player => { if (player.health > 0 && checkCollision(player, game.meteor)) { game.meteor.active = false; triggerMeteorEffect(player); } });
        }

        if (game.ringEffect && game.ringEffect.active) {
            game.ringEffect.radius += 25; ctx.save(); ctx.beginPath(); ctx.arc(game.ringEffect.x, game.ringEffect.y, game.ringEffect.radius, 0, Math.PI * 2); ctx.strokeStyle = 'rgba(0, 255, 255, 0.8)'; ctx.lineWidth = 20; ctx.stroke(); ctx.restore();
            if (game.ringEffect.radius >= game.ringEffect.maxRadius) { game.ringEffect.active = false; }
        }

        if (game.lightningEffect && game.lightningEffect.active) {
            game.lightningEffect.ticks--; ctx.save();
            game.lightningEffect.targets.forEach(target => {
                ctx.strokeStyle = 'rgba(255, 255, 0, 0.8)'; ctx.lineWidth = 12; ctx.beginPath(); ctx.moveTo(target.points[0].x, target.points[0].y);
                for (let i = 1; i < target.points.length; i++) { ctx.lineTo(target.points[i].x, target.points[i].y); }
                ctx.stroke();
                ctx.strokeStyle = 'white'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(target.points[0].x, target.points[0].y);
                for (let i = 1; i < target.points.length; i++) { ctx.lineTo(target.points[i].x, target.points[i].y); }
                ctx.stroke();
            });
            ctx.restore();
            if (game.lightningEffect.ticks === 0) { game.lightningEffect.active = false; }
        }

        if (game.meteorEffect && game.meteorEffect.active) {
            if (!game.meteorEffect.exploding) {
                game.meteorEffect.progress += 0.01; game.meteorEffect.x = -100 + (game.meteorEffect.targetX + 100) * game.meteorEffect.progress; game.meteorEffect.y = -100 + (game.meteorEffect.targetY + 100) * game.meteorEffect.progress;
                ctx.save(); ctx.translate(game.meteorEffect.x, game.meteorEffect.y); ctx.rotate(Math.atan2(game.meteorEffect.targetY + 100, game.meteorEffect.targetX + 100)); ctx.scale(1.3, 1.3);
                ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-150, -30); ctx.lineTo(-100, -10); ctx.lineTo(-180, 0); ctx.lineTo(-100, 10); ctx.lineTo(-150, 30); ctx.closePath(); ctx.fillStyle = 'rgba(255, 50, 0, 0.8)'; ctx.fill();
                ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-100, -15); ctx.lineTo(-120, 0); ctx.lineTo(-100, 15); ctx.closePath(); ctx.fillStyle = 'rgba(255, 150, 0, 0.9)'; ctx.fill();
                ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-50, -5); ctx.lineTo(-70, 0); ctx.lineTo(-50, 5); ctx.closePath(); ctx.fillStyle = 'rgba(255, 255, 0, 0.9)'; ctx.fill();
                ctx.beginPath(); ctx.moveTo(30, 0); ctx.lineTo(10, 30); ctx.lineTo(-20, 20); ctx.lineTo(-30, -10); ctx.lineTo(-10, -30); ctx.closePath(); ctx.fillStyle = '#696969'; ctx.fill(); ctx.strokeStyle = '#333'; ctx.lineWidth = 3; ctx.stroke();
                ctx.beginPath(); ctx.arc(0, 10, 8, 0, Math.PI * 2); ctx.fillStyle = '#333'; ctx.fill();
                ctx.beginPath(); ctx.arc(-10, -10, 5, 0, Math.PI * 2); ctx.fillStyle = '#333'; ctx.fill();
                ctx.restore();

                if (game.meteorEffect.progress >= 1) {
                    game.meteorEffect.exploding = true;
                    if (!game.meteorEffect.damaged) {
                        game.meteorEffect.damaged = true;
                        for (let i = game.enemies.length - 1; i >= 0; i--) {
                            const enemy = game.enemies[i]; enemy.health -= 50;
                            if (enemy.health <= 0) { killEnemy(i, game.meteorEffect.player); }
                        }
                        if (game.miniBoss && !game.miniBoss.dying) {
                            game.miniBoss.health -= 50;
                            if (game.miniBoss.health <= 0) { handleBossDeath('miniBoss', game.meteorEffect.player); }
                        }
                        if (game.miniBoss2 && !game.miniBoss2.dying) {
                            game.miniBoss2.health -= 50;
                            if (game.miniBoss2.health <= 0) { handleBossDeath('miniBoss2', game.meteorEffect.player); }
                        }
                        if (game.miniBoss3 && !game.miniBoss3.dying) {
                            game.miniBoss3.health -= 50;
                            if (game.miniBoss3.health <= 0) { handleBossDeath('miniBoss3', game.meteorEffect.player); }
                        }
                        if (game.boss && !game.boss.dying) {
                            game.boss.health -= 50;
                            if (game.boss.health <= 0) { handleBossDeath('boss', game.meteorEffect.player); }
                        }
                    }
                }
            } else {
                game.meteorEffect.explosionRadius += 30;
                ctx.save(); ctx.beginPath(); ctx.arc(game.meteorEffect.targetX, game.meteorEffect.targetY, game.meteorEffect.explosionRadius, 0, Math.PI * 2); ctx.fillStyle = `rgba(255, 100, 0, ${1 - game.meteorEffect.explosionRadius / 600})`; ctx.fill(); ctx.restore();
                if (game.meteorEffect.explosionRadius >= 600) { game.meteorEffect.active = false; }
            }
        }

        game.players.forEach(player => {
            player.update(); if (player.health > 0) { player.draw(); }
            if (player.isAttacking && player.attackBox.width > 0 && player.frameIndex === 0) {
                if (player.assetKey === 'dragon') {
                    ctx.fillStyle = 'rgba(255, 100, 0, 0.7)';
                    for (let i = 0; i < 5; i++) { const rx = player.attackBox.x + Math.random() * player.attackBox.width; const ry = player.attackBox.y + Math.random() * player.attackBox.height; const radius = Math.random() * 15 + 5; ctx.beginPath(); ctx.arc(rx, ry, radius, 0, Math.PI * 2); ctx.fill(); }
                } else if (player.assetKey === 'dino') {
                    ctx.fillStyle = 'rgba(80, 80, 80, 0.7)';
                    for (let i = 0; i < 5; i++) { const rx = player.attackBox.x + Math.random() * player.attackBox.width; const ry = player.attackBox.y + Math.random() * player.attackBox.height; const size = Math.random() * 10 + 5; ctx.fillRect(rx, ry, size, size); }
                }
                for (let i = game.enemies.length - 1; i >= 0; i--) {
                    const enemy = game.enemies[i];
                    if (checkCollision(player.attackBox, enemy)) {
                        enemy.health -= 20;
                        if (enemy.health <= 0) { killEnemy(i, player); }
                    }
                }
                if (game.miniBoss && !game.miniBoss.dying && checkCollision(player.attackBox, game.miniBoss)) {
                    game.miniBoss.health -= 20;
                    if (game.miniBoss.health <= 0) { handleBossDeath('miniBoss', player); }
                }
                if (game.miniBoss2 && !game.miniBoss2.dying && checkCollision(player.attackBox, game.miniBoss2)) {
                    game.miniBoss2.health -= 20;
                    if (game.miniBoss2.health <= 0) { handleBossDeath('miniBoss2', player); }
                }
                if (game.miniBoss3 && !game.miniBoss3.dying && checkCollision(player.attackBox, game.miniBoss3)) {
                    game.miniBoss3.health -= 20;
                    if (game.miniBoss3.health <= 0) { handleBossDeath('miniBoss3', player); }
                }
                if (game.boss && !game.boss.dying && checkCollision(player.attackBox, game.boss)) {
                    game.boss.health -= 20;
                    if (game.boss.health <= 0) { handleBossDeath('boss', player); }
                }
            }
        });

        game.projectiles.forEach((projectile, pIndex) => {
            projectile.update(); projectile.draw();
            if (!projectile.active) { game.projectiles.splice(pIndex, 1); return; }
            for (let i = game.enemies.length - 1; i >= 0; i--) {
                const enemy = game.enemies[i];
                if (checkCollision(projectile, enemy)) {
                    enemy.health -= 50; projectile.active = false;
                    if (enemy.health <= 0) { killEnemy(i, projectile.owner); }
                }
            }
            if (game.miniBoss && !game.miniBoss.dying && checkCollision(projectile, game.miniBoss)) {
                game.miniBoss.health -= 50; projectile.active = false;
                if (game.miniBoss.health <= 0) { handleBossDeath('miniBoss', projectile.owner); }
            }
            if (game.miniBoss2 && !game.miniBoss2.dying && checkCollision(projectile, game.miniBoss2)) {
                game.miniBoss2.health -= 50; projectile.active = false;
                if (game.miniBoss2.health <= 0) { handleBossDeath('miniBoss2', projectile.owner); }
            }
            if (game.miniBoss3 && !game.miniBoss3.dying && checkCollision(projectile, game.miniBoss3)) {
                game.miniBoss3.health -= 50; projectile.active = false;
                if (game.miniBoss3.health <= 0) { handleBossDeath('miniBoss3', projectile.owner); }
            }
            if (game.boss && !game.boss.dying && checkCollision(projectile, game.boss)) {
                game.boss.health -= 50; projectile.active = false;
                if (game.boss.health <= 0) { handleBossDeath('boss', projectile.owner); }
            }
        });

        game.enemies.forEach(enemy => {
            enemy.update(); enemy.draw();
            game.players.forEach(player => { if (player.health > 0 && checkCollision(enemy, player)) { player.health -= 0.05; } });
        });

        if (game.miniBoss) {
            if (game.miniBoss.dying) {
                game.miniBoss.alpha -= 0.005;
                if (game.miniBoss.alpha <= 0) { game.miniBoss = null; game.fadeDirection = 1; game.fadeAlpha = 0; game.nextState = 'wave_4_transition'; }
            } else {
                let closestPlayer = null; let minDist = Infinity;
                game.players.forEach(player => { if (player.health > 0) { const dist = Math.hypot(player.x - game.miniBoss.x, game.miniBoss.y); if (dist < minDist) { minDist = dist; closestPlayer = player; } } });
                if (closestPlayer) {
                    if (game.miniBoss.x < closestPlayer.x) { game.miniBoss.x += game.miniBoss.speed; game.miniBoss.facing = 1; }
                    if (game.miniBoss.x > closestPlayer.x) { game.miniBoss.x -= game.miniBoss.speed; game.miniBoss.facing = -1; }
                    if (game.miniBoss.y < closestPlayer.y) game.miniBoss.y += game.miniBoss.speed;
                    if (game.miniBoss.y > closestPlayer.y) game.miniBoss.y -= game.miniBoss.speed;
                }
                game.miniBoss.update();
                game.players.forEach(player => { if (player.health > 0 && checkCollision(game.miniBoss, player)) player.health -= 0.1; });
            }
            if (game.miniBoss) game.miniBoss.draw();
        }

        if (game.miniBoss2) {
            if (game.miniBoss2.dying) {
                game.miniBoss2.alpha -= 0.005;
                if (game.miniBoss2.alpha <= 0) { game.miniBoss2 = null; game.fadeDirection = 1; game.fadeAlpha = 0; game.nextState = 'wave_7_transition'; }
            } else {
                let closestPlayer = null; let minDist = Infinity;
                game.players.forEach(player => { if (player.health > 0) { const dist = Math.hypot(player.x - game.miniBoss2.x, game.miniBoss2.y); if (dist < minDist) { minDist = dist; closestPlayer = player; } } });
                if (closestPlayer) {
                    if (game.miniBoss2.x < closestPlayer.x) { game.miniBoss2.x += game.miniBoss2.speed; game.miniBoss2.facing = 1; }
                    if (game.miniBoss2.x > closestPlayer.x) { game.miniBoss2.x -= game.miniBoss2.speed; game.miniBoss2.facing = -1; }
                    if (game.miniBoss2.y < closestPlayer.y) game.miniBoss2.y += game.miniBoss2.speed;
                    if (game.miniBoss2.y > closestPlayer.y) game.miniBoss2.y -= game.miniBoss2.speed;
                }
                game.miniBoss2.update();
                game.players.forEach(player => { if (player.health > 0 && checkCollision(game.miniBoss2, player)) player.health -= 0.15; });
            }
            if (game.miniBoss2) game.miniBoss2.draw();
        }

        if (game.miniBoss3) {
            if (game.miniBoss3.dying) {
                game.miniBoss3.alpha -= 0.005;
                if (game.miniBoss3.alpha <= 0) { game.miniBoss3 = null; game.fadeDirection = 1; game.fadeAlpha = 0; game.nextState = 'black_screen_boss_warning'; } // Go to black screen warning!
            } else {
                let closestPlayer = null; let minDist = Infinity;
                game.players.forEach(player => { if (player.health > 0) { const dist = Math.hypot(player.x - game.miniBoss3.x, game.miniBoss3.y); if (dist < minDist) { minDist = dist; closestPlayer = player; } } });
                if (closestPlayer) {
                    if (game.miniBoss3.x < closestPlayer.x) { game.miniBoss3.x += game.miniBoss3.speed; game.miniBoss3.facing = 1; }
                    if (game.miniBoss3.x > closestPlayer.x) { game.miniBoss3.x -= game.miniBoss3.speed; game.miniBoss3.facing = -1; }
                    if (game.miniBoss3.y < closestPlayer.y) game.miniBoss3.y += game.miniBoss3.speed;
                    if (game.miniBoss3.y > closestPlayer.y) game.miniBoss3.y -= game.miniBoss3.speed;
                }
                game.miniBoss3.update();
                game.players.forEach(player => { if (player.health > 0 && checkCollision(game.miniBoss3, player)) player.health -= 0.15; });
            }
            if (game.miniBoss3) game.miniBoss3.draw();
        }

        if (game.boss) {
            if (game.boss.dying) {
                game.boss.alpha -= 0.005;
                if (game.boss.alpha <= 0) { game.boss = null; game.state = 'victory'; game.victoryTicks = 300; }
            } else {
                let closestPlayer = null; let minDist = Infinity;
                game.players.forEach(player => { if (player.health > 0) { const dist = Math.hypot(player.x - game.boss.x, game.boss.y); if (dist < minDist) { minDist = dist; closestPlayer = player; } } });
                if (closestPlayer) {
                    if (game.boss.x < closestPlayer.x) { game.boss.x += game.boss.speed; game.boss.facing = -1; }
                    if (game.boss.x > closestPlayer.x) { game.boss.x -= game.boss.speed; game.boss.facing = 1; }
                    if (game.boss.y < closestPlayer.y) game.boss.y += game.boss.speed;
                    if (game.boss.y > closestPlayer.y) game.boss.y -= game.boss.speed;
                }
                game.boss.update();
                game.players.forEach(player => { if (player.health > 0 && checkCollision(game.boss, player)) player.health -= 0.2; });
            }
            if (game.boss) game.boss.draw();
        }

        if (game.players.length >= 1) { document.getElementById('p1-health').innerText = ''; document.getElementById('p1-kills').innerText = `Dino Kills: ${game.players[0].kills}`; }
        if (game.players.length >= 2) { document.getElementById('p2-health').innerText = ''; document.getElementById('p2-kills').innerText = `Dragon Kills: ${game.players[1].kills}`; }
        
        ctx.fillStyle = 'white'; ctx.font = '26px Arial'; ctx.fillText(`Wave: ${game.wave}`, 10, 30); ctx.fillText(`Score: ${game.score}`, 10, 70);
        // Boss health meters removed

        // SOLID BANNER, FLASHING TEXT
        if (game.warningTicks > 0) {
            ctx.save(); ctx.fillStyle = 'rgba(0, 0, 0, 0.6)'; ctx.fillRect(0, canvas.height / 2 - 50, canvas.width, 100);
            if (Math.floor(game.warningTicks / 10) % 2 === 0) { ctx.fillStyle = 'yellow'; ctx.font = 'bold 60px Impact, Arial Black'; ctx.textAlign = 'center'; ctx.fillText('MINI-BOSS IS COMING!', canvas.width / 2, canvas.height / 2 + 20); }
            ctx.restore();
        }

        // Update and draw particles
        for (let i = game.particles.length - 1; i >= 0; i--) {
            const p = game.particles[i]; p.update(); p.draw();
            if (p.alpha <= 0) { game.particles.splice(i, 1); }
        }
    }

    if (game.fadeDirection !== 0) {
        game.fadeAlpha += game.fadeDirection * game.fadeSpeed;
        if (game.fadeDirection === 1 && game.fadeAlpha >= 1) {
            game.fadeAlpha = 1;
            if (game.nextState === 'playing') { game.fadeDirection = -1; game.state = 'playing'; startGame(game.playerCount); }
            else if (game.nextState === 'gameover_screen') { game.fadeDirection = 0; game.state = 'gameover_screen'; }
            else if (game.nextState === 'wave_4_transition') {
                game.fadeDirection = -1; game.state = 'playing'; game.wave++; assets.background = assets.jungleBackground;
            }
            else if (game.nextState === 'wave_7_transition') {
                game.fadeDirection = -1; game.state = 'playing'; game.wave++; assets.background = assets.outerSpaceBackground;
            }
            else if (game.nextState === 'black_screen_boss_warning') {
                game.fadeDirection = 0; // Stay black
                game.bossWarningTicks = 180; // Start warning
                game.state = 'boss_warning_hold';
            }
        } else if (game.fadeDirection === -1 && game.fadeAlpha <= 0) {
            game.fadeAlpha = 0; game.fadeDirection = 0;
            if (game.nextState === 'wave_4_transition' || game.nextState === 'wave_7_transition' || game.nextState === 'playing') {
                game.waveSpawnDelay = 60; // Wait 1s before spawning
            }
            game.nextState = null;
        }
        ctx.save(); ctx.globalAlpha = game.fadeAlpha; ctx.fillStyle = 'black'; ctx.fillRect(0, 0, canvas.width, canvas.height); ctx.restore();
    }
    requestAnimationFrame(loop);
}

window.addEventListener('keydown', (e) => {
    game.keys[e.code] = true;
    if (game.state === 'menu') {
        if (e.code === 'ArrowUp') { game.menuIndex = (game.menuIndex - 1 + game.menuOptions.length) % game.menuOptions.length; }
        else if (e.code === 'ArrowDown') { game.menuIndex = (game.menuIndex + 1) % game.menuOptions.length; }
        else if (e.code === 'ArrowLeft') { game.difficultyIndex = (game.difficultyIndex - 1 + game.difficulties.length) % game.difficulties.length; }
        else if (e.code === 'ArrowRight') { game.difficultyIndex = (game.difficultyIndex + 1) % game.difficulties.length; }
        else if (e.code === 'Enter') { game.menuFlashing = true; game.menuFlashTicks = 60; game.fadeSpeed = 0.05; }
    } else if (game.state === 'victory') {
        if (game.victoryTicks === 0) { resetGame(); }
    } else if (game.state === 'gameover_screen') {
        resetGame();
    }
});

window.addEventListener('keyup', (e) => {
    game.keys[e.code] = false;
});
