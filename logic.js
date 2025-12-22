class UpgradeOptimizer {
    constructor(totalRunes) {
        this.limit = totalRunes * 0.9;
        this.stages = [];
        this.init();
    }

    init() {
        for (let n = 100; n >= 2; n--) {
            let baseP = (101 - n) / 100;
            this.stages.push({ stageNum: n, baseP: baseP, runes: 0, prob: baseP, runeCost: 0, material: 1 / baseP });
        }
    }

    calculate() {
        let allActions = [];

        // 全段階の「第一目標(91%)」と「第二目標(100%)」をアクションとして抽出
        for (let s of this.stages) {
            // アクション1: 91%セットにする
            let runesTo91 = Math.ceil((0.91 - s.baseP) * 10);
            if (runesTo91 > 10) runesTo91 = 10;
            let prob91 = (runesTo91 === 10) ? 1.0 : Math.min(1.0, s.baseP + (runesTo91 * 0.1));
            let cost91 = runesTo91 / prob91;
            let saving91 = (1 / s.baseP) - (1 / prob91);

            allActions.push({
                stageNum: s.stageNum,
                type: 'TARGET_91',
                runes: runesTo91,
                prob: prob91,
                cost: cost91,
                efficiency: saving91 / cost91
            });

            // アクション2: 100%に引き上げる (91%セットが既に選ばれていることが前提)
            if (runesTo91 < 10) {
                let cost100 = 10 / 1.0;
                let costDiff = cost100 - cost91;
                let savingDiff = (1 / prob91) - 1.0; // 1/1.0 = 1.0
                allActions.push({
                    stageNum: s.stageNum,
                    type: 'TARGET_100',
                    runes: 10,
                    prob: 1.0,
                    cost: cost100,
                    efficiency: savingDiff / costDiff
                });
            }
        }

        // 全てのアクションを「1枚あたりの効率」で降順ソート
        allActions.sort((a, b) => b.efficiency - a.efficiency);

        let currentTotalRuneCost = 0;

        for (let action of allActions) {
            let stage = this.stages.find(s => s.stageNum === action.stageNum);
            
            // 順番ルール: 91%セットがまだ選ばれていないのに100%引き上げはできない
            if (action.type === 'TARGET_100' && stage.runes === 0) continue;
            
            let costDiff = action.cost - stage.runeCost;

            if (currentTotalRuneCost + costDiff <= this.limit) {
                currentTotalRuneCost += costDiff;
                stage.runes = action.runes;
                stage.runeCost = action.cost;
                stage.prob = action.prob;
                stage.material = 1 / action.prob;
            }
        }

        let plan = this.stages.filter(s => s.runes > 0).sort((a, b) => b.stageNum - a.stageNum);
        let totalMatExp = 1; 
        for (let s of this.stages) {
            totalMatExp += (s.runes > 0 ? s.material : (1 / s.baseP));
        }

        return { plan: plan, totalCost: currentTotalRuneCost, totalMatExp: totalMatExp };
    }
}
