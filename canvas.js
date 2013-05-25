var game;

/* 
 * order:: a func that takes 2 parameters, return an integer > 0 if the first element is larger than the second element
 * between:: return 1 if c is between a and b, else return 0 
 */
function between(a, b, c, order) {
	if (order) {
		return (((order(a) > order(c)) && (order(c) > order(b))) || ((order(a) < order(c)) && (order(c) < order(b))));
	} else {
		return (((a > c) && (c > b)) || ((a < c) && (c < b)));
	}
}

function Point(x, y) {
	this.x = x;
	this.y = y;
}

function Ball(position_x, position_y, speed_x, speed_y, ballRadius) {
	this.position = new Point(position_x, position_y);
	this.speed = new Point(speed_x, speed_y);
	this.radius = ballRadius;
	var myself = this;
	this.move = function () {
		myself.position.x += parseFloat(myself.speed.x) / game.fps;
		myself.position.y += parseFloat(myself.speed.y) / game.fps;

		var collision = [];
		var bounce = [];
		var border = [];
		bounce[Line.HORIZONTAL] = bounce[Line.HORIZONTAL] = false;
		border[Line.HORIZONTAL] = { '-1': -1, '1': -1 };
		border[Line.VERTICAL] = { '-1': -1, '1': -1 };
		collision[Line.HORIZONTAL] = { '-1': 0, '1': 0 };
		collision[Line.VERTICAL] = { '-1': 0, '1': 0 };
		for (var i = 0; i < game.lines.length; i++) {
			if (game.lines[i].collide(myself)) {
				var bounceDir = myself.bounceDirection(game.lines[i]);
				var ballDir = game.lines[i].direction == Line.HORIZONTAL ? 'y' : 'x';
				collision[game.lines[i].direction][bounceDir] = bounceDir;
				bounce[game.lines[i].direction] = true;
				border[game.lines[i].direction][bounceDir] = (border[game.lines[i].direction][bounceDir] < 0
						? game.lines[i].startPoint[ballDir]
						: bounceDir * Math.max(bounceDir * game.lines[i].startPoint[ballDir], bounceDir * border[game.lines[i].direction][bounceDir]));
				if (!game.lines[i].finished) {
					if (game.currLines[0] == game.lines[i]) game.currLines.shift();
					else game.currLines.pop();
					game.lines.splice(i--, 1);
				}
			}
		}

		var speedDir = [];
		speedDir[Line.VERTICAL] = collision[Line.HORIZONTAL][-1] + collision[Line.HORIZONTAL][1];
		speedDir[Line.HORIZONTAL] = collision[Line.VERTICAL][-1] + collision[Line.VERTICAL][1];
		var halfLineWidth = parseFloat(game.lineWidth) / 2;
		if (bounce[Line.HORIZONTAL]) {
			if (speedDir[Line.VERTICAL]) {
				myself.speed.y = speedDir[Line.VERTICAL] * Math.abs(myself.speed.y);
				var b = border[Line.HORIZONTAL][speedDir[Line.VERTICAL]];
				var diff = myself.position.y - b;
				myself.position.y = b + /*(parseFloat(myself.speed.y) / game.fps - diff) + */speedDir[Line.VERTICAL] * (halfLineWidth + myself.radius);
			} else {
				myself.speed.y *= -1;
			}
		}
		if (bounce[Line.VERTICAL]) {
			if (speedDir[Line.HORIZONTAL]) {
				myself.speed.x = speedDir[Line.HORIZONTAL] * Math.abs(myself.speed.x);
				var b = border[Line.VERTICAL][speedDir[Line.HORIZONTAL]];
				var diff = myself.position.x - b;
				myself.position.x = b + /*(parseFloat(myself.speed.x) / game.fps - diff) + */speedDir[Line.HORIZONTAL] * (halfLineWidth + myself.radius);
			} else {
				myself.speed.x *= -1;
			}
		}
	};

	this.bounceDirection = function (line) {
		var lineDirPerp = line.direction == Line.HORIZONTAL ? 'y' : 'x';
		var diff = line.startPoint[lineDirPerp] - (myself.position[lineDirPerp] - parseFloat(myself.speed[lineDirPerp] / game.fps));
		if (diff == 0) {
			return myself.speed[lineDirPerp] > 0 ? -1 : 1;
		} else {
		    if (!((((diff > 0) ? -1 : 1) * myself.speed[lineDirPerp]) < 0)) console.log('diff=' + diff + ' linePos=' + line.startPoint[lineDirPerp] + ' ballPos=' + myself.position[lineDirPerp] + ' return=' + ((diff > 0) ? -1 : 1) + ' speed=' + myself.speed[lineDirPerp] + ' correct=' + ((((diff > 0) ? -1 : 1) * myself.speed[lineDirPerp]) < 0));
			return (diff > 0) ? -1 : 1;
		}
	};
}

var Line;
Line.HORIZONTAL = 1;
Line.VERTICAL = 2;
function Line(start_x, start_y, end_x, end_y, drawSpeed) {
	this.startPoint = new Point(start_x, start_y);
	this.endPoint = new Point(end_x, end_y);
	this.drawPoint = new Point(start_x, start_y);
	this.direction = start_x == end_x ? Line.VERTICAL : Line.HORIZONTAL;
	this.drawSpeed = drawSpeed;
	this.finished = false;
	var myself = this;
	this.draw = function () {
		var drawDir = myself.direction == Line.HORIZONTAL ? 'x' : 'y';
		if (myself.drawPoint[drawDir] == myself.endPoint[drawDir]) {
			if (!myself.finished) {
				if (game.currLines[0] == myself) game.currLines.shift();
				else game.currLines.pop();
				myself.finished = true;
			}
			return;
		}
		myself.drawPoint[drawDir] += ((myself.endPoint[drawDir] - myself.startPoint[drawDir] > 0) ? 1 : -1) * parseFloat(myself.drawSpeed) / game.fps;
		if (myself.drawPoint[drawDir] < Math.min(myself.startPoint[drawDir], myself.endPoint[drawDir])
				|| myself.drawPoint[drawDir] > Math.max(myself.startPoint[drawDir], myself.endPoint[drawDir])) {
			myself.drawPoint[drawDir] = myself.endPoint[drawDir];
			if (game.currLines[0] == myself) game.currLines.shift();
			else game.currLines.pop();
			myself.finished = true;
		}
	};

	this.collide = function (ball) {
		var halfLineWidth = parseFloat(game.lineWidth) / 2;
		var lineDir = myself.direction == Line.HORIZONTAL ? 'x' : 'y';
		var lineDirPerp = myself.direction == Line.HORIZONTAL ? 'y' : 'x';
		return ((ball.position[lineDirPerp] + ball.radius >= myself.startPoint[lineDirPerp] - halfLineWidth
				&& ball.position[lineDirPerp] - ball.radius <= myself.startPoint[lineDirPerp] + halfLineWidth)
				&& (ball.position[lineDir] >= Math.min(myself.startPoint[lineDir], myself.drawPoint[lineDir])
				&& ball.position[lineDir] <= Math.max(myself.startPoint[lineDir], myself.drawPoint[lineDir])));
	};
}

var Node;
Node.UP = 0;
Node.RIGHT = 1;
Node.DOWN = 2;
Node.LEFT = 3;
function Node(leftPoint, rightPoint) {
	this.leftPoint = leftPoint;
	this.rightPoint = rightPoint;
	this.hasBalls = false;
	this.visited = false;
	this.neighbor = new Array(4);
	for (var i = 0; i < this.neighbor.length; i++) {
		this.neighbor[i] = null;
	}

}

function Game(canvas, height, width, ballNumber, ballSpeed, ballRadius, lineSpeed, lineWidth, fps) {
	this.canvas = canvas;
	this.display = 0;
	this.gameHeight = height;
	this.gameWidth = width;
	this.gameBoard = [[]];
	this.balls = [];
	this.ballNumber = ballNumber;
	this.ballSpeed = ballSpeed;
	this.ballRadius = ballRadius;
	this.lines = [];
	this.lineSpeed = lineSpeed;
	this.lineWidth = lineWidth;
	this.fps = fps;
	this.currLines = [];
	var myself = this;
	for (var i = 0; i < this.canvas.length; i++) {
		this.canvas[i].style.display = 'none';
		this.canvas[i].setAttribute('width', width);
		this.canvas[i].setAttribute('height', height);
	}
	this.begin = function () {
		//new balls
		myself.gameBoard = [[new Node(new Point(1, 1), new Point(myself.gameWidth - 1, myself.gameHeight - 1))]];
		for (var i = 0; i < ballNumber; i++) {
			var x = Math.random() * (myself.gameWidth - myself.ballRadius * 2) + myself.ballRadius;
			var y = Math.random() * (myself.gameHeight - myself.ballRadius * 2) + myself.ballRadius;
			var part = Math.random() * 0.4 * Math.PI;
			var quadrant = Math.floor(Math.random() * 4);
			var angle = quadrant * 0.5 * Math.PI + 0.05 * Math.PI + part;
			var speed_x = myself.ballSpeed * Math.cos(angle);
			var speed_y = myself.ballSpeed * Math.sin(angle);
			myself.balls[i] = new Ball(x, y, speed_x, speed_y, myself.ballRadius);
		}

		var line = new Line(1, 1, myself.gameWidth - 1, 1, Number.POSITIVE_INFINITY);
		line.drawPoint = line.endPoint;
		line.finished = true;
		myself.lines.push(line);

		line = new Line(1, 1, 1, myself.gameHeight - 1, Number.POSITIVE_INFINITY);
		line.drawPoint = line.endPoint;
		line.finished = true;
		myself.lines.push(line);

		line = new Line(myself.gameWidth - 1, myself.gameHeight - 1, myself.gameWidth - 1, 1, Number.POSITIVE_INFINITY);
		line.drawPoint = line.endPoint;
		line.finished = true;
		myself.lines.push(line);

		line = new Line(myself.gameWidth - 1, myself.gameHeight - 1, 1, myself.gameHeight - 1, Number.POSITIVE_INFINITY);
		line.drawPoint = line.endPoint;
		line.finished = true;
		myself.lines.push(line);

		//addeventlistener
		for (var i = 0; i < myself.canvas.length; i++) {
			myself.canvas[i].addEventListener("click", drawNewLine, false);
			myself.canvas[i].addEventListener("contextmenu", drawNewLine, false);
		}

		//update();
		setInterval(update, 1000.0 / myself.fps);
	};

	function getNode(x, y) {
		for (var i = 0; i < myself.gameBoard.length; i++) {
			for (var j = 0; j < myself.gameBoard[i].length; j++) {
				if (x >= myself.gameBoard[i][j].leftPoint.x
						&& x < myself.gameBoard[i][j].rightPoint.x
						&& y >= myself.gameBoard[i][j].leftPoint.y
						&& y < myself.gameBoard[i][j].rightPoint.y) {
					return new Point(i, j);
				}
			}
		}
	}

	function drawNewLine(e) {
		e.preventDefault();
		e.stopPropagation();
		var dirs = {
			HORIZONTAL: { nodeDir: ['LEFT', 'RIGHT'], lineDir: 'x' },
			VERTICAL: { nodeDir: ['UP', 'DOWN'], lineDir: 'y' }
		};
		var drawDir;
		var drawDirPerp;
		switch (e.button) {
			case 0:
				drawDir = dirs.HORIZONTAL;
				drawDirPerp = dirs.VERTICAL;
				break;
			case 2:
				drawDir = dirs.VERTICAL;
				drawDirPerp = dirs.HORIZONTAL;
				break;
			default:
				return;
		}
		
		if (game.currLines.length) return;

		var clickPos = new Point(e.offsetX, e.offsetY);
		var nodePos = getNode(clickPos.x, clickPos.y);
		var node;
		var endPoint = new Point();
		endPoint[drawDirPerp.lineDir] = clickPos[drawDirPerp.lineDir];

		for (node = myself.gameBoard[nodePos.x][nodePos.y]; node.neighbor[Node[drawDir.nodeDir[0]]]; node = node.neighbor[Node[drawDir.nodeDir[0]]]);
		endPoint[drawDir.lineDir] = node.leftPoint[drawDir.lineDir];
		var newLine = new Line(clickPos.x, clickPos.y, endPoint.x, endPoint.y, myself.lineSpeed);
		myself.lines.push(newLine);
		game.currLines.push(newLine);

		for (node = myself.gameBoard[nodePos.x][nodePos.y]; node.neighbor[Node[drawDir.nodeDir[1]]]; node = node.neighbor[Node[drawDir.nodeDir[1]]]);
		endPoint[drawDir.lineDir] = node.rightPoint[drawDir.lineDir];
		newLine = new Line(clickPos.x, clickPos.y, endPoint.x, endPoint.y, myself.lineSpeed);
		myself.lines.push(newLine);
		game.currLines.push(newLine);
	}

	function update() {
		myself.canvas[(myself.display - 1 + myself.canvas.length) % myself.canvas.length].style.display = 'none';
		myself.canvas[myself.display].style.display = 'block';
		myself.display = (myself.display + 1) % myself.canvas.length;
		var c = myself.canvas[myself.display];
		var ctx = c.getContext("2d");
		ctx.clearRect(0, 0, myself.gameWidth, myself.gameHeight);
		ctx.fillStyle = "#FF0000";
		ctx.beginPath();
		for (var i = 0; i < myself.balls.length; i++) {
			myself.balls[i].move();
			ctx.arc(myself.balls[i].position.x, myself.balls[i].position.y, myself.balls[i].radius, 0, Math.PI * 2, true);
			ctx.closePath();
		}
		ctx.fill();

		ctx.beginPath();
		ctx.lineWidth = myself.lineWidth;
		for (i = 0; i < myself.lines.length; i++) {
		    myself.lines[i].draw();
		    ctx.moveTo(myself.lines[i].startPoint.x, myself.lines[i].startPoint.y);
		    ctx.lineTo(myself.lines[i].drawPoint.x, myself.lines[i].drawPoint.y);
		}
		ctx.stroke();
	}
}

function init() {
	var gameCanvas = document.getElementsByClassName("game");
	game = new Game(gameCanvas, 700, 600, 10, 400, 4, 200, 2, 60);
	game.begin();
}

window.addEventListener("load", init, false);