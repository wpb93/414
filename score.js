window.addEventListener("load",initScore,false);
var multiplier;
var myScore;
var interval;
var decrease;
var tmpdiv;
var curScore = 0;
var curCover = 0;
function initScore() {
	multiplier = 4.0;
	interval = 30;
	decrease = 0.0025;
	tmpdiv = document.getElementById("score");
	tmpdiv.innerHTML = "score:" + curScore + "已搞定的面积：0%";
	setTimeout(decreaseBonus, interval);
	setInterval(displayScore, interval);
}


function decreaseBonus() {
	multiplier = multiplier - decrease;
	decrease = decrease - 0.000001;
	if (multiplier <= 1) {
	    multiplier = 1;
	    return;
	}
	setTimeout(decreaseBonus,interval);
}

function displayScore() {
    var percent = cover();
    if (percent != curCover) {
        curScore += (parseFloat(percent - curCover) * multiplier);
        curCover = percent;
        tmpdiv.innerHTML = "score:" + curScore.toFixed(3) + "已搞定的面积：" + percent.toFixed(2) + "%";
    }
    //tmpdiv.innerHTML += "%";
}

function calculateScore(winnerScore, loserScore) {
    var base = 10;
    var most = 200;
    var result = parseInt(100*Math.pow((parseFloat(loserScore)+500.0)/(parseFloat(winnerScore)+0.333),2));
    if (result < base) return base;
    if (result > most) return most;
    return result;
}

function cover() {
    var cover = 0;
    for (var i = 0; i < game.gameBoard.length; i++) {
        for (var j = 0; j < game.gameBoard[i].length; j++) {
            if (game.gameBoard[i][j].hasBalls == false) {
                cover += (game.gameBoard[i][j].rightPoint.x - game.gameBoard[i][j].leftPoint.x) * (game.gameBoard[i][j].rightPoint.y - game.gameBoard[i][j].leftPoint.y);
            }
        }
    }
    return (parseFloat(cover) / (game.gameHeight * game.gameWidth)) * 100;
}


