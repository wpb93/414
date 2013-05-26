$(function () {
    $(".meter > span").each(function () {
        $(this)
            .data("origWidth", $(this).width())
            .width(0)
            .animate({
                width: $(this).data("origWidth")
            }, 1200);
    });
});

var maxscore = 1000;
var lastScore = 0;
var score = 0;
var bar;
var percent;


function initBar() {
    bar = document.getElementById("bar");
    percent = document.getElementById("percent");
    setInterval(function () {
        score += 1;
    }, 1000);

    setInterval(updateBar, 1000);
}

function updateBar() {
    console.log("lastScore = " + lastScore);
    console.log("curScore = " + curScore);
    var addScore = curScore - lastScore;
    score += addScore;

    if (score >= maxscore) {
        score = maxscore;
    }
    var width = 100 * score / maxscore;
    percent.innerHTML = score + "/" + maxscore;
    console.log(score + " " + maxscore);
    bar.style.width = width + "%";
}

window.addEventListener("load", initBar, false);