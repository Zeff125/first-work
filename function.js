/**
 * 서연고등학교 - C언어 함수 문법 시각화 로직
 */
const FuncViz = {
    // 2. 함수의 기본 구조 설명
    explain(part) {
        const explainBox = document.getElementById('explain-box');
        const explainText = document.getElementById('explain-text');
        const tags = {
            type: { id: 'tag-type', text: "<b>반환 타입 (Return Type):</b> 함수가 작업을 마치고 돌려줄 데이터의 종류입니다. (예: int, float, void 등)" },
            name: { id: 'tag-name', text: "<b>함수 이름 (Function Name):</b> 함수를 호출할 때 사용하는 이름입니다. 의미 있는 이름을 짓는 것이 좋습니다." },
            param: { id: ['tag-param1', 'tag-param2'], text: "<b>매개변수 (Parameters):</b> 함수 외부에서 전달받는 값을 저장하는 변수입니다. 지역 변수처럼 사용됩니다." },
            body: { id: 'tag-return', text: "<b>반환문 (Return Statement):</b> `return` 키워드를 사용하여 결과값을 함수 밖으로 전달하고 함수를 종료합니다." }
        };

        // 기존 강조 제거
        document.querySelectorAll('#code-structure span').forEach(el => el.style.background = 'transparent');

        const info = tags[part];
        if (info) {
            explainBox.style.display = 'block';
            explainText.innerHTML = info.text;
            
            // 요소 강조
            const ids = Array.isArray(info.id) ? info.id : [info.id];
            ids.forEach(id => {
                const el = document.getElementById(id);
                if (el) {
                    el.style.background = '#fbd38d';
                    el.style.borderRadius = '3px';
                    el.style.padding = '2px 4px';
                }
            });
        }
    },

    // 4. 호출과 실행 흐름 (Call Stack)
    flowStep: 0,
    flowData: [
        { line: 'm1', stack: ['main'], msg: "프로그램이 main 함수에서 시작됩니다." },
        { line: 'm2', stack: ['main {x:10}'], msg: "지역 변수 x가 선언되고 10으로 초기화됩니다." },
        { line: 'm3', stack: ['main {x:10}', 'func(n:10)'], msg: "func(x)를 호출합니다. 인자 10이 복사되어 전달됩니다." },
        { line: 'f1', stack: ['main {x:10}', 'func(n:10)'], msg: "제어권이 func 함수로 넘어왔습니다. n은 10입니다." },
        { line: 'f2', stack: ['main {x:10}', 'func(n:10)'], msg: "n * 2 (20)를 계산하여 반환 준비를 합니다." },
        { line: 'm3', stack: ['main {x:10, result:20}'], msg: "func 실행이 끝나고 결과값 20을 result에 저장합니다." },
        { line: 'm4', stack: ['main {x:10, result:20}'], msg: "printf를 통해 result(20)를 화면에 출력합니다." },
        { line: 'm5', stack: ['main {x:10, result:20}'], msg: "main 함수가 0을 반환하며 종료를 준비합니다." },
        { line: 'm6', stack: [], msg: "프로그램이 성공적으로 종료되었습니다." }
    ],

    nextFlowStep() {
        if (this.flowStep >= this.flowData.length) return;

        const step = this.flowData[this.flowStep];
        
        // 코드 라인 하이라이트
        document.querySelectorAll('#flow-code div').forEach(el => {
            el.style.background = 'transparent';
            el.style.color = 'inherit';
        });
        const activeLine = document.getElementById(`line-${step.line}`);
        if (activeLine) {
            activeLine.style.background = '#4a5568';
            activeLine.style.color = '#fff';
        }

        // 콜 스택 업데이트
        const stackContainer = document.getElementById('stack-container');
        stackContainer.innerHTML = '';
        step.stack.forEach((name, idx) => {
            const frame = document.createElement('div');
            frame.className = 'stack-frame';
            frame.style.padding = '8px';
            frame.style.margin = '4px 0';
            frame.style.background = idx === step.stack.length - 1 ? 'var(--primary-color)' : '#a0aec0';
            frame.style.color = 'white';
            frame.style.borderRadius = '8px';
            frame.style.textAlign = 'center';
            frame.style.fontWeight = 'bold';
            frame.style.fontSize = '0.9rem';
            frame.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
            frame.textContent = name;
            stackContainer.appendChild(frame);
        });

        // 로그 기록
        const logBox = document.getElementById('flow-log');
        const logEntry = document.createElement('div');
        logEntry.className = 'log-entry';
        logEntry.style.color = '#e2e8f0';
        logEntry.style.borderBottom = '1px solid #4a5568';
        logEntry.innerHTML = `<span style="color: var(--secondary-color)">Step ${this.flowStep + 1}:</span> ${step.msg}`;
        logBox.appendChild(logEntry);
        logBox.scrollTop = logBox.scrollHeight;

        this.flowStep++;
        if (this.flowStep === this.flowData.length) {
            document.getElementById('btn-next-step').disabled = true;
        }
    },

    resetFlow() {
        this.flowStep = 0;
        document.getElementById('stack-container').innerHTML = '';
        document.querySelectorAll('#flow-code div').forEach(el => {
            el.style.background = 'transparent';
            el.style.color = 'inherit';
        });
        document.getElementById('flow-log').innerHTML = '<div class="log-entry" style="color: #a0aec0;">시스템 대기 중...</div>';
        document.getElementById('btn-next-step').disabled = false;
    },

    // 5. 매개변수 전달 애니메이션
    async animatePbv() {
        const original = document.getElementById('pbv-original');
        const copy = document.getElementById('pbv-copy');
        const arrow = document.getElementById('pbv-arrow');
        const status = document.getElementById('pbv-status');
        const copyBtn = document.getElementById('btn-pbv-copy');
        const modifyBtn = document.getElementById('btn-pbv-modify');

        copyBtn.disabled = true;
        status.textContent = '값 복사 중...';
        status.style.color = 'var(--primary-color)';

        // 이동용 데이터 박스 생성
        const ghost = document.createElement('div');
        ghost.className = 'data-box';
        ghost.style.position = 'absolute';
        ghost.style.borderColor = '#3498db';
        ghost.style.width = '100px';
        ghost.style.height = '100px';
        ghost.style.zIndex = '100';
        ghost.innerHTML = '<span class="data-value">50</span>';
        
        const startRect = original.getBoundingClientRect();
        const endRect = copy.getBoundingClientRect();
        const containerRect = original.closest('.viz-container').getBoundingClientRect();

        ghost.style.left = (startRect.left - containerRect.left) + 'px';
        ghost.style.top = (startRect.top - containerRect.top) + 'px';
        
        original.closest('.viz-container').appendChild(ghost);
        
        arrow.style.color = 'var(--primary-color)';

        // 애니메이션 실행
        setTimeout(() => {
            ghost.style.transition = 'all 1s cubic-bezier(0.4, 0, 0.2, 1)';
            ghost.style.left = (endRect.left - containerRect.left) + 'px';
            ghost.style.top = (endRect.top - containerRect.top) + 'px';
            ghost.style.transform = 'scale(0.9)';
            ghost.style.opacity = '0.8';
        }, 50);

        setTimeout(() => {
            copy.querySelector('.data-value').textContent = '50';
            copy.querySelector('.data-value').style.color = 'var(--primary-color)';
            copy.style.background = '#ebf8ff';
            copy.style.borderColor = 'var(--primary-color)';
            ghost.remove();
            status.textContent = '복사 완료!';
            status.style.color = 'var(--secondary-color)';
            modifyBtn.disabled = false;
        }, 1050);
    },

    modifyPbv() {
        const copyVal = document.querySelector('#pbv-copy .data-value');
        const original = document.getElementById('pbv-original');
        const status = document.getElementById('pbv-status');
        
        copyVal.textContent = '999';
        copyVal.style.color = 'var(--accent-color)';
        
        document.getElementById('pbv-copy').style.animation = 'shake 0.5s';
        status.textContent = '함수 내부 n 수정됨';
        status.style.color = 'var(--accent-color)';
        
        // 원본 강조 (변하지 않음을 표시)
        original.style.boxShadow = '0 0 20px rgba(52, 152, 219, 0.5)';
        original.style.transform = 'scale(1.1)';
        
        setTimeout(() => {
            original.style.boxShadow = 'none';
            original.style.transform = 'scale(1)';
        }, 1000);
    },

    resetPbv() {
        const copy = document.getElementById('pbv-copy');
        const copyVal = copy.querySelector('.data-value');
        const original = document.getElementById('pbv-original');
        const arrow = document.getElementById('pbv-arrow');
        const status = document.getElementById('pbv-status');
        
        copyVal.textContent = '?';
        copyVal.style.color = '#cbd5e0';
        copy.style.background = 'white';
        copy.style.borderColor = '#e74c3c';
        
        original.style.boxShadow = 'none';
        original.style.transform = 'scale(1)';
        
        arrow.style.color = '#cbd5e0';
        status.textContent = '대기 중';
        status.style.color = '#718096';
        
        document.getElementById('btn-pbv-copy').disabled = false;
        document.getElementById('btn-pbv-modify').disabled = true;
    },

    // 6. 반환값 애니메이션
    animateReturn() {
        const target = document.getElementById('ret-target');
        const arrow = document.getElementById('ret-arrow');
        const source = document.getElementById('ret-source');
        
        source.style.background = 'var(--secondary-color)';
        source.style.color = 'white';
        arrow.style.color = 'var(--secondary-color)';
        arrow.style.transform = 'translateX(10px)';
        
        setTimeout(() => {
            target.querySelector('.data-value').textContent = '100';
            target.querySelector('.data-value').style.color = 'var(--secondary-color)';
            target.style.transform = 'scale(1.2)';
            target.style.boxShadow = '0 0 20px rgba(46, 204, 113, 0.4)';
        }, 300);

        setTimeout(() => {
            target.style.transform = 'scale(1)';
        }, 600);
    },

    resetReturn() {
        const target = document.getElementById('ret-target');
        const arrow = document.getElementById('ret-arrow');
        const source = document.getElementById('ret-source');
        
        target.querySelector('.data-value').textContent = '?';
        target.querySelector('.data-value').style.color = '#cbd5e0';
        target.style.transform = 'scale(1)';
        target.style.boxShadow = 'none';
        
        arrow.style.color = '#cbd5e0';
        arrow.style.transform = 'translateX(0)';
        
        source.style.background = '#edf2f7';
        source.style.color = 'inherit';
    },

    // 7. 변수의 범위 (Scope)
    scopeAction(mode) {
        const globalBox = document.getElementById('scope-global');
        const mainBox = document.getElementById('scope-main');
        const funcBox = document.getElementById('scope-func');
        const msgBox = document.getElementById('scope-msg');
        
        msgBox.style.display = 'block';
        
        if (mode === 'main') {
            mainBox.style.opacity = '1';
            mainBox.style.borderColor = 'var(--secondary-color)';
            funcBox.style.opacity = '0.3';
            funcBox.style.borderColor = '#cbd5e0';
            msgBox.innerHTML = "<b>main 함수 실행 중:</b> main의 지역 변수(local_m)와 전역 변수(global_var)에만 접근할 수 있습니다.";
            msgBox.style.background = '#ebf8ff';
            msgBox.style.color = '#2b6cb0';
        } else if (mode === 'func') {
            mainBox.style.opacity = '0.3';
            mainBox.style.borderColor = '#cbd5e0';
            funcBox.style.opacity = '1';
            funcBox.style.borderColor = 'var(--accent-color)';
            msgBox.innerHTML = "<b>func 함수 실행 중:</b> func의 지역 변수(local_f)와 전역 변수(global_var)에 접근할 수 있습니다. main의 변수는 보이지 않습니다.";
            msgBox.style.background = '#fff5f5';
            msgBox.style.color = '#c53030';
        } else if (mode === 'access_error') {
            msgBox.innerHTML = "<b>❌ 컴파일 에러:</b> main 함수는 func 함수 내부의 변수(local_f)를 알 수 없습니다! (Out of Scope)";
            msgBox.style.background = '#fed7d7';
            msgBox.style.color = '#9b2c2c';
            funcBox.style.animation = 'shake 0.5s';
        }
    },

    // 8. 재귀 함수 (Recursion)
    recStep: 0,
    recData: [
        { type: 'call', n: 3, msg: "fact(3) 호출: 3 * fact(2) 대기" },
        { type: 'call', n: 2, msg: "fact(2) 호출: 2 * fact(1) 대기" },
        { type: 'call', n: 1, msg: "fact(1) 호출: n <= 1 이므로 1 반환!" },
        { type: 'return', n: 1, val: 1, msg: "fact(1)이 1을 반환하며 종료" },
        { type: 'return', n: 2, val: 2, msg: "fact(2) 계산 완료: 2 * 1 = 2 반환" },
        { type: 'return', n: 3, val: 6, msg: "fact(3) 계산 완료: 3 * 2 = 6 반환!" }
    ],

    nextRecursionStep() {
        if (this.recStep >= this.recData.length) return;
        
        const step = this.recData[this.recStep];
        const stack = document.getElementById('recursion-stack');
        const status = document.getElementById('recursion-status');
        
        if (step.type === 'call') {
            const frame = document.createElement('div');
            frame.className = 'rec-frame';
            frame.id = `rec-f-${step.n}`;
            frame.style.padding = '12px';
            frame.style.background = 'white';
            frame.style.border = '2px solid var(--primary-color)';
            frame.style.borderRadius = '8px';
            frame.style.textAlign = 'center';
            frame.style.fontWeight = 'bold';
            frame.style.boxShadow = '0 4px 6px rgba(0,0,0,0.05)';
            frame.innerHTML = `fact(${step.n}) <span style="font-size: 0.8rem; color: #718096;">(n=${step.n})</span>`;
            stack.appendChild(frame);
        } else {
            const lastFrame = document.getElementById(`rec-f-${step.n}`);
            if (lastFrame) {
                lastFrame.style.background = 'var(--secondary-color)';
                lastFrame.style.color = 'white';
                lastFrame.innerHTML = `fact(${step.n}) ➡ 반환값: ${step.val}`;
                setTimeout(() => {
                    lastFrame.style.transform = 'translateY(-20px)';
                    lastFrame.style.opacity = '0';
                    setTimeout(() => lastFrame.remove(), 300);
                }, 800);
            }
        }
        
        status.textContent = `상태: ${step.msg}`;
        this.recStep++;
        
        if (this.recStep === this.recData.length) {
            document.getElementById('btn-rec-next').disabled = true;
        }
    },

    resetRecursion() {
        this.recStep = 0;
        document.getElementById('recursion-stack').innerHTML = '';
        document.getElementById('recursion-status').textContent = '상태: 대기 중 (fact(3) 계산 시뮬레이션)';
        document.getElementById('btn-rec-next').disabled = false;
    }
};
