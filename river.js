/**
 * 서연고등학교 - 강 건너기 문제 시각화 로직
 */
const RiverCrossing = {
    LEFT: 0, RIGHT: 1,
    ITEM_NAMES: { 'F': '농부', 'W': '늑대', 'G': '염소', 'C': '양배추' },
    ITEM_ICONS: { 'F': '👨‍🌾', 'W': '🐺', 'G': '🐐', 'C': '🥬' },
    
    currentAlgo: 'bfs',
    isRunning: false,
    manualState: null,
    nodeCounter: 0,
    visitedNodes: [],

    init() {
        this.nodeCounter = 0;
        this.visitedNodes = [];
        this.manualState = new State(this.LEFT, this.LEFT, this.LEFT, this.LEFT);
        this.updateUI(this.manualState);
        document.getElementById('log-content').innerHTML = '';
        document.getElementById('stat-visited-list').textContent = '없음';
        document.getElementById('stat-visited-count').textContent = '0';
        document.getElementById('stat-path-length').textContent = '0';
        this.addLog("준비 완료. 알고리즘을 선택하거나 '직접 조작'을 눌러 게임을 시작하세요.");
    },

    addLog(msg, isTree = false) {
        const logContent = document.getElementById('log-content');
        const entry = document.createElement('div');
        entry.className = isTree ? 'log-entry tree-log' : 'log-entry';
        
        if (isTree) {
            entry.innerHTML = msg;
        } else {
            entry.textContent = `[${new Date().toLocaleTimeString()}] ${msg}`;
        }
        
        logContent.appendChild(entry);
        logContent.scrollTop = logContent.scrollHeight;
    },

    updateUI(state) {
        const leftBank = document.getElementById('left-items');
        const rightBank = document.getElementById('right-items');
        const boat = document.getElementById('boat');
        const currentStateText = document.getElementById('current-state-text');

        const createItem = (type) => {
            const div = document.createElement('div');
            div.className = 'item-icon';
            div.textContent = this.ITEM_ICONS[type];
            div.title = this.ITEM_NAMES[type];
            return div;
        };

        leftBank.innerHTML = ''; 
        rightBank.innerHTML = '';
        
        if (state.w === this.LEFT) leftBank.appendChild(createItem('W')); else rightBank.appendChild(createItem('W'));
        if (state.g === this.LEFT) leftBank.appendChild(createItem('G')); else rightBank.appendChild(createItem('G'));
        if (state.c === this.LEFT) leftBank.appendChild(createItem('C')); else rightBank.appendChild(createItem('C'));

        // 보트 위치: 0 (왼쪽) 또는 calc(100% - 160px) (오른쪽)
        if (state.f === this.LEFT) {
            boat.style.left = '0';
        } else {
            boat.style.left = 'calc(100% - 160px)';
        }

        currentStateText.innerHTML = `노드 <span class="node-name">${state.name}</span> | 상태 <span class="node-state">${state.getKey()}</span>`;
    },

    updateVisitedStats(nodeName) {
        this.visitedNodes.push(nodeName);
        document.getElementById('stat-visited-list').textContent = this.visitedNodes.join(', ');
        document.getElementById('stat-visited-count').textContent = this.visitedNodes.length;
    },

    async animateMove(fromState, toState) {
        const speed = parseInt(document.getElementById('speed-range').value);
        const boatItems = document.getElementById('boat-items');
        const boat = document.getElementById('boat');

        let itemToMove = null;
        if (fromState.w !== toState.w) itemToMove = 'W';
        else if (fromState.g !== toState.g) itemToMove = 'G';
        else if (fromState.c !== toState.c) itemToMove = 'C';

        boatItems.innerHTML = '';
        if (itemToMove) {
            const div = document.createElement('div');
            div.className = 'item-icon';
            div.style.fontSize = '2.5rem';
            div.textContent = this.ITEM_ICONS[itemToMove];
            boatItems.appendChild(div);
            
            // 둑에서 아이템 숨기기
            const bank = fromState.f === this.LEFT ? document.getElementById('left-items') : document.getElementById('right-items');
            const itemOnBank = Array.from(bank.children).find(c => c.textContent === this.ITEM_ICONS[itemToMove]);
            if (itemOnBank) itemOnBank.style.visibility = 'hidden';
        }

        boat.style.left = (toState.f === this.LEFT) ? '0' : 'calc(100% - 160px)';
        await new Promise(r => setTimeout(r, speed));
        this.updateUI(toState);
        boatItems.innerHTML = '';
    },

    getNextNodeName(index) {
        let name = "";
        let i = index;
        while (i >= 0) {
            name = String.fromCharCode(97 + (i % 26)) + name;
            i = Math.floor(i / 26) - 1;
        }
        return name;
    }
};

// 강 건너기용 상태 클래스
class State {
    constructor(f, w, g, c, parent = null, move = "", depth = 0, prefix = "") {
        this.f = f; this.w = w; this.g = g; this.c = c;
        this.parent = parent; this.move = move; this.depth = depth;
        this.prefix = prefix; this.childPrefix = "";
        this.name = RiverCrossing.getNextNodeName(RiverCrossing.nodeCounter++);
        this.g_score = parent ? parent.g_score + 1 : 0;
        this.h_score = this.calculateHeuristic();
    }
    isValid() {
        if (this.w === this.g && this.f !== this.w) return false;
        if (this.g === this.c && this.f !== this.g) return false;
        return true;
    }
    isGoal() { return this.f === 1 && this.w === 1 && this.g === 1 && this.c === 1; }
    getKey() { return `${this.f}${this.w}${this.g}${this.c}`; }
    calculateHeuristic() {
        let count = 0;
        if (this.f !== 1) count++; if (this.w !== 1) count++;
        if (this.g !== 1) count++; if (this.c !== 1) count++;
        return count;
    }
    getNeighbors() {
        const nextSide = 1 - this.f;
        const moves = [{ f: nextSide, w: this.w, g: this.g, c: this.c, m: "농부 혼자" }];
        if (this.w === this.f) moves.push({ f: nextSide, w: nextSide, g: this.g, c: this.c, m: "농부+늑대" });
        if (this.g === this.f) moves.push({ f: nextSide, w: this.w, g: nextSide, c: this.c, m: "농부+염소" });
        if (this.c === this.f) moves.push({ f: nextSide, w: this.w, g: this.g, c: nextSide, m: "농부+양배추" });
        return moves.map(n => new State(n.f, n.w, n.g, n.c, this, n.m, this.depth + 1, this.childPrefix)).filter(s => s.isValid());
    }
    getPath() {
        const path = []; let curr = this;
        while (curr) { path.push(curr); curr = curr.parent; }
        return path.reverse();
    }
}

// 직접 조작 핸들러
const handleRiverItemClick = async (type) => {
    if (RiverCrossing.currentAlgo !== 'manual' || RiverCrossing.isRunning) return;
    const currentSide = RiverCrossing.manualState.f;
    let nextState = null;
    
    if (type === 'F') {
        nextState = new State(1 - currentSide, RiverCrossing.manualState.w, RiverCrossing.manualState.g, RiverCrossing.manualState.c, RiverCrossing.manualState, "농부 이동", RiverCrossing.manualState.depth + 1);
    } else {
        const itemPos = type === 'W' ? RiverCrossing.manualState.w : (type === 'G' ? RiverCrossing.manualState.g : RiverCrossing.manualState.c);
        if (itemPos !== currentSide) return;
        const nextW = type === 'W' ? 1 - currentSide : RiverCrossing.manualState.w;
        const nextG = type === 'G' ? 1 - currentSide : RiverCrossing.manualState.g;
        const nextC = type === 'C' ? 1 - currentSide : RiverCrossing.manualState.c;
        nextState = new State(1 - currentSide, nextW, nextG, nextC, RiverCrossing.manualState, `농부+${RiverCrossing.ITEM_NAMES[type]}`, RiverCrossing.manualState.depth + 1);
    }
    
    if (nextState) {
        RiverCrossing.isRunning = true;
        await RiverCrossing.animateMove(RiverCrossing.manualState, nextState);
        RiverCrossing.manualState = nextState;
        if (!RiverCrossing.manualState.isValid()) {
            document.getElementById('current-state-text').innerHTML = '<span style="color:red; font-weight:bold;">실패! (먹이사슬 위협)</span>';
            RiverCrossing.addLog("실패: 농부가 없는 사이 누군가 먹혔습니다!");
        } else if (RiverCrossing.manualState.isGoal()) {
            document.getElementById('current-state-text').innerHTML = '<span style="color:green; font-weight:bold;">성공! (강 건너기 완료)</span>';
            RiverCrossing.addLog("성공: 모두가 무사히 건넜습니다!");
        }
        RiverCrossing.isRunning = false;
    }
};

// 알고리즘 엔진
async function Algorithms_Engine(algoType) {
    RiverCrossing.nodeCounter = 0;
    const start = new State(0, 0, 0, 0);
    let openList = [start];
    const visited = new Set();
    
    const drawTree = (state, isLast) => {
        if (state.depth === 0) {
            RiverCrossing.addLog(`<span class="node-name">● ${state.name}</span>(<span class="node-state">${state.getKey()}</span>)`, true);
            state.childPrefix = "  "; return;
        }
        const marker = isLast ? "└── " : "├── ";
        RiverCrossing.addLog(`${state.prefix}${marker}<span class="node-name">${state.name}</span>(<span class="node-state">${state.getKey()}</span>)`, true);
        state.childPrefix = state.prefix + (isLast ? "    " : "│   ");
    };

    drawTree(start, true);
    while (openList.length > 0) {
        let curr;
        if (algoType === 'bfs') curr = openList.shift();
        else if (algoType === 'dfs') curr = openList.pop();
        else if (algoType === 'best') { openList.sort((a,b) => a.h_score - b.h_score); curr = openList.shift(); }
        else if (algoType === 'astar') { openList.sort((a,b) => (a.g_score+a.h_score) - (b.g_score+b.h_score)); curr = openList.shift(); }
        
        if (visited.has(curr.getKey())) continue;
        visited.add(curr.getKey());
        RiverCrossing.updateVisitedStats(curr.name);
        RiverCrossing.updateUI(curr);
        
        if (curr.isGoal()) {
            RiverCrossing.addLog(`★ 목표 발견! [${curr.name}] 노드 도달`);
            return curr.getPath();
        }
        
        const neighbors = curr.getNeighbors();
        neighbors.forEach((n, idx) => {
            if (!visited.has(n.getKey())) {
                drawTree(n, idx === neighbors.length - 1);
                openList.push(n);
            }
        });
        await new Promise(r => setTimeout(r, Math.max(50, parseInt(document.getElementById('speed-range').value)/4)));
    }
    return null;
}

// 이벤트 바인딩
document.getElementById('btn-start').onclick = async () => {
    if (RiverCrossing.isRunning || RiverCrossing.currentAlgo === 'manual') return;
    RiverCrossing.isRunning = true;
    document.getElementById('log-content').innerHTML = '';
    RiverCrossing.visitedNodes = [];
    RiverCrossing.addLog(`=== ${RiverCrossing.currentAlgo.toUpperCase()} 탐색 시작 ===`);
    const path = await Algorithms_Engine(RiverCrossing.currentAlgo);
    if (path) {
        RiverCrossing.addLog(`경로 발견! 시연 시작 (${path.length - 1}단계)`);
        document.getElementById('stat-path-length').textContent = path.length - 1;
        for (let i = 1; i < path.length; i++) {
            await RiverCrossing.animateMove(path[i-1], path[i]);
        }
    } else {
        RiverCrossing.addLog("탐색 실패: 목표에 도달할 수 없습니다.");
    }
    RiverCrossing.isRunning = false;
};

document.getElementById('btn-reset').onclick = () => {
    if (!RiverCrossing.isRunning) RiverCrossing.init();
};

document.querySelectorAll('.algo-btn').forEach(btn => {
    btn.onclick = (e) => {
        if (RiverCrossing.isRunning) return;
        const type = e.target.id.replace('btn-', '');
        RiverCrossing.currentAlgo = type;
        document.querySelectorAll('.algo-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        RiverCrossing.init();
    };
});

// 아이템 클릭 이벤트 (직접 조작용)
document.addEventListener('click', (e) => {
    if (RiverCrossing.currentAlgo !== 'manual') return;
    const boat = e.target.closest('#boat');
    if (boat) { handleRiverItemClick('F'); return; }
    const itemIcon = e.target.closest('.item-icon');
    if (itemIcon) {
        const icon = itemIcon.textContent;
        const type = Object.keys(RiverCrossing.ITEM_ICONS).find(key => RiverCrossing.ITEM_ICONS[key] === icon);
        if (type) handleRiverItemClick(type);
    }
});

RiverCrossing.init();
