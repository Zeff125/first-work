const ArrayViz = {
    type: '1d', 
    size: 8, rows: 3, cols: 4,
    data: [],
    baseAddress: 0x7ffee000,
    initialized: false,

    init() {
        if (!this.initialized) {
            this.bindEvents();
            this.initialized = true;
        }
        this.declare();
    },

    bindEvents() {
        const typeSelect = document.getElementById('select-array-type');
        const btnDeclare = document.getElementById('btn-array-declare');
        const btnAccess = document.getElementById('btn-array-access');

        typeSelect.addEventListener('change', (e) => {
            this.type = e.target.value;
            document.getElementById('input-group-1d').classList.toggle('hidden', this.type !== '1d');
            document.getElementById('input-group-2d').classList.toggle('hidden', this.type !== '2d');
            document.getElementById('access-group-1d').classList.toggle('hidden', this.type !== '1d');
            document.getElementById('access-group-2d').classList.toggle('hidden', this.type !== '2d');
        });

        btnDeclare.onclick = () => this.declare();
        btnAccess.onclick = () => this.access();
    },

    declare() {
        this.data = [];
        document.getElementById('array-log-content').innerHTML = '';
        
        if (this.type === '1d') {
            this.size = parseInt(document.getElementById('input-1d-size').value) || 8;
            this.data = Array.from({ length: this.size }, () => Math.floor(Math.random() * 100));
            document.getElementById('array-code-text').textContent = `int arr[${this.size}];`;

            this.addLog(`📌 1차원 배열은 메모리에 연속적으로 저장됩니다.`);
        } else {
            this.rows = parseInt(document.getElementById('input-2d-rows').value) || 3;
            this.cols = parseInt(document.getElementById('input-2d-cols').value) || 4;
            this.data = Array.from({ length: this.rows }, () => 
                Array.from({ length: this.cols }, () => Math.floor(Math.random() * 100))
            );
            document.getElementById('array-code-text').textContent = `int arr[${this.rows}][${this.cols}];`;

            this.addLog(`📌 2차원 배열도 실제 메모리에서는 1차원처럼 저장됩니다 (Row-major 방식)`);
        }
        this.render();
    },

    render() {
        const container = document.getElementById('array-display');
        container.innerHTML = '';
        
        if (this.type === '1d') {
            container.style.display = 'flex';
            container.style.gap = '10px';

            this.data.forEach((val, i) => {
                const addr = (this.baseAddress + i * 4).toString(16).toUpperCase();
                container.appendChild(this.createElement(val, i, addr, `arr-${i}`));
            });

        } else {
            container.style.display = 'grid';
            container.style.gridTemplateColumns = `repeat(${this.cols}, auto)`;
            container.style.gap = '15px';

            this.data.forEach((row, r) => {
                row.forEach((val, c) => {
                    const offset = (r * this.cols + c);
                    const addr = (this.baseAddress + offset * 4).toString(16).toUpperCase();

                    container.appendChild(this.createElement(
                        val, `${r}][${c}`, addr, `cell-${r}-${c}`
                    ));
                });
            });
        }
    },

    createElement(val, label, addr, id) {
        const div = document.createElement('div');
        div.className = 'array-element';

        div.innerHTML = `
            <div class="address-label">0x${addr}</div>
            <div class="array-box" id="${id}">${val}</div>
            <div class="index-label">[${label}]</div>
        `;

        // 🔥 hover 시 정보 표시 강화
        div.onmouseenter = () => {
            document.getElementById('array-info').innerHTML =
                `주소: <strong>0x${addr}</strong> | 인덱스: <strong>[${label}]</strong> | 값: <strong>${val}</strong>`;
        };

        return div;
    },

    access() {
        this.clearEffects();

        let targetId = "";
        let logMsg = "";
        let infoMsg = "";
        let path = [];

        if (this.type === '1d') {
            const idx = parseInt(document.getElementById('input-access-idx').value);
            if (isNaN(idx) || idx < 0 || idx >= this.size) {
                this.addLog("❌ Index Out of Bounds!");
                return;
            }

            targetId = `arr-${idx}`;

            for (let i = 0; i <= idx; i++) path.push(`arr-${i}`);

            const addr = (this.baseAddress + idx * 4).toString(16).toUpperCase();

            logMsg = `arr[${idx}] → 주소 계산: base + (${idx} * 4)`;
            infoMsg = `
                <strong>arr[${idx}]</strong><br>
                주소 = base + index × 4<br>
                = 0x${this.baseAddress.toString(16)} + ${idx}×4<br>
                = <strong>0x${addr}</strong>
            `;

        } else {
            const r = parseInt(document.getElementById('input-access-row').value);
            const c = parseInt(document.getElementById('input-access-col').value);

            if (isNaN(r) || isNaN(c) || r < 0 || r >= this.rows || c < 0 || c >= this.cols) {
                this.addLog("❌ Row/Col Out of Bounds!");
                return;
            }

            targetId = `cell-${r}-${c}`;

            const offset = r * this.cols + c;

            for (let i = 0; i <= offset; i++) {
                const rr = Math.floor(i / this.cols);
                const cc = i % this.cols;
                path.push(`cell-${rr}-${cc}`);
            }

            const addr = (this.baseAddress + offset * 4).toString(16).toUpperCase();

            logMsg = `arr[${r}][${c}] → offset = ${r}*${this.cols}+${c} = ${offset}`;

            infoMsg = `
                <strong>arr[${r}][${c}]</strong><br>
                offset = row × cols + col<br>
                = ${r} × ${this.cols} + ${c} = ${offset}<br>
                주소 = base + offset × 4<br>
                = <strong>0x${addr}</strong>
            `;
        }

        // 🔥 접근 경로 애니메이션 느낌
        path.forEach((id, index) => {
            setTimeout(() => {
                const el = document.getElementById(id);
                if (el) el.classList.add('visited');
            }, index * 50);
        });

        setTimeout(() => {
            const el = document.getElementById(targetId);
            if (el) el.classList.add('active');
        }, path.length * 50);

        this.addLog(logMsg);
        document.getElementById('array-info').innerHTML = infoMsg;
    },

    clearEffects() {
        document.querySelectorAll('.array-box').forEach(b => {
            b.classList.remove('active', 'visited');
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

ArrayViz.init();