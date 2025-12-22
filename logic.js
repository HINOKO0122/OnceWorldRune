class UpgradeOptimizer {
    constructor(totalRunes) {
        this.limit = totalRunes * 0.9;
        this.stages = [];
        this.init();
    }

    init() {
        // 2回目(99%)から100回目(1%)まで
        for (let n = 2; n <= 100; n++) {
            let baseP = (101 - n) / 100;
            let options = [];
            // 0枚から10枚までの全パターンを事前に生成
            for (let k = 0; k <= 10; k++) {
                let nextP = Math.min(1.0, baseP + (k * 0.1));
                // 91%以上にする投入は100%として扱う
                if (k > 0 && baseP + (k - 1) * 0.1 >= 0.9) nextP = 1.0;
                
                options.push({
                    runes: k,
                    material: 1 / nextP,
                    runeCost: k === 0 ? 0 : k / nextP,
                    prob: nextP,
                    stageNum: n,
                    baseP: baseP
                });
                if (nextP === 1.0) break;
            }
            this.stages.push(options);
        }
    }

    calculate() {
        // 全ステージ最初は0枚投入(index 0)の状態からスタート
        let currentPlanIdx = new Array(this.stages.length).fill(0);
        let currentTotalRuneCost = 0;

        while (true) {
            let bestStep = null;

            // 全ステージ、全「次の選択肢」を総当たりで比較
            for (let i = 0; i < this.stages.length; i++) {
                let current = this.stages[i][currentPlanIdx[i]];
                
                for (let nextIdx = currentPlanIdx[i] + 1; nextIdx < this.stages[i].length; nextIdx++) {
                    let next = this.stages[i][nextIdx];
                    let costDiff = next.runeCost - current.runeCost;
                    let savingDiff = current.material - next.material;
                    let efficiency = savingDiff / costDiff; // 石板1枚(期待値)あたりの素材節約量

                    if (currentTotalRuneCost + costDiff <= this.limit) {
                        if (!bestStep || efficiency > bestStep.efficiency) {
                            bestStep = { stageIdx: i, nextIdx: nextIdx, costDiff: costDiff, efficiency: efficiency };
                        }
                    }
                }
            }

            // 改善できる余地がなくなったら終了
            if (!bestStep) break;

            currentTotalRuneCost += bestStep.costDiff;
            currentPlanIdx[bestStep.stageIdx] = bestStep.nextIdx;
        }

        let plan = currentPlanIdx.map((idx, i) => this.stages[i][idx]).filter(p => p.runes > 0);
        
        // 全100工程（1回目〜100回目）の期待値を合算
        let totalMatExp = 1; // 1回目(100%成功)
        for (let i = 0; i < this.stages.length; i++) {
            totalMatExp += this.stages[i][currentPlanIdx[i]].material;
        }

        return { plan: plan, totalCost: currentTotalRuneCost, totalMatExp: totalMatExp };
    }
}
