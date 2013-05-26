var game;

function between(m, a, b, inclusive, cmp) {
	if (!cmp) {
		cmp = function (a, b) {
			return a == b ? 0 : (a < b ? -1 : 1);
		};
	}
	if (!inclusive) {
		inclusive = [false, false];
	}
	if (cmp(a, b) > 0) {
		var t = a;
		a = b;
		b = t;
	}
	var diffAM = cmp(a, m);
	var diffMB = cmp(m, b);
	var diff = diffAM * diffMB;
	if (diff > 0) return true;
	if (diff < 0) return false;
	if (inclusive[0] && inclusive[1]) return true;
	if (!inclusive[0] && !inclusive[1]) return false;
	if (inclusive[0] && diffAM == 0) return true;
	if (inclusive[1] && diffMB == 0) return true;
	return false;
}

function Point(x, y) {
	this.x = x;
	this.y = y;
	var myself = this;
	this.clone = function () {
		return new Point(myself.x, myself.y);
	}
}

function Ball(position_x, position_y, speed_x, speed_y, ballRadius) {
	this.position = new Point(position_x, position_y);
	this.speed = new Point(speed_x, speed_y);
	this.radius = ballRadius;
	var myself = this;
	this.move = function () {
		myself.position.x += parseFloat(myself.speed.x) / game.updateRate;
		myself.position.y += parseFloat(myself.speed.y) / game.updateRate;

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
				myself.position.y = b + /*(parseFloat(myself.speed.y) / game.updateRate - diff) + */speedDir[Line.VERTICAL] * (halfLineWidth + myself.radius);
			} else {
				myself.speed.y *= -1;
			}
		}
		if (bounce[Line.VERTICAL]) {
			if (speedDir[Line.HORIZONTAL]) {
				myself.speed.x = speedDir[Line.HORIZONTAL] * Math.abs(myself.speed.x);
				var b = border[Line.VERTICAL][speedDir[Line.HORIZONTAL]];
				var diff = myself.position.x - b;
				myself.position.x = b + /*(parseFloat(myself.speed.x) / game.updateRate - diff) + */speedDir[Line.HORIZONTAL] * (halfLineWidth + myself.radius);
			} else {
				myself.speed.x *= -1;
			}
		}
	};

	this.bounceDirection = function (line) {
		var lineDirPerp = line.direction == Line.HORIZONTAL ? 'y' : 'x';
		var diff = line.startPoint[lineDirPerp] - (myself.position[lineDirPerp] - parseFloat(myself.speed[lineDirPerp] / game.updateRate));
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
				game.addNode(myself);
			}
			return;
		}
		myself.drawPoint[drawDir] += ((myself.endPoint[drawDir] - myself.startPoint[drawDir] > 0) ? 1 : -1) * parseFloat(myself.drawSpeed) / game.updateRate;
		if (!between(myself.drawPoint[drawDir], myself.startPoint[drawDir], myself.endPoint[drawDir], true)) {
			myself.drawPoint[drawDir] = myself.endPoint[drawDir];
			if (game.currLines[0] == myself) game.currLines.shift();
			else game.currLines.pop();
			myself.finished = true;
			game.addNode(myself);
		}
	};

	this.collide = function (ball) {
		var halfLineWidth = parseFloat(game.lineWidth) / 2;
		var lineDir = myself.direction == Line.HORIZONTAL ? 'x' : 'y';
		var lineDirPerp = myself.direction == Line.HORIZONTAL ? 'y' : 'x';
		return (between(ball.position[lineDirPerp], myself.startPoint[lineDirPerp] - (halfLineWidth + ball.radius), myself.startPoint[lineDirPerp] + (halfLineWidth + ball.radius), true)
				&& between(ball.position[lineDir], myself.startPoint[lineDir], myself.drawPoint[lineDir], true));
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
	this.hasBalls = true;
	this.neighbor = new Array(4);
	for (var i = 0; i < this.neighbor.length; i++) {
		this.neighbor[i] = null;
	}

}

function Game(canvasDiv, height, width, ballNumber, ballSpeed, ballRadius, lineSpeed, lineWidth, fps) {
	this.canvasDiv = canvasDiv;
	this.canvas = canvasDiv.getElementsByClassName('game');
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
	this.updateRate = 80;
	this.currLines = [];
	this.gravity = [];
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
		myself.canvasDiv.addEventListener("click", drawNewLine, false);
		myself.canvasDiv.addEventListener("contextmenu", drawNewLine, false);

		setInterval(update, 1000.0 / myself.updateRate);
		setInterval(render, 1000.0 / myself.fps);
	};

	this.addNode = function (line) {
		var linePoint = line.startPoint;
		var nodePos = getNode(linePoint);
		//console.log((myself.gameBoard[nodePos.x][nodePos.y]));
		var node = game.gameBoard[nodePos.x][nodePos.y];
		var nodePoint = node.leftPoint;

		if (linePoint.y > nodePoint.y) {   //add row
			var newNode;
			for (var i = 0; i < myself.gameBoard.length; i++) {
				var original = myself.gameBoard[i][nodePos.y];
				newNode = new Node(original.leftPoint.clone(), new Point(original.rightPoint.x, linePoint.y));
				original.leftPoint.y = linePoint.y;
				myself.gameBoard[i].splice(nodePos.y, 0, newNode);
			}
			for (i = 0; i < myself.gameBoard.length; i++) {
				var newNode = myself.gameBoard[i][nodePos.y];

				var btm = myself.gameBoard[i][nodePos.y + 1];
				if ((newNode.neighbor[Node.UP] = btm.neighbor[Node.UP])) {
					myself.gameBoard[i][nodePos.y - 1].neighbor[Node.DOWN] = newNode;
				}

				newNode.neighbor[Node.DOWN] = btm;
				btm.neighbor[Node.UP] = newNode;

				newNode.neighbor[Node.LEFT] = btm.neighbor[Node.LEFT] ? myself.gameBoard[i - 1][nodePos.y] : null;

				newNode.neighbor[Node.RIGHT] = btm.neighbor[Node.RIGHT] ? myself.gameBoard[i + 1][nodePos.y] : null;
			}
			nodePos.y++;
		}

		if (linePoint.x > nodePoint.x) {    //add column
			var newCol = new Array(myself.gameBoard[nodePos.x].length);
			for (var i = 0; i < newCol.length; i++) {
				var original = myself.gameBoard[nodePos.x][i];
				newCol[i] = new Node(original.leftPoint.clone(), new Point(linePoint.x, original.rightPoint.y));
				original.leftPoint.x = linePoint.x;
			}
			myself.gameBoard.splice(nodePos.x, 0, newCol);
			for (i = 0; i < newCol.length; i++) {
				var right = myself.gameBoard[nodePos.x + 1][i];
				if ((newCol[i].neighbor[Node.LEFT] = right.neighbor[Node.LEFT])) {
					myself.gameBoard[nodePos.x - 1][i].neighbor[Node.RIGHT] = newCol[i];
				}

				newCol[i].neighbor[Node.RIGHT] = right;
				right.neighbor[Node.LEFT] = newCol[i];

				newCol[i].neighbor[Node.UP] = right.neighbor[Node.UP] ? myself.gameBoard[nodePos.x][i - 1] : null;

				newCol[i].neighbor[Node.DOWN] = right.neighbor[Node.DOWN] ? myself.gameBoard[nodePos.x][i + 1] : null;
			}
			nodePos.x++;
		}

		var nodes = [];
		if (line.direction == Line.HORIZONTAL) {
			var dir = line.startPoint.x > line.endPoint.x ? -1 : 1;
			var point = line.startPoint.x > line.endPoint.x ? 'leftPoint' : 'rightPoint';
			var tmpNode = nodePos.clone();
			if (dir < 0) {
				tmpNode.x += dir;
			}
			for (; myself.gameBoard[tmpNode.x] && line.endPoint.x * dir >= myself.gameBoard[tmpNode.x][tmpNode.y][point].x * dir; tmpNode.x += dir) {
				var top = myself.gameBoard[tmpNode.x][tmpNode.y - 1];
				var btm = myself.gameBoard[tmpNode.x][tmpNode.y];
				if (top) top.neighbor[Node.DOWN] = null;
				btm.neighbor[Node.UP] = null;
			}
			console.log(nodes);
		} else {
			var dir = line.startPoint.y > line.endPoint.y ? -1 : 1;
			var point = line.startPoint.y > line.endPoint.y ? 'leftPoint' : 'rightPoint';
			var tmpNode = nodePos.clone();
			if (dir < 0) {
				tmpNode.y += dir;
			}
			for (; myself.gameBoard[tmpNode.x][tmpNode.y] && line.endPoint.y * dir >= myself.gameBoard[tmpNode.x][tmpNode.y][point].y * dir; tmpNode.y += dir) {
				var left = tmpNode.x - 1 >= 0 ? myself.gameBoard[tmpNode.x - 1][tmpNode.y] : null;
				var right = myself.gameBoard[tmpNode.x][tmpNode.y];
				if (left) left.neighbor[Node.RIGHT] = null;
				right.neighbor[Node.LEFT] = null;
			}
		}
		console.log(myself.gameBoard.length + " " + myself.gameBoard[0].length);

		for (var i = 0; i < myself.gameBoard.length; i++) {
		    for (var j = 0; j < myself.gameBoard[i].length; j++) {
		        myself.gameBoard[i][j].hasBalls = false;
		    }
		}
		for (i = 0; i < myself.balls.length; i++) {
		    markHasBalls(getNode(myself.balls[i].position));
		}
	};

	function getNode(point) {
		for (var i = 0; i < myself.gameBoard.length; i++) {
			if (between(point.x, myself.gameBoard[i][0].leftPoint.x, myself.gameBoard[i][0].rightPoint.x, [true, false])) {
				for (var j = 0; j < myself.gameBoard[i].length; j++) {
					if (between(point.y, myself.gameBoard[i][j].leftPoint.y, myself.gameBoard[i][j].rightPoint.y, [true, false])) {
						return new Point(i, j);
					}
				}
			}
		}
	}

	function dfsNodeTable(node) {
		if (!node || node.hasBalls) return;
		node.hasBalls = true;
		for (var k = 0; k < node.neighbor.length; k++) {
			dfsNodeTable(node.neighbor[k]);
		}
	}

	function markHasBalls(nodePos) {
		if (!nodePos) return;
		dfsNodeTable(myself.gameBoard[nodePos.x][nodePos.y]);
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
		var nodePos = getNode(clickPos);
		if (!nodePos) return;
		var node;
		var newLine;
		var endPoint = new Point();
		endPoint[drawDirPerp.lineDir] = clickPos[drawDirPerp.lineDir];

		// up / left
		node = myself.gameBoard[nodePos.x][nodePos.y];
		var paral = clickPos[drawDirPerp.lineDir] == node.leftPoint[drawDirPerp.lineDir];
		var perp = clickPos[drawDir.lineDir] == node.leftPoint[drawDir.lineDir];
		var tmpPos = nodePos.clone();
		if (perp) { // click on the border of the perpendicular direction
			if (nodePos[drawDir.lineDir] > 0) {
				tmpPos[drawDir.lineDir]--;
				node = myself.gameBoard[tmpPos.x][tmpPos.y];
			} else {
				node = null;
			}
		}
		var draw = true;
		if (node && node.hasBalls) {
		    if (paral) {  // click on the border of the same direction
			    if (nodePos[drawDirPerp.lineDir] > 0 && (draw = node.neighbor[Node[drawDirPerp.nodeDir[0]]])) {
					//tmpPos = nodePos.clone();
					//if (perp) tmpPos[drawDir.lineDir]--;
					if (tmpPos.x >= 0 && tmpPos.y >= 0) {
					    var btmOrRight = myself.gameBoard[tmpPos.x][tmpPos.y];
					    var topOrLeft = btmOrRight.neighbor[Node[drawDirPerp.nodeDir[0]]];
					    if (topOrLeft) {
					        for (tmpPos[drawDir.lineDir]--; tmpPos.x >= 0 && tmpPos.y >= 0; tmpPos[drawDir.lineDir]--) {
					            btmOrRight = myself.gameBoard[tmpPos.x][tmpPos.y];
					            topOrLeft = btmOrRight.neighbor[Node[drawDirPerp.nodeDir[0]]];
					            if (!topOrLeft || (!topOrLeft.neighbor[Node[drawDir.nodeDir[1]]] && !btmOrRight.neighbor[Node[drawDir.nodeDir[1]]])) {
					                break;
					            }
					        }
					    }
					}
					if (tmpPos.x >= 0 && tmpPos.y >= 0) {
						node = myself.gameBoard[tmpPos.x][tmpPos.y];
					} else {
						node = null;
					}
				}
			} else { // didn't click on borders
				for (; node; node = node.neighbor[Node[drawDir.nodeDir[0]]], tmpPos[drawDir.lineDir]--);
				if (tmpPos.x >= 0 && tmpPos.y >= 0) {
					node = myself.gameBoard[tmpPos.x][tmpPos.y];
				} else {
					node = null;
				}
			}

			if (draw) {
			    endPoint[drawDir.lineDir] = node ? node.rightPoint[drawDir.lineDir] : 1;
			    if (clickPos[drawDir.lineDir] != endPoint[drawDir.lineDir]) {
			        newLine = new Line(clickPos.x, clickPos.y, endPoint.x, endPoint.y, myself.lineSpeed);
			        myself.lines.push(newLine);
			        game.currLines.push(newLine);
			    }
			}
		}
		
		// down / right
		node = myself.gameBoard[nodePos.x][nodePos.y];
		tmpPos = nodePos.clone();
		draw = true;
		if (node.hasBalls) {
		    if (paral) {  // click on the border of the same direction
			    if ((draw = node.neighbor[Node[drawDirPerp.nodeDir[0]]])) {
					//tmpPos = nodePos.clone();
					tmpPos[drawDir.lineDir]++;
					if (tmpPos.x < myself.gameBoard.length && tmpPos.y < myself.gameBoard[tmpPos.x].length) {
					    var btmOrRight = myself.gameBoard[tmpPos.x][tmpPos.y];
					    var topOrLeft = btmOrRight.neighbor[Node[drawDirPerp.nodeDir[0]]];
					    if (topOrLeft) {
					        for (; tmpPos.x < myself.gameBoard.length && tmpPos.y < myself.gameBoard[tmpPos.x].length; tmpPos[drawDir.lineDir]++) {
					            var btmOrRight = myself.gameBoard[tmpPos.x][tmpPos.y];
					            var topOrLeft = btmOrRight.neighbor[Node[drawDirPerp.nodeDir[0]]];
					            if (!topOrLeft || (!topOrLeft.neighbor[Node[drawDir.nodeDir[0]]] && !btmOrRight.neighbor[Node[drawDir.nodeDir[0]]])) {
					                break;
					            }
					        }
					    }
					}
					if (tmpPos.x < myself.gameBoard.length && tmpPos.y < myself.gameBoard[tmpPos.x].length) {
						node = myself.gameBoard[tmpPos.x][tmpPos.y];
					} else {
						node = null;
					}
				}
			} else { // didn't click on borders
				for (/*tmpPos = nodePos.clone()*/; node; node = node.neighbor[Node[drawDir.nodeDir[1]]], tmpPos[drawDir.lineDir]++);
				if (tmpPos.x < myself.gameBoard.length && tmpPos.y < myself.gameBoard[tmpPos.x].length) {
					node = myself.gameBoard[tmpPos.x][tmpPos.y];
				} else {
					node = null;
				}
			}

		    if (draw) {
			    var dimension = new Point(myself.gameWidth - 1, myself.gameHeight - 1);
			    endPoint[drawDir.lineDir] = node ? node.leftPoint[drawDir.lineDir] : dimension[drawDir.lineDir];
			    if (clickPos[drawDir.lineDir] != endPoint[drawDir.lineDir]) {
			        newLine = new Line(clickPos.x, clickPos.y, endPoint.x, endPoint.y, myself.lineSpeed);
			        myself.lines.push(newLine);
			        game.currLines.push(newLine);
			    }
			}
		}
	}

	function update() {
		for (var i = 0; i < myself.gravity.length; i++) {
			myself.gravity[i].attract();
		}
		for (var i = 0; i < myself.balls.length; i++) {
			myself.balls[i].move();
		}
		for (var i = 0; i < myself.lines.length; i++) {
			myself.lines[i].draw();
		}
	}

	function render() {
		myself.canvas[(myself.display - 1 + myself.canvas.length) % myself.canvas.length].style.display = 'none';
		myself.canvas[myself.display].style.display = 'block';
		myself.display = (myself.display + 1) % myself.canvas.length;
		var c = myself.canvas[myself.display];
		var ctx = c.getContext("2d");
		ctx.clearRect(0, 0, myself.gameWidth, myself.gameHeight);
		ctx.lineWidth = myself.lineWidth;

	    // lines
		ctx.strokeStyle = "black";
		ctx.beginPath();
		for (i = 0; i < myself.lines.length; i++) {
		    var line = myself.lines[i];
		    if (line.finished) {
		        ctx.moveTo(line.startPoint.x, line.startPoint.y);
		        ctx.lineTo(line.drawPoint.x, line.drawPoint.y);
		    }
		}
		ctx.stroke();

	    // lines
		ctx.strokeStyle = "blue";
		ctx.beginPath();
		for (i = 0; i < myself.lines.length; i++) {
		    var line = myself.lines[i];
		    if (!line.finished) {
		        ctx.moveTo(line.startPoint.x, line.startPoint.y);
		        ctx.lineTo(line.drawPoint.x, line.drawPoint.y);
		    }
		}
		ctx.stroke();

		// shades
		ctx.fillStyle = "#BEBEBE";
		ctx.beginPath();
		for (var i = 0; i < myself.gameBoard.length; i++) {
			for (var j = 0; j < myself.gameBoard[i].length; j++) {
				var node = myself.gameBoard[i][j];
				if (!node.hasBalls) {
					var x = node.leftPoint.x;
					var y = node.leftPoint.y;
					var width = node.rightPoint.x - x;
					var height = node.rightPoint.y - y;
					if (j == 0 || (!node.neighbor[Node.UP] && myself.gameBoard[i][j - 1].hasBalls)) {
						y++;
						height--;
					}
					if (j == myself.gameBoard[i].length - 1 || (!node.neighbor[Node.DOWN] && myself.gameBoard[i][j + 1].hasBalls)) {
						height--;
					}
					if (i == 0 || (!node.neighbor[Node.LEFT] && myself.gameBoard[i - 1][j].hasBalls)) {
						x++;
						width--;
					}
					if (i == myself.gameBoard.length - 1 || (!node.neighbor[Node.RIGHT] && myself.gameBoard[i + 1][j].hasBalls)) {
						width--;
					}
					ctx.rect(x, y, width, height);
				}
			}
		}
		ctx.fill();

		// gravity
		for (var i = 0; i < game.gravity.length; i++) {
			var g = myself.gravity[i];
			var grd = ctx.createRadialGradient(g.center.x, g.center.y, 0, g.center.x, g.center.y, g.radius);
			grd.addColorStop(0, "black");
			grd.addColorStop(1, "rgba(0, 0, 0, 0)");
			ctx.fillStyle = grd;
			ctx.beginPath();
			ctx.arc(g.center.x, g.center.y, g.radius, 0, Math.PI * 2);
			ctx.fill();
		}

		// balls
		ctx.fillStyle = "red";
		ctx.beginPath();
		for (var i = 0; i < myself.balls.length; i++) {
			ctx.arc(myself.balls[i].position.x, myself.balls[i].position.y, myself.balls[i].radius, 0, Math.PI * 2);
			ctx.closePath();
		}
		ctx.fill();
	}
}
