class UpgradeOptimizer {
    constructor(totalRunes) {
        this.limit = totalRunes * 0.9;
        this.stages = [];
        this.init();
    }

    init() {
        // 100回目(1%)から2回目(99%)まで、実戦の進行順に並べる
        for (let n = 100; n >= 2; n--) {
            let baseP = (101 - n) / 100;
            this.stages.push({
                stageNum: n,
                baseP: baseP
            });
        }
    }

    calculate() {
        let finalPlan = [];
        let currentTotalRuneCost = 0;
        let totalMatExp = 1; // 1回目(100%成功)の分

        for (let stage of this.stages) {
            let baseP = stage.baseP;
            let bestOption = null;

            // その段階を91%以上にする最小枚数から10枚までを検討
            // 1%刻みの効率を追わず、一気に目標確率(91%+)へ持っていく「セット」で評価
            for (let k = 1; k <= 10; k++) {
                let nextP = Math.min(1.0, baseP + (k * 0.1));
                if (k > 0 && baseP + (k - 1) * 0.1 >= 0.9) nextP = 1.0;

                if (nextP < 0.91) continue;

                let runeCost = k / nextP;
                
                // 予算内で、最も節約量が多い（基本は100%にする10枚）方を選ぶ
                if (currentTotalRuneCost + runeCost <= this.limit) {
                    if (!bestOption || (1/baseP - 1/nextP) > (1/baseP - 1/bestOption.prob)) {
                        bestOption = {
                            runes: k,
                            runeCost: runeCost,
                            prob: nextP,
                            stageNum: stage.stageNum,
                            baseP: baseP,
                            material: 1 / nextP
                        };
                    }
                }
            }

            if (bestOption) {
                finalPlan.push(bestOption);
                currentTotalRuneCost += bestOption.runeCost;
                totalMatExp += bestOption.material;
            } else {
                // 予算が足りない段階に来たら、それ以降は一切石板を使わない
                // 未処理のこの段階も含め、残りの全ステージを「素の確率」で加算
                let startIdx = this.stages.findIndex(s => s.stageNum === stage.stageNum);
                for (let i = startIdx; i < this.stages.length; i++) {
                    totalMatExp += (1 / this.stages[i].baseP);
                }
                break; // 進行停止
            }
        }

        return { plan: finalPlan, totalCost: currentTotalRuneCost, totalMatExp: totalMatExp };
    }
}
