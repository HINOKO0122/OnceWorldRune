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
        let executionQueue = [];

        // --- 手順1: 100回目から順に「91%セット」をリストに追加 ---
        for (let s of this.stages) {
            let runesTo91 = Math.ceil((0.91 - s.baseP) * 10);
            if (runesTo91 < 0) runesTo91 = 0;
            if (runesTo91 > 10) runesTo91 = 10;
            let prob91 = (runesTo91 === 10) ? 1.0 : Math.min(1.0, s.baseP + (runesTo91 * 0.1));

            if (runesTo91 > 0) {
                executionQueue.push({
                    stageNum: s.stageNum,
                    type: 'SET_91',
                    targetRune: runesTo91,
                    targetProb: prob91
                });
            }
        }

        // --- 手順2: 100回目から順に「100%への引き上げ」をリストに追加 ---
        for (let s of this.stages) {
            let runesTo91 = Math.ceil((0.91 - s.baseP) * 10);
            // 91%セットの時点で100%に届かなかった場合のみ追加
            if (runesTo91 >= 0 && runesTo91 < 10) {
                executionQueue.push({
                    stageNum: s.stageNum,
                    type: 'FINISH_100',
                    targetRune: 10,
                    targetProb: 1.0
                });
            }
        }

        // --- 実行 ---
        let currentTotalRuneCost = 0;
        let activePlan = this.stages.map(s => ({...s, currentRunes: 0, currentProb: s.baseP}));

        for (let action of executionQueue) {
            let stage = activePlan.find(s => s.stageNum === action.stageNum);

            // 既にその枚数以上ならスキップ
            if (action.targetRune <= stage.currentRunes) continue;

            // 追加で必要な期待値コストを計算
            let currentCost = stage.currentRunes === 0 ? 0 : (stage.currentRunes / stage.currentProb);
            let nextCost = action.targetRune / action.targetProb;
            let costDiff = nextCost - currentCost;

            if (currentTotalRuneCost + costDiff <= this.limit) {
                currentTotalRuneCost += costDiff;
                stage.currentRunes = action.targetRune;
                stage.currentProb = action.targetProb;
                stage.material = 1 / stage.currentProb;
            } else {
                // 予算オーバー：ここで即座に終了。余った予算で後ろのアクションを探さない。
                break;
            }
        }

        // 結果を整形
        let plan = activePlan.filter(s => s.currentRunes > 0).sort((a, b) => b.stageNum - a.stageNum);
        let totalMatExp = 1; 
        for (let s of activePlan) {
            totalMatExp += s.material;
        }

        return { plan: plan, totalCost: currentTotalRuneCost, totalMatExp: totalMatExp };
    }
}
