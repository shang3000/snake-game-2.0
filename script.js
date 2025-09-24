console.log('脚本加载成功');

function initTest() {
    console.log('DOM加载完成');
    
    // 简单测试DOM元素
    const canvas = document.getElementById('game-board');
    if (canvas) {
        console.log('找到canvas元素');
    } else {
        console.log('未找到canvas元素');
    }
    
    const startBtn = document.getElementById('start-btn');
    if (startBtn) {
        console.log('找到start-btn元素');
        startBtn.addEventListener('click', function() {
            console.log('点击了开始按钮');
            alert('测试成功！点击了开始按钮');
        });
    } else {
        console.log('未找到start-btn元素');
    }
}

// 等待DOM加载完成
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTest);
} else {
    initTest();
}