class UpgradeOptimizer {
    constructor(totalRunes) {
        this.limit = totalRunes * 0.9;
        this.stages = [];
        this.init();
    }

    init() {
        for (let n = 100; n >= 2; n--) {
            let baseP = (101 - n) / 100;
            this.stages.push({ stageNum: n, baseP: baseP, runes: 0, prob: baseP, material: 1 / baseP });
        }
    }

    calculate() {
        let allActions = [];

        for (let s of this.stages) {
            // STEP 1: 91%以上に持っていくための「セット」
            let firstRunes = Math.ceil((0.91 - s.baseP) * 10);
            if (firstRunes < 0) firstRunes = 0;
            if (firstRunes > 10) firstRunes = 10;

            let firstProb = (firstRunes === 10) ? 1.0 : Math.min(1.0, s.baseP + (firstRunes * 0.1));
            let firstCost = firstRunes / firstProb;
            let firstSaving = (1 / s.baseP) - (1 / firstProb);

            if (firstRunes > 0) {
                allActions.push({
                    stageNum: s.stageNum,
                    type: 'SET',
                    efficiency: firstSaving / firstCost, // 素材節約量 / 石板期待値
                    costToApply: firstCost,
                    targetRune: firstRunes,
                    targetProb: firstProb
                });
            }

            // STEP 2: 100%への引き上げ
            if (firstProb < 1.0) {
                let cost100 = 10 / 1.0;
                let costDiff = cost100 - firstCost; // 追加分の期待値コスト
                let savingDiff = (1 / firstProb) - 1.0; // 追加分の素材節約量

                allActions.push({
                    stageNum: s.stageNum,
                    type: 'FINISH',
                    efficiency: savingDiff / costDiff, // 純粋に「追加投資分」の利回り
                    costToApply: costDiff,
                    targetRune: 10,
                    targetProb: 1.0
                });
            }
        }

        // 全アクションを「その投資単体での効率」で降順ソート
        allActions.sort((a, b) => b.efficiency - a.efficiency);

        let currentTotalRuneCost = 0;
        let activePlan = this.stages.map(s => ({...s, currentCost: 0}));

        for (let action of allActions) {
            let stage = activePlan.find(s => s.stageNum === action.stageNum);

            // 依存関係：SETがまだなのにFINISHはできない
            if (action.type === 'FINISH' && stage.runes === 0) continue;

            if (currentTotalRuneCost + action.costToApply <= this.limit) {
                currentTotalRuneCost += action.costToApply;
                stage.runes = action.targetRune;
                stage.prob = action.targetProb;
                stage.material = 1 / stage.prob;
            } else {
                // 予算オーバー：以降の全リストは適用しない
                break;
            }
        }

        let plan = activePlan.filter(s => s.runes > 0).sort((a, b) => b.stageNum - a.stageNum);
        let totalMatExp = 1; 
        for (let s of activePlan) {
            totalMatExp += s.material;
        }

        return { plan: plan, totalCost: currentTotalRuneCost, totalMatExp: totalMatExp };
    }
}
