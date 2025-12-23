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
            // --- STEP1: 91%以上にするセット ---
            let r1 = Math.ceil((0.91 - s.baseP) * 10);
            if (r1 < 0) r1 = 0;
            if (r1 > 10) r1 = 10;
            let p1 = (r1 === 10) ? 1.0 : (s.baseP + r1 * 0.1);

            if (r1 > 0) {
                let cost1 = r1 / p1; // この状態にするための期待値コスト
                let saving1 = (1 / s.baseP) - (1 / p1); // 節約される素材期待値
                allActions.push({
                    stageNum: s.stageNum,
                    type: 'SET1',
                    saving: saving1,
                    cost: cost1,
                    targetRune: r1,
                    targetProb: p1
                });
            }

            // --- STEP2: 100%にするための追加投資 ---
            if (p1 < 1.0) {
                let cost1 = r1 / p1;
                let cost2 = 10 / 1.0; // 100%時の期待値コストは10
                let costDiff = cost2 - cost1; // 追加でかかる期待値
                let savingDiff = (1 / p1) - 1.0; // 追加で節約される素材

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

        // 有理数比較による厳密ソート (Saving/Cost)
        // a.saving/a.cost vs b.saving/b.cost => a.saving * b.cost vs b.saving * a.cost
        allActions.sort((a, b) => {
            let valA = a.saving * b.cost;
            let valB = b.saving * a.cost;
            if (Math.abs(valA - valB) < 1e-15) {
                return b.stageNum - a.stageNum; // 効率が同じなら低確率帯優先
            }
            return valB - valA;
        });

        let currentTotalCost = 0;
        let activePlan = this.stages.map(s => ({...s, currentCost: 0}));

        for (let action of allActions) {
            let stage = activePlan.find(s => s.stageNum === action.stageNum);

            // SET1が適用される前にSET2を適用することはできない
            if (action.type === 'SET2' && stage.runes === 0) continue;
            // すでにそれ以上の状態ならスキップ
            if (action.targetRune <= stage.runes) continue;

            // このアクションを適用するための「追加コスト（期待値）」
            let nextTotalCost = action.targetRune / action.targetProb;
            let addedCost = nextTotalCost - stage.currentCost;

            if (currentTotalCost + addedCost <= this.limit) {
                currentTotalCost += addedCost;
                stage.runes = action.targetRune;
                stage.prob = action.targetProb;
                stage.currentCost = nextTotalCost;
            } else {
                // 予算オーバー：以降の全アクションを拒否（即時停止）
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
