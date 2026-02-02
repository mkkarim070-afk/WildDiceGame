// Game Configuration
const CONFIG = {
    currentLevel: 1,
    totalLevels: 100,
    diceCount: 15,
    score: 0,
    soundEnabled: true,
    maxSelection: 0,
    selectedTiles: []
};

// Tile Categories
const TILE_CATEGORIES = {
    animals: {
        name: "Animals",
        icon: "🦁",
        percentage: 30,
        tiles: ["🦁", "🐘", "🦒", "🐼", "🐯", "🦊", "🐻", "🦓"]
    },
    birds: {
        name: "Birds", 
        icon: "🦜",
        percentage: 25,
        tiles: ["🦜", "🦅", "🦚", "🦉", "🦩", "🦢", "🐦", "🐓"]
    },
    flowers: {
        name: "Flowers",
        icon: "🌹",
        percentage: 25,
        tiles: ["🌹", "🌸", "🌻", "🌺", "🌷", "💐", "🪷", "🌼"]
    },
    fruits: {
        name: "Fruits",
        icon: "🍎",
        percentage: 20,
        tiles: ["🍎", "🍌", "🍇", "🍊", "🍓", "🍍", "🥭", "🍑"]
    }
};

// Game State
let gameState = {
    currentTargets: {},
    lastSix: -5,
    totalRolls: 0
};

// Initialize Game
function initGame() {
    generateLevel();
    setupEventListeners();
    updateDisplay();
}

// Generate Level
function generateLevel() {
    // Clear previous
    CONFIG.selectedTiles = [];
    CONFIG.maxSelection = 0;
    
    // Set dice count based on level
    if (CONFIG.currentLevel <= 9) CONFIG.diceCount = 20;
    else if (CONFIG.currentLevel <= 29) CONFIG.diceCount = 18;
    else if (CONFIG.currentLevel <= 49) CONFIG.diceCount = 16;
    else if (CONFIG.currentLevel <= 69) CONFIG.diceCount = 14;
    else if (CONFIG.currentLevel <= 89) CONFIG.diceCount = 12;
    else CONFIG.diceCount = 10;
    
    // Generate targets
    generateTargets();
    
    // Generate tiles
    generateTiles();
    
    // Update display
    updateDisplay();
}

// Generate Targets
function generateTargets() {
    gameState.currentTargets = {};
    const level = CONFIG.currentLevel;
    
    // Determine number of target types
    let targetTypes;
    if (level <= 9) targetTypes = 1;
    else if (level <= 29) targetTypes = 2;
    else if (level <= 49) targetTypes = 3;
    else targetTypes = 4;
    
    // Select random categories
    const categories = Object.keys(TILE_CATEGORIES);
    const selected = [];
    
    while (selected.length < targetTypes) {
        const randomCat = categories[Math.floor(Math.random() * categories.length)];
        if (!selected.includes(randomCat)) {
            selected.push(randomCat);
        }
    }
    
    // Create targets
    selected.forEach(category => {
        const base = Math.floor(level / 3) + 3;
        const needed = base + Math.floor(Math.random() * 3);
        
        gameState.currentTargets[category] = {
            name: TILE_CATEGORIES[category].name,
            icon: TILE_CATEGORIES[category].icon,
            needed: needed,
            collected: 0
        };
    });
    
    updateTargetsDisplay();
}

// Generate Tiles
function generateTiles() {
    const board = document.getElementById('gameBoard');
    board.innerHTML = '';
    
    // Calculate tile distribution
    const totalTiles = 12;
    const counts = {
        animals: Math.floor(totalTiles * 0.30),
        birds: Math.floor(totalTiles * 0.25),
        flowers: Math.floor(totalTiles * 0.25),
        fruits: Math.floor(totalTiles * 0.20)
    };
    
    // Create tile array
    let allTiles = [];
    
    Object.keys(counts).forEach(category => {
        for (let i = 0; i < counts[category]; i++) {
            const tile = TILE_CATEGORIES[category].tiles[
                Math.floor(Math.random() * TILE_CATEGORIES[category].tiles.length)
            ];
            allTiles.push({
                category: category,
                emoji: tile,
                id: Math.random().toString(36).substr(2, 9)
            });
        }
    });
    
    // Shuffle and create tiles
    shuffleArray(allTiles);
    
    allTiles.forEach((tile, index) => {
        const tileElement = document.createElement('div');
        tileElement.className = 'tile';
        tileElement.innerHTML = tile.emoji;
        tileElement.dataset.id = tile.id;
        tileElement.dataset.category = tile.category;
        
        tileElement.addEventListener('click', () => selectTile(tileElement));
        board.appendChild(tileElement);
    });
}

// Select Tile
function selectTile(tile) {
    if (CONFIG.maxSelection === 0) {
        showMessage("Roll dice first!");
        return;
    }
    
    if (CONFIG.selectedTiles.length >= CONFIG.maxSelection) {
        showMessage(`Select only ${CONFIG.maxSelection} tiles`);
        return;
    }
    
    if (tile.classList.contains('used')) {
        return;
    }
    
    if (tile.classList.contains('selected')) {
        // Deselect
        tile.classList.remove('selected');
        const index = CONFIG.selectedTiles.indexOf(tile);
        if (index > -1) {
            CONFIG.selectedTiles.splice(index, 1);
        }
    } else {
        // Select
        tile.classList.add('selected');
        CONFIG.selectedTiles.push(tile);
    }
    
    // Auto process if enough selected
    if (CONFIG.selectedTiles.length === CONFIG.maxSelection) {
        setTimeout(processTiles, 500);
    }
}

// Roll Dice
function rollDice() {
    if (CONFIG.diceCount <= 0) {
        showMessage("No dice left! Reset level.");
        return;
    }
    
    if (CONFIG.maxSelection > 0) {
        showMessage("Process selected tiles first!");
        return;
    }
    
    const dice = document.getElementById('dice');
    const rollBtn = document.getElementById('rollBtn');
    
    // Disable button during roll
    rollBtn.disabled = true;
    rollBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> ROLLING...';
    
    // Add rolling animation
    dice.classList.add('rolling');
    
    // Calculate roll with AI logic
    setTimeout(() => {
        const roll = calculateRoll();
        
        // Update dice
        dice.classList.remove('rolling');
        document.getElementById('diceNumber').textContent = roll;
        
        // Update game state
        CONFIG.diceCount--;
        gameState.totalRolls++;
        CONFIG.maxSelection = roll;
        
        // Update display
        updateDiceDisplay();
        rollBtn.disabled = false;
        rollBtn.innerHTML = '<i class="fas fa-redo"></i> ROLL DICE';
        
        showMessage(`🎲 Rolled: ${roll}. Select ${roll} tiles.`);
        
        // Check if out of dice
        if (CONFIG.diceCount <= 0) {
            setTimeout(checkLevelComplete, 1000);
        }
    }, 1000);
}

// Calculate Roll with AI
function calculateRoll() {
    const rolls = gameState.totalRolls;
    const diceLeft = CONFIG.diceCount;
    const lastSix = gameState.lastSix;
    
    // AI Logic
    if (rolls === 0) {
        // First roll - higher chance of good number
        return weightedRandom([4, 5, 6, 3, 2, 1], [25, 25, 20, 15, 10, 5]);
    }
    
    if (diceLeft <= 3 && rolls - lastSix > 2) {
        // Low dice - give six to help
        gameState.lastSix = rolls;
        return 6;
    }
    
    if (rolls - lastSix > 5) {
        // Haven't gotten six in a while
        if (Math.random() < 0.4) {
            gameState.lastSix = rolls;
            return 6;
        }
    }
    
    // Normal random
    return Math.floor(Math.random() * 6) + 1;
}

// Process Selected Tiles
function processTiles() {
    if (CONFIG.selectedTiles.length === 0) return;
    
    // Count tiles by category
    const counts = {};
    CONFIG.selectedTiles.forEach(tile => {
        const cat = tile.dataset.category;
        counts[cat] = (counts[cat] || 0) + 1;
    });
    
    // Update targets
    let points = 0;
    Object.keys(counts).forEach(category => {
        if (gameState.currentTargets[category]) {
            const before = gameState.currentTargets[category].collected;
            gameState.currentTargets[category].collected += counts[category];
            
            // Cap at needed
            if (gameState.currentTargets[category].collected > gameState.currentTargets[category].needed) {
                gameState.currentTargets[category].collected = gameState.currentTargets[category].needed;
            }
            
            // Calculate points
            const collectedNow = gameState.currentTargets[category].collected - before;
            points += collectedNow * 100;
            
            // Bonus for completing category
            if (gameState.currentTargets[category].collected === gameState.currentTargets[category].needed) {
                points += 500;
                showMessage(`✅ ${gameState.currentTargets[category].name} completed! +500 bonus`);
            }
        }
    });
    
    // Mark tiles as used
    CONFIG.selectedTiles.forEach(tile => {
        tile.classList.remove('selected');
        tile.classList.add('used');
    });
    
    // Update score
    CONFIG.score += points;
    CONFIG.selectedTiles = [];
    CONFIG.maxSelection = 0;
    
    updateDisplay();
    updateTargetsDisplay();
    showMessage(`+${points} points!`);
    
    // Check level completion
    setTimeout(checkLevelComplete, 500);
}

// Check Level Complete
function checkLevelComplete() {
    const allComplete = Object.values(gameState.currentTargets).every(
        target => target.collected >= target.needed
    );
    
    if (allComplete) {
        // Level complete
        const diceBonus = CONFIG.diceCount * 50;
        const levelBonus = CONFIG.currentLevel * 10;
        const totalBonus = diceBonus + levelBonus;
        
        CONFIG.score += totalBonus;
        
        showMessage(
            `🎉 LEVEL ${CONFIG.currentLevel} COMPLETE!<br>` +
            `Bonus: +${totalBonus} points<br>` +
            `Click anywhere to continue`
        );
        
        updateDisplay();
        
        // Prepare for next level
        document.getElementById('gameBoard').addEventListener('click', nextLevel, { once: true });
        
    } else if (CONFIG.diceCount <= 0) {
        // Level failed
        showMessage(
            `❌ Out of dice! Level failed.<br>` +
            `You collected ${getCompletionPercent()}% of targets.<br>` +
            `Click RESET to try again.`
        );
    }
}

// Next Level
function nextLevel() {
    CONFIG.currentLevel++;
    if (CONFIG.currentLevel > CONFIG.totalLevels) {
        CONFIG.currentLevel = 1;
    }
    
    gameState.totalRolls = 0;
    gameState.lastSix = -5;
    
    generateLevel();
    showMessage(`LEVEL ${CONFIG.currentLevel} - Good luck!`);
}

// Reset Level
function resetLevel() {
    generateLevel();
    showMessage("Level reset!");
}

// Get Extra Dice
function getExtraDice() {
    showMessage("Watching ad for extra dice...");
    
    setTimeout(() => {
        CONFIG.diceCount += 3;
        updateDiceDisplay();
        showMessage("+3 dice added!");
    }, 1500);
}

// Show Hint
function showHint() {
    const incomplete = Object.keys(gameState.currentTargets).filter(
        cat => gameState.currentTargets[cat].collected < gameState.currentTargets[cat].needed
    );
    
    if (incomplete.length > 0) {
        const randomCat = incomplete[Math.floor(Math.random() * incomplete.length)];
        const target = gameState.currentTargets[randomCat];
        const needed = target.needed - target.collected;
        
        showMessage(`💡 Hint: Focus on ${target.name}. Need ${needed} more.`);
    } else {
        showMessage("All targets complete! Roll dice to finish.");
    }
}

// Toggle Sound
function toggleSound() {
    CONFIG.soundEnabled = !CONFIG.soundEnabled;
    const soundBtn = document.getElementById('soundBtn');
    soundBtn.innerHTML = CONFIG.soundEnabled ? 
        '<i class="fas fa-volume-up"></i> SOUND ON' : 
        '<i class="fas fa-volume-mute"></i> SOUND OFF';
    
    showMessage(CONFIG.soundEnabled ? "Sound enabled" : "Sound disabled");
}

// Update Display
function updateDisplay() {
    document.getElementById('currentLevel').textContent = CONFIG.currentLevel;
    document.getElementById('score').textContent = CONFIG.score;
    updateDiceDisplay();
}

// Update Dice Display
function updateDiceDisplay() {
    document.getElementById('rollsLeft').textContent = CONFIG.diceCount;
    document.getElementById('totalRolls').textContent = gameState.totalRolls;
    
    const rollBtn = document.getElementById('rollBtn');
    rollBtn.disabled = CONFIG.diceCount <= 0 || CONFIG.maxSelection > 0;
}

// Update Targets Display
function updateTargetsDisplay() {
    const container = document.getElementById('targetsContainer');
    container.innerHTML = '';
    
    Object.keys(gameState.currentTargets).forEach(category => {
        const target = gameState.currentTargets[category];
        const percent = (target.collected / target.needed) * 100;
        
        const targetItem = document.createElement('div');
        targetItem.className = 'target-item';
        targetItem.innerHTML = `
            <div class="target-icon">${target.icon}</div>
            <div class="target-details">
                <div class="target-name">${target.name}</div>
                <div class="target-progress">
                    <div class="progress-bar" style="width: ${Math.min(percent, 100)}%"></div>
                </div>
                <div class="target-count">${target.collected}/${target.needed}</div>
            </div>
        `;
        
        container.appendChild(targetItem);
    });
}

// Show Message
function showMessage(text) {
    const message = document.getElementById('message');
    message.innerHTML = text;
    message.classList.add('show');
    
    setTimeout(() => {
        message.classList.remove('show');
    }, 3000);
}

// Get Completion Percentage
function getCompletionPercent() {
    const totalNeeded = Object.values(gameState.currentTargets).reduce((a, b) => a + b.needed, 0);
    const totalCollected = Object.values(gameState.currentTargets).reduce((a, b) => a + b.collected, 0);
    return Math.round((totalCollected / totalNeeded) * 100);
}

// Utility Functions
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function weightedRandom(values, weights) {
    const total = weights.reduce((a, b) => a + b, 0);
    const random = Math.random() * total;
    let sum = 0;
    
    for (let i = 0; i < values.length; i++) {
        sum += weights[i];
        if (random < sum) return values[i];
    }
    return values[0];
}

// Setup Event Listeners
function setupEventListeners() {
    document.getElementById('rollBtn').addEventListener('click', rollDice);
    document.getElementById('resetBtn').addEventListener('click', resetLevel);
    document.getElementById('hintBtn').addEventListener('click', showHint);
    document.getElementById('soundBtn').addEventListener('click', toggleSound);
    document.getElementById('extraBtn').addEventListener('click', getExtraDice);
    document.getElementById('homeBtn').addEventListener('click', () => {
        CONFIG.currentLevel = 1;
        CONFIG.score = 0;
        initGame();
        showMessage("Returned to level 1");
    });
}

// Initialize when page loads
window.addEventListener('DOMContentLoaded', initGame);
