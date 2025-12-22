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
        // --- 1. 絶対に守りたい「実行順序」のリストを作る ---
        let strategyQueue = [];

        // ステップA: 100回目から順に「91%〜100%」まで持っていく
        for (let s of this.stages) {
            let runes = Math.ceil((0.91 - s.baseP) * 10);
            if (runes < 0) runes = 0;
            if (runes > 10) runes = 10;
            let prob = (runes === 10) ? 1.0 : Math.min(1.0, s.baseP + (runes * 0.1));

            if (runes > 0) {
                strategyQueue.push({
                    stageNum: s.stageNum,
                    type: 'SET_91',
                    targetRune: runes,
                    targetProb: prob,
                    // 効率（ソートが必要になった場合のため一応計算）
                    efficiency: ((1 / s.baseP) - (1 / prob)) / (runes / prob)
                });
            }
        }

        // ステップB: 100回目から順に「残りの1枚を足して100%」にする
        for (let s of this.stages) {
            let currentRunes = Math.ceil((0.91 - s.baseP) * 10);
            if (currentRunes >= 0 && currentRunes < 10) {
                let currentProb = Math.min(1.0, s.baseP + (currentRunes * 0.1));
                let cost91 = currentRunes / currentProb;
                let cost100 = 10 / 1.0;
                
                strategyQueue.push({
                    stageNum: s.stageNum,
                    type: 'FINISH_100',
                    targetRune: 10,
                    targetProb: 1.0,
                    efficiency: ((1 / currentProb) - 1.0) / (cost100 - cost91)
                });
            }
        }

        // --- 2. この順番で石板が尽きるまで適用する ---
        // ※ここではあえて sort() を使わず、作成したキューの順番を最優先します
        // ただし、もし「節約効率」を優先したい場合は strategyQueue.sort() を有効にします
        // 今回は「90回目より80回目が先に来るバグ」を殺すため、このまま進みます。
        
        let currentTotalRuneCost = 0;
        let activePlan = this.stages.map(s => ({...s, currentRunes: 0, currentProb: s.baseP}));

        for (let action of strategyQueue) {
            let stage = activePlan.find(s => s.stageNum === action.stageNum);

            // 既にそのアクション以上の状態ならスキップ（重複防止）
            if (action.targetRune <= stage.currentRunes) continue;

            // このアクションを追加で適用するのに必要な「追加期待値コスト」
            let currentCost = stage.currentRunes === 0 ? 0 : (stage.currentRunes / stage.currentProb);
            let nextCost = action.targetRune / action.targetProb;
            let costDiff = nextCost - currentCost;

            if (currentTotalRuneCost + costDiff <= this.limit) {
                currentTotalRuneCost += costDiff;
                stage.currentRunes = action.targetRune;
                stage.currentProb = action.targetProb;
                stage.material = 1 / stage.currentProb;
            } else {
                // 予算オーバー：ここで即座に終了。余った石板は使わない。
                break;
            }
        }

        // --- 3. 結果の出力準備 ---
        let plan = activePlan.filter(s => s.currentRunes > 0).map(s => ({
            stageNum: s.stageNum,
            baseP: s.baseP,
            runes: s.currentRunes,
            prob: s.currentProb,
            material: s.material
        })).sort((a, b) => b.stageNum - a.stageNum);

        let totalMatExp = 1; // 1回目分
        for (let s of activePlan) {
            totalMatExp += s.material;
        }

        return { plan: plan, totalCost: currentTotalRuneCost, totalMatExp: totalMatExp };
    }
}
