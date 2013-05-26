function accelerate(m) {
	for (var i = 0; i < game.balls.length; i++) {
		game.balls[i].speed.x *= m;
		game.balls[i].speed.y *= m;
	}
	setTimeout(function () {
		for (var i = 0; i < game.balls.length; i++) {
			game.balls[i].speed.x /= m;
			game.balls[i].speed.y /= m;
		}
	}, 5000);
}

function bigger(m) {
	if (game.ballRadius * m > 50) return;
	game.ballRadius *= m;
	function setRadius() {
		for (var i = 0; i < game.balls.length; i++) {
			game.balls[i].radius = game.ballRadius;
		}
	}
	setRadius();
	setTimeout(function () {
		game.ballRadius /= m;
		setRadius();
	}, 5000);
}

function split(){
	var oldLen = game.balls.length;
	game.ballNumber *= 2;
	for (var i = 0; i < oldLen; i++) {
		var part = Math.random() * 0.4 * Math.PI;
		var quadrant = Math.floor(Math.random() * 4);
		var angle = quadrant * 0.5 * Math.PI + 0.05 * Math.PI + part;
		var speed_x = game.ballSpeed * Math.cos(angle);
		var speed_y = game.ballSpeed * Math.sin(angle);
		game.balls.push(new Ball(game.balls[i].position.x, game.balls[i].position.y, speed_x, speed_y, game.ballRadius));
	}
	setTimeout(function () {
		game.ballNumber /= 2;
		game.balls.length = game.ballNumber;
	}, 8000);
}

function Gravity(x, y, r, a) {
	var myself = this;
	this.center = new Point(x, y);
	this.radius = r;
	this.a = a;
	this.attract = function () {
		maxSpeed = 1000;
		for (var i = 0; i < game.balls.length; i++) {
			var center = myself.center;
			var dx = center.x - game.balls[i].position.x;
			var dy = center.y - game.balls[i].position.y;
			var dis = Math.sqrt((dx * dx) + (dy * dy));

			var a = myself.a / (dis * dis);
			game.balls[i].speed.x += a * (dx / dis);
			game.balls[i].speed.y += a * (dy / dis);

			var sx = game.balls[i].speed.x;
			var sy = game.balls[i].speed.y;
			var speed = Math.sqrt((sx * sx) + (sy * sy));

			if (speed > maxSpeed) {
				game.balls[i].speed.x = maxSpeed * (sx / speed);
				game.balls[i].speed.y = maxSpeed * (sy / speed);
			}

			if (a < 0.1) {
				game.balls[i].speed.x = game.ballSpeed * (sx / speed);
				game.balls[i].speed.y = game.ballSpeed * (sy / speed);
			}
		}
	};
}

function curve() {
	game.gravity.push(new Gravity(parseInt(Math.random() * (game.gameWidth - 200) + 100), parseInt(Math.random() * (game.gameHeight - 200) + 100), 50, 50000));
	setTimeout(function () {
		game.gravity.shift();
	}, 5000);
}

function hole() {
    var container = document.createElement("div");
    container.addEventListener("click",p1, false);
    container.addEventListener("contextmenu", p1, false);
    var canvasDiv = document.getElementById('gameCanvas');
    container.style.left = canvasDiv.clientLeft + parseInt(Math.random() * (game.gameWidth - 200)) + "px";
    container.style.top = canvasDiv.clientTop + parseInt(Math.random() * (game.gameHeight - 240)) + "px";
    container.style.position = "absolute";
    var image = document.createElement("img");
    image.style.height = "200px";
    image.style.width = "240px";
    image.src = "hole.png";
    container.appendChild(image);
    var body = document.getElementsByTagName("body")[0];
    body.appendChild(container);
    setTimeout(function () {
        body.removeChild(container);
    }, 10000);
}

function p1(e) {
    e.preventDefault();
}

function shake() {
	var j=0;
	var x = document.getElementById("gameCanvas");
	var l = parseInt(x.style.left);
	var t = parseInt(x.style.top);
	function shakeMyAss() {
		setTimeout(function() {
			x.style.left = (l + 10) + 'px';
			setTimeout(function() {
				x.style.left = l + 'px';
			},Math.floor((Math.random()*30)+30));
		},Math.floor((Math.random()*30)+30));
		setTimeout(function() {
			x.style.top = (t - 10) + 'px';
			setTimeout(function() {
				x.style.top = t + 'px';
			},Math.floor((Math.random()*30)+30));
		},Math.floor((Math.random()*30)+30));
		setTimeout(function() {
			x.style.top = (t + 10) + 'px';
			setTimeout(function() {
				x.style.top = t + 'px';
			},Math.floor((Math.random()*30)+30));
		},Math.floor((Math.random()*30)+30));
		setTimeout(function() {
			x.style.left = (l - 10) + 'px';
			setTimeout(function() {
				x.style.left = l + 'px';
			},Math.floor((Math.random()*30)+30));
		},Math.floor((Math.random()*30)+30));
		if (j++<200) {
			setTimeout(shakeMyAss,Math.floor((Math.random()*30)+30));
		}
		else {
			x.style.top = t + 'px';
			x.style.left = l + 'px';
		}
	}
	shakeMyAss();
}
function initButton() {
    var buttonDiv = document.getElementById("buttonContainer");
    var canvasDiv = document.getElementById("gameCanvas");
    buttonDiv.style.top = (parseInt(canvasDiv.style.top) + parseInt(canvasDiv.offsetHeight) + parseInt(canvasDiv.style.height)) + 'px';
    buttonDiv.style.left = canvasDiv.style.left;
    buttonDiv.style.position = "absolute";

}


window.addEventListener("load", initButton, false);