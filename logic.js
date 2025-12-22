class UpgradeOptimizer {
    constructor(totalRunes) {
        this.limit = totalRunes * 0.9;
        this.stages = [];
        this.init();
    }

    init() {
        for (let n = 100; n >= 2; n--) {
            let baseP = (101 - n) / 100;
            this.stages.push({ stageNum: n, baseP: baseP });
        }
    }

    calculate() {
        let finalPlan = [];
        let currentTotalRuneCost = 0;
        let totalMatExp = 1; // 1回目(100%)

        for (let stage of this.stages) {
            let baseP = stage.baseP;
            let bestOption = null;

            // 1枚〜10枚まで検討
            for (let k = 1; k <= 10; k++) {
                let nextP = Math.min(1.0, baseP + (k * 0.1));
                
                // 【重要】最後の1枚が「10%分」の仕事を果たしているかチェック
                // nextPが1.0に到達したとき、(1.0 - 前の確率) が 0.1(10%) 未満なら、その枚数は「無理やり」と判定
                let prevP = baseP + ((k - 1) * 0.1);
                if (nextP === 1.0 && (1.0 - prevP) < 0.099) continue; // 0.1未満の端数埋めを禁止

                // 91%未満なら実戦ルールにより無視
                if (nextP < 0.91) continue;

                let runeCost = k / nextP;
                
                if (currentTotalRuneCost + runeCost <= this.limit) {
                    // より節約できる（基本は枚数が多い）方を採用
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
                // 予算切れ、または有効なプランが作れない場合
                let startIdx = this.stages.findIndex(s => s.stageNum === stage.stageNum);
                for (let i = startIdx; i < this.stages.length; i++) {
                    totalMatExp += (1 / this.stages[i].baseP);
                }
                break; 
            }
        }

        return { plan: finalPlan, totalCost: currentTotalRuneCost, totalMatExp: totalMatExp };
    }
}
