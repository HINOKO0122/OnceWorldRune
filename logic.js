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
            if (p1 < 1.0) {
                let cost1 = r1/p1;
                actions.push({
                    stageNum: s.stageNum, type: 'FINISH',
                    saving: (1/p1) - 1.0, cost: 10.0 - cost1,
                    targetRune: 10, targetProb: 1.0
                });
            }
        }

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

function run() {
    const input = document.getElementById('runeInput').value;
    const opt = new UpgradeOptimizer(Number(input));
    const res = opt.calculate();

    document.getElementById('res-cost').innerText = res.totalCost.toFixed(1);
    document.getElementById('res-mat').innerText = res.totalMat.toFixed(1);

    const tbody = document.getElementById('resultBody');
    
    // --- 【改良】枚数が同じ区間をまとめるロジック ---
    let grouped = [];
    if (res.plan.length > 0) {
        let current = {
            start: res.plan[0].stageNum, 
            end: res.plan[0].stageNum,
            runes: res.plan[0].runes, 
            minProb: res.plan[0].prob,
            maxProb: res.plan[0].prob
        };

        for (let i = 1; i < res.plan.length; i++) {
            let item = res.plan[i];
            // 「投入枚数」が同じならグループ
            if (item.runes === current.runes) {
                current.end = item.stageNum;
                current.minProb = Math.min(current.minProb, item.prob);
                current.maxProb = Math.max(current.maxProb, item.prob);
            } else {
                grouped.push(current);
                current = { start: item.stageNum, end: item.stageNum, runes: item.runes, minProb: item.prob, maxProb: item.prob };
            }
        }
        grouped.push(current);
    }

    tbody.innerHTML = grouped.map(g => {
        const range = (g.start === g.end) ? `${g.start}回目` : `${g.start}〜${g.end}`;
        
        // 確率の表示（最小と最大が同じなら1つだけ、違うなら範囲表示）
        const pMin = Math.round(g.minProb * 100);
        const pMax = Math.round(g.maxProb * 100);
        const probDisplay = (pMin === pMax) ? `${pMin}%` : `${pMin}〜${pMax}%`;

        return `
            <tr>
                <td class="stage-txt">${range}</td>
                <td class="rune-val">${g.runes}枚</td>
                <td class="prob-val">${probDisplay}</td>
            </tr>
        `;
    }).join('');
}

document.getElementById('calcBtn').addEventListener('click', run);
run();
