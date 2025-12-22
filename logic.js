class UpgradeOptimizer {
    constructor(totalRunes) {
        this.limit = totalRunes * 0.9;
        this.stages = [];
        this.init();
    }

    init() {
        for (let n = 2; n <= 100; n++) {
            let baseP = (101 - n) / 100;
            let options = [];
            // 0枚（使わない）は常に選択肢にある
            options.push({ runes: 0, material: 1 / baseP, runeCost: 0, prob: baseP, stageNum: n, baseP: baseP });

            for (let k = 1; k <= 10; k++) {
                let nextP = Math.min(1.0, baseP + (k * 0.1));
                if (k > 0 && baseP + (k - 1) * 0.1 >= 0.9) nextP = 1.0;
                
                // 【重要】強化後確率が91%未満になるような中途半端な使い方は無視する
                if (nextP < 0.91) continue;

                options.push({
                    runes: k,
                    material: 1 / nextP,
                    runeCost: k / nextP,
                    prob: nextP,
                    stageNum: n,
                    baseP: baseP
                });
                if (nextP === 1.0) break;
            }
            this.stages.push(options);
        }
    }

    calculate() {
        let currentPlanIdx = new Array(this.stages.length).fill(0);
        let currentTotalRuneCost = 0;

        while (true) {
            let bestStep = null;

            for (let i = 0; i < this.stages.length; i++) {
                let current = this.stages[i][currentPlanIdx[i]];
                
                for (let nextIdx = 1; nextIdx < this.stages[i].length; nextIdx++) {
                    let next = this.stages[i][nextIdx];
                    if (next.runes <= current.runes) continue;

                    let costDiff = next.runeCost - current.runeCost;
                    let savingDiff = current.material - next.material;
                    let efficiency = savingDiff / costDiff;

                    if (currentTotalRuneCost + costDiff <= this.limit) {
                        if (!bestStep || efficiency > bestStep.efficiency) {
                            bestStep = { stageIdx: i, nextIdx: nextIdx, costDiff: costDiff, efficiency: efficiency };
                        }
                    }
                }
            }

            if (!bestStep) break;
            currentTotalRuneCost += bestStep.costDiff;
            currentPlanIdx[bestStep.stageIdx] = bestStep.nextIdx;
        }

        let plan = currentPlanIdx.map((idx, i) => this.stages[i][idx]).filter(p => p.runes > 0);
        let totalMatExp = 1; 
        for (let i = 0; i < this.stages.length; i++) {
            totalMatExp += this.stages[i][currentPlanIdx[i]].material;
        }

        return { plan: plan, totalCost: currentTotalRuneCost, totalMatExp: totalMatExp };
    }
}
