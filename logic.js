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
            // アクション1: 91%セットにする投資
            let r91 = Math.ceil((0.91 - s.baseP) * 10);
            if (r91 < 0) r91 = 0;
            if (r91 > 10) r91 = 10;
            let p91 = (r91 === 10) ? 1.0 : Math.min(1.0, s.baseP + (r91 * 0.1));

            if (r91 > 0) {
                let cost91 = r91 / p91;
                let saving91 = (1 / s.baseP) - (1 / p91);
                allActions.push({
                    stageNum: s.stageNum,
                    type: 'SET',
                    saving: saving91,
                    cost: cost91,
                    targetRune: r91,
                    targetProb: p91
                });
            }

            // アクション2: 100%化への追加投資 (セットで100%にならない場合)
            if (p91 < 1.0) {
                let cost100 = 10 / 1.0;
                let costDiff = cost100 - (r91 / p91);
                let savingDiff = (1 / p91) - 1.0;
                allActions.push({
                    stageNum: s.stageNum,
                    type: 'FINISH',
                    saving: savingDiff,
                    cost: costDiff,
                    targetRune: 10,
                    targetProb: 1.0
                });
            }
        }

        // 有理数的な比較によるソート (Saving/Cost の比較)
        allActions.sort((a, b) => {
            // a.saving/a.cost vs b.saving/b.cost  =>  a.saving * b.cost vs b.saving * a.cost
            let valA = a.saving * b.cost;
            let valB = b.saving * a.cost;
            if (Math.abs(valA - valB) < 1e-12) {
                return b.stageNum - a.stageNum; // 効率が同じなら低確率側を優先
            }
            return valB - valA;
        });

        let currentTotalCost = 0;
        let activePlan = this.stages.map(s => ({...s}));

        for (let action of allActions) {
            let stage = activePlan.find(s => s.stageNum === action.stageNum);

            // 依存ルール: セットなしでFINISHは不可
            if (action.type === 'FINISH' && stage.runes === 0) continue;
            if (action.targetRune <= stage.runes) continue;

            if (currentTotalCost + action.cost <= this.limit) {
                currentTotalCost += action.cost;
                stage.runes = action.targetRune;
                stage.prob = action.targetProb;
            } else {
                // 予算オーバーなら即終了。後ろの端数は拾わない。
                break;
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
