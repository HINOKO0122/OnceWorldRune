class UpgradeOptimizer {
    constructor(totalRunes) {
        this.limit = totalRunes * 0.9;
        this.stages = [];
        this.init();
    }

    init() {
        for (let n = 100; n >= 2; n--) {
            let baseP = (101 - n) / 100;
            this.stages.push({ stageNum: n, baseP: baseP });
        }
    }

    calculate() {
        let currentPlan = this.stages.map(s => ({
            runes: 0, runeCost: 0, prob: s.baseP, stageNum: s.stageNum, baseP: s.baseP, material: 1 / s.baseP
        }));

        let totalRuneCost = 0;

        while (true) {
            let bestAction = null;

            for (let i = 0; i < currentPlan.length; i++) {
                let current = currentPlan[i];
                if (current.runes >= 10) continue;

                // 順番ルール: 前の段階が91%以上になっていないなら、この段階は検討しない
                if (i > 0 && currentPlan[i-1].prob < 0.91) break;

                // 選択肢1: まだ使っていないなら、91%まで一気に投入（セット）
                // 選択肢2: 既に91%以上なら、1枚ずつ追加して100%を目指す
                let nextRunes = (current.runes === 0) ? Math.ceil((0.91 - current.baseP) * 10) : current.runes + 1;
                if (nextRunes > 10) nextRunes = 10;

                let nextP = (nextRunes === 10) ? 1.0 : Math.min(1.0, current.baseP + (nextRunes * 0.1));
                let costForNext = nextRunes / nextP;
                let costDiff = costForNext - current.runeCost;
                let savingDiff = current.material - (1 / nextP);
                let efficiency = savingDiff / costDiff;

                if (totalRuneCost + costDiff <= this.limit) {
                    if (!bestAction || efficiency > bestAction.efficiency) {
                        bestAction = { idx: i, runes: nextRunes, cost: costForNext, prob: nextP, efficiency: efficiency, costDiff: costDiff };
                    }
                }
            }

            if (!bestAction) break;

            totalRuneCost += bestAction.costDiff;
            currentPlan[bestAction.idx].runes = bestAction.runes;
            currentPlan[bestAction.idx].runeCost = bestAction.cost;
            currentPlan[bestAction.idx].prob = bestAction.prob;
            currentPlan[bestAction.idx].material = 1 / bestAction.prob;
        }

        let plan = currentPlan.filter(p => p.runes > 0);
        let totalMatExp = 1; 
        for (let i = 0; i < currentPlan.length; i++) {
            totalMatExp += (currentPlan[i].runes > 0 ? currentPlan[i].material : (1 / currentPlan[i].baseP));
        }

        return { plan: plan, totalCost: totalRuneCost, totalMatExp: totalMatExp };
    }
}
