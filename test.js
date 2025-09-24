console.log('测试脚本加载成功');

// 最简单的DOM测试
setTimeout(function() {
    console.log('等待100毫秒后测试DOM');
    const canvas = document.getElementById('game-board');
    console.log('canvas元素:', canvas);
    
    const startBtn = document.getElementById('start-btn');
    console.log('start-btn元素:', startBtn);
    
    if (startBtn) {
        startBtn.onclick = function() {
            alert('成功点击了开始按钮！');
        };
        console.log('成功添加了点击事件处理程序');
    }
}, 100);