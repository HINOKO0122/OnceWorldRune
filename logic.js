class UpgradeOptimizer {
    constructor(totalRunes) {
        this.limit = totalRunes * 0.9;
        this.stages = [];
        this.init();
    }

    init() {
        for (let n = 100; n >= 2; n--) {
            let baseP = (101 - n) / 100;
            this.stages.push({ stageNum: n, baseP: baseP, currentRunes: 0, currentProb: baseP, currentCost: 0 });
        }
    }

    calculate() {
        let allActions = [];

        for (let s of this.stages) {
            // --- ステップ1: 91%以上にするセット ---
            let r1 = Math.ceil((0.91 - s.baseP) * 10);
            if (r1 < 0) r1 = 0;
            if (r1 > 10) r1 = 10;
            
            // 確率を1.0でキャップする
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
            // ステップ1で100%に届いていない場合のみ追加
            if (p1 < 1.0) {
                let r2 = 10;
                let p2 = 1.0;
                let cost1 = r1 / p1;
                let cost2 = 10 / 1.0; // 100%の時、期待値コストは10
                
                let costDiff = cost2 - cost1;
                let savingDiff = (1 / p1) - 1.0;

                allActions.push({
                    stageNum: s.stageNum,
                    type: 'SET2',
                    saving: savingDiff,
                    cost: costDiff,
                    targetRune: r2,
                    targetProb: p2
                });
            }
        }

        // 期待値効率 (Saving / Cost) でソート
        // 誤差を考慮し、微小な差は無視してstageNum（低確率側）を優先
        allActions.sort((a, b) => {
            let valA = a.saving * b.cost;
            let valB = b.saving * a.cost;
            if (Math.abs(valA - valB) < 1e-15) return b.stageNum - a.stageNum;
            return valB - valA;
        });

        let totalExpectedRuneCost = 0;

        for (let action of allActions) {
            let stage = this.stages.find(s => s.stageNum === action.stageNum);
            
            // 依存関係：SET1がまだならSET2はできない
            if (action.type === 'SET2' && stage.currentRunes === 0) continue;
            // すでにそれ以上の状態ならスキップ
            if (action.targetRune <= stage.currentRunes) continue;

            // 追加でかかる期待値コスト
            let nextTotalCost = action.targetRune / action.targetProb;
            let addedCost = nextTotalCost - stage.currentCost;

            if (totalExpectedRuneCost + addedCost <= this.limit) {
                totalExpectedRuneCost += addedCost;
                stage.currentRunes = action.targetRune;
                stage.currentProb = action.targetProb;
                stage.currentCost = nextTotalCost;
            } else {
                break; // 予算オーバーで即終了
            }
        }

        let plan = this.stages.filter(s => s.currentRunes > 0).sort((a, b) => b.stageNum - a.stageNum);
        let totalMatExp = 1; 
        for (let s of this.stages) {
            totalMatExp += (1 / s.currentProb);
        }

        return { plan: plan, totalCost: totalExpectedRuneCost, totalMatExp: totalMatExp };
    }
}
