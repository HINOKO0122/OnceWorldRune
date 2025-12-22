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
            // STEP 1: 91%以上にするための「最小セット」
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
                    costToApply: firstCost,
                    targetRune: firstRunes,
                    targetProb: firstProb
                });
            }

            // STEP 2: 100%への「追加投資」
            // STEP 1で100%に届かなかった場合のみ計算
            if (firstProb < 1.0) {
                let secondProb = 1.0;
                let secondCost = 10 / 1.0;
                let costDiff = secondCost - firstCost;
                let savingDiff = (1 / firstProb) - 1.0;

                allActions.push({
                    stageNum: s.stageNum,
                    type: 'FINISH',
                    efficiency: savingDiff / costDiff,
                    costToApply: costDiff,
                    targetRune: 10,
                    targetProb: 1.0
                });
            }
        }

        // 全アクションを「効率（節約量/石板期待値）」で降順ソート
        // 数値が同じなら stageNum が大きい（確率が低い）方を優先
        allActions.sort((a, b) => {
            if (Math.abs(b.efficiency - a.efficiency) < 1e-9) {
                return b.stageNum - a.stageNum;
            }
            return b.efficiency - a.efficiency;
        });

        let currentTotalRuneCost = 0;
        let activePlan = this.stages.map(s => ({...s, currentRunes: 0, currentProb: s.baseP, currentCost: 0}));

        for (let action of allActions) {
            let stage = activePlan.find(s => s.stageNum === action.stageNum);

            // 依存関係：SETがまだなのにFINISHはできない
            if (action.type === 'FINISH' && stage.currentRunes === 0) continue;
            // すでにそれ以上の枚数が割り当て済みならスキップ
            if (action.targetRune <= stage.currentRunes) continue;

            if (currentTotalRuneCost + action.costToApply <= this.limit) {
                currentTotalRuneCost += action.costToApply;
                stage.currentRunes = action.targetRune;
                stage.currentProb = action.targetProb;
                stage.material = 1 / stage.currentProb;
            } else {
                // 予算オーバー：以降の全アクションを即終了（hinoko0122ルール）
                break;
            }
        }

        let plan = activePlan.filter(s => s.currentRunes > 0).map(s => ({
            stageNum: s.stageNum,
            baseP: s.baseP,
            runes: s.currentRunes,
            prob: s.currentProb,
            material: s.material
        })).sort((a, b) => b.stageNum - a.stageNum);

        let totalMatExp = 1; 
        for (let s of activePlan) {
            totalMatExp += s.material;
        }

        return { plan: plan, totalCost: currentTotalRuneCost, totalMatExp: totalMatExp };
    }
}
