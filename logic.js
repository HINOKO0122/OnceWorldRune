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
        let actions = [];

        // 全ての可能な「お得なアクション」をリストアップ
        for (let s of this.stages) {
            // アクションA: 91%セット (一気に投入)
            let runes91 = Math.ceil((0.91 - s.baseP) * 10);
            if (runes91 > 10) runes91 = 10;
            let prob91 = (runes91 === 10) ? 1.0 : Math.min(1.0, s.baseP + (runes91 * 0.1));
            
            let cost91 = runes91 / prob91;
            let saving91 = (1 / s.baseP) - (1 / prob91);
            
            actions.push({
                stageNum: s.stageNum,
                type: 'FIRST_91',
                runes: runes91,
                prob: prob91,
                cost: cost91,
                efficiency: saving91 / cost91
            });

            // アクションB: 100%への引き上げ (すでに91%以上あることが前提のアクション)
            if (runes91 < 10) {
                let cost100 = 10 / 1.0;
                let costDiff = cost100 - cost91;
                let savingDiff = (1 / prob91) - (1.0); // 1/1.0 = 1.0
                
                actions.push({
                    stageNum: s.stageNum,
                    type: 'FINISH_100',
                    runes: 10,
                    prob: 1.0,
                    cost: cost100,
                    efficiency: savingDiff / costDiff // 追加の1枚あたりの効率
                });
            }
        }

        // 全アクションを「効率(石板1枚あたりの節約量)」で降順ソート
        actions.sort((a, b) => b.efficiency - a.efficiency);

        let currentTotalRuneCost = 0;
        let activePlan = {};

        for (let action of actions) {
            let stage = this.stages.find(s => s.stageNum === action.stageNum);
            
            // 順番の制約: その段階の「FIRST_91」が終わっていないのに「FINISH_100」はできない
            if (action.type === 'FINISH_100' && stage.runes === 0) continue;
            
            let costDiff = action.cost - stage.runeCost;

            if (currentTotalRuneCost + costDiff <= this.limit) {
                currentTotalRuneCost += costDiff;
                stage.runes = action.runes;
                stage.runeCost = action.cost;
                stage.prob = action.prob;
                stage.material = 1 / action.prob;
            }
            // 予算オーバーしても、他の（もっとコストが低い）アクションが入る可能性があるので continue
        }

        // 表示用に強化段階順にソート
        let plan = this.stages.filter(s => s.runes > 0).sort((a, b) => b.stageNum - a.stageNum);
        
        let totalMatExp = 1; 
        for (let s of this.stages) {
            totalMatExp += (s.runes > 0 ? s.material : (1 / s.baseP));
        }

        return { plan: plan, totalCost: currentTotalRuneCost, totalMatExp: totalMatExp };
    }
}
