class UpgradeOptimizer {
    constructor(totalRunes) {
        this.limit = totalRunes * 0.9;
        this.stages = [];
        for (let n = 100; n >= 2; n--) {
            let baseP = (101 - n) / 100;
            this.stages.push({ stageNum: n, baseP: baseP, runes: 0, prob: baseP, currentCost: 0 });
        }
    }

    calculate() {
        let actions = [];
        for (let s of this.stages) {
            // セット1: 91%以上にする
            let r1 = Math.ceil((0.91 - s.baseP) * 10);
            if (r1 < 0) r1 = 0; if (r1 > 10) r1 = 10;
            let p1 = Math.min(1.0, s.baseP + (r1 * 0.1));
            if (r1 > 0) {
                actions.push({
                    stageNum: s.stageNum, type: 'SET',
                    saving: (1/s.baseP) - (1/p1), cost: r1/p1,
                    targetRune: r1, targetProb: p1
                });
            }
            // セット2: 100%にする
            if (p1 < 1.0) {
                let cost1 = r1/p1;
                actions.push({
                    stageNum: s.stageNum, type: 'FINISH',
                    saving: (1/p1) - 1.0, cost: 10.0 - cost1,
                    targetRune: 10, targetProb: 1.0
                });
            }
        }

        // 期待値効率でソート
        actions.sort((a, b) => {
            let vA = a.saving * b.cost;
            let vB = b.saving * a.cost;
            if (Math.abs(vA - vB) < 1e-15) return b.stageNum - a.stageNum;
            return vB - vA;
        });

        let totalUsed = 0;
        for (let act of actions) {
            let s = this.stages.find(st => st.stageNum === act.stageNum);
            if (act.type === 'FINISH' && s.runes === 0) continue;
            if (act.targetRune <= s.runes) continue;
            let diff = (act.targetRune / act.targetProb) - s.currentCost;
            if (totalUsed + diff <= this.limit) {
                totalUsed += diff;
                s.runes = act.targetRune;
                s.prob = act.targetProb;
                s.currentCost = act.targetRune / act.targetProb;
            } else { break; }
        }

        return {
            plan: this.stages.filter(s => s.runes > 0).sort((a,b) => b.stageNum - a.stageNum),
            totalCost: totalUsed,
            totalMat: this.stages.reduce((acc, s) => acc + (1/s.prob), 1)
        };
    }
}

// 画面への表示処理
function run() {
    const input = document.getElementById('runeInput').value;
    const opt = new UpgradeOptimizer(Number(input));
    const res = opt.calculate();

    document.getElementById('res-cost').innerText = res.totalCost.toFixed(2);
    document.getElementById('res-mat').innerText = res.totalMat.toFixed(1);

    const tbody = document.getElementById('resultBody');
    tbody.innerHTML = res.plan.map(d => `
        <tr>
            <td class="stage-txt">${d.stageNum}回目</td>
            <td class="rune-val">${d.runes}枚</td>
            <td class="prob-val">${Math.round(d.prob * 100)}%</td>
        </tr>
    `).join('');
}

// ボタンにイベントを登録
document.getElementById('calcBtn').addEventListener('click', run);
// 初回起動
run();
