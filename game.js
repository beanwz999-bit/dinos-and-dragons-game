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
    hearts: [], // Changed to array
    diamonds: [], // Changed to array
    lightnings: [], // Changed to array
    meteors: [], // Changed to array
    reviveItems: [], // Changed to array
    wands: [],
    ringEffect: null,
    lightningEffect: null,
    meteorEffect: null,
    keys: {},
    wave: 1,
    score: 0,
    state: 'menu', // 'menu', 'char_select', 'playing', 'gameover_delay', 'gameover_fading', 'gameover_screen', 'victory', 'boss_warning_hold'
    warningTicks: 0,
    miniBossTriggered: false,
    miniBoss2Triggered: false,
    miniBoss3Triggered: false,
    bossWarningTicks: 0,
    bossTriggered: false,
    menuIndex: 0,
    menuOptions: ['Start Game', 'Training Mode'], // Updated
    difficultyIndex: 2, // Default to Normal
    difficulties: ['Kids', 'Easy', 'Normal', 'Hard', 'Extreme'],
    availableCharacters: ['dino', 'dragon', 'unicorn', 'frog', 'lion', 'axolotl'],
    selectedCharacters: [0, 1, 2], // Current hovered character index
    lockedCharacters: [false, false, false], // Track if player has locked in
    selectedColors: [0, 0, 0],
    lockedColors: [false, false, false],
    selectedDifficulties: [2, 2, 2],
    lockedDifficulties: [false, false, false],
    playerJoined: [true, false, false],
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
    wandWave: 0,
    wandSpawned: false,
    fadeSpeed: 0.05,
    waveSpawnDelay: 0,
    waveTextTicks: 0,
    paused: false,
    pauseMenuIndex: 0,
    pauseMenuOptions: ['Resume', 'Restart', 'Quit Game'],
    trainingMenuIndex: 0,
    trainingMenuOptions: ['Play Again', 'Quit to Menu']
};

// Load Images
const assets = {
    dino: { walk: null, attack: null },
    dragon: { walk: null, attack: null },
    unicorn: { walk: null, attack: null },
    frog: { walk: null, attack: null },
    lion: { walk: null, attack: null },
    axolotl: { walk: null, attack: null },
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
    lightning: null,
    revivePotion: null,
    cheeseburger: null
};

const imageSources = {
    dino_walk: 'dino_walk.png',
    dino_attack: 'dino_attack.png',
    dragon_walk: 'dragon_walk.png',
    dragon_attack: 'dragon_attack.png',
    unicorn_walk: 'unicorn_walk.png',
    unicorn_attack: 'unicorn_attack.png',
    frog_walk: 'frog_walk.png',
    frog_attack: 'frog_attack.png',
    lion_walk: 'lion_walk.png',
    lion_attack: 'lion_attack.png',
    axolotl_walk: 'axolotl_walk.png',
    axolotl_attack: 'axolotl_attack.png',
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
    lightning: 'lightning.png',
    revivePotion: 'revive_potion.png',
    cheeseburger: 'cheeseburger.png'
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
const totalAssets = 33; // Updated count

function checkLoaded() {
    loadedCount++;
    console.log(`Loaded asset ${loadedCount}/33`);
    if (loadedCount === 33) {
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
        if (key === 'diamond' || key === 'lightning' || key === 'miniBoss2' || key === 'miniBoss3' || key === 'alien_ufo' || key === 'revivePotion' || key === 'unicorn_walk' || key === 'unicorn_attack' || key === 'frog_walk' || key === 'frog_attack' || key === 'lion_walk' || key === 'lion_attack' || key === 'axolotl_walk' || key === 'axolotl_attack' || key === 'cheeseburger') { transparentCanvas = makeTransparent(img, 250); }
        else { transparentCanvas = makeTransparent(img, 150); }
        
        if (key === 'boss' || key === 'miniBoss' || key === 'miniBoss2' || key === 'miniBoss3' || key === 'bee' || key === 'alien_ufo' || key === 'heart' || key === 'diamond' || key === 'lightning' || key === 'revivePotion' || key === 'cheeseburger') { assets[key] = transparentCanvas; }
        else if (key === 'rock' || key === 'fireball') { assets[key] = transparentCanvas; }
        else {
            const [char, action] = key.split('_');
            if (char === 'unicorn' || char === 'frog' || char === 'lion' || char === 'axolotl') { assets[char][action] = transparentCanvas; }
            else { assets[char][action] = transparentCanvas; }
        }
        checkLoaded();
    };
    img.onerror = () => { console.error(`Failed to load image: ${src}`); checkLoaded(); };
}

function drawStar(cx, cy, spikes, outerRadius, innerRadius, color) {
    let rot = Math.PI / 2 * 3; let x = cx; let y = cy; let step = Math.PI / spikes;
    ctx.beginPath(); ctx.moveTo(cx, cy - outerRadius)
    for (let i = 0; i < spikes; i++) { x = cx + Math.cos(rot) * outerRadius; y = cy + Math.sin(rot) * outerRadius; ctx.lineTo(x, y); rot += step; x = cx + Math.cos(rot) * innerRadius; y = cy + Math.sin(rot) * innerRadius; ctx.lineTo(x, y); rot += step; }
    ctx.lineTo(cx, cy - outerRadius); ctx.closePath(); ctx.fillStyle = color; ctx.fill();
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
        if (this.assetKey === 'boss' || this.assetKey === 'miniBoss' || this.assetKey === 'miniBoss2' || this.assetKey === 'miniBoss3' || this.assetKey === 'bee' || this.assetKey === 'alien_ufo' || this.assetKey === 'heart' || this.assetKey === 'diamond' || this.assetKey === 'lightning' || this.assetKey === 'revivePotion' || this.assetKey === 'cheeseburger') { img = asset; }
        else { img = asset ? asset[this.currentAction] : null; }

        if (img) {
            ctx.save(); ctx.globalAlpha = this.alpha; ctx.translate(this.x + this.width / 2, this.y + this.height / 2); ctx.scale(this.facing, 1);
            if (this.colorIndex === 1) ctx.filter = 'hue-rotate(90deg)';
            else if (this.colorIndex === 2) ctx.filter = 'hue-rotate(180deg)';
            if (this.assetKey === 'boss' || this.assetKey === 'miniBoss' || this.assetKey === 'miniBoss2' || this.assetKey === 'miniBoss3' || this.assetKey === 'bee' || this.assetKey === 'alien_ufo' || this.assetKey === 'heart' || this.assetKey === 'diamond' || this.assetKey === 'lightning' || this.assetKey === 'revivePotion' || this.assetKey === 'cheeseburger') { ctx.drawImage(img, -this.width / 2, -this.height / 2, this.width, this.height); }
            else {
                const frameWidth = img.width / 2; const frameHeight = img.height / 2; const col = this.frameIndex % 2; const row = Math.floor(this.frameIndex / 2); const sx = col * frameWidth; const sy = row * frameHeight;
                ctx.drawImage(img, sx, sy, frameWidth, frameHeight, -this.width / 2, -this.height / 2, this.width, this.height);
            }
            ctx.restore();

            if (this.health < this.maxHealth || this.assetKey === 'catfish' || this.assetKey === 'bee' || this.assetKey === 'alien_ufo' || this.assetKey === 'dino' || this.assetKey === 'dragon' || this.assetKey === 'unicorn' || this.assetKey === 'frog' || this.assetKey === 'lion' || this.assetKey === 'axolotl') {
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
        this.x = x; this.y = y; this.imageKey = imageKey;
        this.width = 40; this.height = 40; this.speedX = speedX; this.speedY = speedY; this.owner = owner; this.active = true; this.facing = speedX > 0 ? 1 : -1;
    }
    draw() {
        if (this.imageKey === 'rainbow') {
            ctx.save(); ctx.translate(this.x + this.width / 2, this.y + this.height / 2); ctx.scale(this.facing, 1);
            const colors = ['red', 'orange', 'yellow', 'green', 'blue', 'purple'];
            const baseRadius = 30;
            colors.forEach((color, index) => {
                ctx.beginPath(); ctx.arc(0, 0, baseRadius - index * 3, -Math.PI / 2, Math.PI / 2); ctx.strokeStyle = color; ctx.lineWidth = 3; ctx.stroke();
            });
            ctx.restore();
        } else if (this.imageKey === 'bubble') {
            ctx.save(); ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
            ctx.beginPath(); ctx.arc(0, 0, 15, 0, Math.PI * 2); ctx.fillStyle = 'rgba(173, 216, 230, 0.5)'; ctx.fill();
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)'; ctx.lineWidth = 2; ctx.stroke();
            ctx.beginPath(); ctx.arc(-5, -5, 3, 0, Math.PI * 2); ctx.fillStyle = 'white'; ctx.fill();
            ctx.restore();
        } else if (this.imageKey === 'talon') {
            ctx.save(); ctx.translate(this.x + this.width / 2, this.y + this.height / 2); ctx.scale(this.facing * 1.5, 1.5);
            ctx.beginPath(); ctx.moveTo(-10, -10); ctx.quadraticCurveTo(10, 0, -10, 10); ctx.quadraticCurveTo(0, 0, -10, -10); ctx.fillStyle = 'indigo'; ctx.fill();
            ctx.restore();
        } else if (this.imageKey === 'star') {
            ctx.save(); ctx.translate(this.x + this.width / 2, this.y + this.height / 2); drawStar(0, 0, 5, 15, 7, 'yellow'); ctx.restore();
        } else {
            const img = assets[this.imageKey];
            if (img) { ctx.save(); ctx.translate(this.x + this.width / 2, this.y + this.height / 2); ctx.scale(this.facing, 1); ctx.drawImage(img, -this.width / 2, -this.height / 2, this.width, this.height); ctx.restore(); }
            else { ctx.fillStyle = 'red'; ctx.fillRect(this.x, this.y, this.width, this.height); }
        }
    }
    update() { this.x += this.speedX; this.y += this.speedY; if (this.x < 0 || this.x > canvas.width || this.y < 0 || this.y > canvas.height) { this.active = false; } }
}

class Particle {
    constructor(x, y, color) {
        this.x = x; this.y = y; this.color = color; this.radius = Math.random() * 3 + 2; this.speedX = Math.random() * 6 - 3; this.speedY = Math.random() * 6 - 3; this.alpha = 1; this.decay = Math.random() * 0.02 + 0.01; this.isStar = false;
    }
    update() { this.x += this.speedX; this.y += this.speedY; this.alpha -= this.decay; }
    draw() { ctx.save(); ctx.globalAlpha = this.alpha; if (this.isStar) { drawStar(this.x, this.y, 5, this.radius * 2, this.radius, this.color); } else { ctx.fillStyle = this.color; ctx.beginPath(); ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2); ctx.fill(); } ctx.restore(); }
}

class Player extends Character {
    constructor(x, y, assetKey, controls, colorIndex = 0, difficultyIndex = 2) {
        super(x, y, 100, 100, assetKey); this.controls = controls; this.attackBox = { x: this.x, y: this.y, width: 50, height: 50 }; this.superCooldown = 0; this.superCooldownMax = 60; this.kills = 0; this.colorIndex = colorIndex; this.forcefieldTicks = 0; this.extraLives = 0; this.difficultyIndex = difficultyIndex; this.hasHit = false;
    }
    update() {
        if (this.health <= 0) {
            if (this.extraLives > 0) {
                this.extraLives--;
                this.health = this.maxHealth;
                this.forcefieldTicks = 120;
                console.log(`Player respawned! Lives left: ${this.extraLives}`);
            } else {
                return;
            }
        }
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
        this.isAttacking = true; this.currentAction = 'attack'; this.frameIndex = 0; this.tickCount = 0; this.hasHit = false;
        if (type === 'attack') { this.attackBox.width = 60; this.attackBox.height = 40; this.attackBox.y = this.y + 30; }
        else if (type === 'super') { this.attackBox.width = 0; this.attackBox.height = 0; }
    }
    useSuper() {
        if (this.assetKey === 'dino') { const speedX = this.facing * 4.2; const projectile = new Projectile(this.x + this.width / 2, this.y + this.height / 2, speedX, 0, 'rock', this); game.projectiles.push(projectile); }
        else if (this.assetKey === 'dragon') { const speedX = this.facing * 6.3; const projectile = new Projectile(this.x + this.width / 2, this.y + this.height / 2, speedX, 0, 'fireball', this); game.projectiles.push(projectile); }
        else if (this.assetKey === 'unicorn') { const speedX = this.facing * 5.0; const projectile = new Projectile(this.x + this.width / 2, this.y + this.height / 2, speedX, 0, 'rainbow', this); game.projectiles.push(projectile); }
        else if (this.assetKey === 'frog') { const speedX = this.facing * 4.0; const projectile = new Projectile(this.x + this.width / 2, this.y + this.height / 2, speedX, 0, 'bubble', this); game.projectiles.push(projectile); }
        else if (this.assetKey === 'lion') { const speedX = this.facing * 6.0; const projectile = new Projectile(this.x + this.width / 2, this.y + this.height / 2, speedX, 0, 'talon', this); projectile.width = 60; projectile.height = 60; game.projectiles.push(projectile); }
        else if (this.assetKey === 'axolotl') { const speedX = this.facing * 5.0; const projectile = new Projectile(this.x + this.width / 2, this.y + this.height / 2, speedX, 0, 'star', this); game.projectiles.push(projectile); }
        this.superCooldown = this.superCooldownMax;
    }
}

class Enemy extends Character {
    constructor(x, y, width, height, assetKey) { super(x, y, width, height, assetKey); this.speed = 1.75; this.forcefieldCooldown = 0; } // Reduced speed by 30%
    update() {
        let closestPlayer = null; let minDist = Infinity;
        game.players.forEach(player => { if (player.health > 0) { const dist = Math.hypot(player.x - this.x, player.y - this.y); if (dist < minDist) { minDist = dist; closestPlayer = player; } } });
        if (closestPlayer) {
            const speedMultipliers = [0.5, 1.0, 1.0, 1.2, 1.2];
            const speedMultiplier = speedMultipliers[closestPlayer.difficultyIndex];
            const currentSpeed = this.speed * speedMultiplier;
            
            const dx = closestPlayer.x - this.x;
            const dy = closestPlayer.y - this.y;
            const dist = Math.hypot(dx, dy);
            if (dist > 0) {
                this.x += (dx / dist) * currentSpeed;
                this.y += (dy / dist) * currentSpeed;
                this.facing = dx > 0 ? 1 : -1;
            }
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
    const countMultiplier = 1.0;
    const healthMultiplier = 1.0;
    const speedMultiplier = 1.0;
    const playerCountMultiplier = game.playerCount === 1 ? 0.75 : 1.0;
    
    const baseCount = game.wave * 2 + 2;
    const count = Math.ceil(baseCount * countMultiplier * playerCountMultiplier);
    
    for (let i = 0; i < count; i++) {
        const x = Math.random() < 0.5 ? -50 : canvas.width + 50;
        const y = Math.random() * (canvas.height - 80);
        let assetKey = 'catfish';
        if (game.wave >= 4 && game.wave <= 6) { assetKey = 'bee'; }
        else if (game.wave >= 7) { assetKey = 'alien_ufo'; }
        
        const enemy = new Enemy(x, y, 80, 80, assetKey);
        enemy.maxHealth = 100 * healthMultiplier;
        enemy.health = enemy.maxHealth;
        enemy.speed = 1.75;
        if (assetKey === 'alien_ufo') { enemy.speed = 1.2; } // Slower UFOs
        game.enemies.push(enemy);
    }
    if (game.wave === game.diamondWave && !game.diamondSpawned) { game.diamonds.push({ x: Math.random() * (canvas.width - 150), y: Math.random() * (canvas.height - 150), width: 150, height: 150, active: true }); game.diamondSpawned = true; }
    if (game.wave === game.lightningWave && !game.lightningSpawned) { game.lightnings.push({ x: Math.random() * (canvas.width - 80), y: Math.random() * (canvas.height - 80), width: 80, height: 80, active: true }); game.lightningSpawned = true; }
    if (game.wave === game.meteorWave && !game.meteorSpawned) { game.meteors.push({ x: Math.random() * (canvas.width - 80), y: Math.random() * (canvas.height - 80), width: 80, height: 80, active: true }); game.meteorSpawned = true; }
    
    if (game.wave === game.wandWave && !game.wandSpawned) {
        game.wands.push({ x: Math.random() * (canvas.width - 50), y: Math.random() * (canvas.height - 50), width: 50, height: 50, active: true });
        game.wandSpawned = true;
    }

    if (Math.random() < 0.2) {
        const rand = Math.random();
        if (rand < 0.25) { game.diamonds.push({ x: Math.random() * (canvas.width - 150), y: Math.random() * (canvas.height - 150), width: 150, height: 150, active: true }); }
        else if (rand < 0.5) { game.lightnings.push({ x: Math.random() * (canvas.width - 80), y: Math.random() * (canvas.height - 80), width: 80, height: 80, active: true }); }
        else if (rand < 0.75) { game.meteors.push({ x: Math.random() * (canvas.width - 80), y: Math.random() * (canvas.height - 80), width: 80, height: 80, active: true }); }
        else { game.wands.push({ x: Math.random() * (canvas.width - 50), y: Math.random() * (canvas.height - 50), width: 50, height: 50, active: true }); }
    }
    
    if ((game.wave === 4 || game.wave === 8) && game.playerCount >= 2) { spawnReviveItem(); }
    if (game.wave === 6 && game.playerCount === 3) { spawnReviveItem(); }
}

function createFirework(x, y) {
    const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff', '#ffd700'];
    const color = colors[Math.floor(Math.random() * colors.length)];
    for (let i = 0; i < 50; i++) { game.particles.push(new Particle(x, y, color)); }
}

function createRainbowExplosion(x, y) {
    const colors = ['red', 'orange', 'yellow', 'green', 'blue', 'purple'];
    for (let i = 0; i < 30; i++) { const color = colors[Math.floor(Math.random() * colors.length)]; game.particles.push(new Particle(x, y, color)); }
}

function createPopParticles(x, y) {
    for (let i = 0; i < 10; i++) { game.particles.push(new Particle(x, y, 'rgba(255, 255, 255, 0.8)')); }
}

function createStarExplosion(x, y) {
    for (let i = 0; i < 15; i++) { const p = new Particle(x, y, 'yellow'); p.isStar = true; game.particles.push(p); }
}

function spawnMiniBoss() {
    game.miniBoss = new Character(canvas.width - 250, 200, 220, 220, 'miniBoss');
    game.miniBoss.maxHealth = 500; game.miniBoss.health = game.miniBoss.maxHealth; game.miniBoss.speed = 1.0;
    console.log('Mini-boss spawned!');
}

function spawnMiniBoss2() {
    game.miniBoss2 = new Character(canvas.width - 250, 200, 260, 260, 'miniBoss2');
    game.miniBoss2.maxHealth = 650; game.miniBoss2.health = game.miniBoss2.maxHealth; game.miniBoss2.speed = 0.9;
    console.log('Mini-boss 2 spawned!');
}

function spawnMiniBoss3() {
    game.miniBoss3 = new Character(canvas.width - 250, 200, 260, 260, 'miniBoss3');
    game.miniBoss3.maxHealth = 650; game.miniBoss3.health = game.miniBoss3.maxHealth; game.miniBoss3.speed = 0.9;
    console.log('Mini-boss 3 spawned!');
}

function spawnBoss() {
    game.boss = new Character(canvas.width - 350, 100, 300, 300, 'boss');
    game.boss.maxHealth = 1250; game.boss.health = game.boss.maxHealth; game.boss.speed = 0.8;
    console.log('Boss spawned!');
}

function spawnHeart() { game.hearts.push({ x: Math.random() * (canvas.width - 50), y: Math.random() * (canvas.height - 50), width: 50, height: 50, active: true }); console.log('Heart spawned!'); }
function spawnReviveItem() { game.reviveItems.push({ x: Math.random() * (canvas.width - 60), y: Math.random() * (canvas.height - 60), width: 60, height: 60, active: true }); console.log('Revive potion spawned!'); }

function drawMeteorItem(x, y, width, height) {
    ctx.save(); ctx.beginPath(); ctx.moveTo(x + width, y); ctx.lineTo(x + width * 0.2, y + height * 0.6); ctx.lineTo(x + width * 0.5, y + height * 0.5); ctx.lineTo(x + width * 0.1, y + height * 0.9); ctx.lineTo(x + width * 0.4, y + height * 0.7); ctx.lineTo(x + width * 0.3, y + height * 0.8); ctx.lineTo(x + width * 0.8, y + height * 0.2); ctx.closePath(); ctx.fillStyle = 'rgba(255, 50, 0, 0.9)'; ctx.fill(); ctx.beginPath(); ctx.moveTo(x + width, y); ctx.lineTo(x + width * 0.3, y + height * 0.5); ctx.lineTo(x + width * 0.6, y + height * 0.4); ctx.lineTo(x + width * 0.2, y + height * 0.8); ctx.lineTo(x + width * 0.7, y + height * 0.3); ctx.closePath(); ctx.fillStyle = 'rgba(255, 150, 0, 0.9)'; ctx.fill(); ctx.beginPath(); ctx.moveTo(x + width, y); ctx.lineTo(x + width * 0.5, y + height * 0.6); ctx.lineTo(x + width * 0.4, y + height * 0.7); ctx.closePath(); ctx.fillStyle = 'rgba(255, 255, 0, 0.9)'; ctx.fill(); ctx.beginPath(); ctx.moveTo(x + width * 0.1, y + height * 0.7); ctx.lineTo(x + width * 0.3, y + height * 0.6); ctx.lineTo(x + width * 0.5, y + height * 0.8); ctx.lineTo(x + width * 0.4, y + height * 1.0); ctx.lineTo(x, y + height * 0.9); ctx.closePath(); ctx.fillStyle = '#696969'; ctx.fill(); ctx.strokeStyle = '#333'; ctx.lineWidth = 2; ctx.stroke(); ctx.beginPath(); ctx.arc(x + width * 0.2, y + height * 0.8, 4, 0, Math.PI * 2); ctx.fillStyle = '#333'; ctx.fill(); ctx.beginPath(); ctx.arc(x + width * 0.3, y + height * 0.9, 2, 0, Math.PI * 2); ctx.fillStyle = '#333'; ctx.fill(); ctx.restore();
}

function drawWand(x, y, width, height) {
    ctx.save(); ctx.translate(x + width / 2, y + height / 2); ctx.rotate(-Math.PI / 4);
    
    // Thicker straight handle
    ctx.fillStyle = '#8B4513'; ctx.fillRect(-5, -height / 2, 10, height);
    
    // Twirling colors
    const colors = ['red', 'orange', 'yellow', 'green', 'blue', 'purple'];
    ctx.lineWidth = 3;
    const timeOffset = Date.now() / 50;
    
    for (let i = -height / 2; i <= height / 2; i += 2) {
        ctx.beginPath();
        const x1 = Math.sin((i + timeOffset) / 8) * 8;
        const x2 = Math.sin((i + 2 + timeOffset) / 8) * 8;
        ctx.moveTo(x1, i);
        ctx.lineTo(x2, i + 2);
        ctx.strokeStyle = colors[Math.floor((i + height / 2) / 5) % colors.length];
        ctx.stroke();
    }
    
    drawStar(0, -height / 2, 5, 15, 7, 'yellow'); ctx.restore();
}


function getBaseColor(assetKey, colorIndex) {
    const baseColors = { dino: 'green', dragon: 'red', unicorn: 'pink', frog: 'green', lion: 'orange', axolotl: 'pink' };
    let color = baseColors[assetKey] || 'white';
    return color;
}

function triggerRingEffect(x, y, player) {
    game.ringEffect = { x: x, y: y, radius: 0, maxRadius: 2000, active: true };
    for (let i = game.enemies.length - 1; i >= 0; i--) { const enemy = game.enemies[i]; enemy.health -= 50; if (enemy.health <= 0) { killEnemy(i, player); } }
    if (game.miniBoss && !game.miniBoss.dying) { game.miniBoss.health -= 50; if (game.miniBoss.health <= 0) { handleBossDeath('miniBoss', player); } }
    if (game.miniBoss2 && !game.miniBoss2.dying) { game.miniBoss2.health -= 50; if (game.miniBoss2.health <= 0) { handleBossDeath('miniBoss2', player); } }
    if (game.miniBoss3 && !game.miniBoss3.dying) { game.miniBoss3.health -= 50; if (game.miniBoss3.health <= 0) { handleBossDeath('miniBoss3', player); } }
    if (game.boss && !game.boss.dying) { game.boss.health -= 50; if (game.boss.health <= 0) { handleBossDeath('boss', player); } }
}

function triggerLightningEffect(player) {
    game.lightningEffect = { active: true, ticks: 30, targets: [] };
    const generatePoints = (startX, startY, endX, endY) => { const points = []; let curY = startY; let curX = startX; points.push({x: curX, y: curY}); while (curY < endY) { curY += 30; curX += Math.random() * 40 - 20; points.push({x: curX, y: curY}); } points.push({x: endX, y: endY}); return points; };
    for (let i = game.enemies.length - 1; i >= 0; i--) { const enemy = game.enemies[i]; const targetX = enemy.x + enemy.width / 2; const targetY = enemy.y + enemy.height / 2; game.lightningEffect.targets.push({ points: generatePoints(targetX, 0, targetX, targetY) }); enemy.health -= 50; if (enemy.health <= 0) { killEnemy(i, player); } }
    if (game.miniBoss && !game.miniBoss.dying) { const targetX = game.miniBoss.x + game.miniBoss.width / 2; const targetY = game.miniBoss.y + game.miniBoss.height / 2; game.lightningEffect.targets.push({ points: generatePoints(targetX, 0, targetX, targetY) }); game.miniBoss.health -= 50; if (game.miniBoss.health <= 0) { handleBossDeath('miniBoss', player); } }
    if (game.miniBoss2 && !game.miniBoss2.dying) { const targetX = game.miniBoss2.x + game.miniBoss2.width / 2; const targetY = game.miniBoss2.y + game.miniBoss2.height / 2; game.lightningEffect.targets.push({ points: generatePoints(targetX, 0, targetX, targetY) }); game.miniBoss2.health -= 50; if (game.miniBoss2.health <= 0) { handleBossDeath('miniBoss2', player); } }
    if (game.miniBoss3 && !game.miniBoss3.dying) { const targetX = game.miniBoss3.x + game.miniBoss3.width / 2; const targetY = game.miniBoss3.y + game.miniBoss3.height / 2; game.lightningEffect.targets.push({ points: generatePoints(targetX, 0, targetX, targetY) }); game.miniBoss3.health -= 50; if (game.miniBoss3.health <= 0) { handleBossDeath('miniBoss3', player); } }
    if (game.boss && !game.boss.dying) { const targetX = game.boss.x + game.boss.width / 2; const targetY = game.boss.y + game.boss.height / 2; game.lightningEffect.targets.push({ points: generatePoints(targetX, 0, targetX, targetY) }); game.boss.health -= 50; if (game.boss.health <= 0) { handleBossDeath('boss', player); } }
}

function triggerMeteorEffect(player) {
    game.meteorEffect = { active: true, x: -100, y: -100, targetX: canvas.width / 2, targetY: canvas.height / 2, progress: 0, exploding: false, explosionRadius: 0, player: player, damaged: false };
}

function canLockColor(playerIndex, colorIndex) {
    const charIndex = game.selectedCharacters[playerIndex];
    for (let i = 0; i < game.playerCount; i++) { if (i !== playerIndex && game.lockedCharacters[i] && game.selectedCharacters[i] === charIndex && game.lockedColors[i] && game.selectedColors[i] === colorIndex) { return false; } }
    return true;
}

function killEnemy(index, player) {
    console.log(`killEnemy called for index ${index}`);
    const enemy = game.enemies[index];
    if (!enemy) { console.error(`Enemy at index ${index} is undefined!`); return; }
    for (let i = 0; i < 20; i++) { game.particles.push(new Particle(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, '#ff4500')); }
    game.enemies.splice(index, 1); game.score += 10; player.kills++;
}

function handleBossDeath(bossKey, player) {
    const boss = game[bossKey];
    if (boss && !boss.dying) { boss.dying = true; game.score += (bossKey === 'boss') ? 100 : (bossKey === 'miniBoss2' || bossKey === 'miniBoss3' ? 75 : 50); player.kills++; }
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

function drawPauseMenu() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'white'; ctx.font = 'bold 60px Impact, Arial Black'; ctx.textAlign = 'center'; ctx.fillText('PAUSED', canvas.width / 2, canvas.height / 2 - 100);
    ctx.font = 'bold 30px Arial';
    game.pauseMenuOptions.forEach((option, index) => {
        if (index === game.pauseMenuIndex) { ctx.fillStyle = '#ffd700'; ctx.fillText(`-> ${option} <-`, canvas.width / 2, canvas.height / 2 + index * 50); }
        else { ctx.fillStyle = 'white'; ctx.fillText(option, canvas.width / 2, canvas.height / 2 + index * 50); }
    });
    ctx.textAlign = 'left';
}

function loop() {
    if (!game.running) return;
    
    try {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const controlsBtn = document.getElementById('controls-btn');
        if (game.state === 'menu' || game.state === 'char_select') { controlsBtn.style.display = 'block'; }
        else { controlsBtn.style.display = 'none'; document.getElementById('controls-popup').classList.add('hidden'); }

        const backBtn = document.getElementById('back-btn');
        if (game.state === 'char_select') { backBtn.classList.remove('hidden'); }
        else { backBtn.classList.add('hidden'); }

        if (game.state === 'boss_warning_hold') {
            ctx.fillStyle = 'black'; ctx.fillRect(0, 0, canvas.width, canvas.height);
            game.bossWarningTicks--;
            if (Math.floor(game.bossWarningTicks / 30) % 2 === 0) {
                ctx.save(); ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'; ctx.fillRect(0, canvas.height / 2 - 60, canvas.width, 120);
                ctx.fillStyle = 'red'; ctx.font = 'bold 70px Impact, Arial Black'; ctx.textAlign = 'center'; ctx.fillText('WARNING: BOSS IS COMING!', canvas.width / 2, canvas.height / 2 + 25);
                ctx.restore();
            }
            if (game.bossWarningTicks <= 0) { game.state = 'playing'; game.wave++; assets.background = assets.bossBackground; spawnBoss(); game.fadeDirection = -1; game.fadeAlpha = 1; game.nextState = null; }
        } else {
            if (game.backgroundFadeTicks > 0) {
                game.backgroundFadeTicks--; drawBg(assets.background, 1.0); const alpha = (60 - game.backgroundFadeTicks) / 60; drawBg(game.targetBackground, alpha);
                if (game.backgroundFadeTicks === 0) { assets.background = game.targetBackground; game.targetBackground = null; }
            } else { drawBg(assets.background, 1.0); }
        }

        if (game.state === 'menu') {
            document.getElementById('p1-health').innerText = ''; document.getElementById('p1-kills').innerText = ''; document.getElementById('p2-health').innerText = ''; document.getElementById('p2-kills').innerText = ''; document.getElementById('p3-health').innerText = ''; document.getElementById('p3-kills').innerText = '';
            if (assets.titleBackground.complete) { ctx.drawImage(assets.titleBackground, 0, 0, canvas.width, canvas.height); }
            else if (assets.background.complete) { ctx.drawImage(assets.background, 0, 0, canvas.width, canvas.height); }
            else { ctx.fillStyle = '#222'; ctx.fillRect(0, 0, canvas.width, canvas.height); }
            
            ctx.save(); ctx.shadowColor = 'black'; ctx.shadowBlur = 10; ctx.shadowOffsetX = 4; ctx.shadowOffsetY = 4;
            ctx.fillStyle = '#ffd700'; ctx.font = 'bold 80px Impact, Arial Black'; ctx.textAlign = 'center'; ctx.fillText('Dinos and Dragons', canvas.width / 2, 150);
            ctx.fillStyle = 'white'; ctx.font = 'bold 40px Impact, Arial Black';
            game.menuOptions.forEach((option, index) => { ctx.fillText(option, canvas.width / 2, canvas.height / 2 + index * 60); });
            
            let showArrow = true;
            if (game.menuFlashing) {
                game.menuFlashTicks--; showArrow = Math.floor(game.menuFlashTicks / 5) % 2 === 0;
                if (game.menuFlashTicks === 0) {
                    game.fadeDirection = 1; game.fadeAlpha = 0;
                    if (game.menuIndex === 0) { game.nextState = 'char_select'; }
                    else if (game.menuIndex === 1) { game.nextState = 'training'; }
                    game.playerJoined = [true, false, false]; game.playerCount = 1; game.menuFlashing = false;
                }
            }
            if (showArrow) { const arrowX = canvas.width / 2 - 180; const arrowY = canvas.height / 2 + game.menuIndex * 60; ctx.fillText('->', arrowX, arrowY); }
            ctx.restore();

        } else if (game.state === 'char_select') {
            ctx.fillStyle = '#222'; ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = '#ffd700'; ctx.font = 'bold 60px Impact, Arial Black'; ctx.textAlign = 'center'; ctx.fillText('Select Your Character', canvas.width / 2, 100);
            ctx.font = 'bold 30px Arial'; ctx.fillStyle = 'white'; ctx.fillText('Player 1: A / D to cycle, C to lock', canvas.width / 2, 160);
            ctx.fillText('Player 2: Press L to Join, Arrows to cycle, L to lock', canvas.width / 2, 200);
            ctx.fillText('Player 3: Press N to Join, F / H to cycle, N to lock', canvas.width / 2, 240);
            ctx.fillText('Press ENTER to start (All joined players must lock in)', canvas.width / 2, canvas.height - 50);
            
            for (let i = 0; i < 3; i++) { // Always loop 3 times for slots
                const x = canvas.width / 4 * (i + 1); const y = canvas.height / 2;
                
                if (game.playerJoined[i]) {
                    const charIndex = game.selectedCharacters[i]; const charKey = game.availableCharacters[charIndex];
                    const asset = assets[charKey]; const img = asset ? asset.walk : null;
                    
                    ctx.save();
                    if (game.lockedCharacters[i]) {
                        const colorIndex = game.selectedColors[i];
                        if (colorIndex === 1) ctx.filter = 'hue-rotate(90deg)';
                        else if (colorIndex === 2) ctx.filter = 'hue-rotate(180deg)';
                    }
                    
                    if (img) { const frameWidth = img.width / 2; const frameHeight = img.height / 2; ctx.drawImage(img, 0, 0, frameWidth, frameHeight, x - 50, y - 50, 100, 100); }
                    else { ctx.fillStyle = 'red'; ctx.fillRect(x - 50, y - 50, 100, 100); }
                    ctx.restore();
                    
                    ctx.fillStyle = '#ffd700'; ctx.textAlign = 'center'; ctx.fillText(`Player ${i+1}`, x, y + 80); ctx.fillStyle = 'white'; ctx.fillText(charKey.toUpperCase(), x, y + 120);
                    
                    if (game.lockedCharacters[i]) {
                        ctx.fillStyle = '#00ff00'; ctx.fillText('LOCKED', x, y + 160);
                        const colors = ['Original', 'Alt 1', 'Alt 2'];
                        ctx.fillStyle = 'white'; ctx.font = '20px Arial';
                        ctx.fillText(`Color: < ${colors[game.selectedColors[i]]} >`, x, y + 200);
                        if (game.lockedColors[i]) {
                            ctx.fillStyle = '#00ff00'; ctx.fillText('COLOR LOCKED', x, y + 230);
                            ctx.fillStyle = 'white';
                            ctx.fillText(`Diff: < ${game.difficulties[game.selectedDifficulties[i]]} >`, x, y + 260);
                            if (game.lockedDifficulties[i]) { ctx.fillStyle = '#00ff00'; ctx.fillText('DIFF LOCKED', x, y + 290); }
                        }
                        ctx.font = 'bold 30px Arial';
                    }
                } else {
                    // Show placeholder
                    ctx.fillStyle = '#555'; ctx.fillRect(x - 50, y - 50, 100, 100);
                    ctx.fillStyle = '#ffd700'; ctx.textAlign = 'center'; ctx.fillText(`Player ${i+1}`, x, y + 80);
                    ctx.fillStyle = 'white'; ctx.font = '20px Arial';
                    if (i === 1) ctx.fillText('Press L to Join', x, y + 120);
                    if (i === 2) ctx.fillText('Press N to Join', x, y + 120);
                    
                    const flash = Math.floor(Date.now() / 500) % 2 === 0;
                    if (flash) {
                        ctx.fillStyle = 'white';
                        ctx.font = 'bold 20px Arial';
                        ctx.textBaseline = 'middle';
                        ctx.fillText('JOIN NOW', x, y);
                        ctx.textBaseline = 'alphabetic'; // Reset
                    }
                    ctx.font = 'bold 30px Arial';
                }
            }
            ctx.textAlign = 'left';

        } else if (game.state === 'gameover_delay') {
            game.gameOverTicks--; if (game.gameOverTicks <= 0) { game.state = 'gameover_fading'; game.fadeDirection = 1; game.fadeAlpha = 0; game.nextState = 'gameover_screen'; }
            game.players.forEach(p => { if (p.health > 0) { p.draw(); } else { ctx.save(); ctx.globalAlpha = 0.3; p.draw(); ctx.restore(); } });
            game.enemies.forEach(e => e.draw()); if (game.miniBoss) game.miniBoss.draw(); if (game.miniBoss2) game.miniBoss2.draw(); if (game.miniBoss3) game.miniBoss3.draw(); if (game.boss) game.boss.draw(); game.projectiles.forEach(p => p.draw());

        } else if (game.state === 'gameover_fading') {
            game.players.forEach(p => { if (p.health > 0) { p.draw(); } else { ctx.save(); ctx.globalAlpha = 0.3; p.draw(); ctx.restore(); } });
            game.enemies.forEach(e => e.draw()); if (game.miniBoss) game.miniBoss.draw(); if (game.miniBoss2) game.miniBoss2.draw(); if (game.miniBoss3) game.miniBoss3.draw(); if (game.boss) game.boss.draw(); game.projectiles.forEach(p => p.draw());

        } else if (game.state === 'gameover_screen') {
            ctx.fillStyle = 'black'; ctx.fillRect(0, 0, canvas.width, canvas.height); ctx.fillStyle = 'red'; ctx.font = 'bold 80px Impact, Arial Black'; ctx.textAlign = 'center'; ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2);
            ctx.fillStyle = 'white'; ctx.font = '20px Arial'; ctx.fillText('Press any key to return to menu', canvas.width / 2, canvas.height / 2 + 80); ctx.textAlign = 'left';

        } else if (game.state === 'victory') {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'; ctx.fillRect(0, 0, canvas.width, canvas.height);
            if (Math.random() < 0.05) { createFirework(Math.random() * canvas.width, Math.random() * canvas.height); }
            for (let i = game.particles.length - 1; i >= 0; i--) { const p = game.particles[i]; p.update(); p.draw(); if (p.alpha <= 0) { game.particles.splice(i, 1); } }
            if (Math.floor(Date.now() / 200) % 2 === 0) { ctx.fillStyle = '#ffd700'; } else { ctx.fillStyle = '#ffffff'; }
            ctx.font = 'bold 100px Impact, Arial Black'; ctx.textAlign = 'center'; ctx.fillText('VICTORY', canvas.width / 2, canvas.height / 2 + 30);
            if (game.victoryTicks > 0) { game.victoryTicks--; } else { ctx.fillStyle = 'white'; ctx.font = '20px Arial'; ctx.textAlign = 'center'; ctx.fillText('Press any key to continue', canvas.width / 2, canvas.height / 2 + 100); }
            ctx.textAlign = 'left';

        } else if (game.state === 'playing') {
            if (game.players.length > 0 && game.players.every(p => p.health <= 0)) { game.state = 'gameover_delay'; game.gameOverTicks = 120; }

            if (game.waveSpawnDelay > 0) { game.waveSpawnDelay--; if (game.waveSpawnDelay === 0) { spawnWave(); } }

            if (game.enemies.length === 0 && game.waveSpawnDelay === 0 && !game.boss && !game.miniBoss && !game.miniBoss2 && !game.miniBoss3 && game.warningTicks === 0 && game.bossWarningTicks === 0) {
                if (game.wave === 3 && !game.miniBossTriggered) { game.miniBossTriggered = true; game.warningTicks = 180; }
                else if (game.wave === 6 && !game.miniBoss2Triggered) { game.miniBoss2Triggered = true; game.warningTicks = 180; }
                else if (game.wave === 9 && !game.miniBoss3Triggered) { game.miniBoss3Triggered = true; game.warningTicks = 180; }
                else if (game.wave < 9) {
                    game.wave++; game.waveSpawnDelay = 60; game.waveTextTicks = 180;
                    if (game.wave === 3 || game.wave === 6 || game.wave === 9) { spawnHeart(); }
                }
            }

            if (game.warningTicks > 0) { game.warningTicks--; if (game.warningTicks === 0) { if (game.wave === 3) { spawnMiniBoss(); } else if (game.wave === 6) { spawnMiniBoss2(); } else if (game.wave === 9) { spawnMiniBoss3(); } } }

            // Draw static scene if paused
            if (game.paused) {
                game.players.forEach(p => { if (p.health > 0) p.draw(); });
                game.enemies.forEach(e => e.draw());
                if (game.miniBoss) game.miniBoss.draw();
                if (game.miniBoss2) game.miniBoss2.draw();
                if (game.miniBoss3) game.miniBoss3.draw();
                if (game.boss) game.boss.draw();
                game.projectiles.forEach(p => p.draw());
                game.particles.forEach(p => p.draw());
                game.hearts.forEach(h => { if (h.active) { const img = assets.cheeseburger; if (img) { ctx.drawImage(img, h.x, h.y, h.width, h.height); } } });
                game.diamonds.forEach(d => { if (d.active) { const img = assets.diamond; if (img) { ctx.drawImage(img, d.x, d.y, d.width, d.height); } } });
                game.lightnings.forEach(l => { if (l.active) { const img = assets.lightning; if (img) { ctx.drawImage(img, l.x, l.y, l.width, l.height); } } });
                game.meteors.forEach(m => { if (m.active) { drawMeteorItem(m.x, m.y, m.width, m.height); } });
                game.reviveItems.forEach(r => { if (r.active) { const img = assets.heart; if (img) { ctx.drawImage(img, r.x, r.y, r.width, r.height); } } });
                game.wands.forEach(wand => { if (wand.active) { drawWand(wand.x, wand.y, wand.width, wand.height); } });
                
                drawPauseMenu();
            } else {
                // Normal updates and draws
                for (let i = game.hearts.length - 1; i >= 0; i--) {
                    const heart = game.hearts[i];
                    if (heart.active) {
                        const img = assets.cheeseburger; if (img) { ctx.drawImage(img, heart.x, heart.y, heart.width, heart.height); } else { ctx.fillStyle = 'red'; ctx.fillRect(heart.x, heart.y, heart.width, heart.height); }
                        game.players.forEach(player => { if (player.health > 0 && checkCollision(player, heart)) { player.health = Math.min(player.maxHealth, player.health + 30); heart.active = false; game.hearts.splice(i, 1); } });
                    }
                }

                for (let i = game.diamonds.length - 1; i >= 0; i--) {
                    const diamond = game.diamonds[i];
                    if (diamond.active) {
                        const img = assets.diamond; if (img) { ctx.drawImage(img, diamond.x, diamond.y, diamond.width, diamond.height); } else { ctx.fillStyle = 'cyan'; ctx.fillRect(diamond.x, diamond.y, diamond.width, diamond.height); }
                        game.players.forEach(player => { if (player.health > 0 && checkCollision(player, diamond)) { diamond.active = false; game.diamonds.splice(i, 1); triggerRingEffect(player.x + player.width / 2, player.y + player.height / 2, player); } });
                    }
                }

                for (let i = game.lightnings.length - 1; i >= 0; i--) {
                    const lightning = game.lightnings[i];
                    if (lightning.active) {
                        const img = assets.lightning; if (img) { ctx.drawImage(img, lightning.x, lightning.y, lightning.width, lightning.height); } else { ctx.fillStyle = 'yellow'; ctx.fillRect(lightning.x, lightning.y, lightning.width, lightning.height); }
                        game.players.forEach(player => { if (player.health > 0 && checkCollision(player, lightning)) { player.health = Math.min(player.maxHealth, player.health + 30); lightning.active = false; game.lightnings.splice(i, 1); triggerLightningEffect(player); } });
                    }
                }

                for (let i = game.meteors.length - 1; i >= 0; i--) {
                    const meteor = game.meteors[i];
                    if (meteor.active) {
                        drawMeteorItem(meteor.x, meteor.y, meteor.width, meteor.height);
                        game.players.forEach(player => { if (player.health > 0 && checkCollision(player, meteor)) { meteor.active = false; game.meteors.splice(i, 1); triggerMeteorEffect(player); } });
                    }
                }

                for (let i = game.reviveItems.length - 1; i >= 0; i--) {
                    const reviveItem = game.reviveItems[i];
                    if (reviveItem.active && game.playerCount >= 2) {
                        const img = assets.heart; if (img) { ctx.drawImage(img, reviveItem.x, reviveItem.y, reviveItem.width, reviveItem.height); } else { ctx.fillStyle = 'red'; ctx.fillRect(reviveItem.x, reviveItem.y, reviveItem.width, reviveItem.height); }
                        game.players.forEach((player, index) => { if (player.health > 0 && checkCollision(player, reviveItem)) { const deadPlayer = game.players.find(p => p.health <= 0); if (deadPlayer) { deadPlayer.health = 50; reviveItem.active = false; game.reviveItems.splice(i, 1); console.log('Player revived!'); } } });
                    }
                }

                // Update and draw wands
                for (let i = game.wands.length - 1; i >= 0; i--) {
                    const wand = game.wands[i];
                    if (wand.active) {
                        drawWand(wand.x, wand.y, wand.width, wand.height);
                        game.players.forEach(player => {
                            if (player.health > 0 && checkCollision(player, wand)) {
                                wand.active = false;
                                player.forcefieldTicks = 1200;
                                game.wands.splice(i, 1);
                            }
                        });
                    }
                }

                if (game.ringEffect && game.ringEffect.active) { game.ringEffect.radius += 25; ctx.save(); ctx.beginPath(); ctx.arc(game.ringEffect.x, game.ringEffect.y, game.ringEffect.radius, 0, Math.PI * 2); ctx.strokeStyle = 'rgba(0, 255, 255, 0.8)'; ctx.lineWidth = 20; ctx.stroke(); ctx.restore(); if (game.ringEffect.radius >= game.ringEffect.maxRadius) { game.ringEffect.active = false; } }

                if (game.lightningEffect && game.lightningEffect.active) {
                    game.lightningEffect.ticks--; ctx.save();
                    game.lightningEffect.targets.forEach(target => { ctx.strokeStyle = 'rgba(255, 255, 0, 0.8)'; ctx.lineWidth = 12; ctx.beginPath(); ctx.moveTo(target.points[0].x, target.points[0].y); for (let i = 1; i < target.points.length; i++) { ctx.lineTo(target.points[i].x, target.points[i].y); } ctx.stroke(); ctx.strokeStyle = 'white'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(target.points[0].x, target.points[0].y); for (let i = 1; i < target.points.length; i++) { ctx.lineTo(target.points[i].x, target.points[i].y); } ctx.stroke(); });
                    ctx.restore(); if (game.lightningEffect.ticks === 0) { game.lightningEffect.active = false; }
                }

                if (game.meteorEffect && game.meteorEffect.active) {
                    if (!game.meteorEffect.exploding) {
                        game.meteorEffect.progress += 0.01; game.meteorEffect.x = -100 + (game.meteorEffect.targetX + 100) * game.meteorEffect.progress; game.meteorEffect.y = -100 + (game.meteorEffect.targetY + 100) * game.meteorEffect.progress;
                        ctx.save(); ctx.translate(game.meteorEffect.x, game.meteorEffect.y); ctx.rotate(Math.atan2(game.meteorEffect.targetY + 100, game.meteorEffect.targetX + 100)); ctx.scale(1.3, 1.3); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-150, -30); ctx.lineTo(-100, -10); ctx.lineTo(-180, 0); ctx.lineTo(-100, 10); ctx.lineTo(-150, 30); ctx.closePath(); ctx.fillStyle = 'rgba(255, 50, 0, 0.8)'; ctx.fill(); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-100, -15); ctx.lineTo(-120, 0); ctx.lineTo(-100, 15); ctx.closePath(); ctx.fillStyle = 'rgba(255, 150, 0, 0.9)'; ctx.fill(); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-50, -5); ctx.lineTo(-70, 0); ctx.lineTo(-50, 5); ctx.closePath(); ctx.fillStyle = 'rgba(255, 255, 0, 0.9)'; ctx.fill(); ctx.beginPath(); ctx.moveTo(30, 0); ctx.lineTo(10, 30); ctx.lineTo(-20, 20); ctx.lineTo(-30, -10); ctx.lineTo(-10, -30); ctx.closePath(); ctx.fillStyle = '#696969'; ctx.fill(); ctx.strokeStyle = '#333'; ctx.lineWidth = 3; ctx.stroke(); ctx.beginPath(); ctx.arc(0, 10, 8, 0, Math.PI * 2); ctx.fillStyle = '#333'; ctx.fill(); ctx.beginPath(); ctx.arc(-10, -10, 5, 0, Math.PI * 2); ctx.fillStyle = '#333'; ctx.fill(); ctx.restore();
                        if (game.meteorEffect.progress >= 1) { game.meteorEffect.exploding = true; if (!game.meteorEffect.damaged) { game.meteorEffect.damaged = true; for (let i = game.enemies.length - 1; i >= 0; i--) { const enemy = game.enemies[i]; enemy.health -= 50; if (enemy.health <= 0) { killEnemy(i, game.meteorEffect.player); } } if (game.miniBoss && !game.miniBoss.dying) { game.miniBoss.health -= 50; if (game.miniBoss.health <= 0) { handleBossDeath('miniBoss', game.meteorEffect.player); } } if (game.miniBoss2 && !game.miniBoss2.dying) { game.miniBoss2.health -= 50; if (game.miniBoss2.health <= 0) { handleBossDeath('miniBoss2', game.meteorEffect.player); } } if (game.miniBoss3 && !game.miniBoss3.dying) { game.miniBoss3.health -= 50; if (game.miniBoss3.health <= 0) { handleBossDeath('miniBoss3', game.meteorEffect.player); } } if (game.boss && !game.boss.dying) { game.boss.health -= 50; if (game.boss.health <= 0) { handleBossDeath('boss', game.meteorEffect.player); } } } }
                    } else { game.meteorEffect.explosionRadius += 30; ctx.save(); ctx.beginPath(); ctx.arc(game.meteorEffect.targetX, game.meteorEffect.targetY, game.meteorEffect.explosionRadius, 0, Math.PI * 2); ctx.fillStyle = `rgba(255, 100, 0, ${1 - game.meteorEffect.explosionRadius / 600})`; ctx.fill(); ctx.restore(); if (game.meteorEffect.explosionRadius >= 600) { game.meteorEffect.active = false; } }
                }

                game.players.forEach(player => {
                    player.update(); if (player.health > 0) { player.draw(); }
                    
                    if (player.forcefieldTicks > 0) {
                        player.forcefieldTicks--;
                        const radius = 70;
                        ctx.save();
                        ctx.beginPath();
                        ctx.arc(player.x + player.width / 2, player.y + player.height / 2, radius, 0, Math.PI * 2);
                        const flash = Math.floor(Date.now() / 100) % 2 === 0;
                        const baseColor = getBaseColor(player.assetKey, player.colorIndex);
                        ctx.strokeStyle = flash ? baseColor : 'rgba(255, 255, 255, 0.3)';
                        ctx.lineWidth = 5;
                        ctx.stroke();
                        ctx.restore();
                        
                        for (let i = game.enemies.length - 1; i >= 0; i--) {
                            const enemy = game.enemies[i];
                            const dist = Math.hypot(enemy.x + enemy.width/2 - (player.x + player.width/2), enemy.y + enemy.height/2 - (player.y + player.height/2));
                            if (dist < radius + enemy.width / 2) {
                                if (!enemy.forcefieldCooldown) enemy.forcefieldCooldown = 0;
                                if (enemy.forcefieldCooldown === 0) {
                                    enemy.health -= 20;
                                    enemy.forcefieldCooldown = 60;
                                    if (enemy.health <= 0) { killEnemy(i, player); }
                                }
                            }
                        }
                        
                        const checkBossForcefield = (bossKey) => {
                            const boss = game[bossKey];
                            if (boss && !boss.dying) {
                                const dist = Math.hypot(boss.x + boss.width/2 - (player.x + player.width/2), boss.y + boss.height/2 - (player.y + player.height/2));
                                if (dist < radius + boss.width / 2) {
                                    if (!boss.forcefieldCooldown) boss.forcefieldCooldown = 0;
                                    if (boss.forcefieldCooldown === 0) {
                                        boss.health -= 20;
                                        boss.forcefieldCooldown = 60;
                                        if (boss.health <= 0) { handleBossDeath(bossKey, player); }
                                    }
                                }
                            }
                        };
                        checkBossForcefield('miniBoss');
                        checkBossForcefield('miniBoss2');
                        checkBossForcefield('miniBoss3');
                        checkBossForcefield('boss');
                    }

                    if (player.isAttacking && player.attackBox.width > 0 && player.frameIndex === 0 && !player.hasHit) {
                        const damages = [100, 60, 50, 25, 12];
                        const dmg = damages[player.difficultyIndex];
                        
                        if (player.assetKey === 'dragon') { ctx.fillStyle = 'rgba(255, 100, 0, 0.7)'; for (let i = 0; i < 5; i++) { const rx = player.attackBox.x + Math.random() * player.attackBox.width; const ry = player.attackBox.y + Math.random() * player.attackBox.height; const radius = Math.random() * 15 + 5; ctx.beginPath(); ctx.arc(rx, ry, radius, 0, Math.PI * 2); ctx.fill(); } }
                        else if (player.assetKey === 'dino') { ctx.fillStyle = 'rgba(80, 80, 80, 0.7)'; for (let i = 0; i < 5; i++) { const rx = player.attackBox.x + Math.random() * player.attackBox.width; const ry = player.attackBox.y + Math.random() * player.attackBox.height; const size = Math.random() * 10 + 5; ctx.fillRect(rx, ry, size, size); } }
                        else if (player.assetKey === 'unicorn') { ctx.fillStyle = 'rgba(255, 105, 180, 0.7)'; for (let i = 0; i < 5; i++) { const rx = player.attackBox.x + Math.random() * player.attackBox.width; const ry = player.attackBox.y + Math.random() * player.attackBox.height; const size = Math.random() * 8 + 4; ctx.fillRect(rx, ry, size, size); } }
                        for (let i = game.enemies.length - 1; i >= 0; i--) { const enemy = game.enemies[i]; if (checkCollision(player.attackBox, enemy)) { enemy.health -= dmg; if (enemy.health <= 0) { killEnemy(i, player); } } }
                        if (game.miniBoss && !game.miniBoss.dying && checkCollision(player.attackBox, game.miniBoss)) { game.miniBoss.health -= dmg; if (game.miniBoss.health <= 0) { handleBossDeath('miniBoss', player); } }
                        if (game.miniBoss2 && !game.miniBoss2.dying && checkCollision(player.attackBox, game.miniBoss2)) { game.miniBoss2.health -= dmg; if (game.miniBoss2.health <= 0) { handleBossDeath('miniBoss2', player); } }
                        if (game.miniBoss3 && !game.miniBoss3.dying && checkCollision(player.attackBox, game.miniBoss3)) { game.miniBoss3.health -= dmg; if (game.miniBoss3.health <= 0) { handleBossDeath('miniBoss3', player); } }
                        if (game.boss && !game.boss.dying && checkCollision(player.attackBox, game.boss)) { game.boss.health -= dmg; if (game.boss.health <= 0) { handleBossDeath('boss', player); } }
                        player.hasHit = true;
                    }
                });

                for (let pIndex = game.projectiles.length - 1; pIndex >= 0; pIndex--) {
                    const projectile = game.projectiles[pIndex]; projectile.update(); projectile.draw(); if (!projectile.active) { game.projectiles.splice(pIndex, 1); continue; }
                    
                    const superDamages = [100, 100, 50, 25, 12];
                    const dmg = superDamages[projectile.owner.difficultyIndex];
                    
                    for (let i = game.enemies.length - 1; i >= 0; i--) { const enemy = game.enemies[i]; if (checkCollision(projectile, enemy)) { enemy.health -= dmg; projectile.active = false; if (projectile.imageKey === 'rainbow') { createRainbowExplosion(enemy.x + enemy.width/2, enemy.y + enemy.height/2); } else if (projectile.imageKey === 'bubble') { createPopParticles(enemy.x + enemy.width/2, enemy.y + enemy.height/2); } else if (projectile.imageKey === 'star') { createStarExplosion(enemy.x + enemy.width/2, enemy.y + enemy.height/2); } if (enemy.health <= 0) { killEnemy(i, projectile.owner); } } }
                    if (game.miniBoss && !game.miniBoss.dying && checkCollision(projectile, game.miniBoss)) { game.miniBoss.health -= dmg; projectile.active = false; if (projectile.imageKey === 'rainbow') { createRainbowExplosion(game.miniBoss.x + game.miniBoss.width/2, game.miniBoss.y + game.miniBoss.height/2); } else if (projectile.imageKey === 'bubble') { createPopParticles(game.miniBoss.x + game.miniBoss.width/2, game.miniBoss.y + game.miniBoss.height/2); } else if (projectile.imageKey === 'star') { createStarExplosion(game.miniBoss.x + game.miniBoss.width/2, game.miniBoss.y + game.miniBoss.height/2); } if (game.miniBoss.health <= 0) { handleBossDeath('miniBoss', projectile.owner); } }
                    if (game.miniBoss2 && !game.miniBoss2.dying && checkCollision(projectile, game.miniBoss2)) { game.miniBoss2.health -= dmg; projectile.active = false; if (projectile.imageKey === 'rainbow') { createRainbowExplosion(game.miniBoss2.x + game.miniBoss2.width/2, game.miniBoss2.y + game.miniBoss2.height/2); } else if (projectile.imageKey === 'bubble') { createPopParticles(game.miniBoss2.x + game.miniBoss2.width/2, game.miniBoss2.y + game.miniBoss2.height/2); } else if (projectile.imageKey === 'star') { createStarExplosion(game.miniBoss2.x + game.miniBoss2.width/2, game.miniBoss2.y + game.miniBoss2.height/2); } if (game.miniBoss2.health <= 0) { handleBossDeath('miniBoss2', projectile.owner); } }
                    if (game.miniBoss3 && !game.miniBoss3.dying && checkCollision(projectile, game.miniBoss3)) { game.miniBoss3.health -= dmg; projectile.active = false; if (projectile.imageKey === 'rainbow') { createRainbowExplosion(game.miniBoss3.x + game.miniBoss3.width/2, game.miniBoss3.y + game.miniBoss3.height/2); } else if (projectile.imageKey === 'bubble') { createPopParticles(game.miniBoss3.x + game.miniBoss3.width/2, game.miniBoss3.y + game.miniBoss3.height/2); } else if (projectile.imageKey === 'star') { createStarExplosion(game.miniBoss3.x + game.miniBoss3.width/2, game.miniBoss3.y + game.miniBoss3.height/2); } if (game.miniBoss3.health <= 0) { handleBossDeath('miniBoss3', projectile.owner); } }
                    if (game.boss && !game.boss.dying && checkCollision(projectile, game.boss)) { game.boss.health -= dmg; projectile.active = false; if (projectile.imageKey === 'rainbow') { createRainbowExplosion(game.boss.x + game.boss.width/2, game.boss.y + game.boss.height/2); } else if (projectile.imageKey === 'bubble') { createPopParticles(game.boss.x + game.boss.width/2, game.boss.y + game.boss.height/2); } else if (projectile.imageKey === 'star') { createStarExplosion(game.boss.x + game.boss.width/2, game.boss.y + game.boss.height/2); } if (game.boss.health <= 0) { handleBossDeath('boss', projectile.owner); } }
                }

                game.enemies.forEach(enemy => {
                    enemy.update(); enemy.draw();
                    if (enemy.forcefieldCooldown > 0) enemy.forcefieldCooldown--;
                    game.players.forEach(player => { if (player.health > 0 && player.forcefieldTicks <= 0 && checkCollision(enemy, player)) { player.health -= 0.05; } });
                });

                if (game.miniBoss) {
                    if (game.miniBoss.dying) { game.miniBoss.alpha -= 0.005; if (game.miniBoss.alpha <= 0) { game.miniBoss = null; game.fadeDirection = 1; game.fadeAlpha = 0; game.nextState = 'wave_4_transition'; } }
                    else {
                        if (game.miniBoss.forcefieldCooldown > 0) game.miniBoss.forcefieldCooldown--;
                        let closestPlayer = null; let minDist = Infinity; game.players.forEach(player => { if (player.health > 0) { const dist = Math.hypot(player.x - game.miniBoss.x, game.miniBoss.y); if (dist < minDist) { minDist = dist; closestPlayer = player; } } });
                        if (closestPlayer) { if (game.miniBoss.x < closestPlayer.x) { game.miniBoss.x += game.miniBoss.speed; game.miniBoss.facing = 1; } if (game.miniBoss.x > closestPlayer.x) { game.miniBoss.x -= game.miniBoss.speed; game.miniBoss.facing = -1; } if (game.miniBoss.y < closestPlayer.y) game.miniBoss.y += game.miniBoss.speed; if (game.miniBoss.y > closestPlayer.y) game.miniBoss.y -= game.miniBoss.speed; }
                        game.miniBoss.update(); game.players.forEach(player => { if (player.health > 0 && player.forcefieldTicks <= 0 && checkCollision(game.miniBoss, player)) player.health -= 0.1; });
                    }
                    if (game.miniBoss) game.miniBoss.draw();
                }

                if (game.miniBoss2) {
                    if (game.miniBoss2.dying) { game.miniBoss2.alpha -= 0.005; if (game.miniBoss2.alpha <= 0) { game.miniBoss2 = null; game.fadeDirection = 1; game.fadeAlpha = 0; game.nextState = 'wave_7_transition'; } }
                    else {
                        if (game.miniBoss2.forcefieldCooldown > 0) game.miniBoss2.forcefieldCooldown--;
                        let closestPlayer = null; let minDist = Infinity; game.players.forEach(player => { if (player.health > 0) { const dist = Math.hypot(player.x - game.miniBoss2.x, game.miniBoss2.y); if (dist < minDist) { minDist = dist; closestPlayer = player; } } });
                        if (closestPlayer) { if (game.miniBoss2.x < closestPlayer.x) { game.miniBoss2.x += game.miniBoss2.speed; game.miniBoss2.facing = 1; } if (game.miniBoss2.x > closestPlayer.x) { game.miniBoss2.x -= game.miniBoss2.speed; game.miniBoss2.facing = -1; } if (game.miniBoss2.y < closestPlayer.y) game.miniBoss2.y += game.miniBoss2.speed; if (game.miniBoss2.y > closestPlayer.y) game.miniBoss2.y -= game.miniBoss2.speed; }
                        game.miniBoss2.update(); game.players.forEach(player => { if (player.health > 0 && player.forcefieldTicks <= 0 && checkCollision(game.miniBoss2, player)) player.health -= 0.15; });
                    }
                    if (game.miniBoss2) game.miniBoss2.draw();
                }

                if (game.miniBoss3) {
                    if (game.miniBoss3.dying) { game.miniBoss3.alpha -= 0.005; if (game.miniBoss3.alpha <= 0) { game.miniBoss3 = null; game.fadeDirection = 1; game.fadeAlpha = 0; game.nextState = 'black_screen_boss_warning'; } }
                    else {
                        if (game.miniBoss3.forcefieldCooldown > 0) game.miniBoss3.forcefieldCooldown--;
                        let closestPlayer = null; let minDist = Infinity; game.players.forEach(player => { if (player.health > 0) { const dist = Math.hypot(player.x - game.miniBoss3.x, game.miniBoss3.y); if (dist < minDist) { minDist = dist; closestPlayer = player; } } });
                        if (closestPlayer) { if (game.miniBoss3.x < closestPlayer.x) { game.miniBoss3.x += game.miniBoss3.speed; game.miniBoss3.facing = 1; } if (game.miniBoss3.x > closestPlayer.x) { game.miniBoss3.x -= game.miniBoss3.speed; game.miniBoss3.facing = -1; } if (game.miniBoss3.y < closestPlayer.y) game.miniBoss3.y += game.miniBoss3.speed; if (game.miniBoss3.y > closestPlayer.y) game.miniBoss3.y -= game.miniBoss3.speed; }
                        game.miniBoss3.update(); game.players.forEach(player => { if (player.health > 0 && player.forcefieldTicks <= 0 && checkCollision(game.miniBoss3, player)) player.health -= 0.15; });
                    }
                    if (game.miniBoss3) game.miniBoss3.draw();
                }

                if (game.boss) {
                    if (game.boss.dying) { game.boss.alpha -= 0.005; if (game.boss.alpha <= 0) { game.boss = null; game.state = 'victory'; game.victoryTicks = 300; } }
                    else {
                        if (game.boss.forcefieldCooldown > 0) game.boss.forcefieldCooldown--;
                        let closestPlayer = null; let minDist = Infinity; game.players.forEach(player => { if (player.health > 0) { const dist = Math.hypot(player.x - game.boss.x, game.boss.y); if (dist < minDist) { minDist = dist; closestPlayer = player; } } });
                        if (closestPlayer) { if (game.boss.x < closestPlayer.x) { game.boss.x += game.boss.speed; game.boss.facing = -1; } if (game.boss.x > closestPlayer.x) { game.boss.x -= game.boss.speed; game.boss.facing = 1; } if (game.boss.y < closestPlayer.y) game.boss.y += game.boss.speed; if (game.boss.y > closestPlayer.y) game.boss.y -= game.boss.speed; }
                        game.boss.update(); game.players.forEach(player => { if (player.health > 0 && player.forcefieldTicks <= 0 && checkCollision(game.boss, player)) player.health -= 0.2; });
                    }
                    if (game.boss) game.boss.draw();
                }

                if (game.players.length >= 1) { const p = game.players[0]; document.getElementById('p1-health').innerText = p.extraLives > 0 ? '❤️' : ''; document.getElementById('p1-kills').innerText = `${p.assetKey.toUpperCase()} Kills: ${p.kills}`; }
                if (game.players.length >= 2) { const p = game.players[1]; document.getElementById('p2-health').innerText = p.extraLives > 0 ? '❤️' : ''; document.getElementById('p2-kills').innerText = `${p.assetKey.toUpperCase()} Kills: ${p.kills}`; }
                if (game.players.length >= 3) { const p = game.players[2]; document.getElementById('p3-health').innerText = p.extraLives > 0 ? '❤️' : ''; document.getElementById('p3-kills').innerText = `${p.assetKey.toUpperCase()} Kills: ${p.kills}`; }
                
                ctx.fillStyle = 'white'; ctx.font = '26px Arial'; ctx.fillText(`Wave: ${game.wave}`, 10, 30);
                
                if (game.waveTextTicks > 0) { game.waveTextTicks--; ctx.save(); ctx.globalAlpha = 0.5; ctx.fillStyle = 'white'; ctx.font = 'bold 100px Impact, Arial Black'; ctx.textAlign = 'center'; ctx.fillText(`WAVE ${game.wave}`, canvas.width / 2, canvas.height / 2); ctx.restore(); }

                if (game.warningTicks > 0) { ctx.save(); ctx.fillStyle = 'rgba(0, 0, 0, 0.6)'; ctx.fillRect(0, canvas.height / 2 - 50, canvas.width, 100); if (Math.floor(game.warningTicks / 30) % 2 === 0) { ctx.fillStyle = 'yellow'; ctx.font = 'bold 60px Impact, Arial Black'; ctx.textAlign = 'center'; ctx.fillText('MINI-BOSS IS COMING!', canvas.width / 2, canvas.height / 2 + 20); } ctx.restore(); }

                if (game.bossWarningTicks > 0) { ctx.save(); ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'; ctx.fillRect(0, canvas.height / 2 - 60, canvas.width, 120); if (Math.floor(game.bossWarningTicks / 30) % 2 === 0) { ctx.fillStyle = 'red'; ctx.font = 'bold 70px Impact, Arial Black'; ctx.textAlign = 'center'; ctx.fillText('WARNING: BOSS IS COMING!', canvas.width / 2, canvas.height / 2 + 25); } ctx.restore(); }

                for (let i = game.particles.length - 1; i >= 0; i--) { const p = game.particles[i]; p.update(); p.draw(); if (p.alpha <= 0) { game.particles.splice(i, 1); } }
            }
        } else if (game.state === 'training') {
            const tileSize = 80;
            
            if (game.paused) {
                ctx.fillStyle = '#555';
                for (let r = 0; r < game.maze.length; r++) {
                    for (let c = 0; c < game.maze[r].length; c++) {
                        if (game.maze[r][c] === 1) { ctx.fillRect(c * tileSize, r * tileSize, tileSize, tileSize); }
                    }
                }
                const img = assets.cheeseburger;
                if (img) { ctx.drawImage(img, game.mazeGoal.x, game.mazeGoal.y, game.mazeGoal.width, game.mazeGoal.height); }
                game.players.forEach(player => { if (player.health > 0) { player.draw(); } });
                
                drawPauseMenu();
            } else {
                ctx.fillStyle = '#555';
                for (let r = 0; r < game.maze.length; r++) {
                    for (let c = 0; c < game.maze[r].length; c++) {
                        if (game.maze[r][c] === 1) { ctx.fillRect(c * tileSize, r * tileSize, tileSize, tileSize); }
                    }
                }
                
                const img = assets.cheeseburger;
                if (img) { ctx.drawImage(img, game.mazeGoal.x, game.mazeGoal.y, game.mazeGoal.width, game.mazeGoal.height); }
                
                game.players.forEach(player => {
                    const oldX = player.x;
                    const oldY = player.y;
                    
                    let dx = 0;
                    let dy = 0;
                    player.moving = false;
                    if (game.keys[player.controls.up]) { dy -= player.speed; player.moving = true; }
                    if (game.keys[player.controls.down]) { dy += player.speed; player.moving = true; }
                    if (game.keys[player.controls.left]) { dx -= player.speed; player.moving = true; player.facing = -1; }
                    if (game.keys[player.controls.right]) { dx += player.speed; player.moving = true; player.facing = 1; }
                    
                    // Try X movement
                    player.x += dx;
                    player.x = Math.max(0, Math.min(canvas.width - player.width, player.x));
                    
                    let collisionX = false;
                    for (let r = 0; r < game.maze.length; r++) {
                        for (let c = 0; c < game.maze[r].length; c++) {
                            if (game.maze[r][c] === 1) {
                                const wallRect = { x: c * tileSize, y: r * tileSize, width: tileSize, height: tileSize };
                                if (checkCollision(player, wallRect)) { collisionX = true; break; }
                            }
                        }
                        if (collisionX) break;
                    }
                    if (collisionX) { player.x = oldX; }
                    
                    // Try Y movement
                    player.y += dy;
                    player.y = Math.max(0, Math.min(canvas.height - player.height, player.y));
                    
                    let collisionY = false;
                    for (let r = 0; r < game.maze.length; r++) {
                        for (let c = 0; c < game.maze[r].length; c++) {
                            if (game.maze[r][c] === 1) {
                                const wallRect = { x: c * tileSize, y: r * tileSize, width: tileSize, height: tileSize };
                                if (checkCollision(player, wallRect)) { collisionY = true; break; }
                            }
                        }
                        if (collisionY) break;
                    }
                    if (collisionY) { player.y = oldY; }
                    
                    // Update animation ticks
                    player.tickCount++;
                    if (player.tickCount > player.ticksPerFrame) {
                        player.tickCount = 0; player.frameIndex = (player.frameIndex + 1) % 4;
                    }
                    
                    if (player.health > 0) { player.draw(); }
                });
                
                if (game.trainingComplete) {
                    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'; ctx.fillRect(0, 0, canvas.width, canvas.height);
                    ctx.fillStyle = '#ffd700'; ctx.font = 'bold 60px Impact, Arial Black'; ctx.textAlign = 'center'; ctx.fillText('TRAINING COMPLETE!', canvas.width / 2, canvas.height / 2 - 100);
                    
                    ctx.font = 'bold 30px Arial';
                    game.trainingMenuOptions.forEach((option, index) => {
                        if (index === game.trainingMenuIndex) { ctx.fillStyle = '#ffd700'; ctx.fillText(`-> ${option} <-`, canvas.width / 2, canvas.height / 2 + index * 50); }
                        else { ctx.fillStyle = 'white'; ctx.fillText(option, canvas.width / 2, canvas.height / 2 + index * 50); }
                    });
                    ctx.textAlign = 'left';
                } else {
                    const player = game.players[0];
                    if (checkCollision(player, game.mazeGoal)) { game.trainingComplete = true; }
                }
            }
        }

        if (game.fadeDirection !== 0) {
            game.fadeAlpha += game.fadeDirection * game.fadeSpeed;
            if (game.fadeDirection === 1 && game.fadeAlpha >= 1) {
                game.fadeAlpha = 1;
                if (game.nextState === 'playing') { game.fadeDirection = -1; game.state = 'playing'; startGame(game.playerCount); }
                else if (game.nextState === 'char_select') { game.fadeDirection = -1; game.state = 'char_select'; }
                else if (game.nextState === 'training') { game.fadeDirection = -1; game.state = 'training'; startTraining(); }
                else if (game.nextState === 'playing_start') { game.fadeDirection = -1; game.state = 'playing'; startGame(game.playerCount); game.waveSpawnDelay = 60; }
                else if (game.nextState === 'menu_back') { game.fadeDirection = -1; game.state = 'menu'; resetGame(); }
                else if (game.nextState === 'gameover_screen') { game.fadeDirection = 0; game.state = 'gameover_screen'; }
                else if (game.nextState === 'wave_4_transition') { game.fadeDirection = -1; game.state = 'playing'; game.wave++; assets.background = assets.jungleBackground; game.waveTextTicks = 180; }
                else if (game.nextState === 'wave_7_transition') { game.fadeDirection = -1; game.state = 'playing'; game.wave++; assets.background = assets.outerSpaceBackground; game.waveTextTicks = 180; }
                else if (game.nextState === 'black_screen_boss_warning') { game.fadeDirection = 0; game.state = 'boss_warning_hold'; game.bossWarningTicks = 180; }
            } else if (game.fadeDirection === -1 && game.fadeAlpha <= 0) {
                game.fadeAlpha = 0; game.fadeDirection = 0;
                if (game.nextState === 'wave_4_transition' || game.nextState === 'wave_7_transition') { game.waveSpawnDelay = 60; }
                game.nextState = null;
            }
            ctx.save(); ctx.globalAlpha = game.fadeAlpha; ctx.fillStyle = 'black'; ctx.fillRect(0, 0, canvas.width, canvas.height); ctx.restore();
        }
    } catch (error) {
        console.error('Game loop error:', error); ctx.fillStyle = 'rgba(255, 0, 0, 0.8)'; ctx.fillRect(0, 0, canvas.width, canvas.height); ctx.fillStyle = 'white'; ctx.font = 'bold 40px Arial'; ctx.textAlign = 'center'; ctx.fillText('GAME CRASHED!', canvas.width / 2, canvas.height / 2 - 50); ctx.font = '20px Arial'; ctx.fillText(`Error: ${error.message}`, canvas.width / 2, canvas.height / 2 + 20); ctx.textAlign = 'left'; game.running = false;
    }
    
    if (game.running) { requestAnimationFrame(loop); }
}

function canLock(playerIndex) { return true; }

function startGame(playerCount) {
    const p1Controls = { up: 'KeyW', down: 'KeyS', left: 'KeyA', right: 'KeyD', attack: 'KeyC', super: 'KeyV' };
    const p2Controls = { up: 'ArrowUp', down: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight', attack: 'KeyL', super: 'Semicolon' };
    const p3Controls = { up: 'KeyT', down: 'KeyG', left: 'KeyF', right: 'KeyH', attack: 'KeyN', super: 'KeyM' };
    const controls = [p1Controls, p2Controls, p3Controls];
    
    for (let i = 0; i < 3; i++) {
        if (game.playerJoined[i]) {
            const charKey = game.availableCharacters[game.selectedCharacters[i]];
            const player = new Player(50 + i * 100, 200, charKey, controls[i], game.selectedColors[i], game.selectedDifficulties[i]);
            player.extraLives = game.selectedDifficulties[i] === 0 ? 1 : 0;
            game.players.push(player);
        }
    }
    
    game.diamondWave = Math.floor(Math.random() * 6) + 1; game.diamondSpawned = false;
    do { game.lightningWave = Math.floor(Math.random() * 6) + 1; } while (game.lightningWave === game.diamondWave);
    game.lightningSpawned = false;
    do { game.meteorWave = Math.floor(Math.random() * 6) + 1; } while (game.meteorWave === game.diamondWave || game.meteorWave === game.lightningWave);
    game.meteorSpawned = false;
    
    // Random wave for wand (1-6)
    do { game.wandWave = Math.floor(Math.random() * 6) + 1; } while (game.wandWave === game.diamondWave || game.wandWave === game.lightningWave || game.wandWave === game.meteorWave);
    game.wandSpawned = false;
    
    console.log(`Diamond: ${game.diamondWave}, Lightning: ${game.lightningWave}, Meteor: ${game.meteorWave}, Wand: ${game.wandWave}`);
    game.waveTextTicks = 180;
}

function startTraining() {
    game.players = [];
    
    // Randomize background
    const backgrounds = [assets.underwaterBackground, assets.jungleBackground, assets.outerSpaceBackground, assets.moonBackground, assets.bossBackground, assets.titleBackground];
    assets.background = backgrounds[Math.floor(Math.random() * backgrounds.length)];
    
    // Generate random maze using Depth-First Search
    const grid = Array(10).fill().map(() => Array(20).fill(1));
    
    function carve(x, y) {
        grid[y][x] = 0;
        const dirs = [[0,2], [0,-2], [2,0], [-2,0]].sort(() => Math.random() - 0.5);
        for (const [dx, dy] of dirs) {
            const nx = x + dx; const ny = y + dy;
            if (nx > 0 && nx < 20 && ny > 0 && ny < 10 && grid[ny][nx] === 1) {
                grid[y + dy/2][x + dx/2] = 0;
                carve(nx, ny);
            }
        }
    }
    carve(1, 1);
    
    // Ensure goal is open
    let goalX = 17; let goalY = 7;
    grid[goalY][goalX] = 0;
    
    game.maze = grid;
    game.mazeGoal = { x: goalX * 80 + 15, y: goalY * 80 + 15, width: 50, height: 50 };
    
    const p1Controls = { up: 'KeyW', down: 'KeyS', left: 'KeyA', right: 'KeyD', attack: 'KeyC', super: 'KeyV' };
    const player = new Player(1 * 80 + 15, 1 * 80 + 15, 'dino', p1Controls, 0, 2);
    player.width = 50; player.height = 50;
    game.players.push(player);
}

function resetGame() {
    game.state = 'menu'; game.wave = 1; game.score = 0; game.players = []; game.enemies = []; game.projectiles = []; game.particles = []; game.boss = null; game.miniBoss = null; game.miniBoss2 = null; game.miniBoss3 = null; game.hearts = []; game.diamonds = []; game.lightnings = []; game.meteors = []; game.reviveItems = []; game.wands = []; game.ringEffect = null; game.lightningEffect = null; game.meteorEffect = null; game.miniBossTriggered = false; game.miniBoss2Triggered = false; game.miniBoss3Triggered = false; game.bossTriggered = false; game.warningTicks = 0; game.bossWarningTicks = 0; game.gameOverTicks = 0; assets.background = assets.underwaterBackground;
    game.selectedCharacters = [0, 1, 2]; game.lockedCharacters = [false, false, false]; game.selectedColors = [0, 0, 0]; game.lockedColors = [false, false, false];
    game.wandWave = 0; game.wandSpawned = false; game.paused = false;
    game.selectedDifficulties = [2, 2, 2]; game.lockedDifficulties = [false, false, false];
    game.playerJoined = [true, false, false];
    game.playerCount = 1;
}

window.addEventListener('keydown', (e) => {
    game.keys[e.code] = true;
    
    if (game.state === 'training' && game.trainingComplete) {
        if (e.code === 'ArrowUp') { game.trainingMenuIndex = (game.trainingMenuIndex - 1 + game.trainingMenuOptions.length) % game.trainingMenuOptions.length; }
        else if (e.code === 'ArrowDown') { game.trainingMenuIndex = (game.trainingMenuIndex + 1) % game.trainingMenuOptions.length; }
        else if (e.code === 'Enter') {
            if (game.trainingMenuIndex === 0) { startTraining(); game.trainingComplete = false; }
            else if (game.trainingMenuIndex === 1) { resetGame(); }
        }
        return;
    }
    
    if (e.code === 'Space' && (game.state === 'playing' || game.state === 'training')) {
        game.paused = !game.paused;
        return;
    }

    if (game.paused) { // Handle pause menu
        if (e.code === 'ArrowUp') { game.pauseMenuIndex = (game.pauseMenuIndex - 1 + game.pauseMenuOptions.length) % game.pauseMenuOptions.length; }
        else if (e.code === 'ArrowDown') { game.pauseMenuIndex = (game.pauseMenuIndex + 1) % game.pauseMenuOptions.length; }
        else if (e.code === 'Enter') {
            if (game.pauseMenuIndex === 0) { game.paused = false; } // Resume
            else if (game.pauseMenuIndex === 1) {
                if (game.state === 'training') { startTraining(); game.paused = false; }
                else { resetGame(); startGame(game.playerCount); game.state = 'playing'; }
            } // Restart
            else if (game.pauseMenuIndex === 2) { resetGame(); } // Quit
        }
        return;
    }
    
    if (game.state === 'menu') {
        if (e.code === 'ArrowUp') { game.menuIndex = (game.menuIndex - 1 + game.menuOptions.length) % game.menuOptions.length; }
        else if (e.code === 'ArrowDown') { game.menuIndex = (game.menuIndex + 1) % game.menuOptions.length; }
        else if (e.code === 'Enter') { game.menuFlashing = true; game.menuFlashTicks = 60; game.fadeSpeed = 0.05; }
    } else if (game.state === 'char_select') {
        // Dynamic joining
        if (!game.playerJoined[1] && e.code === 'KeyL') { game.playerJoined[1] = true; game.playerCount = Math.max(game.playerCount, 2); return; }
        if (!game.playerJoined[2] && e.code === 'KeyN') { game.playerJoined[2] = true; game.playerCount = Math.max(game.playerCount, 3); return; }

        // Player 1
        if (!game.lockedCharacters[0]) {
            if (e.code === 'KeyA') { game.selectedCharacters[0] = (game.selectedCharacters[0] - 1 + game.availableCharacters.length) % game.availableCharacters.length; }
            if (e.code === 'KeyD') { game.selectedCharacters[0] = (game.selectedCharacters[0] + 1) % game.availableCharacters.length; }
            if (e.code === 'KeyC' && canLock(0)) { game.lockedCharacters[0] = true; }
        } else if (!game.lockedColors[0]) {
            if (e.code === 'KeyA') { game.selectedColors[0] = (game.selectedColors[0] - 1 + 3) % 3; }
            if (e.code === 'KeyD') { game.selectedColors[0] = (game.selectedColors[0] + 1) % 3; }
            if (e.code === 'KeyC' && canLockColor(0, game.selectedColors[0])) { game.lockedColors[0] = true; }
            if (e.code === 'KeyV') { game.lockedCharacters[0] = false; game.lockedColors[0] = false; }
        } else if (!game.lockedDifficulties[0]) {
            if (e.code === 'KeyA') { game.selectedDifficulties[0] = (game.selectedDifficulties[0] - 1 + 5) % 5; }
            if (e.code === 'KeyD') { game.selectedDifficulties[0] = (game.selectedDifficulties[0] + 1) % 5; }
            if (e.code === 'KeyC') { game.lockedDifficulties[0] = true; }
            if (e.code === 'KeyV') { game.lockedColors[0] = false; game.lockedDifficulties[0] = false; }
        } else if (e.code === 'KeyV') { game.lockedDifficulties[0] = false; }

        // Player 2
        if (game.playerJoined[1]) {
            if (!game.lockedCharacters[1]) {
                if (e.code === 'ArrowLeft') { game.selectedCharacters[1] = (game.selectedCharacters[1] - 1 + game.availableCharacters.length) % game.availableCharacters.length; }
                if (e.code === 'ArrowRight') { game.selectedCharacters[1] = (game.selectedCharacters[1] + 1) % game.availableCharacters.length; }
                if (e.code === 'KeyL' && canLock(1)) { game.lockedCharacters[1] = true; }
                if (e.code === 'Semicolon') { game.playerJoined[1] = false; }
            } else if (!game.lockedColors[1]) {
                if (e.code === 'ArrowLeft') { game.selectedColors[1] = (game.selectedColors[1] - 1 + 3) % 3; }
                if (e.code === 'ArrowRight') { game.selectedColors[1] = (game.selectedColors[1] + 1) % 3; }
                if (e.code === 'KeyL' && canLockColor(1, game.selectedColors[1])) { game.lockedColors[1] = true; }
                if (e.code === 'Semicolon') { game.lockedCharacters[1] = false; game.lockedColors[1] = false; }
            } else if (!game.lockedDifficulties[1]) {
                if (e.code === 'ArrowLeft') { game.selectedDifficulties[1] = (game.selectedDifficulties[1] - 1 + 5) % 5; }
                if (e.code === 'ArrowRight') { game.selectedDifficulties[1] = (game.selectedDifficulties[1] + 1) % 5; }
                if (e.code === 'KeyL') { game.lockedDifficulties[1] = true; }
                if (e.code === 'Semicolon') { game.lockedColors[1] = false; game.lockedDifficulties[1] = false; }
            } else if (e.code === 'Semicolon') { game.lockedDifficulties[1] = false; }
        }

        // Player 3
        if (game.playerJoined[2]) {
            if (!game.lockedCharacters[2]) {
                if (e.code === 'KeyF') { game.selectedCharacters[2] = (game.selectedCharacters[2] - 1 + game.availableCharacters.length) % game.availableCharacters.length; }
                if (e.code === 'KeyH') { game.selectedCharacters[2] = (game.selectedCharacters[2] + 1) % game.availableCharacters.length; }
                if (e.code === 'KeyN' && canLock(2)) { game.lockedCharacters[2] = true; }
                if (e.code === 'KeyM') { game.playerJoined[2] = false; }
            } else if (!game.lockedColors[2]) {
                if (e.code === 'KeyF') { game.selectedColors[2] = (game.selectedColors[2] - 1 + 3) % 3; }
                if (e.code === 'KeyH') { game.selectedColors[2] = (game.selectedColors[2] + 1) % 3; }
                if (e.code === 'KeyN' && canLockColor(2, game.selectedColors[2])) { game.lockedColors[2] = true; }
                if (e.code === 'KeyM') { game.lockedCharacters[2] = false; game.lockedColors[2] = false; }
            } else if (!game.lockedDifficulties[2]) {
                if (e.code === 'KeyF') { game.selectedDifficulties[2] = (game.selectedDifficulties[2] - 1 + 5) % 5; }
                if (e.code === 'KeyH') { game.selectedDifficulties[2] = (game.selectedDifficulties[2] + 1) % 5; }
                if (e.code === 'KeyN') { game.lockedDifficulties[2] = true; }
                if (e.code === 'KeyM') { game.lockedColors[2] = false; game.lockedDifficulties[2] = false; }
            } else if (e.code === 'KeyM') { game.lockedDifficulties[2] = false; }
        }
        
        if (e.code === 'Backspace') {
            game.fadeDirection = 1; game.fadeAlpha = 0; game.nextState = 'menu_back';
        }
        
        if (e.code === 'Enter') {
            let allLocked = true;
            for (let i = 0; i < 3; i++) {
                if (game.playerJoined[i] && !game.lockedDifficulties[i]) { allLocked = false; break; }
            }
            if (allLocked) { game.fadeDirection = 1; game.fadeAlpha = 0; game.nextState = 'playing_start'; }
        }
    } else if (game.state === 'victory') { if (game.victoryTicks === 0) { resetGame(); } } 
    else if (game.state === 'gameover_screen') { resetGame(); }
});

window.addEventListener('keyup', (e) => { game.keys[e.code] = false; });
document.getElementById('controls-btn').addEventListener('click', () => { document.getElementById('controls-popup').classList.remove('hidden'); });
document.getElementById('close-popup').addEventListener('click', () => { document.getElementById('controls-popup').classList.add('hidden'); });
document.getElementById('back-btn').addEventListener('click', () => { game.fadeDirection = 1; game.fadeAlpha = 0; game.nextState = 'menu_back'; });

// Mobile Controls
function isMobile() {
    return ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
}

if (isMobile()) {
    document.getElementById('mobile-controls').classList.remove('hidden');
    
    const handleTouch = (id, key) => {
        const btn = document.getElementById(id);
        
        const press = (e) => {
            e.preventDefault();
            game.keys[key] = true;
        };
        
        const release = (e) => {
            e.preventDefault();
            game.keys[key] = false;
        };
        
        btn.addEventListener('touchstart', press, { passive: false });
        btn.addEventListener('touchend', release, { passive: false });
        btn.addEventListener('touchcancel', release, { passive: false });
        
        // Also handle mouse events for testing on desktop with dev tools
        btn.addEventListener('mousedown', (e) => { e.preventDefault(); game.keys[key] = true; });
        btn.addEventListener('mouseup', (e) => { e.preventDefault(); game.keys[key] = false; });
        btn.addEventListener('mouseleave', (e) => { e.preventDefault(); game.keys[key] = false; });
    };
    
    handleTouch('btn-up', 'KeyW');
    handleTouch('btn-down', 'KeyS');
    handleTouch('btn-left', 'KeyA');
    handleTouch('btn-right', 'KeyD');
    handleTouch('btn-attack', 'KeyC');
    handleTouch('btn-super', 'KeyV');
}
