class UpgradeOptimizer {
    constructor(totalRunes) {
        this.limit = totalRunes * 0.9;
        this.stages = [];
        this.init();
    }

    init() {
        for (let n = 100; n >= 2; n--) {
            let baseP = (101 - n) / 100;
            this.stages.push({ stageNum: n, baseP: baseP, currentRunes: 0, currentProb: baseP });
        }
    }

    calculate() {
        let executionQueue = [];

        // --- 手順1: 全員を「あと1枚で100%」の状態まで上げる ---
        // ※ここでは絶対に100%にはせず、最高でも「91%〜99.9%」で止める
        for (let s of this.stages) {
            let runesTo9x = Math.ceil((0.91 - s.baseP) * 10);
            if (runesTo9x < 0) runesTo9x = 0;
            
            // 重要：もしその枚数で100%に届いてしまうなら、あえて1枚減らす
            if (s.baseP + (runesTo9x * 0.1) >= 0.999) {
                runesTo9x = Math.max(0, runesTo9x - 1);
            }

            let prob = s.baseP + (runesTo9x * 0.1);

            if (runesTo9x > 0) {
                executionQueue.push({
                    stageNum: s.stageNum,
                    targetRune: runesTo91, // 実際は100%未満の枚数
                    targetProb: prob
                });
            }
        }

        // --- 手順2: 100回目から順に「10枚投入して100%」にする ---
        // ここで初めて100%のアクションを解禁する
        for (let s of this.stages) {
            executionQueue.push({
                stageNum: s.stageNum,
                targetRune: 10,
                targetProb: 1.0
            });
        }

        let currentTotalRuneCost = 0;

        for (let action of executionQueue) {
            let stage = this.stages.find(s => s.stageNum === action.stageNum);

            if (action.targetRune <= stage.currentRunes) continue;

            let currentCost = stage.currentRunes === 0 ? 0 : (stage.currentRunes / stage.currentProb);
            let nextCost = action.targetRune / action.targetProb;
            let costDiff = nextCost - currentCost;

            if (currentTotalRuneCost + costDiff <= this.limit) {
                currentTotalRuneCost += costDiff;
                stage.currentRunes = action.targetRune;
                stage.currentProb = action.targetProb;
            } else {
                // 予算オーバーなら即終了
                break;
            }
        }

        let plan = this.stages.filter(s => s.currentRunes > 0).sort((a, b) => b.stageNum - a.stageNum);
        let totalMatExp = 1; 
        for (let s of this.stages) {
            totalMatExp += (1 / s.currentProb);
        }

        return { plan: plan, totalCost: currentTotalRuneCost, totalMatExp: totalMatExp };
    }
}
