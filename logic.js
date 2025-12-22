class UpgradeOptimizer {
    constructor(totalRunes) {
        this.limit = totalRunes * 0.9;
        this.stages = [];
        this.init();
    }

    init() {
        for (let n = 100; n >= 2; n--) {
            let baseP = (101 - n) / 100;
            this.stages.push({
                stageNum: n,
                baseP: baseP,
                runes: 0,
                prob: baseP,
                runeCost: 0
            });
        }
    }

    calculate() {
        let currentTotalRuneCost = 0;
        let actionQueue = [];

        // 手順1: 各段階を「91%〜100%（セット）」にするアクションを100回目から順に並べる
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

        // 手順2: 既に91%以上にした場所を「100%」にするアクションを100回目から順に並べる
        for (let s of this.stages) {
            let initialTargetRunes = Math.ceil((0.91 - s.baseP) * 10);
            if (initialTargetRunes >= 10) continue; // 最初から100%なら不要

            actionQueue.push({
                stageNum: s.stageNum,
                runes: 10,
                prob: 1.0,
                cost: 10 / 1.0
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
            } else {
                // 予算が足りなくなった瞬間にストップ
                break; 
            }
        }

        let plan = this.stages.filter(s => s.runes > 0);
        let totalMatExp = 1; 
        for (let s of this.stages) {
            totalMatExp += (1 / s.prob);
        }

        return { plan: plan, totalCost: currentTotalRuneCost, totalMatExp: totalMatExp };
    }
}
