// ==UserScript==
// @name         Bing拼图解题
// @namespace    http://tampermonkey.net/
// @version      1.1
// @description  Bing拼图解决方案
// @author       1nTooDeep
// @match        https://www.bing.com/spotlight/imagepuzzle*
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    // 添加悬浮框样式
    const style = `
        #puzzle-solver {
            position: fixed;
            top: 20px;
            right: 20px;
            background: rgba(255, 255, 255, 0.95);
            padding: 20px;
            border: 1px solid #ccc;
            border-radius: 8px;
            box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
            z-index: 10000;
            width: 350px;
        }
        #puzzle-solver.minimized {
            width: 200px;
            height: 40px;
            overflow: hidden;
            padding: 10px;
        }
        #puzzle-solver input {
            width: calc(100% - 12px);
            margin-bottom: 10px;
            padding: 5px;
        }
        #puzzle-solver button {
            padding: 8px 12px;
            border: none;
            background: #007bff;
            color: white;
            border-radius: 4px;
            cursor: pointer;
            margin-right: 10px;
        }
        #puzzle-solver button:hover {
            background: #0056b3;
        }
        #solution {
            margin-top: 10px;
        }
        #puzzle-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 10px;
        }
        #puzzle-header h4 {
            margin: 0;
            font-size: 16px;
        }
        #puzzle-header .control-btn {
            font-size: 14px;
            padding: 5px;
            margin-left: 5px;
            border: none;
            background: #ccc;
            color: black;
            border-radius: 4px;
            cursor: pointer;
        }
        #puzzle-header .control-btn:hover {
            background: #999;
        }
    `;

    // 添加样式到页面
    const styleEl = document.createElement('style');
    styleEl.textContent = style;
    document.head.appendChild(styleEl);

    // 创建悬浮框
    const container = document.createElement('div');
    container.id = 'puzzle-solver';
    container.innerHTML = `
        <div id="puzzle-header">
            <h4>8-Puzzle Solver</h4>
            <div>
                <button class="control-btn" id="minimize-btn">_</button>
            </div>
        </div>
        <div id="puzzle-body">
            <label>请输入拼图（用空格分隔，包含 0-8）：</label><br>
            <input type="text" id="puzzle-input" placeholder="如：8 1 4 2 6 0 5 3 7" /><br>
            <button id="solve-btn">解谜</button>
            <div id="solution"></div>
        </div>
    `;
    document.body.appendChild(container);

    // A* 解谜逻辑
    class Puzzle {
        constructor(array, depth = 0, parent = null, move = null) {
            if (array.length === 9) {
                this.puzzle = [array.slice(0, 3), array.slice(3, 6), array.slice(6, 9)];
            } else {
                this.puzzle = array;
            }
            this.depth = depth;
            this.parent = parent;
            this.move = move;
            this.blank_pos = this.findZero();
        }

        findZero() {
            for (let i = 0; i < 3; i++) {
                for (let j = 0; j < 3; j++) {
                    if (this.puzzle[i][j] === 0) return [i, j];
                }
            }
        }

        isGoal() {
            const GOAL = [[1, 2, 3], [4, 5, 6], [7, 8, 0]];
            return JSON.stringify(this.puzzle) === JSON.stringify(GOAL);
        }

        getNext() {
            const moves = ['Up', 'Down', 'Left', 'Right'];
            return moves
                .map(move => this[`move${move}`]())
                .filter(puzzle => puzzle !== null);
        }

        moveUp() {
            const [x, y] = this.blank_pos;
            if (x === 0) return null;
            const copy = this.puzzle.map(row => row.slice());
            [copy[x][y], copy[x - 1][y]] = [copy[x - 1][y], copy[x][y]];
            return new Puzzle(copy, this.depth + 1, this, 'Up');
        }

        moveDown() {
            const [x, y] = this.blank_pos;
            if (x === 2) return null;
            const copy = this.puzzle.map(row => row.slice());
            [copy[x][y], copy[x + 1][y]] = [copy[x + 1][y], copy[x][y]];
            return new Puzzle(copy, this.depth + 1, this, 'Down');
        }

        moveLeft() {
            const [x, y] = this.blank_pos;
            if (y === 0) return null;
            const copy = this.puzzle.map(row => row.slice());
            [copy[x][y], copy[x][y - 1]] = [copy[x][y - 1], copy[x][y]];
            return new Puzzle(copy, this.depth + 1, this, 'Left');
        }

        moveRight() {
            const [x, y] = this.blank_pos;
            if (y === 2) return null;
            const copy = this.puzzle.map(row => row.slice());
            [copy[x][y], copy[x][y + 1]] = [copy[x][y + 1], copy[x][y]];
            return new Puzzle(copy, this.depth + 1, this, 'Right');
        }

        calculateManhattan() {
            let distance = 0;
            for (let i = 0; i < 3; i++) {
                for (let j = 0; j < 3; j++) {
                    const value = this.puzzle[i][j];
                    if (value === 0) continue;
                    const targetX = Math.floor((value - 1) / 3);
                    const targetY = (value - 1) % 3;
                    distance += Math.abs(i - targetX) + Math.abs(j - targetY);
                }
            }
            return distance;
        }

        fCost() {
            return this.depth + this.calculateManhattan();
        }
    }

    function solvePuzzle(initialPuzzle) {
        const openList = [];
        const closedSet = new Set();
        heapqPush(openList, [initialPuzzle.fCost(), initialPuzzle]);

        while (openList.length > 0) {
            const [_, current] = heapqPop(openList);

            if (current.isGoal()) {
                const path = [];
                let node = current;
                while (node.parent) {
                    path.unshift(node.move);
                    node = node.parent;
                }
                return path;
            }

            closedSet.add(JSON.stringify(current.puzzle));

            for (const next of current.getNext()) {
                if (!closedSet.has(JSON.stringify(next.puzzle))) {
                    heapqPush(openList, [next.fCost(), next]);
                }
            }
        }
        return [];
    }

    // 小顶堆操作
    function heapqPush(heap, item) {
        heap.push(item);
        heap.sort((a, b) => a[0] - b[0]);
    }

    function heapqPop(heap) {
        return heap.shift();
    }

    // 按钮事件绑定
    document.getElementById('solve-btn').addEventListener('click', () => {
        const input = document.getElementById('puzzle-input').value.trim();
        const numbers = input.split(' ').map(Number);
        if (numbers.length !== 9 || new Set(numbers).size !== 9) {
            alert('输入格式不正确，请输入包含 0-8 的数字，并用空格分隔');
            return;
        }

        const initialPuzzle = new Puzzle(numbers);
        const solution = solvePuzzle(initialPuzzle);

        const solutionDiv = document.getElementById('solution');
        solutionDiv.innerHTML = solution.length
            ? `解法步骤：${solution.join(' -> ')}`
            : '无解';
    });

    document.getElementById('minimize-btn').addEventListener('click', () => {
        const container = document.getElementById('puzzle-solver');
    container.classList.toggle('minimized');
    });
})();
