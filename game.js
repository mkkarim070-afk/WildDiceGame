// Game Configuration
const CONFIG = {
    currentLevel: 1,
    totalLevels: 100,
    diceCount: 15,
    score: 0,
    soundEnabled: true,
    totalRolls: 0,
    selectedTiles: [],
    maxSelection: 0
};

// Tile Categories with exact distribution
const TILE_CATEGORIES = {
    animals: {
        name: "Animals",
        icon: "🦁",
        percentage: 30,
        types: [
            { name: "Lion", icon: "🦁", color: "#FF6B35" },
            { name: "Elephant", icon: "🐘", color: "#4361EE" },
            { name: "Giraffe", icon: "🦒", color: "#FFD166" },
            { name: "Panda", icon: "🐼", color: "#000000" },
            { name: "Tiger", icon: "🐯", color: "#FF9E00" },
            { name: "Fox", icon: "🦊", color: "#FF5400" },
            { name: "Bear", icon: "🐻", color: "#8B4513" },
            { name: "Zebra", icon: "🦓", color: "#000000" },
            { name: "Rhino", icon: "🦏", color: "#6D6875" },
            { name: "Kangaroo", icon: "🦘", color: "#FFB4A2" },
            { name: "Hippo", icon: "🦛", color: "#B5838D" },
            { name: "Monkey", icon: "🐵", color: "#A663CC" }
        ]
    },
    birds: {
        name: "Birds",
        icon: "🦜",
        percentage: 25,
        types: [
            { name: "Parrot", icon: "🦜", color: "#06D6A0" },
            { name: "Eagle", icon: "🦅", color: "#8338EC" },
            { name: "Peacock", icon: "🦚", color: "#3A86FF" },
            { name: "Owl", icon: "🦉", color: "#774936" },
            { name: "Flamingo", icon: "🦩", color: "#FF006E" },
            { name: "Swan", icon: "🦢", color: "#FFFFFF" },
            { name: "Hummingbird", icon: "🐦", color: "#FB5607" },
            { name: "Penguin", icon: "🐧", color: "#000000" },
            { name: "Rooster", icon: "🐓", color: "#FFBE0B" },
            { name: "Duck", icon: "🦆", color: "#FF9E00" }
        ]
    },
    flowers: {
        name: "Flowers",
        icon: "🌹",
        percentage: 25,
        types: [
            { name: "Rose", icon: "🌹", color: "#FF006E" },
            { name: "Sunflower", icon: "🌻", color: "#FFBE0B" },
            { name: "Tulip", icon: "🌷", color: "#FF5400" },
            { name: "Cherry Blossom", icon: "🌸", color: "#FFAFCC" },
            { name: "Lotus", icon: "🪷", color: "#FF8FA3" },
            { name: "Hibiscus", icon: "🌺", color: "#FB5607" },
            { name: "Lavender", icon: "🪻", color: "#9B5DE5" },
            { name: "Daisy", icon: "🌼", color: "#FFD166" },
            { name: "Orchid", icon: "💐", color: "#8338EC" },
            { name: "Cactus", icon: "🌵", color: "#06D6A0" }
        ]
    },
    fruits: {
        name: "Fruits",
        icon: "🍎",
        percentage: 20,
        types: [
            { name: "Apple", icon: "🍎", color: "#FF0000" },
            { name: "Banana", icon: "🍌", color: "#FFBE0B" },
            { name: "Grapes", icon: "🍇", color: "#7209B7" },
            { name: "Orange", icon: "🍊", color: "#FF9E00" },
            { name: "Strawberry", icon: "🍓", color: "#FF006E" },
            { name: "Pineapple", icon: "🍍", color: "#FFD166" },
            { name: "Watermelon", icon: "🍉", color: "#06D6A0" },
            { name: "Mango", icon: "🥭", color: "#FF9E00" },
            { name: "Peach", icon: "🍑", color: "#FFAFCC" },
            { name: "Pear", icon: "🍐", color: "#C1E1C1" }
        ]
    }
};

// Game State
let gameState = {
    currentTargets: {},
    diceAI: null,
    levelComplete: false,
    lastSixRoll: -5
};

// Dice AI Class
class DiceAI {
    constructor() {
        this.rollHistory = [];
        this.consecutiveLowRolls = 0;
        this.playerStuck = false;
    }
    
    calculateRoll() {
        const currentLevel = CONFIG.currentLevel;
        const rollsLeft = CONFIG.diceCount;
        const totalRolls = CONFIG.totalRolls;
        
        // Base random roll
        let baseRoll = Math.floor(Math.random() * 6) + 1;
        
        // Strategic AI Logic
        if (this.shouldGiveSix()) {
            baseRoll = 6;
            this.handleSpecialSix();
        } else if (this.shouldGiveHighRoll()) {
            baseRoll = this.weightedRoll([4, 5, 6, 3, 2, 1], [30, 25, 20, 15, 7, 3]);
        } else if (this.shouldGiveLowRoll()) {
            baseRoll = this.weightedRoll([1, 2, 3, 4, 5, 6], [40, 25, 20, 10, 4, 1]);
        }
        
        this.rollHistory.push(baseRoll);
        this.updatePlayerState(baseRoll);
        
        return baseRoll;
    }
    
    shouldGiveSix() {
        const rolls = this.rollHistory.length;
        const lastSix = gameState.lastSixRoll;
        
        // Give six on first roll
        if (rolls === 0) return Math.random() < 0.3;
        
        // Give six when player stuck
        if (this.playerStuck && rolls - lastSix > 3) return Math.random() < 0.7;
        
        // Give six on last few dice
        if (CONFIG.diceCount <= 3 && rolls - lastSix > 2) return Math.random() < 0.6;
        
        // Random strategic six (10% chance)
        if (Math.random() < 0.1 && rolls - lastSix > 5) return true;
        
        return false;
    }
    
    shouldGiveHighRoll() {
        // Early in level
        if (CONFIG.totalRolls < 3) return true;
        
        // When player needs to catch up
        if (this.playerStuck) return true;
        
        // After consecutive low rolls
        if (this.consecutiveLowRolls >= 2) return true;
        
        return false;
    }
    
    shouldGiveLowRoll() {
        // When player is doing too well
        const completion = this.calculateTargetCompletion();
        if (completion > 0.7 && CONFIG.diceCount > 10) return true;
        
        // On high difficulty levels
        if (CONFIG.currentLevel > 50) return Math.random() < 0.3;
        
        return false;
    }
    
    handleSpecialSix() {
        gameState.lastSixRoll = this.rollHistory.length;
        
        // Give extra dice on special six
        if (CONFIG.diceCount < 25 && Math.random() < 0.5) {
            CONFIG.diceCount++;
            showToast("🎉 Special Six! +1 Extra Dice!", "success");
            updateDiceDisplay();
        }
    }
    
    weightedRoll(numbers, weights) {
        const total = weights.reduce((a, b) => a + b, 0);
        const random = Math.random() * total;
        let sum = 0;
        
        for (let i = 0; i < numbers.length; i++) {
            sum += weights[i];
            if (random < sum) return numbers[i];
        }
        return numbers[0];
    }
    
    updatePlayerState(roll) {
        // Track consecutive low rolls
        if (roll <= 2) {
            this.consecutiveLowRolls++;
        } else {
            this.consecutiveLowRolls = 0;
        }
        
        // Detect if player is stuck
        const completion = this.calculateTargetCompletion();
        const expectedProgress = CONFIG.totalRolls * 0.1;
        this.playerStuck = completion < expectedProgress - 0.2;
    }
    
    calculateTargetCompletion() {
        const totalNeeded = Object.values(gameState.currentTargets).reduce((a, b) => a + b.needed, 0);
        const totalCollected = Object.values(gameState.currentTargets).reduce((a, b) => a + b.collected, 0);
        return totalNeeded > 0 ? totalCollected / totalNeeded : 0;
    }
}

// Initialize Game
function initGame() {
    gameState.diceAI = new DiceAI();
    generateLevelTargets();
    generateTileGrid();
    updateDisplay();
    setupEventListeners();
}

// Generate Level Targets
function generateLevelTargets() {
    const level = CONFIG.currentLevel;
    gameState.currentTargets = {};
    
    // Determine number of target categories based on level
    let categoriesCount;
    if (level <= 9) categoriesCount = 1;
    else if (level <= 29) categoriesCount = 2;
    else if (level <= 49) categoriesCount = 3;
    else categoriesCount = 4;
    
    // Select random categories
    const allCategories = Object.keys(TILE_CATEGORIES);
    const selectedCategories = [];
    
    while (selectedCategories.length < categoriesCount) {
        const randomCat = allCategories[Math.floor(Math.random() * allCategories.length)];
        if (!selectedCategories.includes(randomCat)) {
            selectedCategories.push(randomCat);
        }
    }
    
    // Generate targets for each selected category
    selectedCategories.forEach(category => {
        const baseAmount = Math.floor(level / 3) + 3;
        const variance = Math.floor(baseAmount * 0.3);
        const needed = baseAmount + Math.floor(Math.random() * variance);
        
        gameState.currentTargets[category] = {
            name: TILE_CATEGORIES[category].name,
            icon: TILE_CATEGORIES[category].icon,
            needed: needed,
            collected: 0,
            color: TILE_CATEGORIES[category].types[0].color
        };
    });
    
    updateTargetDisplay();
}

// Generate Vita Mahjong 3D Tile Grid
function generateTileGrid() {
    const gameBoard = document.getElementById('gameBoard');
    gameBoard.innerHTML = '';
    
    // Calculate total tiles needed (12 tiles for 3 layers)
    const totalTiles = 12;
    const tileCounts = calculateTileDistribution(totalTiles);
    
    // Create all tiles
    const allTiles = [];
    Object.keys(tileCounts).forEach(category => {
        for (let i = 0; i < tileCounts[category]; i++) {
            const type = TILE_CATEGORIES[category].types[
                Math.floor(Math.random() * TILE_CATEGORIES[category].types.length)
            ];
            allTiles.push({
                category: category,
                name: type.name,
                icon: type.icon,
                color: type.color
            });
        }
    });
    
    // Shuffle tiles
    shuffleArray(allTiles);
    
    // Create 3D pyramid layout
    const layers = [
        { count: 5, zIndex: 0, className: 'layer-1' },  // Bottom layer
        { count: 4, zIndex: 30, className: 'layer-2' }, // Middle layer
        { count: 3, zIndex: 60, className: 'layer-3' }  // Top layer
    ];
    
    let tileIndex = 0;
    layers.forEach(layer => {
        const layerDiv = document.createElement('div');
        layerDiv.className = `tile-layer ${layer.className}`;
        layerDiv.style.transform = `translateZ(${layer.zIndex}px)`;
        
        for (let i = 0; i < layer.count && tileIndex < allTiles.length; i++) {
            const tile = allTiles[tileIndex];
            const tileElement = createTileElement(tile, tileIndex);
            layerDiv.appendChild(tileElement);
            tileIndex++;
        }
        
        gameBoard.appendChild(layerDiv);
    });
}

// Calculate exact tile distribution
function calculateTileDistribution(totalTiles) {
    const counts = {};
    let remainingTiles = totalTiles;
    
    Object.keys(TILE_CATEGORIES).forEach(category => {
        const percentage = TILE_CATEGORIES[category].percentage;
        const count = Math.floor(totalTiles * (percentage / 100));
        counts[category] = count;
        remainingTiles -= count;
    });
    
    // Distribute remaining tiles
    const categories = Object.keys(TILE_CATEGORIES);
    for (let i = 0; i < remainingTiles; i++) {
        const randomCat = categories[Math.floor(Math.random() * categories.length)];
        counts[randomCat]++;
    }
    
    return counts;
}

// Create individual tile element
function createTileElement(tileData, index) {
    const tile = document.createElement('div');
    tile.className = 'tile';
    tile.dataset.index = index;
    tile.dataset.category = tileData.category;
    tile.dataset.name = tileData.name;
    
    tile.innerHTML = `
        <div class="tile-icon" style="color: ${tileData.color}">${tileData.icon}</div>
        <div class="tile-type">${tileData.category}</div>
    `;
    
    tile.addEventListener('click', () => selectTile(tile));
    return tile;
}

// Select Tile
function selectTile(tileElement) {
    if (CONFIG.maxSelection === 0) {
        showToast("Roll the dice first!", "warning");
        return;
    }
    
    if (CONFIG.selectedTiles.length >= CONFIG.maxSelection) {
        showToast(`Already selected ${CONFIG.maxSelection} tiles!`, "warning");
        return;
    }
    
    if (tileElement.classList.contains('used')) {
        return;
    }
    
    if (tileElement.classList.contains('selected')) {
        // Deselect tile
        tileElement.classList.remove('selected');
        const tileIndex = CONFIG.selectedTiles.indexOf(tileElement);
        if (tileIndex > -1) {
            CONFIG.selectedTiles.splice(tileIndex, 1);
        }
    } else {
        // Select tile
        tileElement.classList.add('selected');
        CONFIG.selectedTiles.push(tileElement);
        playSound('tileSound');
    }
    
    // If selected enough tiles, process them
    if (CONFIG.selectedTiles.length === CONFIG.maxSelection) {
        setTimeout(processSelectedTiles, 500);
    }
}

// Roll Dice
function rollDice() {
    if (CONFIG.diceCount <= 0) {
        showToast("No dice left! Reset level.", "error");
        return;
    }
    
    if (CONFIG.maxSelection > 0) {
        showToast("Process selected tiles first!", "warning");
        return;
    }
    
    const dice = document.getElementById('dice');
    const rollBtn = document.getElementById('rollBtn');
    
    // Disable roll button during animation
    rollBtn.disabled = true;
    rollBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> ROLLING...';
    
    // Add rolling animation
    dice.classList.add('rolling');
    playSound('diceSound');
    
    // Calculate roll using AI
    setTimeout(() => {
        const roll = gameState.diceAI.calculateRoll();
        
        // Update dice display
        dice.classList.remove('rolling');
        dice.style.transform = getDiceRotation(roll);
        
        // Update game state
        CONFIG.diceCount--;
        CONFIG.totalRolls++;
        CONFIG.maxSelection = roll;
        CONFIG.selectedTiles = [];
        
        // Update UI
        updateDiceDisplay();
        rollBtn.disabled = false;
        rollBtn.innerHTML = '<i class="fas fa-redo"></i> ROLL DICE';
        
        // Show roll result
        showToast(`🎲 You rolled: ${roll} (Select ${roll} tiles)`, "info");
        
        // Check if dice exhausted
        if (CONFIG.diceCount <= 0) {
            setTimeout(checkLevelCompletion, 1000);
        }
    }, 1500);
}

// Get dice rotation based on roll
function getDiceRotation(roll) {
    const rotations = {
        1: 'rotateX(0deg) rotateY(0deg)',
        2: 'rotateX(0deg) rotateY(-90deg)',
        3: 'rotateX(-90deg) rotateY(0deg)',
        4: 'rotateX(90deg) rotateY(0deg)',
        5: 'rotateX(0deg) rotateY(90deg)',
        6: 'rotateX(180deg) rotateY(0deg)'
    };
    return rotations[roll] || rotations[1];
}

// Process selected tiles
function processSelectedTiles() {
    if (CONFIG.selectedTiles.length === 0) return;
    
    const tileCounts = {};
    
    // Count selected tiles by category
    CONFIG.selectedTiles.forEach(tile => {
        const category = tile.dataset.category;
        tileCounts[category] = (tileCounts[category] || 0) + 1;
    });
    
    // Update targets
    let pointsEarned = 0;
    Object.keys(tileCounts).forEach(category => {
        if (gameState.currentTargets[category]) {
            const previousCollected = gameState.currentTargets[category].collected;
            gameState.currentTargets[category].collected += tileCounts[category];
            
            // Cap at needed amount
            if (gameState.currentTargets[category].collected > gameState.currentTargets[category].needed) {
                gameState.currentTargets[category].collected = gameState.currentTargets[category].needed;
            }
            
            // Calculate points (more points for exact matches)
            const collectedNow = gameState.currentTargets[category].collected - previousCollected;
            pointsEarned += collectedNow * 100;
            
            // Bonus for exact completion
            if (gameState.currentTargets[category].collected === gameState.currentTargets[category].needed) {
                pointsEarned += 500;
                showToast(`✅ ${category.toUpperCase()} target completed! +500 bonus`, "success");
            }
        }
    });
    
    // Mark tiles as used
    CONFIG.selectedTiles.forEach(tile => {
        tile.classList.remove('selected');
        tile.classList.add('used');
        tile.style.pointerEvents = 'none';
    });
    
    // Update score and display
    CONFIG.score += pointsEarned;
    CONFIG.selectedTiles = [];
    CONFIG.maxSelection = 0;
    
    updateDisplay();
    updateTargetDisplay();
    showToast(`+${pointsEarned} points!`, "success");
    
    // Check level completion
    setTimeout(checkLevelCompletion, 500);
}

// Check level completion
function checkLevelCompletion() {
    const allComplete = Object.values(gameState.currentTargets).every(
        target => target.collected >= target.needed
    );
    
    if (allComplete) {
        gameState.levelComplete = true;
        const remainingDice = CONFIG.diceCount;
        const stars = calculateStars(remainingDice);
        
        // Calculate bonus points
        const diceBonus = remainingDice * 50;
        const levelBonus = CONFIG.currentLevel * 10;
        const totalBonus = diceBonus + levelBonus;
        
        CONFIG.score += totalBonus;
        
        // Show victory message
        setTimeout(() => {
            playSound('winSound');
            showToast(
                `🎉 LEVEL ${CONFIG.currentLevel} COMPLETE!<br>` +
                `Stars: ${'★'.repeat(stars)}${'☆'.repeat(5-stars)}<br>` +
                `Bonus: +${totalBonus} points<br>` +
                `Click to continue to next level`,
                "success"
            );
            
            // Update stars display
            updateStars(stars);
            updateDisplay();
            
            // Prepare for next level
            document.getElementById('gameBoard').addEventListener('click', nextLevel, { once: true });
        }, 1000);
        
    } else if (CONFIG.diceCount <= 0) {
        // Level failed
        playSound('loseSound');
        showToast(
            `❌ Out of dice! Level failed.<br>` +
            `You collected ${getCollectedPercentage()}% of targets.<br>` +
            `Click RESET to try again.`,
            "error"
        );
    }
}

// Calculate stars based on remaining dice
function calculateStars(remainingDice) {
    const totalDice = getLevelDiceLimit();
    const percentage = (remainingDice / totalDice) * 100;
    
    if (percentage >= 80) return 5;
    if (percentage >= 60) return 4;
    if (percentage >= 40) return 3;
    if (percentage >= 20) return 2;
    return 1;
}

// Get dice limit for current level
function getLevelDiceLimit() {
    const level = CONFIG.currentLevel;
    if (level <= 9) return 20;
    if (level <= 29) return 18;
    if (level <= 49) return 16;
    if (level <= 69) return 14;
    if (level <= 89) return 12;
    return 10;
}

// Get collected percentage
function getCollectedPercentage() {
    const totalNeeded = Object.values(gameState.currentTargets).reduce((a, b) => a + b.needed, 0);
    const totalCollected = Object.values(gameState.currentTargets).reduce((a, b) => a + b.collected, 0);
    return totalNeeded > 0 ? Math.round((totalCollected / totalNeeded) * 100) : 0;
}

// Next Level
function nextLevel() {
    CONFIG.currentLevel++;
    
    // Reset for new level
    CONFIG.diceCount = getLevelDiceLimit();
    CONFIG.totalRolls = 0;
    CONFIG.selectedTiles = [];
    CONFIG.maxSelection = 0;
    gameState.levelComplete = false;
    gameState.lastSixRoll = -5;
    gameState.diceAI = new DiceAI();
    
    // Generate new level
    generateLevelTargets();
    generateTileGrid();
    updateDisplay();
    
    showToast(`LEVEL ${CONFIG.currentLevel} - Good luck!`, "info");
}

// Reset Level
function resetLevel() {
    CONFIG.diceCount = getLevelDiceLimit();
    CONFIG.selectedTiles 
