/**
 * 강 건너기 문제 (농부, 늑대, 염소, 양배추) AI 시각화
 */

// 상수 정의
const LEFT = 0;
const RIGHT = 1;
const ITEM_NAMES = { 'F': '농부', 'W': '늑대', 'G': '염소', 'C': '양배추' };
const ITEM_ICONS = { 'F': '👨‍🌾', 'W': '🐺', 'G': '🐐', 'C': '🥬' };

// 전역 상태 변수
let currentAlgo = 'bfs';
let isRunning = false;
let manualState = null;
let nodeCounter = 0;
let visitedNodes = [];

/**
 * 노드 이름을 생성하는 함수 (a, b, c, ..., z, aa, ab, ...)
 */
function getNextNodeName(index) {
    let name = "";
    let i = index;
    while (i >= 0) {
        name = String.fromCharCode(97 + (i % 26)) + name;
        i = Math.floor(i / 26) - 1;
    }
    return name;
}

/**
 * 상태 클래스 (0000 형식을 따름: Farmer, Wolf, Goat, Cabbage)
 */
class State {
    constructor(f, w, g, c, parent = null, move = "", depth = 0, prefix = "") {
        this.f = f; // 농부 위치
        this.w = w; // 늑대 위치
        this.g = g; // 염소 위치
        this.c = c; // 양배추 위치
        this.parent = parent;
        this.move = move;
        this.depth = depth;
        this.prefix = prefix;
        this.childPrefix = "";
        this.name = getNextNodeName(nodeCounter++);
        this.g_score = parent ? parent.g_score + 1 : 0;
        this.h_score = this.calculateHeuristic();
    }

    isValid() {
        if (this.w === this.g && this.f !== this.w) return false;
        if (this.g === this.c && this.f !== this.g) return false;
        return true;
    }

    isGoal() {
        return this.f === RIGHT && this.w === RIGHT && this.g === RIGHT && this.c === RIGHT;
    }

    getKey() {
        return `${this.f}${this.w}${this.g}${this.c}`;
    }

    calculateHeuristic() {
        let count = 0;
        if (this.f !== RIGHT) count++;
        if (this.w !== RIGHT) count++;
        if (this.g !== RIGHT) count++;
        if (this.c !== RIGHT) count++;
        return count;
    }

    getNeighbors() {
        const neighbors = [];
        const currentSide = this.f;
        const nextSide = 1 - currentSide;

        // 가능한 이동 정의
        const moves = [
            { f: nextSide, w: this.w, g: this.g, c: this.c, m: "농부 혼자" }
        ];
        if (this.w === currentSide) moves.push({ f: nextSide, w: nextSide, g: this.g, c: this.c, m: "농부+늑대" });
        if (this.g === currentSide) moves.push({ f: nextSide, w: this.w, g: nextSide, c: this.c, m: "농부+염소" });
        if (this.c === currentSide) moves.push({ f: nextSide, w: this.w, g: this.g, c: nextSide, m: "농부+양배추" });

        return moves
            .map(n => new State(n.f, n.w, n.g, n.c, this, n.m, this.depth + 1, this.childPrefix))
            .filter(s => s.isValid());
    }

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
    statVisitedList: document.getElementById('stat-visited-list'),
    statVisitedCount: document.getElementById('stat-visited-count'),
    statPathLength: document.getElementById('stat-path-length'),
    currentStateText: document.getElementById('current-state-text'),
    speedRange: document.getElementById('speed-range'),

    init() {
        nodeCounter = 0;
        visitedNodes = [];
        manualState = new State(LEFT, LEFT, LEFT, LEFT);
        this.updateStateUI(manualState);
        this.logContent.innerHTML = '';
        this.statVisitedList.textContent = '없음';
        this.statVisitedCount.textContent = '0';
        this.statPathLength.textContent = '0';
        this.addLog("준비 완료. 알고리즘을 선택하고 탐색 시작을 누르세요.");
    },

    addLog(msg, isTree = false) {
        const entry = document.createElement('div');
        entry.className = isTree ? 'log-entry tree-log' : 'log-entry';
        
        if (isTree) {
            // HTML 태그를 사용하여 노드 이름과 상태에 색상 입히기
            entry.innerHTML = msg;
        } else {
            entry.textContent = `[${new Date().toLocaleTimeString()}] ${msg}`;
        }
        
        this.logContent.appendChild(entry);
        this.logContent.scrollTop = this.logContent.scrollHeight;
    },

    /**
     * 트리 노드 출력 로직 개선
     */
    drawTreeNode(state, isLast = true) {
        if (state.depth === 0) {
            this.addLog(`<span class="node-name">● ${state.name}</span>(<span class="node-state">${state.getKey()}</span>)`, true);
            state.childPrefix = "  ";
            return;
        }

        const marker = isLast ? "└── " : "├── ";
        const treeLine = `${state.prefix}${marker}<span class="node-name">${state.name}</span>(<span class="node-state">${state.getKey()}</span>)`;
        this.addLog(treeLine, true);
        
        state.childPrefix = state.prefix + (isLast ? "    " : "│   ");
    },

    async updateStateUI(state) {
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

        if (state.f === LEFT) {
            this.boat.style.left = '5px';
        } else {
            this.boat.style.left = 'calc(100% - 125px)';
        }

        this.currentStateText.innerHTML = `<span class="node-name">${state.name}</span>: <span class="node-state">${state.getKey()}</span> (${state.move || "초기"})`;
    },

    updateVisitedStats(nodeName) {
        visitedNodes.push(nodeName);
        this.statVisitedList.textContent = visitedNodes.join(', ');
        this.statVisitedCount.textContent = visitedNodes.length;
        this.statVisitedList.scrollTop = this.statVisitedList.scrollHeight;
    },

    async animateMove(fromState, toState) {
        const speed = parseInt(this.speedRange.value);
        let itemToMove = null;
        if (fromState.w !== toState.w) itemToMove = 'W';
        else if (fromState.g !== toState.g) itemToMove = 'G';
        else if (fromState.c !== toState.c) itemToMove = 'C';

        this.boatItems.innerHTML = '';
        if (itemToMove) {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'item-icon';
            itemDiv.textContent = ITEM_ICONS[itemToMove];
            this.boatItems.appendChild(itemDiv);
            
            const bank = fromState.f === LEFT ? this.leftBank : this.rightBank;
            const itemOnBank = Array.from(bank.children).find(c => c.textContent === ITEM_ICONS[itemToMove]);
            if (itemOnBank) itemOnBank.style.visibility = 'hidden';
        }

        if (toState.f === LEFT) {
            this.boat.style.left = '10px';
        } else {
            this.boat.style.left = 'calc(100% - 110px)';
        }

        await new Promise(r => setTimeout(r, speed));
        this.updateStateUI(toState);
        this.boatItems.innerHTML = '';
    }
};

/**
 * 알고리즘 엔진
 */
const Algorithms = {
    async run(algoType) {
        nodeCounter = 0;
        visitedNodes = [];
        const start = new State(LEFT, LEFT, LEFT, LEFT);
        let openList = [start];
        const visited = new Set();

        UI.drawTreeNode(start);

        while (openList.length > 0) {
            let curr;
            if (algoType === 'bfs') curr = openList.shift();
            else if (algoType === 'dfs') curr = openList.pop();
            else if (algoType === 'best') {
                openList.sort((a, b) => a.h_score - b.h_score);
                curr = openList.shift();
            } else if (algoType === 'astar') {
                openList.sort((a, b) => (a.g_score + a.h_score) - (b.g_score + b.h_score));
                curr = openList.shift();
            }

            if (visited.has(curr.getKey())) continue;
            
            visited.add(curr.getKey());
            
            // 통계 및 UI 업데이트
            UI.updateVisitedStats(curr.name);
            await UI.updateStateUI(curr);
            
            const delay = Math.max(50, parseInt(UI.speedRange.value) / 4);
            await new Promise(r => setTimeout(r, delay));

            if (curr.isGoal()) {
                UI.addLog(`★ 목표 발견! [${curr.name}] 노드에서 1111 도달`);
                return curr.getPath();
            }

            const neighbors = curr.getNeighbors();
            for (let i = 0; i < neighbors.length; i++) {
                const neighbor = neighbors[i];
                if (!visited.has(neighbor.getKey())) {
                    UI.drawTreeNode(neighbor, i === neighbors.length - 1);
                    openList.push(neighbor);
                }
            }
        }
        return null;
    }
};

// 직접 조작 핸들러
const handleItemClick = async (type) => {
    if (currentAlgo !== 'manual' || isRunning) return;
    const currentSide = manualState.f;
    let nextState = null;
    
    if (type === 'F') {
        nextState = new State(1 - currentSide, manualState.w, manualState.g, manualState.c, manualState, "농부 이동", manualState.depth + 1);
    } else {
        const itemPos = type === 'W' ? manualState.w : (type === 'G' ? manualState.g : manualState.c);
        if (itemPos !== currentSide) return;
        const nextW = type === 'W' ? 1 - currentSide : manualState.w;
        const nextG = type === 'G' ? 1 - currentSide : manualState.g;
        const nextC = type === 'C' ? 1 - currentSide : manualState.c;
        nextState = new State(1 - currentSide, nextW, nextG, nextC, manualState, `농부+${ITEM_NAMES[type]}`, manualState.depth + 1);
    }
    
    if (nextState) {
        isRunning = true;
        await UI.animateMove(manualState, nextState);
        manualState = nextState;
        if (!manualState.isValid() || manualState.isGoal()) {
            UI.currentStateText.innerHTML = manualState.isGoal() ? '<span style="color:green">성공!</span>' : '<span style="color:red">실패!</span>';
        }
        isRunning = false;
    }
};

// 이벤트 리스너
document.getElementById('btn-start').addEventListener('click', async () => {
    if (isRunning || currentAlgo === 'manual') return;
    isRunning = true;
    UI.logContent.innerHTML = '';
    UI.statVisitedList.textContent = '탐색 중...';
    UI.addLog(`=== ${currentAlgo.toUpperCase()} 탐색 트리 생성 및 추적 시작 ===`, false);
    
    const path = await Algorithms.run(currentAlgo);
    
    if (path) {
        UI.addLog(`최단 경로 시연 시작 (${path.length - 1}단계)`);
        UI.statPathLength.textContent = path.length - 1;
        for (let i = 1; i < path.length; i++) {
            await UI.animateMove(path[i-1], path[i]);
        }
        UI.addLog("전원 강 건너기 성공!");
    } else {
        UI.addLog("탐색 실패: 해결 가능한 경로가 없습니다.");
    }
    isRunning = false;
});

document.querySelectorAll('.algo-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        if (isRunning) return;
        document.querySelectorAll('.algo-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        currentAlgo = e.target.id.replace('btn-', '');
        UI.init();
    });
});

document.getElementById('btn-reset').addEventListener('click', () => {
    if (isRunning) return;
    UI.init();
});

document.addEventListener('click', (e) => {
    const itemIcon = e.target.closest('.item-icon');
    if (itemIcon && currentAlgo === 'manual') {
        const icon = itemIcon.textContent;
        const type = Object.keys(ITEM_ICONS).find(key => ITEM_ICONS[key] === icon);
        if (type) handleItemClick(type);
    }
});

UI.init();
