window.addEventListener("load",initScore,false);

function initScore() {
    var scoreDiv;
    scoreDiv = document.getElementById("score");
    scoreDiv.innerHTML = "score:" + game.score + "�Ѹ㶨�������0%";
    game.displayScore = function () {
        scoreDiv.innerHTML = "score:" + game.score.toFixed(3) + " �Ѹ㶨�������" + game.cover.toFixed(2) + "%";
    };
}





