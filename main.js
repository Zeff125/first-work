/**
 * AlgoVis - 통합 알고리즘 시각화 엔진
 */

// --- 1. 내비게이션 관리 ---
const Navigation = {
    screens: {
        home: document.getElementById('screen-home'),
        river: document.getElementById('screen-river'),
        array: document.getElementById('screen-array')
    },
    goTo(screenName) {
        Object.values(this.screens).forEach(s => s.classList.add('hidden'));
        this.screens[screenName].classList.remove('hidden');
        window.scrollTo(0, 0);
        
        if (screenName === 'river') RiverCrossing.init();
        if (screenName === 'array') ArrayViz.init();
    }
};

// --- 2. 강 건너기 문제 (기존 로직 이식 및 모듈화) ---
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
        this.addLog("준비 완료. 알고리즘을 선택하고 탐색 시작을 누르세요.");
    },

    addLog(msg, isTree = false) {
        const logContent = document.getElementById('log-content');
        const entry = document.createElement('div');
        entry.className = isTree ? 'log-entry tree-log' : 'log-entry';
        entry.innerHTML = isTree ? msg : `[${new Date().toLocaleTimeString()}] ${msg}`;
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
            return div;
        };

        leftBank.innerHTML = ''; rightBank.innerHTML = '';
        if (state.w === this.LEFT) leftBank.appendChild(createItem('W')); else rightBank.appendChild(createItem('W'));
        if (state.g === this.LEFT) leftBank.appendChild(createItem('G')); else rightBank.appendChild(createItem('G'));
        if (state.c === this.LEFT) leftBank.appendChild(createItem('C')); else rightBank.appendChild(createItem('C'));

        boat.style.left = (state.f === this.LEFT) ? '5px' : 'calc(100% - 125px)';
        currentStateText.innerHTML = `<span class="node-name">${state.name}</span>: <span class="node-state">${state.getKey()}</span> (${state.move || "초기"})`;
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
            div.textContent = this.ITEM_ICONS[itemToMove];
            boatItems.appendChild(div);
        }

        boat.style.left = (toState.f === this.LEFT) ? '10px' : 'calc(100% - 110px)';
        await new Promise(r => setTimeout(r, speed));
        this.updateUI(toState);
        boatItems.innerHTML = '';
    }
};

// 강 건너기용 상태 클래스
class State {
    constructor(f, w, g, c, parent = null, move = "", depth = 0, prefix = "") {
        this.f = f; this.w = w; this.g = g; this.c = c;
        this.parent = parent; this.move = move; this.depth = depth;
        this.prefix = prefix; this.childPrefix = "";
        this.name = RiverCrossing.getNextNodeName ? RiverCrossing.getNextNodeName(RiverCrossing.nodeCounter++) : "n"+(RiverCrossing.nodeCounter++);
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
    calculateHeuristic() { return (1-this.f) + (1-this.w) + (1-this.g) + (1-this.c); }
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
RiverCrossing.getNextNodeName = (index) => {
    let name = ""; let i = index;
    while (i >= 0) { name = String.fromCharCode(97 + (i % 26)) + name; i = Math.floor(i / 26) - 1; }
    return name;
};

// --- 3. C언어 배열 시각화 로직 ---
const ArrayViz = {
    size: 10,
    data: [],
    baseAddress: 0x7ffee000,

    init() {
        this.randomize();
        this.addLog("C언어 정적 배열 int arr[10]이 메모리에 할당되었습니다.");
    },

    randomize() {
        this.data = Array.from({ length: this.size }, () => Math.floor(Math.random() * 100));
        this.render();
    },

    render() {
        const container = document.getElementById('array-display');
        container.innerHTML = '';
        this.data.forEach((val, i) => {
            const addr = (this.baseAddress + i * 4).toString(16).toUpperCase();
            const el = document.createElement('div');
            el.className = 'array-element';
            el.innerHTML = `
                <div class="address-label">0x${addr}</div>
                <div class="array-box" id="arr-${i}">${val}</div>
                <div class="index-label">[${i}]</div>
            `;
            container.appendChild(el);
        });
    },

    async access(index) {
        if (index < 0 || index >= this.size) {
            this.addLog("Error: Array Index Out of Bounds!", true);
            return;
        }
        this.clearEffects();
        const box = document.getElementById(`arr-${index}`);
        box.classList.add('active');
        const addr = (this.baseAddress + index * 4).toString(16).toUpperCase();
        document.getElementById('array-info').innerHTML = `<strong>arr[${index}]</strong> 접근 완료 | 메모리 주소: <strong>0x${addr}</strong> | 값: <strong>${this.data[index]}</strong>`;
        this.addLog(`arr[${index}] (주소: 0x${addr})의 값 ${this.data[index]}을(를) 읽었습니다.`);
    },

    async search(target) {
        this.addLog(`선형 탐색 시작: 값 ${target}을(를) 찾습니다...`);
        this.clearEffects();
        let found = false;
        for (let i = 0; i < this.size; i++) {
            const box = document.getElementById(`arr-${i}`);
            box.classList.add('active');
            await new Promise(r => setTimeout(r, 400));
            if (this.data[i] === target) {
                box.classList.remove('active');
                box.classList.add('found');
                this.addLog(`값 ${target}을(를) 인덱스 [${i}]에서 발견했습니다!`);
                found = true;
                break;
            }
            box.classList.remove('active');
        }
        if (!found) this.addLog(`값 ${target}을(를) 찾지 못했습니다.`);
    },

    clearEffects() {
        document.querySelectorAll('.array-box').forEach(b => {
            b.classList.remove('active');
            b.classList.remove('found');
        });
    },

    addLog(msg) {
        const log = document.getElementById('array-log-content');
        const entry = document.createElement('div');
        entry.className = 'log-entry';
        entry.textContent = `> ${msg}`;
        log.prepend(entry);
    }
};

// --- 4. 전역 이벤트 바인딩 ---

// 공통 홈 버튼
document.getElementById('btn-go-home').addEventListener('click', () => Navigation.goTo('home'));
document.getElementById('nav-logo').addEventListener('click', () => Navigation.goTo('home'));

// 강 건너기 이벤트
document.getElementById('btn-start').addEventListener('click', async () => {
    if (RiverCrossing.isRunning) return;
    RiverCrossing.isRunning = true;
    const path = await Algorithms_Engine(RiverCrossing.currentAlgo);
    if (path) {
        for (let i = 1; i < path.length; i++) {
            await RiverCrossing.animateMove(path[i-1], path[i]);
        }
        RiverCrossing.addLog("★ 성공적으로 모두 건넜습니다!");
    }
    RiverCrossing.isRunning = false;
});

document.querySelectorAll('.algo-btn').forEach(btn => {
    if (btn.id.startsWith('btn-')) {
        btn.addEventListener('click', (e) => {
            const type = e.target.id.replace('btn-', '');
            if (['bfs', 'dfs', 'best', 'astar', 'manual'].includes(type)) {
                RiverCrossing.currentAlgo = type;
                document.querySelectorAll('.algo-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                RiverCrossing.init();
            }
        });
    }
});

// 배열 시각화 이벤트
document.getElementById('btn-array-random').addEventListener('click', () => ArrayViz.randomize());
document.getElementById('btn-array-access').addEventListener('click', () => {
    const idx = parseInt(document.getElementById('input-array-index').value);
    if (!isNaN(idx)) ArrayViz.access(idx);
});
document.getElementById('btn-array-search').addEventListener('click', () => {
    const val = parseInt(document.getElementById('input-array-value').value);
    if (!isNaN(val)) ArrayViz.search(val);
});

// 기존 알고리즘 엔진 (State 클래스 의존성 때문에 밖으로 뺌)
async function Algorithms_Engine(algoType) {
    RiverCrossing.nodeCounter = 0;
    const start = new State(0, 0, 0, 0);
    let openList = [start];
    const visited = new Set();
    
    // 트리 시각화 함수 로컬 정의
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
        RiverCrossing.updateUI(curr);
        
        if (curr.isGoal()) return curr.getPath();
        
        const neighbors = curr.getNeighbors();
        neighbors.forEach((n, idx) => {
            if (!visited.has(n.getKey())) {
                drawTree(n, idx === neighbors.length - 1);
                openList.push(n);
            }
        });
        await new Promise(r => setTimeout(r, 100));
    }
    return null;
}

// 초기 화면 설정
Navigation.goTo('home');
