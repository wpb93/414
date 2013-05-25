var game;

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
		if (myself.position.x > game.gameWidth - myself.radius || myself.position.x < myself.radius) {
			myself.speed.x *= -1;
		}
		if (myself.position.y > game.gameHeight - myself.radius || myself.position.y < myself.radius) {
			myself.speed.y *= -1;
		}
		
		var collision = [];
		collision[Line.HORIZONTAL] = collision[Line.VERTICAL] = false;
		for (var i = 0; i < game.lines.length; i++) {
			if (game.lines[i].collide(myself)) {
				collision[game.lines[i].direction] = true;
				if (collision[Line.HORIZONTAL] && collision[Line.VERTICAL]) break;
			}
		}
		if (collision[Line.HORIZONTAL]) {
			myself.speed.y *= -1;
		}
		if (collision[Line.VERTICAL]) {
			myself.speed.x *= -1;
		}
		myself.position.x += parseFloat(myself.speed.x) / game.fps;
		myself.position.y += parseFloat(myself.speed.y) / game.fps;
	}
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
		//console.log(myself.drawPoint.x + " " + myself.endPoint.x);
		//console.log(myself.drawPoint.y + " " + myself.endPoint.y);
		//console.log(" ");

		var drawDir = myself.direction == Line.HORIZONTAL ? 'x' : 'y';
		if (myself.drawPoint[drawDir] == myself.endPoint[drawDir]) {
			if (!myself.finished) {
			    if (game.currLines[0] == myself) game.currLines.shift();
			    else game.currLines.pop();
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

function Game(myCanvas, height, width, ballNumber, ballSpeed, ballRadius, lineSpeed, lineWidth, fps) {
	this.myCanvas = myCanvas;
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
	this.myCanvas.setAttribute('width', width);
	this.myCanvas.setAttribute('height', height);
	this.begin = function () {
		//new balls
		myself.gameBoard = [[new Node(new Point(0, 0), new Point(myself.gameWidth, myself.gameHeight))]];
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

		//addeventlistener
		myself.myCanvas.addEventListener("click", drawNewLine, false);
		myself.myCanvas.addEventListener("contextmenu", drawNewLine, false);

		//update();
		setInterval(update, 1000.0 / myself.fps);
	}

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
		var c = document.getElementById("myCanvas");
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
			var collide = false;
			for (var j = 0; j < myself.balls.length; j++) {
				if (!myself.lines[i].finished && myself.lines[i].collide(myself.balls[j])) {
					if (myself.currLines[0] == myself.lines[i]) myself.currLines.shift();
					else myself.currLines.pop();
					myself.lines.splice(i--, 1);
					collide = true;
					break;
				}
			}
			if (!collide) {
				ctx.moveTo(myself.lines[i].startPoint.x, myself.lines[i].startPoint.y);
				ctx.lineTo(myself.lines[i].drawPoint.x, myself.lines[i].drawPoint.y);
			}
		}
		ctx.stroke();
	}
}

function init() {
	var myCanvas = document.getElementById("myCanvas");
	game = new Game(myCanvas, 700, 600, 10, 400, 4, 200, 2, 60);
	game.begin();
}

window.addEventListener("load", init, false);