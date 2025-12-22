class UpgradeOptimizer {
    constructor(totalRunes) {
        this.limit = totalRunes * 0.9;
        this.stages = [];
        this.init();
    }

    init() {
        // 100回目から2回目まで準備
        for (let n = 100; n >= 2; n--) {
            let baseP = (101 - n) / 100;
            this.stages.push({
                stageNum: n,
                baseP: baseP,
                runes: 0,
                prob: baseP,
                runeCost: 0,
                material: 1 / baseP
            });
        }
    }

    calculate() {
        let currentTotalRuneCost = 0;
        let actionQueue = [];

        // 【優先順位1】各段階を「91%以上」にする（100回目〜順に）
        for (let s of this.stages) {
            let targetRunes = Math.ceil((0.91 - s.baseP) * 10);
            if (targetRunes > 10) targetRunes = 10;
            let targetP = Math.min(1.0, s.baseP + (targetRunes * 0.1));
            if (targetRunes === 10) targetP = 1.0;

            actionQueue.push({
                stageNum: s.stageNum,
                runes: targetRunes,
                prob: targetP,
                cost: targetRunes / targetP
            });
        }

        // 【優先順位2】91%にした段階を「100%」に引き上げる（100回目〜順に）
        for (let s of this.stages) {
            let firstRunes = Math.ceil((0.91 - s.baseP) * 10);
            if (firstRunes >= 10) continue; // すでに100%なら不要

            actionQueue.push({
                stageNum: s.stageNum,
                runes: 10,
                prob: 1.0,
                cost: 10 / 1.0 // 100%時の期待値コスト
            });
        }

        // 予算が尽きるまでキューを順番に実行
        for (let action of actionQueue) {
            let stage = this.stages.find(s => s.stageNum === action.stageNum);
            let costDiff = action.cost - stage.runeCost;

            if (currentTotalRuneCost + costDiff <= this.limit) {
                currentTotalRuneCost += costDiff;
                stage.runes = action.runes;
                stage.runeCost = action.cost;
                stage.prob = action.prob;
                stage.material = 1 / action.prob;
            } else {
                // 予算が足りなくなったら、その後の「端数による無理やりな強化」は一切行わない
                break; 
            }
        }

        let plan = this.stages.filter(s => s.runes > 0);
        let totalMatExp = 1; // 1回目
        for (let s of this.stages) {
            totalMatExp += (s.runes > 0 ? s.material : (1 / s.baseP));
        }

        return { plan: plan, totalCost: currentTotalRuneCost, totalMatExp: totalMatExp };
    }
}
