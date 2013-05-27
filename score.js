window.addEventListener("load",initScore,false);

function initScore() {
    var scoreDiv;
    scoreDiv = document.getElementById("score");
    scoreDiv.innerHTML = "score:" + game.score + "已搞定的面积：0%";
    game.displayScore = function () {
        scoreDiv.innerHTML = "score:" + game.score.toFixed(3) + " 已搞定的面积：" + game.cover.toFixed(2) + "%";
    };
}





