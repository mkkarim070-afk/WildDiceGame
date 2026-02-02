const config = {
    currentLevel: 1,
    diceCount: 10,
    points: 0,
    stars: "⭐"
};

const tileCategories = {
    animals: ["🦁", "🐘", "🦒", "🐼", "🐺", "🐵", "🐯", "🦊", "🐻", "🦓", "🦏", "🦌"],
    birds: ["🦜", "🦅", "🦚", "🕊️", "🦉", "🦢", "🐓", "🦩", "🦆", "🐦"],
    flowers: ["🌹", "🌸", "🌼", "🌺", "🌻", "💐", "🌷", "🌾", "🍁", "🪷"],
    fruits: ["🍎", "🍌", "🍇", "🍊", "🍓", "🍍", "🥭", "🍑"]
};

let gameState = {
    selectedTiles: [],
    currentTarget: null,
    maxSelection: 0
};

class DiceAI {
    constructor() {
        this.rollHistory = [];
        this.lastSixAt = -10;
    }
    
    roll() {
        let roll;
        const currentRoll = this.rollHistory.length + 1;
        
        if (currentRoll === 1) {
            roll = this.weightedRoll([4, 5, 6, 3, 2, 1], [25, 25, 20, 15, 10, 5]);
        }
        else if (config.diceCount <= 3) {
            roll = this.weightedRoll([6, 5, 4, 3, 2, 1], [40, 20, 15, 10, 10, 5]);
        }
        else if (currentRoll - this.lastSixAt > 5) {
            roll = this.weightedRoll([6, 1, 2, 3, 4, 5], [35, 15, 15, 15, 10, 10]);
        }
        else {
            roll = Math.floor(Math.random() * 6) + 1;
        }
        
        if (roll === 6) {
            this.lastSixAt = currentRoll;
            this.giveExtraDice();
        }
        
        this.rollHistory.push(roll);
        return roll;
    }
    
    weightedRoll(numbers, weights) {
        let total = weights.reduce((a, b) => a + b, 0);
        let random = Math.random() * total;
        let sum = 0;
        
        for (let i = 0; i < numbers.length; i++) {
            sum += weights[i];
            if (random < sum) return numbers[i];
        }
        return numbers[0];
    }
    
    giveExtraDice() {
        if (config.diceCount < 15) {
            config.diceCount++;
            showMessage("🎉 Chakka! Extra dice mila!");
            updateDiceDisplay();
        }
    }
}

const diceAI = new DiceAI();

function initGame() {
    generateTiles();
    generateTarget();
    updateDisplay();
}

function generateTiles() {
    const board = document.getElementById('gameBoard');
    board.innerHTML = '';
    
    const totalTiles = 12;
    const tileCounts = {
        animals: Math.floor(totalTiles * 0.30),
        birds: Math.floor(totalTiles * 0.25),
        flowers: Math.floor(totalTiles * 0.25),
        fruits: Math.floor(totalTiles * 0.20)
    };
    
    let allTiles = [];
    
    for (let i = 0; i < tileCounts.animals; i++) {
        const animal = tileCategories.animals[Math.floor(Math.random() * tileCategories.animals.length)];
        allTiles.push({type: 'animal', emoji: animal});
    }
    
    for (let i = 0; i < tileCounts.birds; i++) {
        const bird = tileCategories.birds[Math.floor(Math.random() * tileCategories.birds.length)];
        allTiles.push({type: 'bird', emoji: bird});
    }
    
    for (let i = 0; i < tileCounts.flowers; i++) {
        const flower = tileCategories.flowers[Math.floor(Math.random() * tileCategories.flowers.length)];
        allTiles.push({type: 'flower', emoji: flower});
    }
    
    for (let i = 0; i < tileCounts.fruits; i++) {
        const fruit = tileCategories.fruits[Math.floor(Math.random() * tileCategories.fruits.length)];
        allTiles.push({type: 'fruit', emoji: fruit});
    }
    
    allTiles.sort(() => Math.random() - 0.5);
    
    allTiles.forEach((tile, index) => {
        const tileElement = document.createElement('div');
        tileElement.className = 'tile';
        tileElement.innerHTML = tile.emoji;
        tileElement.dataset.index = index;
        tileElement.dataset.type = tile.type;
        tileElement.dataset.emoji = tile.emoji;
        tileElement.onclick = () => selectTile(tileElement);
        board.appendChild(tileElement);
    });
}

function generateTarget() {
    const level = config.currentLevel;
    let target = {};
    
    if (level <= 9) {
        const categories = ['animals', 'birds', 'flowers', 'fruits'];
        const selected = categories[Math.floor(Math.random() * categories.length)];
        target[selected] = 3 + level;
    }
    else if (level <= 29) {
        const pairs = [['animals', 'birds'], ['flowers', 'fruits'], ['animals', 'flowers'], ['birds', 'fruits']];
        const selected = pairs[Math.floor(Math.random() * pairs.length)];
        target[selected[0]] = 4 + Math.floor(level/2);
        target[selected[1]] = 3 + Math.floor(level/3);
    }
    else if (level <= 49) {
        target['animals'] = 5 + Math.floor(level/3);
        target['birds'] = 4 + Math.floor(level/4);
        target['flowers'] = 3 + Math.floor(level/5);
    }
    else {
        target['animals'] = 6 + Math.floor(level/2);
        target['birds'] = 5 + Math.floor(level/3);
        target['flowers'] = 4 + Math.floor(level/4);
        target['fruits'] = 3 + Math.floor(level/5);
    }
    
    gameState.currentTarget = target;
    updateTargetDisplay();
}

function rollDice() {
    if (config.diceCount <= 0) {
        showMessage("🎲 Dice khatam! Level restart karein.");
        return;
    }
    
    const diceElement = document.getElementById('dice');
    const diceValueElement = document.getElementById('diceValue');
    
    diceElement.classList.add('rolling');
    
    setTimeout(() => {
        const roll = diceAI.roll();
        
        diceElement.classList.remove('rolling');
        diceValueElement.textContent = roll;
        
        config.diceCount--;
        updateDiceDisplay();
        
        gameState.maxSelection = roll;
        gameState.selectedTiles = [];
        
        showMessage(`🎲 Aapko ${roll} tiles select karne hain!`);
        
    }, 1000);
}

function selectTile(tileElement) {
    if (!gameState.maxSelection) {
        showMessage("Pehle dice roll karein!");
        return;
    }
    
    if (gameState.selectedTiles.length >= gameState.maxSelection) {
        showMessage(`${gameState.maxSelection} tiles select kar chuke hain!`);
        return;
    }
    
    if (tileElement.classList.contains('selected')) {
        tileElement.classList.remove('selected');
        const index = gameState.selectedTiles.indexOf(tileElement);
        gameState.selectedTiles.splice(index, 1);
    } else {
        tileElement.classList.add('selected');
        gameState.selectedTiles.push(tileElement);
    }
    
    if (gameState.selectedTiles.length === gameState.maxSelection) {
        processSelection();
    }
}

function processSelection() {
    let typeCount = {};
    
    gameState.selectedTiles.forEach(tile => {
        const type = tile.dataset.type;
        typeCount[type] = (typeCount[type] || 0) + 1;
    });
    
    Object.keys(typeCount).forEach(type => {
        if (gameState.currentTarget[type]) {
            gameState.currentTarget[type] -= typeCount[type];
            if (gameState.currentTarget[type] < 0) {
                gameState.currentTarget[type] = 0;
            }
        }
    });
    
    gameState.selectedTiles.forEach(tile => {
        tile.style.opacity = '0.3';
        tile.style.pointerEvents = 'none';
    });
    
    config.points += gameState.selectedTiles.length * 10;
    
    gameState.selectedTiles = [];
    gameState.maxSelection = null;
    
    updateTargetDisplay();
    updateDisplay();
    checkWinCondition();
}

function checkWinCondition() {
    const target = gameState.currentTarget;
    let allZero = true;
    
    Object.values(target).forEach(value => {
        if (value > 0) allZero = false;
    });
    
    if (allZero) {
        setTimeout(() => {
            showMessage("🎉 Level Complete! Agla level shuru karein");
            config.currentLevel++;
            if (config.currentLevel > 100) {
                config.currentLevel = 1;
            }
            nextLevel();
        }, 500);
    }
    else if (config.diceCount <= 0) {
        setTimeout(() => {
            showMessage("😢 Dice khatam! Fir se try karein");
            resetLevel();
        }, 500);
    }
}

function updateDisplay() {
    document.getElementById('levelNumber').textContent = config.currentLevel;
    document.getElementById('points').textContent = config.points;
    updateDiceDisplay();
}

function updateDiceDisplay() {
    document.getElementById('rollsLeft').textContent = config.diceCount;
}

function updateTargetDisplay() {
    const targetContainer = document.getElementById('targetItems');
    targetContainer.innerHTML = '';
    
    Object.entries(gameState.currentTarget).forEach(([type, count]) => {
        if (count > 0) {
            const emoji = getEmojiForType(type);
            const div = document.createElement('div');
            div.className = 'target-item';
            div.innerHTML = `
                <span class="tile-icon">${emoji}</span>
                <span class="target-count">${count}</span>
            `;
            targetContainer.appendChild(div);
        }
    });
}

function getEmojiForType(type) {
    const emojis = {'animal': '🦁', 'bird': '🦜', 'flower': '🌹', 'fruit': '🍎'};
    return emojis[type] || '🎯';
}

function showMessage(msg) {
    const toast = document.createElement('div');
    toast.textContent = msg;
    toast.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(0,0,0,0.8);
        color: white;
        padding: 15px 25px;
        border-radius: 10px;
        z-index: 1000;
        font-size: 16px;
        text-align: center;
    `;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        document.body.removeChild(toast);
    }, 2000);
}

function nextLevel() {
    config.diceCount = 10 + Math.floor(config.currentLevel / 10);
    initGame();
}

function resetLevel() {
    config.diceCount = 10;
    initGame();
}

function goHome() {
    config.currentLevel = 1;
    config.points = 0;
    config.diceCount = 10;
    initGame();
}

function getExtraDice() {
    showMessage("📺 Ad dekh rahe hain...");
    setTimeout(() => {
        config.diceCount++;
        updateDiceDisplay();
        showMessage("🎲 +1 Dice mila!");
    }, 1500);
}

window.onload = function() {
    if (config.currentLevel <= 2) {
        setTimeout(() => {
            showMessage("🎮 Game me swagat! Dice roll karein aur tiles select karein");
        }, 1000);
    }
    
    initGame();
};
