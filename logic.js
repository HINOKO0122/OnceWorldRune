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
            let pPercent = Math.round(s.baseP * 100);
            let n = Math.floor(pPercent / 10);
            
            // --- セット1: (9-n)枚投入して「あと1枚で100%」の状態を作る ---
            let rSet1 = 9 - n;
            if (rSet1 < 0) rSet1 = 0;
            
            let pSet1 = s.baseP + (rSet1 * 0.1);
            let costSet1 = rSet1 / pSet1;
            let savingSet1 = (1 / s.baseP) - (1 / pSet1);

            if (rSet1 > 0) {
                allActions.push({
                    stageNum: s.stageNum,
                    type: 'SET1',
                    saving: savingSet1,
                    cost: costSet1,
                    targetRune: rSet1,
                    targetProb: pSet1
                });
            }

            // --- セット2: 最後1枚を足して100%にする ---
            let cost100 = 10 / 1.0;
            let costDiff = cost100 - costSet1;
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

        // 有理数比較による厳密ソート (Saving / Cost)
        allActions.sort((a, b) => {
            let valA = a.saving * b.cost;
            let valB = b.saving * a.cost;
            if (Math.abs(valA - valB) < 1e-14) {
                return b.stageNum - a.stageNum; // 効率が同じなら低確率側優先
            }
            return valB - valA;
        });

        let currentTotalCost = 0;
        let activePlan = this.stages.map(s => ({...s}));

        for (let action of allActions) {
            let stage = activePlan.find(s => s.stageNum === action.stageNum);

            // 依存関係: SET1を通らずにSET2はできない
            if (action.type === 'SET2' && stage.runes === 0 && (9 - Math.floor(Math.round(stage.baseP * 100) / 10)) > 0) {
                continue; 
            }
            if (action.targetRune <= stage.runes) continue;

            if (currentTotalCost + action.cost <= this.limit) {
                currentTotalCost += action.cost;
                stage.runes = action.targetRune;
                stage.prob = action.targetProb;
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
