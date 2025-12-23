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
            // --- セット1: 91%以上にするための「最小」枚数 ---
            // 10%刻みなので、(0.91 - 現在) を 0.1 で割って切り上げ
            let rSet1 = Math.ceil((0.91 - s.baseP) * 10);
            if (rSet1 < 0) rSet1 = 0;
            if (rSet1 > 10) rSet1 = 10;
            
            let pSet1 = (rSet1 === 10) ? 1.0 : Math.min(1.0, s.baseP + (rSet1 * 0.1));
            
            if (rSet1 > 0) {
                let costSet1 = rSet1 / pSet1;
                let savingSet1 = (1 / s.baseP) - (1 / pSet1);
                allActions.push({
                    stageNum: s.stageNum,
                    type: 'SET1',
                    saving: savingSet1,
                    cost: costSet1,
                    targetRune: rSet1,
                    targetProb: pSet1
                });
            }

            // --- セット2: あと1枚で100%になるなら、その「最後の1枚」を追加 ---
            if (pSet1 < 1.0) {
                let cost100 = 10 / 1.0;
                let costDiff = cost100 - (rSet1 / pSet1);
                let savingDiff = (1 / pSet1) - 1.0;
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

        // 有理数比較でソート (Saving/Cost)
        allActions.sort((a, b) => {
            let valA = a.saving * b.cost;
            let valB = b.saving * a.cost;
            if (Math.abs(valA - valB) < 1e-14) return b.stageNum - a.stageNum;
            return valB - valA;
        });

        let currentTotalCost = 0;
        let activePlan = this.stages.map(s => ({...s}));

        for (let action of allActions) {
            let stage = activePlan.find(s => s.stageNum === action.stageNum);
            if (action.type === 'SET2' && stage.runes === 0) continue;
            if (action.targetRune <= stage.runes) continue;

            if (currentTotalCost + action.cost <= this.limit) {
                currentTotalCost += action.cost;
                stage.runes = action.targetRune;
                stage.prob = action.targetProb;
            } else {
                break; // 予算オーバー即終了
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
