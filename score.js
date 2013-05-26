window.addEventListener("load",init_score,false);
var multiplier;
var my_score;
var interval;
var decrease;
var start_time;
var tmpdiv;
function init_score() {
	multiplier = 4.0;
	interval = 30;
	decrease = 0.0025;
	tmpdiv = document.getElementById("score");
	tmpdiv.innerHTML="hehe";
	var d = new Date();
	start_time = d.getTime();
	setTimeout(decrease_bonus,interval);
}


function decrease_bonus() {
	multiplier = multiplier - decrease;
	decrease = decrease - 0.000001;
	if (multiplier <= 1) {
		multiplier = 1;
		display_multiplier();
		return;
	}
	display_multiplier();
	setTimeout(decrease_bonus,interval);
}

function display_multiplier() {
	tmpdiv.innerHTML=multiplier;
}

function calculateScore(winnerScore, loserScore) {
	var base = 10;
	var most = 200;
	var result = parseInt(100*Math.pow((parseFloat(loserScore)+500.0)/(parseFloat(winnerScore)+0.333),2));
	if (result < base) return base;
	if (result > most) return most;
	return result;
}
