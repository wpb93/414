window.addEventListener("load",initScore,false);
var scoreDiv;
function initScore() {
    scoreDiv = document.getElementById("score");
    scoreDiv.innerHTML = "score:" + game.score + "�Ѹ㶨�������0%";
    game.displayScore = function () {
        scoreDiv.innerHTML = "score:" + game.score.toFixed(3) + " �Ѹ㶨�������" + game.cover.toFixed(2) + "%";
    };
}





