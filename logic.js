class UpgradeOptimizer {
    constructor(totalRunes) {
        this.totalRunes = totalRunes;
        this.limit = totalRunes * 0.9;
        this.stages = [];
        this.init();
    }

    init() {
        for (let n = 2; n <= 100; n++) {
            let baseP = (101 - n) / 100;
            let stageOptions = [];
            for (let k = 0; k <= 10; k++) {
                let nextP = Math.min(1.0, baseP + (k * 0.1));
                if (k > 0 && baseP + (k - 1) * 0.1 >= 0.9) nextP = 1.0;

                stageOptions.push({
                    runes: k,
                    material: 1 / nextP,
                    runeCost: k === 0 ? 0 : k / nextP,
                    prob: nextP,
                    stageNum: n,
                    baseP: baseP
                });
                if (nextP === 1.0) break;
            }
            this.stages.push(stageOptions);
        }
    }

    calculate() {
        let currentPlanIdx = new Array(this.stages.length).fill(0);
        let currentTotalRuneCost = 0;

        while (true) {
            let bestUpgrade = null;

            for (let i = 0; i < this.stages.length; i++) {
                let current = this.stages[i][currentPlanIdx[i]];
                
                for (let nextIdx = currentPlanIdx[i] + 1; nextIdx < this.stages[i].length; nextIdx++) {
                    let next = this.stages[i][nextIdx];
                    let costDiff = next.runeCost - current.runeCost;
                    let savingDiff = current.material - next.material;
                    let efficiency = savingDiff / costDiff;

                    if (currentTotalRuneCost + costDiff <= this.limit) {
                        if (!bestUpgrade || efficiency > bestUpgrade.efficiency) {
                            bestUpgrade = { stageIdx: i, nextIdx: nextIdx, costDiff: costDiff, efficiency: efficiency };
                        }
                    }
                }
            }

            if (!bestUpgrade) break;
            currentTotalRuneCost += bestUpgrade.costDiff;
            currentPlanIdx[bestUpgrade.stageIdx] = bestUpgrade.nextIdx;
        }

        let finalPlan = currentPlanIdx.map((idx, i) => this.stages[i][idx]).filter(p => p.runes > 0);
        let totalMatExp = 0;
        // 石板を使わない段階も含めて、全100段階の使用素材期待値を合算
        for (let i = 0; i < this.stages.length; i++) {
            totalMatExp += this.stages[i][currentPlanIdx[i]].material;
        }
        // 1回目の100%成功分(1個)を追加
        totalMatExp += 1;

        return { plan: finalPlan, totalCost: currentTotalRuneCost, totalMatExp: totalMatExp };
    }
}
