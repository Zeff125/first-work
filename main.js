/**
 * 강 건너기 문제 (농부, 늑대, 염소, 양배추) AI 시각화
 */

// 상수 정의
const LEFT = 0;
const RIGHT = 1;
const ITEMS = ['F', 'W', 'G', 'C']; // 농부, 늑대, 염소, 양배추
const ITEM_NAMES = { 'F': '농부', 'W': '늑대', 'G': '염소', 'C': '양배추' };
const ITEM_ICONS = { 'F': '👨‍🌾', 'W': '🐺', 'G': '🐐', 'C': '🥬' };

// 상태 클래스
class State {
    constructor(f, w, g, c, parent = null, move = "") {
        this.f = f; // 농부 위치
        this.w = w; // 늑대 위치
        this.g = g; // 염소 위치
        this.c = c; // 양배추 위치
        this.parent = parent;
        this.move = move; // 어떤 이동으로 이 상태가 되었는지
        this.g_score = parent ? parent.g_score + 1 : 0;
        this.h_score = this.calculateHeuristic();
    }

    // 유효한 상태인지 확인
    isValid() {
        // 늑대와 염소가 같이 있는데 농부가 없는 경우
        if (this.w === this.g && this.f !== this.w) return false;
        // 염소와 양배추가 같이 있는데 농부가 없는 경우
        if (this.g === this.c && this.f !== this.g) return false;
        return true;
    }

    // 목표 상태인지 확인
    isGoal() {
        return this.f === RIGHT && this.w === RIGHT && this.g === RIGHT && this.c === RIGHT;
    }

    // 고유 키 생성 (방문 여부 확인용)
    getKey() {
        return `${this.f}${this.w}${this.g}${this.c}`;
    }

    // 휴리스틱 계산 (목표 기슭에 있지 않은 아이템 수)
    calculateHeuristic() {
        let count = 0;
        if (this.f !== RIGHT) count++;
        if (this.w !== RIGHT) count++;
        if (this.g !== RIGHT) count++;
        if (this.c !== RIGHT) count++;
        return count;
    }

    // 가능한 다음 상태들 반환
    getNeighbors() {
        const neighbors = [];
        const currentSide = this.f;
        const nextSide = 1 - currentSide;

        // 1. 농부만 이동
        neighbors.push(new State(nextSide, this.w, this.g, this.c, this, "농부 혼자 이동"));

        // 2. 농부가 아이템 하나와 함께 이동
        if (this.w === currentSide) {
            neighbors.push(new State(nextSide, nextSide, this.g, this.c, this, "농부와 늑대 이동"));
        }
        if (this.g === currentSide) {
            neighbors.push(new State(nextSide, this.w, nextSide, this.c, this, "농부와 염소 이동"));
        }
        if (this.c === currentSide) {
            neighbors.push(new State(nextSide, this.w, this.g, nextSide, this, "농부와 양배추 이동"));
        }

        return neighbors.filter(s => s.isValid());
    }

    // 경로 추적
    getPath() {
        const path = [];
        let curr = this;
        while (curr) {
            path.push(curr);
            curr = curr.parent;
        }
        return path.reverse();
    }
}

// UI 컨트롤러
const UI = {
    leftBank: document.getElementById('left-items'),
    rightBank: document.getElementById('right-items'),
    boat: document.getElementById('boat'),
    boatItems: document.getElementById('boat-items'),
    logContent: document.getElementById('log-content'),
    statVisited: document.getElementById('stat-visited'),
    statPathLength: document.getElementById('stat-path-length'),
    currentStateText: document.getElementById('current-state-text'),
    speedRange: document.getElementById('speed-range'),

    init() {
        this.updateStateUI(new State(LEFT, LEFT, LEFT, LEFT));
        this.addLog("준비 완료. 알고리즘을 선택하고 시작 버튼을 누르세요.");
    },

    addLog(msg) {
        const entry = document.createElement('div');
        entry.className = 'log-entry';
        entry.textContent = `[${new Date().toLocaleTimeString()}] ${msg}`;
        this.logContent.prepend(entry);
    },

    async updateStateUI(state) {
        // 아이템 배치 업데이트
        const createItem = (type) => {
            const div = document.createElement('div');
            div.className = 'item-icon';
            div.textContent = ITEM_ICONS[type];
            div.title = ITEM_NAMES[type];
            return div;
        };

        this.leftBank.innerHTML = '';
        this.rightBank.innerHTML = '';
        
        if (state.w === LEFT) this.leftBank.appendChild(createItem('W'));
        else this.rightBank.appendChild(createItem('W'));
        
        if (state.g === LEFT) this.leftBank.appendChild(createItem('G'));
        else this.rightBank.appendChild(createItem('G'));
        
        if (state.c === LEFT) this.leftBank.appendChild(createItem('C'));
        else this.rightBank.appendChild(createItem('C'));

        // 보트 위치 및 농부 (농부는 항상 보트에 있는 것으로 간주)
        if (state.f === LEFT) {
            this.boat.style.left = '10px';
        } else {
            this.boat.style.left = 'calc(100% - 110px)';
        }

        this.currentStateText.textContent = state.move || (currentAlgo === 'manual' ? "당신의 차례입니다" : "대기 중...");
    },

    async animateMove(fromState, toState) {
        const speed = parseInt(this.speedRange.value);
        
        // 1. 이동할 아이템 파악 (농부 외)
        let itemToMove = null;
        if (fromState.w !== toState.w) itemToMove = 'W';
        else if (fromState.g !== toState.g) itemToMove = 'G';
        else if (fromState.c !== toState.c) itemToMove = 'C';

        // 2. 아이템 보트에 태우기
        this.boatItems.innerHTML = '';
        if (itemToMove) {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'item-icon';
            itemDiv.textContent = ITEM_ICONS[itemToMove];
            this.boatItems.appendChild(itemDiv);
            
            // 기존 둑에서 제거
            const bank = fromState.f === LEFT ? this.leftBank : this.rightBank;
            const itemOnBank = Array.from(bank.children).find(c => c.textContent === ITEM_ICONS[itemToMove]);
            if (itemOnBank) itemOnBank.style.visibility = 'hidden';
        }

        // 3. 보트 이동
        if (toState.f === LEFT) {
            this.boat.style.left = '10px';
        } else {
            this.boat.style.left = 'calc(100% - 110px)';
        }

        await new Promise(r => setTimeout(r, speed));

        // 4. 상태 업데이트 (UI 갱신)
        this.updateStateUI(toState);
        this.boatItems.innerHTML = '';
    }
};

// 알고리즘 구현
const Algorithms = {
    async bfs() {
        const start = new State(LEFT, LEFT, LEFT, LEFT);
        const queue = [start];
        const visited = new Set([start.getKey()]);
        let visitedCount = 0;

        while (queue.length > 0) {
            const curr = queue.shift();
            visitedCount++;
            UI.statVisited.textContent = visitedCount;

            if (curr.isGoal()) return curr.getPath();

            for (const neighbor of curr.getNeighbors()) {
                if (!visited.has(neighbor.getKey())) {
                    visited.add(neighbor.getKey());
                    queue.push(neighbor);
                }
            }
        }
        return null;
    },

    async dfs() {
        const start = new State(LEFT, LEFT, LEFT, LEFT);
        const stack = [start];
        const visited = new Set();
        let visitedCount = 0;

        while (stack.length > 0) {
            const curr = stack.pop();
            if (visited.has(curr.getKey())) continue;
            
            visited.add(curr.getKey());
            visitedCount++;
            UI.statVisited.textContent = visitedCount;

            if (curr.isGoal()) return curr.getPath();

            // DFS의 특성을 보여주기 위해 자식 노드를 역순으로 넣음
            for (const neighbor of curr.getNeighbors().reverse()) {
                if (!visited.has(neighbor.getKey())) {
                    stack.push(neighbor);
                }
            }
        }
        return null;
    },

    async bestFirst() {
        const start = new State(LEFT, LEFT, LEFT, LEFT);
        const openList = [start];
        const visited = new Set();
        let visitedCount = 0;

        while (openList.length > 0) {
            // h_score가 낮은 순으로 정렬 (Greedy)
            openList.sort((a, b) => a.h_score - b.h_score);
            const curr = openList.shift();

            if (visited.has(curr.getKey())) continue;
            visited.add(curr.getKey());
            visitedCount++;
            UI.statVisited.textContent = visitedCount;

            if (curr.isGoal()) return curr.getPath();

            for (const neighbor of curr.getNeighbors()) {
                if (!visited.has(neighbor.getKey())) {
                    openList.push(neighbor);
                }
            }
        }
        return null;
    },

    async astar() {
        const start = new State(LEFT, LEFT, LEFT, LEFT);
        const openList = [start];
        const visited = new Map(); // key -> min_g_score
        let visitedCount = 0;

        while (openList.length > 0) {
            // f = g + h 가 낮은 순으로 정렬
            openList.sort((a, b) => (a.g_score + a.h_score) - (b.g_score + b.h_score));
            const curr = openList.shift();

            if (visited.has(curr.getKey()) && visited.get(curr.getKey()) <= curr.g_score) continue;
            visited.set(curr.getKey(), curr.g_score);
            visitedCount++;
            UI.statVisited.textContent = visitedCount;

            if (curr.isGoal()) return curr.getPath();

            for (const neighbor of curr.getNeighbors()) {
                openList.push(neighbor);
            }
        }
        return null;
    }
};

// 메인 앱 로직
let currentAlgo = 'bfs';
let isRunning = false;
let manualState = new State(LEFT, LEFT, LEFT, LEFT);

// 아이템 클릭 이벤트 (직접 조작용)
const handleItemClick = async (type) => {
    if (currentAlgo !== 'manual' || isRunning) return;
    
    const currentSide = manualState.f;
    let nextState = null;

    if (type === 'F') {
        // 농부만 이동
        nextState = new State(1 - currentSide, manualState.w, manualState.g, manualState.c, manualState, "농부 혼자 이동");
    } else {
        // 아이템과 함께 이동 (아이템이 농부와 같은 쪽에 있어야 함)
        const itemPos = type === 'W' ? manualState.w : (type === 'G' ? manualState.g : manualState.c);
        if (itemPos !== currentSide) {
            UI.addLog(`${ITEM_NAMES[type]}가 반대편에 있습니다.`);
            return;
        }

        const nextW = type === 'W' ? 1 - currentSide : manualState.w;
        const nextG = type === 'G' ? 1 - currentSide : manualState.g;
        const nextC = type === 'C' ? 1 - currentSide : manualState.c;
        nextState = new State(1 - currentSide, nextW, nextG, nextC, manualState, `농부와 ${ITEM_NAMES[type]} 이동`);
    }

    if (nextState) {
        isRunning = true;
        await UI.animateMove(manualState, nextState);
        manualState = nextState;
        
        if (!manualState.isValid()) {
            UI.addLog("⚠️ 규칙 위반! " + getFailureReason(manualState));
            UI.currentStateText.innerHTML = `<span style="color: red">실패: ${getFailureReason(manualState)}</span>`;
            setTimeout(() => {
                if (confirm("실패했습니다! 다시 시작하시겠습니까?")) {
                    resetManualGame();
                }
            }, 500);
        } else if (manualState.isGoal()) {
            UI.addLog("🎉 축하합니다! 모두 무사히 건넜습니다.");
            UI.currentStateText.innerHTML = `<span style="color: green; font-weight: bold;">성공!</span>`;
        }
        isRunning = false;
    }
};

const getFailureReason = (state) => {
    if (state.w === state.g && state.f !== state.w) return "늑대가 염소를 먹었습니다!";
    if (state.g === state.c && state.f !== state.g) return "염소가 양배추를 먹었습니다!";
    return "잘못된 이동입니다.";
};

const resetManualGame = () => {
    manualState = new State(LEFT, LEFT, LEFT, LEFT);
    UI.updateStateUI(manualState);
    UI.statVisited.textContent = '0';
    UI.statPathLength.textContent = '0';
    UI.addLog("직접 조작 모드 초기화.");
};

// 이벤트 위임으로 아이템 클릭 처리
document.addEventListener('click', (e) => {
    const itemIcon = e.target.closest('.item-icon');
    if (itemIcon) {
        const icon = itemIcon.textContent;
        const type = Object.keys(ITEM_ICONS).find(key => ITEM_ICONS[key] === icon);
        if (type) handleItemClick(type);
    }

    const boat = e.target.closest('.boat');
    if (boat && currentAlgo === 'manual' && !isRunning) {
        handleItemClick('F'); // 보트 클릭 시 농부 혼자 이동
    }
});

document.querySelectorAll('.algo-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        if (isRunning) return;
        document.querySelectorAll('.algo-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        currentAlgo = e.target.id.replace('btn-', '');
        
        if (currentAlgo === 'manual') {
            resetManualGame();
            UI.addLog("직접 조작 모드가 활성화되었습니다. 아이템이나 보트를 클릭하여 이동하세요.");
        }
    });
});

document.getElementById('btn-start').addEventListener('click', async () => {
    if (isRunning || currentAlgo === 'manual') return;
    isRunning = true;
    UI.addLog(`${currentAlgo.toUpperCase()} 탐색 시작...`);
...
    isRunning = false;
});

document.getElementById('btn-reset').addEventListener('click', () => {
    if (isRunning) return;
    if (currentAlgo === 'manual') {
        resetManualGame();
    } else {
        UI.init();
        UI.statVisited.textContent = '0';
        UI.statPathLength.textContent = '0';
        UI.logContent.innerHTML = '';
        UI.addLog("초기화되었습니다.");
    }
});

// 초기화 실행
UI.init();
