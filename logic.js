class UpgradeOptimizer {
    constructor(totalRunes) {
        this.limit = totalRunes * 0.9;
        this.stages = [];
        this.init();
    }

    init() {
        for (let n = 100; n >= 2; n--) {
            let baseP = (101 - n) / 100;
            this.stages.push({ stageNum: n, baseP: baseP, runes: 0, prob: baseP });
        }
    }

    calculate() {
        let allActions = [];

        for (let s of this.stages) {
            // --- ステップ1: 91%以上にするセット ---
            let r1 = Math.ceil((0.91 - s.baseP) * 10);
            if (r1 < 0) r1 = 0;
            if (r1 > 10) r1 = 10;
            let p1 = Math.min(1.0, s.baseP + (r1 * 0.1));

            if (r1 > 0) {
                let cost1 = r1 / p1;
                let saving1 = (1 / s.baseP) - (1 / p1);
                allActions.push({
                    stageNum: s.stageNum,
                    type: 'SET1',
                    saving: saving1,
                    cost: cost1,
                    targetRune: r1,
                    targetProb: p1
                });
            }

            // --- ステップ2: 100%への引き上げ ---
            if (p1 < 1.0) {
                let cost1 = r1 / p1;
                let cost2 = 10 / 1.0;
                let costDiff = cost2 - cost1;
                let savingDiff = (1 / p1) - 1.0;

                allActions.push({
                    stageNum: s.stageNum,
                    type: 'SET2',
                    saving: savingDiff,
                    cost: costDiff,
                    targetRune: 10,
                    targetProb: 1.0
                });
            }
        }

        // 有理数比較でソート (節約期待値/石板期待値)
        allActions.sort((a, b) => {
            let valA = a.saving * b.cost;
            let valB = b.saving * a.cost;
            if (Math.abs(valA - valB) < 1e-15) return b.stageNum - a.stageNum;
            return valB - valA;
        });

        let currentTotalCost = 0;
        let activePlan = this.stages.map(s => ({...s, currentCost: 0}));

        for (let action of allActions) {
            let stage = activePlan.find(s => s.stageNum === action.stageNum);
            if (action.type === 'SET2' && stage.runes === 0) continue;
            if (action.targetRune <= stage.runes) continue;

            let nextTotalCost = action.targetRune / action.targetProb;
            let addedCost = nextTotalCost - stage.currentCost;

            if (currentTotalCost + addedCost <= this.limit) {
                currentTotalCost += addedCost;
                stage.runes = action.targetRune;
                stage.prob = action.targetProb;
                stage.currentCost = nextTotalCost;
            } else {
                break; // 予算オーバーで即終了
            }
        }

        let plan = activePlan.filter(s => s.runes > 0).sort((a, b) => b.stageNum - a.stageNum);
        let totalMatExp = 1; 
        for (let s of activePlan) {
            totalMatExp += (1 / s.prob);
        }

        return { plan: plan, totalCost: currentTotalCost, totalMatExp: totalMatExp };
    }
}
