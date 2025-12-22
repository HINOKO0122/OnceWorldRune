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
        // 各段階、最初は0枚からスタート
        let currentPlan = this.stages.map(s => ({
            runes: 0,
            runeCost: 0,
            prob: s.baseP,
            stageNum: s.stageNum,
            baseP: s.baseP,
            material: 1 / s.baseP
        }));

        let totalRuneCost = 0;

        // 貪欲法：予算が尽きるまで「今、最も効率の良い1枚追加」を繰り返す
        // ただし、hinoko0122さんのルール通り「91%以上」になるまで一気に投入し、
        // その後は1枚ずつの効率をチェックする
        while (true) {
            let bestUpgrade = null;

            for (let i = 0; i < currentPlan.length; i++) {
                let current = currentPlan[i];
                if (current.runes >= 10) continue;

                // 次の段階（1枚増やす、または未投入なら91%になるまで一気に増やす）
                let nextRunes = current.runes === 0 ? Math.ceil((0.91 - current.baseP) * 10) : current.runes + 1;
                if (nextRunes > 10) nextRunes = 10;

                let nextP = Math.min(1.0, current.baseP + (nextRunes * 0.1));
                // 10枚目は100%
                if (nextRunes === 10) nextP = 1.0; 

                let nextRuneCost = nextRunes / nextP;
                let costDiff = nextRuneCost - current.runeCost;
                let savingDiff = current.material - (1 / nextP);
                let efficiency = savingDiff / costDiff;

                // 順番ルール：前の段階が一定以上（91%以上）になっていないのに次へ行くのを防ぐ
                if (i > 0 && currentPlan[i-1].prob < 0.91) break;

                if (totalRuneCost + costDiff <= this.limit) {
                    if (!bestUpgrade || efficiency > bestUpgrade.efficiency) {
                        bestUpgrade = { idx: i, runes: nextRunes, cost: nextRuneCost, prob: nextP, efficiency: efficiency, costDiff: costDiff };
                    }
                }
            }

            if (!bestUpgrade) break;

            // 採用
            totalRuneCost += bestUpgrade.costDiff;
            currentPlan[bestUpgrade.idx].runes = bestUpgrade.runes;
            currentPlan[bestUpgrade.idx].runeCost = bestUpgrade.cost;
            currentPlan[bestUpgrade.idx].prob = bestUpgrade.prob;
            currentPlan[bestUpgrade.idx].material = 1 / bestUpgrade.prob;
        }

        let plan = currentPlan.filter(p => p.runes > 0);
        let totalMatExp = 1; // 1回目
        for (let i = 0; i < currentPlan.length; i++) {
            totalMatExp += currentPlan[i].material;
        }

        return { plan: plan, totalCost: totalRuneCost, totalMatExp: totalMatExp };
    }
}
