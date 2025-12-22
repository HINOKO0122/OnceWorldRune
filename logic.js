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
            // STEP 1: 91%セットにする投資
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
                    efficiency: firstSaving / firstCost,
                    costToApply: firstCost, // この投資に必要な石板期待値
                    targetRune: firstRunes,
                    targetProb: firstProb
                });
            }

            // STEP 2: さらに100%まで引き上げる「追加投資」
            if (firstProb < 1.0) {
                let secondProb = 1.0;
                let secondCost = 10 / 1.0; // 100%時の総期待値は10
                
                let costDiff = secondCost - firstCost; // 91%から100%にするための「追加コスト」
                let savingDiff = (1 / firstProb) - 1.0; // 91%から100%にすることでの「追加節約量」

                allActions.push({
                    stageNum: s.stageNum,
                    type: 'FINISH',
                    efficiency: savingDiff / costDiff, // 純粋な追加投資の効率
                    costToApply: costDiff,
                    targetRune: 10,
                    targetProb: 1.0
                });
            }
        }

        // 全てのアクションを「1石板期待値あたりの素材節約量」で厳密にソート
        allActions.sort((a, b) => b.efficiency - a.efficiency);

        let currentTotalRuneCost = 0;
        let activePlan = this.stages.map(s => ({...s, runes: 0, currentProb: s.baseP, currentCost: 0}));

        for (let action of allActions) {
            let stage = activePlan.find(s => s.stageNum === action.stageNum);

            // 依存関係：SETが未適用の状態でFINISH（追加投資）はできない
            if (action.type === 'FINISH' && stage.runes === 0) continue;
            // すでにそれ以上の状態ならスキップ
            if (action.targetRune <= stage.runes) continue;

            if (currentTotalRuneCost + action.costToApply <= this.limit) {
                currentTotalRuneCost += action.costToApply;
                stage.runes = action.targetRune;
                stage.prob = action.targetProb;
                stage.material = 1 / stage.prob;
            } else {
                // 予算不足：ここで即時終了（hinoko0122ルール）
                break;
            }
        }

        let plan = activePlan.filter(s => s.runes > 0).sort((a, b) => b.stageNum - a.stageNum);
        let totalMatExp = 1; 
        for (let s of activePlan) {
            totalMatExp += (s.runes > 0 ? (1/s.prob) : (1/s.baseP));
        }

        return { plan: plan, totalCost: currentTotalRuneCost, totalMatExp: totalMatExp };
    }
}
