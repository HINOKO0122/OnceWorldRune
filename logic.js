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

        // 全段階の「第一目標(91%)」と「第二目標(100%)」をアクションとしてリストアップ
        for (let s of this.stages) {
            // アクション1: 91%セット
            let runesTo91 = Math.ceil((0.91 - s.baseP) * 10);
            if (runesTo91 > 10) runesTo91 = 10;
            let prob91 = (runesTo91 === 10) ? 1.0 : Math.min(1.0, s.baseP + (runesTo91 * 0.1));
            let cost91 = runesTo91 / prob91;
            let saving91 = (1 / s.baseP) - (1 / prob91);

            allActions.push({
                stageNum: s.stageNum,
                type: 'SET_91',
                runes: runesTo91,
                prob: prob91,
                cost: cost91,
                efficiency: saving91 / cost91
            });

            // アクション2: 100%への引き上げ（91%セットより効率が良い場合がある）
            if (runesTo91 < 10) {
                let cost100 = 10 / 1.0;
                let costDiff = cost100 - cost91;
                let savingDiff = (1 / prob91) - 1.0; 
                allActions.push({
                    stageNum: s.stageNum,
                    type: 'FINISH_100',
                    runes: 10,
                    prob: 1.0,
                    cost: cost100,
                    efficiency: savingDiff / costDiff
                });
            }
        }

        // 全アクションを「1枚あたりの効率」で降順ソート
        allActions.sort((a, b) => b.efficiency - a.efficiency);

        let currentTotalRuneCost = 0;

        for (let action of allActions) {
            let stage = this.stages.find(s => s.stageNum === action.stageNum);
            
            // 順番ルール: 91%セットがまだ選ばれていないのに100%化はできない
            if (action.type === 'FINISH_100' && stage.runes === 0) continue;
            
            let costDiff = action.cost - stage.runeCost;

            if (currentTotalRuneCost + costDiff <= this.limit) {
                currentTotalRuneCost += costDiff;
                stage.runes = action.runes;
                stage.runeCost = action.cost;
                stage.prob = action.prob;
                stage.material = 1 / action.prob;
            }
        }

        // 表示用に強化段階順（100回目〜）にソート
        let plan = this.stages.filter(s => s.runes > 0).sort((a, b) => b.stageNum - a.stageNum);
        
        let totalMatExp = 1; 
        for (let s of this.stages) {
            totalMatExp += (s.runes > 0 ? s.material : (1 / s.baseP));
        }

        return { plan: plan, totalCost: currentTotalRuneCost, totalMatExp: totalMatExp };
    }
}
