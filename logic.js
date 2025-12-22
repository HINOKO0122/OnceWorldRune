class UpgradeOptimizer {
    constructor(totalRunes) {
        this.limit = totalRunes * 0.9;
        this.stages = [];
        this.init();
    }

    init() {
        for (let n = 100; n >= 2; n--) {
            let baseP = (101 - n) / 100;
            this.stages.push({ stageNum: n, baseP: baseP, runes: 0, prob: baseP, runeCost: 0 });
        }
    }

    calculate() {
        let currentTotalRuneCost = 0;

        // --- 優先順位リスト（アクションのキュー）を作成 ---
        let actionQueue = [];

        // 1. まず各段階を「91%以上」にするアクションを100回目から順に並べる
        for (let s of this.stages) {
            let targetRunes = Math.ceil((0.91 - s.baseP) * 10);
            if (targetRunes > 10) targetRunes = 10;
            let targetP = Math.min(1.0, s.baseP + (targetRunes * 0.1));
            if (targetRunes === 10) targetP = 1.0;

            actionQueue.push({
                stageNum: s.stageNum,
                type: 'FIRST_91',
                runes: targetRunes,
                prob: targetP,
                cost: targetRunes / targetP
            });
        }

        // 2. 次に「すでに91%にした場所を100%にする」アクションを100回目から順に並べる
        for (let s of this.stages) {
            let currentRunes = Math.ceil((0.91 - s.baseP) * 10);
            if (currentRunes >= 10) continue; // すでに100%なら不要

            actionQueue.push({
                stageNum: s.stageNum,
                type: 'FINISH_100',
                runes: 10,
                prob: 1.0,
                cost: 10 / 1.0
            });
        }

        // --- キューを順番に実行（予算が尽きるまで） ---
        let activePlan = {};

        for (let action of actionQueue) {
            let stage = this.stages.find(s => s.stageNum === action.stageNum);
            let costDiff = action.cost - stage.runeCost;

            if (currentTotalRuneCost + costDiff <= this.limit) {
                currentTotalRuneCost += costDiff;
                stage.runes = action.runes;
                stage.runeCost = action.cost;
                stage.prob = action.prob;
                activePlan[stage.stageNum] = stage;
            } else {
                // 予算オーバー：この時点で「一切の石板使用」を中止
                break; 
            }
        }

        // 結果の整形
        let plan = this.stages.filter(s => s.runes > 0);
        let totalMatExp = 1; // 1回目
        for (let s of this.stages) {
            totalMatExp += (1 / s.prob);
        }

        return { plan: plan, totalCost: currentTotalRuneCost, totalMatExp: totalMatExp };
    }
}
