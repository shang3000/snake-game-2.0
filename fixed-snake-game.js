console.log('修复后的贪吃蛇游戏脚本加载成功');

// 使用setTimeout来确保DOM完全加载
setTimeout(function() {
    // 获取DOM元素并添加存在性检查
    const canvas = document.getElementById('game-board');
    const ctx = canvas ? canvas.getContext('2d') : null;
    const scoreElement = document.getElementById('score');
    const highScoreElement = document.getElementById('high-score');
    const startBtn = document.getElementById('start-btn');
    const pauseBtn = document.getElementById('pause-btn');
    const resetBtn = document.getElementById('reset-btn');
    const difficultySelector = document.getElementById('difficulty');
    const container = document.querySelector('.container');
    
    // 检查必要元素是否存在
    if (!canvas || !ctx || !scoreElement || !startBtn || !pauseBtn || !resetBtn || !difficultySelector || !container) {
        console.error('无法找到必要的DOM元素');
        return;
    }
    
    // 动态设置canvas大小，使其占整个游戏界面的十分之九
    function setCanvasSize() {
        // 计算容器中可用空间（减去标题、分数、按钮等元素的高度）
        const containerHeight = container.clientHeight;
        const gameInfoHeight = document.querySelector('.game-info').clientHeight;
        const difficultyControlsHeight = document.querySelector('.difficulty-controls').clientHeight;
        const controlsHeight = document.querySelector('.controls').clientHeight;
        const instructionsHeight = document.querySelector('.instructions').clientHeight;
        const mobileControlsHeight = document.querySelector('.mobile-controls').clientHeight;
        const authorInfoHeight = document.querySelector('.author-info').clientHeight;
        const headerHeight = document.querySelector('h1').clientHeight;
        
        // 计算所有非画布元素的总高度加上间距
        const totalNonCanvasHeight = gameInfoHeight + difficultyControlsHeight + controlsHeight + 
                                     instructionsHeight + mobileControlsHeight + authorInfoHeight + 
                                     headerHeight + 100; // 额外的间距
        
        // 设置canvas高度为容器高度的十分之九或剩余空间的较大值
        const desiredHeight = Math.max(containerHeight * 0.9, containerHeight - totalNonCanvasHeight);
        
        // 保持合适的宽高比（设置为9:5）
        const aspectRatio = 9 / 5;
        const desiredWidth = desiredHeight * aspectRatio;
        
        // 确保画布不会超出视口宽度
        const viewportWidth = window.innerWidth - 40; // 考虑外边距
        const maxWidth = Math.min(viewportWidth, desiredWidth);
        const adjustedHeight = maxWidth / aspectRatio;
        
        // 设置canvas的实际大小（内部绘图区域）
        canvas.width = maxWidth;
        canvas.height = adjustedHeight;
        
        // 确保canvas在CSS中的显示大小也合适
        canvas.style.width = '100%';
        canvas.style.height = adjustedHeight + 'px';
    }
    
    // 初始化时设置canvas大小
    setCanvasSize();
    
    // 窗口大小改变时重新设置canvas大小
    window.addEventListener('resize', function() {
        const wasRunning = isRunning;
        const wasPaused = isPaused;
        
        // 重置游戏以适应新的画布大小
        resetGame();
        
        // 如果游戏之前在运行，重新开始
        if (wasRunning) {
            startGame();
            if (wasPaused) {
                pauseGame();
            }
        }
    });
    
    // 游戏常量
    const GRID_SIZE = 20;
    let GRID_COLUMNS = Math.floor(canvas.width / GRID_SIZE);
    let GRID_ROWS = Math.floor(canvas.height / GRID_SIZE);
    
    // 难度设置 - 根据需求调整速度
    const DIFFICULTY_SPEEDS = {
        'easy': 150,     // 简单模式：保持当前速度
        'normal': 70,    // 一般模式：保持当前速度
        'hard': 30       // 困难模式：进一步加快
    };
    
    // 游戏状态变量
    let snake = [];
    let food = {};
    let direction = 'right';
    let nextDirection = 'right'; // 存储下一个方向，防止快速按键导致的问题
    let score = 0;
    let highScore = parseInt(localStorage.getItem('snakeHighScore')) || 0;
    let gameInterval;
    let isRunning = false;
    let isPaused = false;
    let currentDifficulty = 'easy'; // 默认模式改为简单模式
    let gameOverMessage = ''; // 存储游戏结束信息
    
    // 更新最高分显示
    if (highScoreElement) {
        highScoreElement.textContent = highScore;
    }
    
    // 初始化游戏
    function initGame() {
        // 更新网格列数和行数以适应可能变化的画布大小
        GRID_COLUMNS = Math.floor(canvas.width / GRID_SIZE);
        GRID_ROWS = Math.floor(canvas.height / GRID_SIZE);
        
        // 重置蛇的位置和长度 - 调整为适应新画布大小的位置
        const startX = Math.floor(GRID_COLUMNS / 3);
        const startY = Math.floor(GRID_ROWS / 2);
        
        snake = [
            { x: startX, y: startY },
            { x: startX - 1, y: startY },
            { x: startX - 2, y: startY }
        ];
        
        // 重置方向
        direction = 'right';
        nextDirection = 'right';
        
        // 重置分数
        score = 0;
        scoreElement.textContent = score;
        
        // 生成食物
        generateFood();
        
        // 绘制初始游戏状态
        draw();
    }
    
    // 生成食物
    function generateFood() {
        let newFood;
        
        // 确保食物不会出现在蛇身上
        do {
            newFood = {
                x: Math.floor(Math.random() * GRID_COLUMNS),
                y: Math.floor(Math.random() * GRID_ROWS)
            };
        } while (snake.some(function(segment) {
            return segment.x === newFood.x && segment.y === newFood.y;
        }));
        
        food = newFood;
    }
    
    // 绘制游戏
    function draw() {
        // 清除画布
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // 绘制灰色细线网格
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 0.5;
        
        // 绘制垂直线
        for (let x = 0; x <= canvas.width; x += GRID_SIZE) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, canvas.height);
            ctx.stroke();
        }
        
        // 绘制水平线
        for (let y = 0; y <= canvas.height; y += GRID_SIZE) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(canvas.width, y);
            ctx.stroke();
        }
        
        // 绘制蛇
        snake.forEach(function(segment, index) {
            ctx.fillStyle = index === 0 ? '#4CAF50' : '#45a049';
            ctx.fillRect(segment.x * GRID_SIZE, segment.y * GRID_SIZE, GRID_SIZE, GRID_SIZE);
        });
        
        // 绘制食物
        ctx.fillStyle = '#f44336';
        ctx.fillRect(food.x * GRID_SIZE, food.y * GRID_SIZE, GRID_SIZE, GRID_SIZE);
        
        // 如果游戏结束，在游戏界面内显示提示
        if (gameOverMessage) {
            // 创建半透明的背景
            ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            // 设置文本样式
            ctx.fillStyle = 'white';
            ctx.font = 'bold 28px Arial';
            ctx.textAlign = 'center';
            
            // 计算文本位置
            const textX = canvas.width / 2;
            const textY = canvas.height / 2 - 20;
            const subTextY = canvas.height / 2 + 20;
            const restartTextY = canvas.height / 2 + 60;
            
            // 绘制游戏结束文本
            ctx.fillText(gameOverMessage, textX, textY);
            
            // 绘制分数文本
            ctx.font = '20px Arial';
            ctx.fillText('你的分数: ' + score, textX, subTextY);
            
            // 绘制重新开始提示
            ctx.font = '16px Arial';
            ctx.fillText('按空格键重新开始', textX, restartTextY);
        }
    }
    
    // 更新游戏状态
    function update() {
        if (!isRunning || isPaused) return;
        
        // 更新方向
        direction = nextDirection;
        
        // 获取蛇头
        const head = { x: snake[0].x, y: snake[0].y };
        
        // 根据方向移动蛇头
        switch (direction) {
            case 'up':
                head.y--;
                break;
            case 'down':
                head.y++;
                break;
            case 'left':
                head.x--;
                break;
            case 'right':
                head.x++;
                break;
        }
        
        // 检查碰撞
        // 撞墙
        if (head.x < 0 || head.x >= GRID_COLUMNS || head.y < 0 || head.y >= GRID_ROWS) {
            gameOver();
            return;
        }
        
        // 撞到自己
        if (snake.some(function(segment, index) {
            return index > 0 && segment.x === head.x && segment.y === head.y;
        })) {
            gameOver();
            return;
        }
        
        // 将新的头部添加到蛇的前面
        snake.unshift(head);
        
        // 检查是否吃到食物
        if (head.x === food.x && head.y === food.y) {
            // 增加分数
            score += 10;
            scoreElement.textContent = score;
            
            // 更新最高分
            if (score > highScore) {
                highScore = score;
                if (highScoreElement) {
                    highScoreElement.textContent = highScore;
                }
                localStorage.setItem('snakeHighScore', highScore);
            }
            
            // 生成新的食物
            generateFood();
        } else {
            // 如果没吃到食物，移除尾部
            snake.pop();
        }
        
        // 绘制更新后的游戏状态
        draw();
    }
    
    // 游戏结束处理
    function gameOver() {
        isRunning = false;
        clearInterval(gameInterval);
        gameOverMessage = '游戏结束！';
        draw(); // 重新绘制界面显示游戏结束信息
    }
    
    // 开始游戏
    function startGame() {
        if (!isRunning) {
            isRunning = true;
            currentDifficulty = difficultySelector.value;
            const speed = DIFFICULTY_SPEEDS[currentDifficulty];
            gameInterval = setInterval(update, speed);
        } else if (isPaused) {
            // 如果游戏已经开始但被暂停，则继续游戏
            isPaused = false;
        }
    }
    
    // 暂停游戏
    function pauseGame() {
        if (isRunning && !isPaused) {
            isPaused = true;
        }
    }
    
    // 重置游戏
    function resetGame() {
        clearInterval(gameInterval);
        isRunning = false;
        isPaused = false;
        gameOverMessage = '';
        initGame();
    }
    
    // 处理键盘输入
    function handleKeyDown(e) {
        const key = e.key;
        
        // 防止方向键和空格键导致网页滚动
        if (key === ' ' || key.startsWith('Arrow')) {
            e.preventDefault();
        }
        
        // 添加空格键控制游戏启动和暂停，如果游戏结束则重置游戏
        if (key === ' ') {
            if (gameOverMessage) {
                resetGame(); // 游戏结束状态下按空格重置
            } else if (!isRunning) {
                startGame();
            } else if (!isPaused) {
                pauseGame();
            } else {
                startGame(); // 继续游戏
            }
            return;
        }
        
        // 根据按键设置方向，但不允许180度转弯
        // 使用nextDirection来存储下一个方向，而不是立即改变当前方向
        if ((key === 'ArrowUp' || key === 'w' || key === 'W') && direction !== 'down') {
            nextDirection = 'up';
        } else if ((key === 'ArrowDown' || key === 's' || key === 'S') && direction !== 'up') {
            nextDirection = 'down';
        } else if ((key === 'ArrowLeft' || key === 'a' || key === 'A') && direction !== 'right') {
            nextDirection = 'left';
        } else if ((key === 'ArrowRight' || key === 'd' || key === 'D') && direction !== 'left') {
            nextDirection = 'right';
        }
    }
    
    // 难度改变处理
    function handleDifficultyChange() {
        if (isRunning) {
            clearInterval(gameInterval);
            currentDifficulty = difficultySelector.value;
            const speed = DIFFICULTY_SPEEDS[currentDifficulty];
            gameInterval = setInterval(update, speed);
        }
    }
    
    // 添加事件监听器
    document.addEventListener('keydown', handleKeyDown);
    difficultySelector.addEventListener('change', handleDifficultyChange);
    
    startBtn.onclick = startGame;
    pauseBtn.onclick = pauseGame;
    resetBtn.onclick = resetGame;
    
    // 初始化游戏
    initGame();
    
    console.log('贪吃蛇游戏初始化完成');
}, 100);