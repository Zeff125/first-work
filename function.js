/**
 * C언어 함수 문법 시각화 로직
 */
const FuncViz = {
    highlight(part) {
        const code = document.querySelector('.code-preview');
        const colors = {
            type: '#8be9fd',
            name: '#50fa7b',
            param: '#ffb86c',
            body: '#ffffff'
        };
        
        // 간단한 강조 효과 (실제 상용 서비스에서는 더욱 정교한 래핑 필요)
        code.style.boxShadow = `0 0 20px ${colors[part] || '#3498db'}`;
        setTimeout(() => code.style.boxShadow = 'none', 1000);
    },

    async animateParam() {
        const argBox = document.querySelector('#caller-side .data-box');
        const paramBox = document.getElementById('param-box');
        const arrow = document.getElementById('arrow-path');
        
        // 애니메이션용 복제본 생성
        const ghost = argBox.cloneNode(true);
        ghost.style.position = 'absolute';
        const startRect = argBox.getBoundingClientRect();
        const endRect = paramBox.getBoundingClientRect();
        
        ghost.style.left = startRect.left + 'px';
        ghost.style.top = startRect.top + 'px';
        ghost.style.zIndex = '100';
        ghost.style.transition = 'all 1s cubic-bezier(0.68, -0.55, 0.265, 1.55)';
        
        document.body.appendChild(ghost);
        
        // 이동 애니메이션
        setTimeout(() => {
            ghost.style.left = endRect.left + 'px';
            ghost.style.top = endRect.top + 'px';
            ghost.style.opacity = '0.5';
            arrow.style.color = '#3498db';
        }, 50);

        setTimeout(() => {
            paramBox.querySelector('.data-value').textContent = '10';
            paramBox.style.transform = 'scale(1.2)';
            ghost.remove();
            setTimeout(() => paramBox.style.transform = 'scale(1)', 200);
        }, 1050);
    },

    animateReturn() {
        const source = document.getElementById('return-source');
        const dest = document.getElementById('return-dest');
        const box = document.getElementById('return-box');

        box.style.transform = 'translateX(100px) scale(1.2)';
        box.style.opacity = '0';
        source.classList.remove('active');
        
        setTimeout(() => {
            box.style.transition = 'none';
            box.style.transform = 'translateX(-100px)';
            setTimeout(() => {
                box.style.transition = 'all 0.8s';
                box.style.transform = 'translateX(0) scale(1)';
                box.style.opacity = '1';
                dest.classList.add('active');
            }, 50);
        }, 800);
    },

    changeCopy() {
        const copyVal = document.getElementById('copy-val');
        const originalVal = document.getElementById('original-val');
        
        copyVal.textContent = '99';
        copyVal.style.color = '#e74c3c';
        
        // 강조 효과
        document.getElementById('copy-box').style.animation = 'shake 0.5s';
        setTimeout(() => document.getElementById('copy-box').style.animation = '', 500);
        
        // 원본 변함 없음 설명
        const info = document.createElement('div');
        info.style.color = '#27ae60';
        info.style.fontWeight = 'bold';
        info.textContent = "원본 x는 여전히 50입니다!";
        originalVal.parentElement.appendChild(info);
        setTimeout(() => info.remove(), 2000);
    }
};

// CSS 애니메이션 추가
const style = document.createElement('style');
style.textContent = `
    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(-5px); }
        75% { transform: translateX(5px); }
    }
`;
document.head.appendChild(style);
