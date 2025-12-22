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
            // --- ステップ1: 91%以上に持っていくための「セット」 ---
            // 10%刻みなので、端数なしで91%を超える最小枚数を出す
            // 例: 1%なら9枚(91%)、2%なら8枚(92%)、10%なら9枚(100%)
            let firstRunes = Math.ceil((0.91 - s.baseP) * 10);
            if (firstRunes < 0) firstRunes = 0; // すでに91%以上の場合は0
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
                    cost: firstCost,
                    efficiency: firstSaving / firstCost,
                    costToApply: firstCost
                });
            }

            // --- ステップ2: あと1枚で100%にできる場合の「最後の一押し」 ---
            // STEP_1で100%に届かなかった場合のみ、追加1枚の効率を計算
            if (firstProb < 1.0) {
                let secondRunes = 10; // 最後は必ず10枚(100%)
                let secondProb = 1.0;
                let secondCost = 10 / 1.0;
                
                let costDiff = secondCost - firstCost;
                let savingDiff = (1 / firstProb) - 1.0;

                allActions.push({
                    stageNum: s.stageNum,
                    type: 'STEP_2_FINISH',
                    runes: secondRunes,
                    prob: secondProb,
                    cost: secondCost,
                    efficiency: savingDiff / costDiff,
                    costToApply: costDiff
                });
            }
        }

        // 全アクションを「1枚あたりの素材節約量」で降順ソート
        allActions.sort((a, b) => b.efficiency - a.efficiency);

        let currentTotalRuneCost = 0;

        // リストを上から順に適用。一度でも予算オーバーしたら即終了。
        for (let action of allActions) {
            let stage = this.stages.find(s => s.stageNum === action.stageNum);

            // 依存ルール: セット(STEP1)が終わっていないのに100%化(STEP2)はできない
            if (action.type === 'STEP_2_FINISH' && stage.runes === 0) continue;

            if (currentTotalRuneCost + action.costToApply <= this.limit) {
                currentTotalRuneCost += action.costToApply;
                stage.runes = action.runes;
                stage.prob = action.prob;
                stage.runeCost = action.cost;
                stage.material = 1 / action.prob;
            } else {
                // 予算が足りなくなった時点で、以降の全アクションを破棄して終了
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
