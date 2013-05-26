window.addEventListener("load",initScore,false);
var scoreDiv;
function initScore() {
    scoreDiv = document.getElementById("score");
    scoreDiv.innerHTML = "score: " + game.score + "<br />" + "Area£º0%";
    game.displayScore = function () {
        scoreDiv.innerHTML = "score:" + game.score.toFixed(3) + "<br />" + "Area£º" + game.cover.toFixed(2) + "%";
    };
}





