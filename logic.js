class UpgradeOptimizer {
    constructor(totalRunes) {
        this.limit = totalRunes * 0.9;
        this.stages = [];
        this.init();
    }

    init() {
        // 100回目(1%)から2回目(99%)まで、順番に並べる
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

        // 100回目から1つずつ、順番にしか石板を使えない
        for (let stage of this.stages) {
            let baseP = stage.baseP;
            let bestOption = null;

            // その段階で「91%以上」にするための最小枚数から10枚までを検討
            for (let k = 1; k <= 10; k++) {
                let nextP = Math.min(1.0, baseP + (k * 0.1));
                if (k > 0 && baseP + (k - 1) * 0.1 >= 0.9) nextP = 1.0;

                // 91%未満なら無視
                if (nextP < 0.91) continue;

                let runeCost = k / nextP;
                
                // 予算内で、最も素材節約量が大きい（＝枚数が多い）方を選ぶ
                if (currentTotalRuneCost + runeCost <= this.limit) {
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

            if (bestOption) {
                // 採用して次の段階へ
                finalPlan.push(bestOption);
                currentTotalRuneCost += bestOption.runeCost;
                totalMatExp += bestOption.material;
            } else {
                // 予算切れ：この段階以降は石板を使わず「素の確率」で計算
                totalMatExp += (1 / baseP);
                // 以降の全ステージも素の確率で加算
                let remainingStages = this.stages.slice(this.stages.indexOf(stage) + 1);
                for (let rs of remainingStages) {
                    totalMatExp += (1 / rs.baseP);
                }
                break; 
            }
        }

        return { plan: finalPlan, totalCost: currentTotalRuneCost, totalMatExp: totalMatExp };
    }
}
