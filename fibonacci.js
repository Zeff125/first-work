document.addEventListener('DOMContentLoaded', () => {
    const fibArrayContainer = document.getElementById('fibArray');
    const logContent = document.getElementById('logContent');
    const itemCountInput = document.getElementById('itemCount');
    const startBtn = document.getElementById('startBtn');
    const nextBtn = document.getElementById('nextBtn');
    const resetBtn = document.getElementById('resetBtn');

    let fibo = new Array(10).fill(0);
    let n = 0;
    let currentK = 0;
    let step = 0; // 0: init, 1: set fibo[0], 2: set fibo[1], 3: loop, 4: done

    function addLog(message, color = 'inherit') {
        const entry = document.createElement('div');
        entry.className = 'log-entry';
        entry.innerHTML = `<span style="color: ${color}">${message}</span>`;
        logContent.prepend(entry);
    }

    function updateViz() {
        fibArrayContainer.innerHTML = '';
        fibo.forEach((val, i) => {
            const node = document.createElement('div');
            node.className = 'fib-node';
            node.id = `node-${i}`;
            
            const index = document.createElement('span');
            index.className = 'fib-index';
            index.innerText = `[${i}]`;
            node.appendChild(index);

            const value = document.createElement('span');
            value.innerText = val === 0 && i >= n ? '' : val;
            node.appendChild(value);

            if (step === 3 && i === currentK) {
                node.classList.add('active');
            } else if (step === 3 && (i === currentK - 1 || i === currentK - 2)) {
                node.classList.add('source');
            } else if (i < currentK && step >= 3) {
                 node.style.borderColor = 'var(--secondary-color)';
            } else if (i < 2 && step >= 2) {
                 node.style.borderColor = 'var(--secondary-color)';
            }

            fibArrayContainer.appendChild(node);
        });
    }

    function reset() {
        fibo = new Array(10).fill(0);
        n = 0;
        currentK = 0;
        step = 0;
        logContent.innerHTML = '';
        startBtn.disabled = false;
        nextBtn.disabled = true;
        itemCountInput.disabled = false;
        updateViz();
        addLog('시스템 초기화됨. 항의 개수를 입력하고 시작을 누르세요.');
    }

    startBtn.addEventListener('click', () => {
        n = parseInt(itemCountInput.value);
        if (n < 1 || n > 10) {
            alert('1에서 10 사이의 숫자를 입력해주세요.');
            return;
        }
        
        step = 1;
        startBtn.disabled = true;
        nextBtn.disabled = false;
        itemCountInput.disabled = true;
        
        addLog(`프로그램 시작: n = ${n}`, 'var(--primary-color)');
        addLog('fibo[10] 배열이 0으로 초기화되었습니다.');
        updateViz();
    });

    nextBtn.addEventListener('click', () => {
        switch (step) {
            case 1: // Set fibo[0]
                fibo[0] = 1;
                addLog('fibo[0] = 1; 설정 완료', 'var(--secondary-color)');
                step = 2;
                break;
            case 2: // Set fibo[1]
                fibo[1] = 1;
                addLog('fibo[1] = 1; 설정 완료', 'var(--secondary-color)');
                if (n > 2) {
                    currentK = 2;
                    step = 3;
                    addLog('반복문 시작 (k = 2)', '#fab1a0');
                } else {
                    step = 4;
                    addLog('계산 완료!');
                    nextBtn.disabled = true;
                }
                break;
            case 3: // Loop
                fibo[currentK] = fibo[currentK - 1] + fibo[currentK - 2];
                addLog(`fibo[${currentK}] = fibo[${currentK-1}] + fibo[${currentK-2}] = ${fibo[currentK]}`, '#50fa7b');
                
                currentK++;
                if (currentK >= n) {
                    step = 4;
                    addLog('반복문 종료 (k >= n)', '#fab1a0');
                    addLog('모든 계산이 완료되었습니다.', 'var(--secondary-color)');
                    nextBtn.disabled = true;
                }
                break;
        }
        updateViz();
    });

    resetBtn.addEventListener('click', reset);

    // Initial setup
    reset();
});