class UpgradeOptimizer {
    constructor(totalRunes) {
        this.limit = totalRunes * 0.9;
        this.stages = [];
        this.init();
    }

    init() {
        for (let n = 100; n >= 2; n--) {
            let baseP = (101 - n) / 100;
            this.stages.push({ stageNum: n, baseP: baseP, runes: 0, prob: baseP, runeCost: 0, material: 1 / baseP });
        }
    }

    calculate() {
        let allActions = [];

        for (let s of this.stages) {
            // STEP 1: 91%以上に持っていくための最小「セット」
            let firstRunes = Math.ceil((0.91 - s.baseP) * 10);
            if (firstRunes < 0) firstRunes = 0;
            if (firstRunes > 10) firstRunes = 10;

            let firstProb = (firstRunes === 10) ? 1.0 : Math.min(1.0, s.baseP + (firstRunes * 0.1));
            let firstCost = firstRunes / firstProb;
            let firstSaving = (1 / s.baseP) - (1 / firstProb);

            if (firstRunes > 0) {
                allActions.push({
                    stageNum: s.stageNum,
                    type: 'STEP_1_SET',
                    runes: firstRunes,
                    prob: firstProb,
                    efficiency: firstSaving / firstCost,
                    costToApply: firstCost,
                    targetRuneTotal: firstRunes
                });
            }

            // STEP 2: あと1枚で100%にできる場合の「最後の一押し」
            // STEP 1で100%にならなかった場合のみ、追加分のコストと節約量を評価
            if (firstProb < 1.0) {
                let secondProb = 1.0;
                let cost91 = firstRunes / firstProb;
                let cost100 = 10 / 1.0;
                
                let costDiff = cost100 - cost91;
                let savingDiff = (1 / firstProb) - 1.0;

                allActions.push({
                    stageNum: s.stageNum,
                    type: 'STEP_2_FINISH',
                    runes: 10,
                    prob: 1.0,
                    efficiency: savingDiff / costDiff,
                    costToApply: costDiff,
                    targetRuneTotal: 10
                });
            }
        }

        // 重要：全段階の全アクションを「1枚あたりの純粋な節約量」でソート
        allActions.sort((a, b) => b.efficiency - a.efficiency);

        let currentTotalRuneCost = 0;

        for (let action of allActions) {
            let stage = this.stages.find(s => s.stageNum === action.stageNum);

            // 依存関係：セットが終わっていないのに100%化はできない
            if (action.type === 'STEP_2_FINISH' && stage.runes === 0) continue;
            // 既にそのアクション以上の状態ならスキップ
            if (action.targetRuneTotal <= stage.runes) continue;

            if (currentTotalRuneCost + action.costToApply <= this.limit) {
                currentTotalRuneCost += action.costToApply;
                stage.runes = action.targetRuneTotal;
                stage.prob = action.prob;
                stage.material = 1 / action.prob;
            } else {
                // 予算オーバー：以降の全アクションを即座に破棄（hinoko0122ルール）
                break;
            }
        }

        let plan = this.stages.filter(s => s.runes > 0).sort((a, b) => b.stageNum - a.stageNum);
        let totalMatExp = 1; 
        for (let s of this.stages) {
            totalMatExp += (s.runes > 0 ? s.material : (1 / s.baseP));
        }

        return { plan: plan, totalCost: currentTotalRuneCost, totalMatExp: totalMatExp };
    }
}
