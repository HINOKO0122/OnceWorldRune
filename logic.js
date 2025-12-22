class UpgradeOptimizer {
    constructor(totalRunes) {
        this.limit = totalRunes * 0.9;
        this.stages = [];
        this.init();
    }

    init() {
        for (let n = 2; n <= 100; n++) {
            let baseP = (101 - n) / 100;
            let stageOptions = [];
            
            // 各段階で0〜10枚使う全パターンを計算
            for (let k = 0; k <= 10; k++) {
                let nextP = Math.min(1.0, baseP + (k * 0.1));
                // 91%以上にするなら100%として扱う
                if (k > 0 && baseP + (k - 1) * 0.1 >= 0.9) nextP = 1.0;

                let expectedMaterial = 1 / nextP;
                let expectedRuneCost = k === 0 ? 0 : k / nextP;
                
                stageOptions.push({
                    runes: k,
                    material: expectedMaterial,
                    runeCost: expectedRuneCost,
                    prob: nextP,
                    saving: (1 / baseP) - expectedMaterial
                });
                if (nextP === 1.0) break;
            }
            this.stages.push(stageOptions);
        }
    }

    // 貪欲法に「入れ替え」を組み合わせた最適化
    calculate() {
        let currentPlan = this.stages.map(options => options[0]); // 最初は全て0枚
        let currentTotalCost = 0;

        // 1枚あたりの節約効率が最も高い「アップグレード」を繰り返し選択
        while (true) {
            let bestUpgrade = null;

            for (let i = 0; i < this.stages.length; i++) {
                let currentOption = currentPlan[i];
                for (let nextOption of this.stages[i]) {
                    if (nextOption.runes <= currentOption.runes) continue;

                    let costDiff = nextOption.runeCost - currentOption.runeCost;
                    let savingDiff = nextOption.saving - currentOption.saving;
                    let efficiency = savingDiff / costDiff;

                    if (currentTotalCost + costDiff <= this.limit) {
                        if (!bestUpgrade || efficiency > bestUpgrade.efficiency) {
                            bestUpgrade = { stageIdx: i, option: nextOption, costDiff: costDiff, efficiency: efficiency };
                        }
                    }
                }
            }

            if (!bestUpgrade) break;
            currentTotalCost += bestUpgrade.costDiff;
            currentPlan[bestUpgrade.stageIdx] = bestUpgrade.option;
        }

        return {
            plan: currentPlan.filter(p => p.runes > 0),
            totalCost: currentTotalCost,
            totalSaving: currentPlan.reduce((sum, p) => sum + p.saving, 0)
        };
    }
}
