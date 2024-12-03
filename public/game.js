// Configuring the Phaser game with basic settings
const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 800,
    parent: 'game-container', // Attach the game to the container
    physics: {
        default: 'arcade',
        arcade: { debug: false },
    },
    scale: {
        mode: Phaser.Scale.FIT, // Scale the game to fit the screen
        autoCenter: Phaser.Scale.CENTER_BOTH, // Center the game horizontally and vertically
    },
    scene: {
        preload: preload,
        create: create,
        update: update,
    },
};

// Create a new Phaser game instance using the config
const game = new Phaser.Game(config);
let gameOver = false;

// Declare variables for key game objects and logic
let starship;
let monsters;
let bullets;
let monsterBullets;
let cursors;
let score = 0;
let scoreText;
let playerHealth = 10; // Player's health
let healthText; // Display for player's health
let restartButton;
let countdownText; // For displaying the countdown
let isMobileDevice;
let pauseButton, pauseMenu, resumeButton, mainMenuButton;
let stage = 0;

// Function to load game assets (runs before the game starts)
function preload() {
    this.load.image('background', 'assets/background.jpg');
    this.load.image('starship', 'assets/starship.png');
    this.load.image('alien', 'assets/monster2.png');
    this.load.image('robot', 'assets/robot.png');
    this.load.image('boss', 'assets/boss.png');
    this.load.image('bullet', 'assets/bullet.png');
    this.load.image('fire', 'assets/fireball.png');
    this.load.image('electric', 'assets/electric.png');
    this.load.image('restart', 'assets/restart.png'); // Restart button sprite
}

// Function to set up game objects and logic
async function create() {
    // Detect if the device is mobile
    isMobileDevice = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    // Add and configure the background
    this.add.image(400, 400, 'background').setDisplaySize(800, 800);

    pauseButton = document.getElementById('pause-button');
    pauseMenu = document.getElementById('pause-menu');
    resumeButton = document.getElementById('resume-button');
    mainMenuButton = document.getElementById('main-menu-button');

    // Pause button functionality
    pauseButton.addEventListener('click', handlePause);

    // Resume button functionality
    resumeButton.addEventListener('click', handleResume);

    // Main menu button functionality
    mainMenuButton.addEventListener('click', handleMainMenu);

    // Add and configure the starship
    starship = this.physics.add
        .sprite(400, 550, 'starship')
        .setCollideWorldBounds(true)
        .setDisplaySize(64, 64);

    // Initialize monsters group
    monsters = this.physics.add.group();

    // Load monster data from JSON
    let monsterData;
    try {
        const response = await fetch(`/api/map/${stage+1}`);
        let data = await response.json();
        console.log(data)
        monsterData = data.entities
    } catch (error) {
        console.log('Error loading monster JSON:', error);
        return;
    }

    // Dynamically create monsters and assign attack logic
    monsterData.forEach((monster) => {
        const newMonster = monsters.create(monster.x, monster.y, monster.sprite || 'monster');
        newMonster.setData('type', monster.type);
        newMonster.setData('health', monster.health || 1);
        newMonster.setData('attackPeriod', monster.attackPeriod || 2000);
        newMonster.setData('attackStyle', monster.attackStyle || 'straight');
        newMonster.setData('direction', 1); // Initial movement direction
        newMonster.setDisplaySize(monster.sizeX, monster.sizeX);

        // Set up an individual attack timer for each monster
        this.time.addEvent({
            delay: newMonster.getData('attackPeriod'),
            callback: () => monsterAttack.call(this, newMonster),
            callbackScope: this,
            loop: true
        });
    });

    // Bullets setup
    bullets = this.physics.add.group();
    monsterBullets = this.physics.add.group();

    // Add score display
    scoreText = this.add.text(16, 16, `Score: ${score}`, { fontSize: '32px', fill: '#fff' });

    // Add health display
    healthText = this.add.text(16, 50, 'Health: ' + playerHealth, { fontSize: '32px', fill: '#fff' });

    // Set up collision detection
    this.physics.add.overlap(bullets, monsters, destroyMonster, null, this);
    this.physics.add.collider(monsterBullets, starship, hitStarship, null, this);

    // Add a timer for auto-shooting
    this.time.addEvent({
        delay: 500, // Fire bullets every 500ms
        callback: () => {
            if (gameOver) return;
            const bullet = bullets.create(starship.x, starship.y - 20, 'bullet');
            bullet.setVelocityY(-300);
            bullet.setDisplaySize(10, 20);
        },
        callbackScope: this,
        loop: true,
    });

    if (isMobileDevice) {
        // Mobile: Drag to move
        this.input.on('pointermove', (pointer) => {
            if (gameOver) return;
            if (pointer.isDown) {
                starship.x = Phaser.Math.Clamp(pointer.x, 0, config.width);
            }
        });
    } else {
        // Desktop: Follow mouse pointer
        this.input.on('pointermove', (pointer) => {
            if (gameOver) return;
            starship.x = Phaser.Math.Clamp(pointer.x, 0, config.width);
        });
    }

    // Add restart button (hidden initially)
    restartButton = this.add.image(400, 400, 'restart')
        .setInteractive()
        .setVisible(false)
        .setScale(0.5);
    restartButton.on('pointerdown', () => restartGame.call(this));

    window.addEventListener('resize', resizeGame);
    resizeGame(); // Call resizeGame initially    
}

function resizeGame() {
    const canvas = document.querySelector('canvas');
    if (canvas) {
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;
        const gameRatio = config.width / config.height;

        if (windowWidth / windowHeight < gameRatio) {
            canvas.style.width = `${windowWidth}px`;
            canvas.style.height = `${windowWidth / gameRatio}px`;
        } else {
            canvas.style.width = `${windowHeight * gameRatio}px`;
            canvas.style.height = `${windowHeight}px`;
        }
    }
}

// Function that runs every frame (~60 times per second by default)
function update() {
    if (gameOver) return;

    // Move monsters left and right
    monsters.children.iterate((monster) => {
        if (monster.active) {
            const direction = monster.getData('direction');
            monster.x += direction * 0.5; // Move slowly left or right
            if (monster.x <= 50 || monster.x >= 750) {
                monster.setData('direction', direction * -1); // Reverse direction
            }
        }
    });
}

// Function to handle when a player's bullet hits a monster
function destroyMonster(bullet, monster) {
    bullet.destroy();
    const health = monster.getData('health') - 1;

    if (health <= 0) {
        monster.destroy();
    } else {
        monster.setData('health', health);
    }

    score += 1;
    scoreText.setText('Score: ' + score);

    // Check if all monsters are destroyed
    if (monsters.countActive(true) === 0) {
        if (stage == 9) {
            endGame.call(this);
        }
        else {
            startCountdown.call(this);
        }
    }
}

// Function to start the countdown
function startCountdown() {
    let countdown = 3; // Countdown starts from 3
    stage++;

    // Display the countdown text
    countdownText = this.add.text(config.width / 2, config.height / 2, `Stage ${stage+1} start in ${countdown}`, {
        fontSize: '48px',
        fill: '#fff',
    }).setOrigin(0.5);

    // Timer event for the countdown
    const timer = this.time.addEvent({
        delay: 1000, // 1 second interval
        callback: () => {
            countdown -= 1; // Decrease countdown
            if (countdown > 0) {
                countdownText.setText(`Stage ${stage+1} start in ${countdown}`);
            } else {
                timer.remove(); // Stop the timer
                nextStageGame.call(this); // next stage the game
            }
        },
        loop: true,
    });
}

// Function to handle when a monster's bullet hits the starship
function hitStarship(starship, bullet) {
    bullet.destroy();
    playerHealth -= 1; // Decrease player health
    healthText.setText('Health: ' + playerHealth);

    // Reset starship's velocity after being hit
    starship.setVelocity(0, 0);
    starship.y = 550

    if (playerHealth <= 0) {
        endGame.call(this);
    }
}

// Function to make monsters attack with different bullet styles
function monsterAttack(monster) {
    if (gameOver) return;
    if (!monster.active) return;

    const attackStyle = monster.getData('attackStyle');
    const bulletSpeed = 300;

    switch (attackStyle) {
        case 'straight':
            const straightBullet = monsterBullets.create(monster.x, monster.y + 20, 'fire');
            straightBullet.setVelocityY(bulletSpeed);
            straightBullet.setDisplaySize(10, 20);
            break;

        case 'zigzag':
            const direction = Phaser.Math.Between(0, 1) === 0 ? -1 : 1;
            const zigzagBullet = monsterBullets.create(monster.x, monster.y + 20, 'electric');
            zigzagBullet.setVelocity(bulletSpeed * direction * 0.5, bulletSpeed);
            zigzagBullet.setDisplaySize(100, 100);
            break;

        case 'spread':
            for (let angle = -45; angle <= 45; angle += 15) {
                const spreadBullet = monsterBullets.create(monster.x, monster.y + 20, 'fire');
                spreadBullet.setDisplaySize(10, 20);
                this.physics.velocityFromAngle(angle + 90, bulletSpeed, spreadBullet.body.velocity);
            }
            break;

        default:
            const defaultBullet = monsterBullets.create(monster.x, monster.y + 20, 'fire');
            defaultBullet.setVelocityY(bulletSpeed);
            defaultBullet.setDisplaySize(10, 20);
            break;
    }
}

function handlePause() {
    if (game.scene.isPaused('default')) {
        game.scene.resume('default');
        pauseMenu.classList.add('hidden'); // Hide pause menu
    } else {
        game.scene.pause('default');
        pauseMenu.classList.remove('hidden'); // Show pause menu
    }
}

function handleResume() {
    game.scene.resume('default');
    pauseMenu.classList.add('hidden'); // Hide pause menu
    pauseButton.textContent = 'Pause'; // Reset pause button text
}

function handleMainMenu() {
    // Navigate to main menu (reload or redirect)
    window.location.href = '/'; // Redirect to the main menu page
}

// Function to end the game
function endGame() {
    gameOver = true; // Mark the game as over
    this.physics.pause(); // Pause all physics
    monsters.children.iterate((monster) => {
        monster.body.enable = false; // Disable monster physics
    });
    restartButton.setVisible(true); // Show restart button
    starship.setTint(0xff0000); // Tint the starship red

    fetch('/api/user/score', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ score }) // Send the score in the request body
    })
        .then(response => {
            if (response.ok) {
                console.log('Score saved successfully');
            } else {
                return response.json().then(data => {
                    console.error('Error saving score:', data.error);
                });
            }
        })
        .catch(error => {
            console.error('Error:', error);
        });
}

// Function to restart the game
function restartGame() {
    stage=0
    gameOver = false;
    playerHealth = 10;
    score = 0;
    this.scene.restart(); // Restart the scene
}


function nextStageGame() {
    gameOver = false;
    playerHealth += 8;
    this.scene.restart(); // Restart the scene
}