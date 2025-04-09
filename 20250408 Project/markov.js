inlets = 1;
outlets = 1;

function list() {
    var args = arrayfromargs(arguments); // ← ここ重要！

    var nextChords = [];
    var probs = [];

    for (var i = 0; i < args.length; i += 2) {
        var chord = parseInt(args[i]);
        var prob = parseFloat(args[i + 1]);

        if (!isNaN(chord) && !isNaN(prob)) {
            nextChords.push(chord);
            probs.push(prob);
        }
    }

    // ランダムに選択
    var r = Math.random();
    var sum = 0;
    for (var i = 0; i < probs.length; i++) {
        sum += probs[i];
        if (r <= sum) {
            outlet(0, nextChords[i]);
            return;
        }
    }

    // フォールバック（確率の合計が1未満でも返す）
    if (nextChords.length > 0) {
        outlet(0, nextChords[0]);
    } else {
        outlet(0, 0); // 万一データが空だったとき
    }
}