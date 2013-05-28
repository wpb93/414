var game;
var life;

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

function copyArray(array) {
    if (array instanceof Array) {
        var newArray = [];
        for (var i = 0; i < array.length; i++) {
            newArray[i] = copyArray(array[i]);
        }
        return newArray;
    } else if (array instanceof Object) {
        try {
            return array.clone();
        } catch (e) {
            return array;
        }
    } else {
        return array;
    }
}

function Point(x, y) {
    this.x = x;
    this.y = y;
    var myself = this;
    this.clone = function () {
        return new Point(myself.x, myself.y);
    }
}

function Ball(position_x, position_y, speed_x, speed_y, ballRadius, game) {
    this.position = new Point(position_x, position_y);
    this.speed = new Point(speed_x, speed_y);
    this.radius = ballRadius;
    this.game = game;
    var myself = this;

    this.clone = function () {
        return new Ball(myself.position.x, myself.position.y, myself.speed.x, myself.speed.y, myself.radius);
    }

    this.move = function () {
        myself.position.x += parseFloat(myself.speed.x) / myself.game.updateRate;
        myself.position.y += parseFloat(myself.speed.y) / myself.game.updateRate;

        var collision = [];
        var bounce = [];
        var border = [];
        bounce[Line.HORIZONTAL] = bounce[Line.HORIZONTAL] = false;
        border[Line.HORIZONTAL] = { '-1': -1, '1': -1 };
        border[Line.VERTICAL] = { '-1': -1, '1': -1 };
        collision[Line.HORIZONTAL] = { '-1': 0, '1': 0 };
        collision[Line.VERTICAL] = { '-1': 0, '1': 0 };
        for (var i = 0; i < myself.game.lines.length; i++) {
            if (myself.game.lines[i].collide(myself)) {
                var bounceDir = myself.bounceDirection(myself.game.lines[i]);
                var ballDir = myself.game.lines[i].direction == Line.HORIZONTAL ? 'y' : 'x';
                collision[myself.game.lines[i].direction][bounceDir] = bounceDir;
                bounce[myself.game.lines[i].direction] = true;
                border[myself.game.lines[i].direction][bounceDir] = (border[myself.game.lines[i].direction][bounceDir] < 0
						? myself.game.lines[i].startPoint[ballDir]
						: bounceDir * Math.max(bounceDir * myself.game.lines[i].startPoint[ballDir], bounceDir * border[myself.game.lines[i].direction][bounceDir]));
                if (!myself.game.lines[i].finished) {
                    if (myself.game.currLines[0] == myself.game.lines[i]) myself.game.currLines.shift();
                    else myself.game.currLines.pop();
                    myself.game.lines.splice(i--, 1);
                    life.die();
                }
            }
        }

        var speedDir = [];
        speedDir[Line.VERTICAL] = collision[Line.HORIZONTAL][-1] + collision[Line.HORIZONTAL][1];
        speedDir[Line.HORIZONTAL] = collision[Line.VERTICAL][-1] + collision[Line.VERTICAL][1];
        var halfLineWidth = parseFloat(myself.game.lineWidth) / 2;
        if (bounce[Line.HORIZONTAL]) {
            if (speedDir[Line.VERTICAL]) {
                myself.speed.y = speedDir[Line.VERTICAL] * Math.abs(myself.speed.y);
                var b = border[Line.HORIZONTAL][speedDir[Line.VERTICAL]];
                var diff = myself.position.y - b;
                myself.position.y = b + /*(parseFloat(myself.speed.y) / myself.game.updateRate - diff) + */speedDir[Line.VERTICAL] * (halfLineWidth + myself.radius);
            } else {
                myself.speed.y *= -1;
            }
        }
        if (bounce[Line.VERTICAL]) {
            if (speedDir[Line.HORIZONTAL]) {
                myself.speed.x = speedDir[Line.HORIZONTAL] * Math.abs(myself.speed.x);
                var b = border[Line.VERTICAL][speedDir[Line.HORIZONTAL]];
                var diff = myself.position.x - b;
                myself.position.x = b + /*(parseFloat(myself.speed.x) / myself.game.updateRate - diff) + */speedDir[Line.HORIZONTAL] * (halfLineWidth + myself.radius);
            } else {
                myself.speed.x *= -1;
            }
        }
    };

    this.bounceDirection = function (line) {
        var lineDirPerp = line.direction == Line.HORIZONTAL ? 'y' : 'x';
        var diff = line.startPoint[lineDirPerp] - (myself.position[lineDirPerp] - parseFloat(myself.speed[lineDirPerp] / myself.game.updateRate));
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
function Line(start_x, start_y, end_x, end_y, drawSpeed, game) {
    this.startPoint = new Point(start_x, start_y);
    this.endPoint = new Point(end_x, end_y);
    this.drawPoint = new Point(start_x, start_y);
    this.direction = start_x == end_x ? Line.VERTICAL : Line.HORIZONTAL;
    this.drawSpeed = drawSpeed;
    this.finished = false;
    this.game = game;
    var myself = this;

    this.clone = function () {
        var newLine = new Line(myself.startPoint.x, myself.startPoint.y, myself.endPoint.x, myself.endPoint.y, myself.drawSpeed);
        newLine.drawPoint = myself.drawPoint.clone();
        newLine.finished = myself.finished;
        return newLine;
    }

    this.draw = function () {
        var drawDir = myself.direction == Line.HORIZONTAL ? 'x' : 'y';
        if (myself.drawPoint[drawDir] == myself.endPoint[drawDir]) {
            if (!myself.finished) {
                if (myself.game.currLines[0] == myself) myself.game.currLines.shift();
                else myself.game.currLines.pop();
                myself.finished = true;
                myself.game.addNode(myself);
            }
            return;
        }
        myself.drawPoint[drawDir] += ((myself.endPoint[drawDir] - myself.startPoint[drawDir] > 0) ? 1 : -1) * parseFloat(myself.drawSpeed) / myself.game.updateRate;
        if (!between(myself.drawPoint[drawDir], myself.startPoint[drawDir], myself.endPoint[drawDir], [true, true])) {
            myself.drawPoint[drawDir] = myself.endPoint[drawDir];
            if (myself.game.currLines[0] == myself) myself.game.currLines.shift();
            else myself.game.currLines.pop();
            myself.finished = true;
            myself.game.addNode(myself);
        }
    };

    this.collide = function (ball) {
        var halfLineWidth = parseFloat(myself.game.lineWidth) / 2;
        var lineDir = myself.direction == Line.HORIZONTAL ? 'x' : 'y';
        var lineDirPerp = myself.direction == Line.HORIZONTAL ? 'y' : 'x';
        return (between(ball.position[lineDirPerp], myself.startPoint[lineDirPerp] - (halfLineWidth + ball.radius), myself.startPoint[lineDirPerp] + (halfLineWidth + ball.radius), [true, true])
				&& between(ball.position[lineDir], myself.startPoint[lineDir], myself.drawPoint[lineDir], [true, true]));
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
    var myself = this;
    for (var i = 0; i < this.neighbor.length; i++) {
        this.neighbor[i] = null;
    }

    this.clone = function () {
        var dummyNode = new Node(myself.leftPoint.clone(), myself.rightPoint.clone());
        dummyNode.hasBalls = myself.hasBalls;
        for (var i = 0; i < dummyNode.neighbor.length; i++) {
            dummyNode.neighbor[i] = !!myself.neighbor[i];
        }
        return dummyNode;
    }
}

////////////////////////
function Bar(initialEnergy, maxEnergy, energyPSecond, width, multipler) {
    this.maxEnergy = 1000;
    this.lastEnergy = 0;
    this.energy = initialEnergy;
    this.multipler = multipler;
    this.width = width;
    this.outer = document.getElementById("outer");
    this.bar = document.getElementById("bar");
    this.percent = document.getElementById("percent");
    var eps = energyPSecond;
    var updateIntervalId;
    var myself = this;

    var begin = function () {
        myself.outer.style.width = myself.widht + "px";
        updateIntervalId = setInterval(function () {
            myself.energy += eps;
            myself.updateBar();
        }, 1000);

        //setInterval(updateBar, 1000);
    }();

    this.pauseUpdate = function () {
        clearInterval(updateIntervalId);
    };

    this.wakeUpUpdate = function () {
        updateIntervalId = setInterval(function () {
            myself.energy += eps;
            myself.updateBar();
        }, 1000);
    };

    this.decrease = function (decEnergy) {
        myself.energy -= decEnergy;
    };

    this.updateCover = function () {
        var addEnergy = game.cover * myself.multipler - myself.lastEnergy;
        if (addEnergy > 0) {
            myself.energy += addEnergy;
        }
        myself.lastEnergy = game.cover * myself.multipler;
        myself.updateBar();
    };

    this.updateBar = function () {

        if (myself.energy >= myself.maxEnergy) {
            myself.energy = myself.maxEnergy;
        }
        myself.energy = parseInt(myself.energy);
        var width = 100 * myself.energy / myself.maxEnergy;
        myself.percent.innerHTML = myself.energy + "/" + myself.maxEnergy;
        myself.bar.style.width = width + "%";
        game.checkItem();
    }
}

function Gravity(x, y, r, a, game) {
    this.center = new Point(x, y);
    this.radius = r;
    this.a = a;
    this.game = game;
    var myself = this;

    this.clone = function () {
        return new Gravity(myself.center.x, myself.center.y, myself.radius, myself.a);
    };

    this.attract = function () {
        maxSpeed = 1000;
        for (var i = 0; i < myself.game.balls.length; i++) {
            var center = myself.center;
            var dx = center.x - myself.game.balls[i].position.x;
            var dy = center.y - myself.game.balls[i].position.y;
            var dis = Math.sqrt((dx * dx) + (dy * dy));

            var a = myself.a / (dis * dis);
            myself.game.balls[i].speed.x += a * (dx / dis);
            myself.game.balls[i].speed.y += a * (dy / dis);

            var sx = myself.game.balls[i].speed.x;
            var sy = myself.game.balls[i].speed.y;
            var speed = Math.sqrt((sx * sx) + (sy * sy));

            if (speed > maxSpeed) {
                myself.game.balls[i].speed.x = maxSpeed * (sx / speed);
                myself.game.balls[i].speed.y = maxSpeed * (sy / speed);
            }

            if (a < 0.1) {
                myself.game.balls[i].speed.x = myself.game.ballSpeed * (sx / speed);
                myself.game.balls[i].speed.y = myself.game.ballSpeed * (sy / speed);
            }
        }
    };
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
    this.cover = 0;
    this.score = 0;
    this.client = null;
    var myself = this;
    var bar;
    var initialEnergy = 0;
    var multiplier = 4.0;
    var decrease = 0.0025;
    var useItems = new Array(6);
    //0->hole 1->curve 2->shake 3->larger 4->split 5->accelerate
    for (var i = 0; i < 6; i++) {
        useItems[i] = false;
    }
    var updateID = null;
    var renderID = null;
    var decreaseID = null;
    var sendID = null;
    for (var i = 0; i < this.canvas.length; i++) {
        this.canvas[i].style.display = 'none';
        this.canvas[i].setAttribute('width', this.gameWidth);
        this.canvas[i].setAttribute('height', this.gameHeight);
    }

    this.getCurrState = function () {
        var state = {
            gameHeight: myself.gameHeight,
            gameWidth: myself.gameWidth,
            gameBoard: copyArray(myself.gameBoard),
            gravity: copyArray(myself.gravity),
            balls: copyArray(myself.balls),
            ballNumber: myself.ballNumber,
            ballSpeed: myself.ballSpeed,
            ballRadius: myself.ballRadius,
            lines: copyArray(myself.lines),
            lineSpeed: myself.lineSpeed,
            lineWidth: myself.lineWidth,
            currLines: copyArray(myself.currLines),
            cover: myself.cover,
            score: myself.score
        };
        return state;
    };
    //new bar
    //bar = new Bar(initialEnergy, 1000, 1, 1000, 4);

    this.begin = function () {

        //new balls
        myself.gameBoard = [[new Node(new Point(1, 1), new Point(myself.gameWidth - 1, myself.gameHeight - 1))]];
        for (var i = 0; i < myself.ballNumber; i++) {
            var x = Math.random() * (myself.gameWidth - myself.ballRadius * 2) + myself.ballRadius;
            var y = Math.random() * (myself.gameHeight - myself.ballRadius * 2) + myself.ballRadius;
            var part = Math.random() * 0.4 * Math.PI;
            var quadrant = Math.floor(Math.random() * 4);
            var angle = quadrant * 0.5 * Math.PI + 0.05 * Math.PI + part;
            var speed_x = myself.ballSpeed * Math.cos(angle);
            var speed_y = myself.ballSpeed * Math.sin(angle);
            myself.balls[i] = new Ball(x, y, speed_x, speed_y, myself.ballRadius, myself);
        }

        var line = new Line(1, 1, myself.gameWidth - 1, 1, Number.POSITIVE_INFINITY, myself);
        line.drawPoint = line.endPoint;
        line.finished = true;
        myself.lines.push(line);

        line = new Line(1, 1, 1, myself.gameHeight - 1, Number.POSITIVE_INFINITY, myself);
        line.drawPoint = line.endPoint;
        line.finished = true;
        myself.lines.push(line);

        line = new Line(myself.gameWidth - 1, myself.gameHeight - 1, myself.gameWidth - 1, 1, Number.POSITIVE_INFINITY, myself);
        line.drawPoint = line.endPoint;
        line.finished = true;
        myself.lines.push(line);

        line = new Line(myself.gameWidth - 1, myself.gameHeight - 1, 1, myself.gameHeight - 1, Number.POSITIVE_INFINITY, myself);
        line.drawPoint = line.endPoint;
        line.finished = true;
        myself.lines.push(line);

        //addeventlistener
        myself.canvasDiv.addEventListener("click", drawNewLine, false);
        myself.canvasDiv.addEventListener("contextmenu", drawNewLine, false);

        updateID = setInterval(update, 1000.0 / myself.updateRate);
        renderID = setInterval(render, 1000.0 / myself.fps);
        decreaseID = setInterval(decreaseBonus, 30);
        if (myself.client) {
            sendID = setInterval(myself.client.getUpdateFunction(myself.client), 1000);
        }
    };

    this.addNode = function (line) {
        var linePoint = line.startPoint;
        var nodePos = getNode(linePoint);
        //console.log((myself.gameBoard[nodePos.x][nodePos.y]));
        var node = myself.gameBoard[nodePos.x][nodePos.y];
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

        if (linePoint.x > nodePoint.x) {	//add column
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
        var oldCover = myself.cover;
        updateCover();
        if (life.mylife > 0) {
            myself.score += (parseFloat(myself.cover - oldCover) * multiplier);
        }
        myself.displayScore();
        ///////////////////////
        //bar.updateCover();
        checkWin();
    };

    function checkWin() {
        if (game.cover >= 75.0 && life.mylife > 0) {
            //alert("You Win!!!");
            game.nextLevel();
            life.bear();
            passOne();
        }
    }

    this.getEnergy = function () {
        return bar.energy;
    };

    this.decreaseEnergy = function (cost) {
        bar.decrease(cost);
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

    function updateCover() {
        var cover = 0;
        for (var i = 0; i < myself.gameBoard.length; i++) {
            for (var j = 0; j < myself.gameBoard[i].length; j++) {
                if (myself.gameBoard[i][j].hasBalls == false) {
                    cover += (myself.gameBoard[i][j].rightPoint.x - myself.gameBoard[i][j].leftPoint.x) * (myself.gameBoard[i][j].rightPoint.y - myself.gameBoard[i][j].leftPoint.y);
                }
            }
        }
        myself.cover = (parseFloat(cover) / (myself.gameHeight * myself.gameWidth)) * 100;
    }

    function decreaseBonus() {
        multiplier = multiplier - decrease;
        decrease = decrease - 0.000001;
        if (multiplier <= 1) {
            clearInterval(decreaseID);
        }
    }

    //item
    function p1(e) {
        e.preventDefault();
    }

    function hole() {
        if (!ifEnough(80) || useItems[0]) return;
        useItems[0] = true;
        myself.decreaseEnergy(80);
        var container = document.createElement("div");
        var canvasDiv = document.getElementById('gameCanvas');
        var image = document.createElement("img");
        container.style.left = canvasDiv.clientLeft + parseInt(Math.random() * (game.gameWidth - 200)) + "px";
        container.style.top = canvasDiv.clientTop + parseInt(Math.random() * (game.gameHeight - 240)) + "px";
        container.style.width = "200px";
        container.style.height = "240px";
        container.style.position = "absolute";
        container.id = "holeDiv";
        image.style.height = "200px";
        image.style.width = "240px";
        image.src = "/Images/hole.png";
        image.addEventListener("click", p1, false);
        image.addEventListener("contextmenu", p1, false);
        container.appendChild(image);
        myself.canvasDiv.appendChild(container);
        setTimeout(function () {
            myself.canvasDiv.removeChild(container);
            useItems[0] = false;
        }, 10000);
    }

    function curve() {
        if (!ifEnough(150) || useItems[1]) return;
        useItems[1] = true;
        myself.decreaseEnergy(150);
        game.gravity.push(new Gravity(parseInt(Math.random() * (game.gameWidth - 200) + 100), parseInt(Math.random() * (game.gameHeight - 200) + 100), 50, 50000, myself));
        setTimeout(function () {
            game.gravity.shift();
            useItems[1] = false;
        }, 5000);
    }

    function shake() {
        if (!ifEnough(150) || useItems[2]) return;
        useItems[2] = true;
        myself.decreaseEnergy(150);
        var j = 0;
        var x = myself.canvasDiv;
        var y = document.getElementById("holeDiv");
        if (y) {
            y.l = parseInt(y.style.left);
            y.t = parseInt(y.style.top);
        }
        x.l = parseInt(x.style.left);
        x.t = parseInt(x.style.top);

        function shakeMyAss() {
            if (!y) {
                y = document.getElementById("holeDiv");
                if (y) {
                    y.l = parseInt(y.style.left);
                    y.t = parseInt(y.style.top);
                }
            }
            setTimeout(function () {
                x.style.left = (x.l + 10) + 'px';
                if (y) {
                    y.style.left = (y.l + 10) + 'px';
                }
                setTimeout(function () {
                    x.style.left = x.l + 'px';
                    if (y) {
                        y.style.left = y.l + 'px';
                    }
                }, Math.floor((Math.random() * 30) + 30));
            }, Math.floor((Math.random() * 30) + 30));
            setTimeout(function () {
                x.style.top = (x.t - 10) + 'px';
                if (y) {
                    y.style.top = (y.t - 10) + 'px';
                }
                setTimeout(function () {
                    x.style.top = x.t + 'px';
                    if (y) {
                        y.style.top = y.t + 'px';
                    }
                }, Math.floor((Math.random() * 30) + 30));
            }, Math.floor((Math.random() * 30) + 30));
            setTimeout(function () {
                x.style.top = (x.t + 10) + 'px';
                if (y) {
                    y.style.top = (y.t + 10) + 'px';
                }
                setTimeout(function () {
                    x.style.top = x.t + 'px';
                    if (y) {
                        y.style.top = y.t + 'px';
                    }
                }, Math.floor((Math.random() * 30) + 30));
            }, Math.floor((Math.random() * 30) + 30));
            setTimeout(function () {
                x.style.left = (x.l - 10) + 'px';
                if (y) {
                    y.style.left = (y.l - 10) + 'px';
                }
                setTimeout(function () {
                    x.style.left = x.l + 'px';
                    if (y) {
                        y.style.left = y.l + 'px';
                    }
                }, Math.floor((Math.random() * 30) + 30));
            }, Math.floor((Math.random() * 30) + 30));
            if (j++ < 160) {
                setTimeout(function () {
                    shakeMyAss();
                }, Math.floor((Math.random() * 30) + 30));
            }
            else {
                x.style.top = x.t + 'px';
                x.style.left = x.l + 'px';
                if (y) {
                    y.style.top = y.t + 'px';
                    y.style.left = y.l + 'px';
                }
            }
        }
        shakeMyAss();
        setTimeout(function () {
            useItems[2] = false;
        }, 15000);
    }

    function bigger(m) {
        if (!ifEnough(300) || useItems[3]) return;
        useItems[3] = true;
        myself.decreaseEnergy(300);
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
            useItems[3] = false;
        }, 5000);
    }

    function split() {
        if (!ifEnough(350) || useItems[4]) return;
        useItems[4] = true;
        myself.decreaseEnergy(350);
        var oldLen = game.balls.length;
        game.ballNumber *= 2;
        for (var i = 0; i < oldLen; i++) {
            var part = Math.random() * 0.4 * Math.PI;
            var quadrant = Math.floor(Math.random() * 4);
            var angle = quadrant * 0.5 * Math.PI + 0.05 * Math.PI + part;
            var speed_x = game.ballSpeed * Math.cos(angle);
            var speed_y = game.ballSpeed * Math.sin(angle);
            game.balls.push(new Ball(game.balls[i].position.x, game.balls[i].position.y, speed_x, speed_y, game.ballRadius, myself));
        }
        setTimeout(function () {
            game.ballNumber /= 2;
            game.balls.length = game.ballNumber;
            useItems[4] = false;
        }, 8000);
    }

    function accelerate(m) {
        if (!ifEnough(350) || useItems[5]) return;
        useItems[5] = true;
        myself.decreaseEnergy(350);
        for (var i = 0; i < game.balls.length; i++) {
            game.balls[i].speed.x *= m;
            game.balls[i].speed.y *= m;
        }
        setTimeout(function () {
            for (var i = 0; i < game.balls.length; i++) {
                game.balls[i].speed.x /= m;
                game.balls[i].speed.y /= m;
            }
            useItems[5] = false;
        }, 5000);
    }

    function ifEnough(cost) {
        if (cost <= game.getEnergy()) {
            return true;
        } else {
            return false;
        }
    }

    this.checkItem = function () {
        if (bar.energy < 80) {
            for (var i = 1; i < 7; i++) {
                var tagId = "item" + i;
                var itemImg = document.getElementById(tagId);
                itemImg.style.opacity = "0.4";
            }
        }
        else if (bar.energy >= 80 && bar.energy < 150) {
            for (var i = 1; i < 2; i++) {
                var tagId = "item" + i;
                var itemImg = document.getElementById(tagId);
                if (useItems[i - 1]) {
                    itemImg.style.opacity = "0.4";
                } else {
                    itemImg.style.opacity = "1";
                }
            }
            for (var j = i; j < 7; j++) {
                var tagId = "item" + j;
                var itemImg = document.getElementById(tagId);
                itemImg.style.opacity = "0.4";
            }
        }
        else if (bar.energy >= 150 && bar.energy < 300) {
            for (var i = 1; i < 4; i++) {
                var tagId = "item" + i;
                var itemImg = document.getElementById(tagId);
                if (useItems[i - 1]) {
                    itemImg.style.opacity = "0.4";
                } else {
                    itemImg.style.opacity = "1";
                }
            }
            for (var j = i; j < 7; j++) {
                var tagId = "item" + j;
                var itemImg = document.getElementById(tagId);
                itemImg.style.opacity = "0.4";
            }
        }
        else if (bar.energy >= 300 && bar.energy < 350) {
            for (var i = 1; i < 5; i++) {
                var tagId = "item" + i;
                var itemImg = document.getElementById(tagId);
                if (useItems[i - 1]) {
                    itemImg.style.opacity = "0.4";
                } else {
                    itemImg.style.opacity = "1";
                }
            }
            for (var j = i; j < 7; j++) {
                var tagId = "item" + j;
                var itemImg = document.getElementById(tagId);
                itemImg.style.opacity = "0.4";
            }
        }
        else if (bar.energy >= 350) {
            for (var i = 1; i < 7; i++) {
                var tagId = "item" + i;
                var itemImg = document.getElementById(tagId);
                if (useItems[i - 1]) {
                    itemImg.style.opacity = "0.4";
                } else {
                    itemImg.style.opacity = "1";
                }
            }
        }
    }

    this.keyPress = function (code) {
        switch (code) {
            case 49: hole();
                break;
            case 50: curve();
                break;
            case 51: shake();
                break;
            case 52: bigger(2);
                break;
            case 53: split();
                break;
            case 54: accelerate(2);
                break;
        }
    }
    this.displayScore = function () { };

    this.updateRanking = function (opposerScore, opposerRank) {

    }

    function rankDiff(winnerRank, loserRank) {
        var base = 10;
        var most = 200;
        var result = parseInt(100 * Math.pow((parseFloat(winnerRank) + 500.0) / (parseFloat(loserRank) + 0.333), 2));
        if (result < base) return base;
        if (result > most) return most;
        return result;
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

        if (myself.currLines.length) return;

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
                    newLine = new Line(clickPos.x, clickPos.y, endPoint.x, endPoint.y, myself.lineSpeed, myself);
                    myself.lines.push(newLine);
                    myself.currLines.push(newLine);
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
                    newLine = new Line(clickPos.x, clickPos.y, endPoint.x, endPoint.y, myself.lineSpeed, myself);
                    myself.lines.push(newLine);
                    myself.currLines.push(newLine);
                }
            }
        }

        if (myself.client) myself.client.sendGameState(myself.client);
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
        for (var i = 0; i < myself.gravity.length; i++) {
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

    this.nextLevel = function () {
        var win = document.createElement("img");
        var body = document.getElementById("body");
        win.src = "/Images/pass.png";
        win.style.position = "absolute";
        win.style.top = myself.canvasDiv.style.top;
        win.style.left = myself.canvasDiv.style.left;
        myself.canvasDiv.appendChild(win);

        setTimeout(function () {
            clearInterval(updateID);
            clearInterval(renderID);
            if (sendID != null) clearInterval(sendID);
            if (decreaseID != null) clearInterval(decreaseID);
        }, 3000.0 / myself.fps);

        setTimeout(function () {
            myself.canvasDiv.removeChild(win);


            myself.gameBoard = [[]];
            myself.balls = [];
            myself.ballNumber += 1;
            myself.ballSpeed += 10;
            myself.lines = [];
            myself.lineSpeed += 10;
            myself.currLines = [];
            myself.gravity = [];
            myself.cover = 0;
            //myself.score = 0;
            multiplier = 4.0;
            decrease = 0.0025;
            //initialEnergy = bar.energy;
            updateID = null;
            renderID = null;
            decreaseID = null;
            //bar.pauseUpdate();
            myself.begin();
        }, 2000);
    }
}

function passOne() {
    var passMedia = document.getElementById("passAudio");
    if (passMedia) {
        passMedia.currentTime = 0;
    }
    else {
        passMedia = document.createElement("audio");
        passMedia.id = "passAudio";
        passMedia.style.display = "none";
        passMedia.src = "/Media/smb_stage_clear.mp3";
        passMedia.controls = true;
        passMedia.autoplay = true;
        passMedia.play();
        document.body.appendChild(passMedia);
        passMedia.addEventListener("ended", function () {
            document.body.removeChild(passMedia);
        }, false);
    }
}

function dieOne() {
    var dieMedia;
    dieMedia = document.getElementById("dieAudio");
    if (dieMedia) {
        dieMedia.currentTime = 0;
    }
    else {
        dieMedia = document.createElement("audio");
        dieMedia.id = "dieAudio";
        dieMedia.style.display = "none";
        dieMedia.src = "/Media/smb_die.mp3";
        dieMedia.controls = true;
        dieMedia.autoplay = true;
        dieMedia.play();
        document.body.appendChild(dieMedia);
        dieMedia.addEventListener("ended", function () {
            document.body.removeChild(dieMedia);
        }, false);
    }
}


function Life(initLife, game) {
    var myself = this;
    this.mylife = initLife;
    this.timeRemain = 300000;
    this.timeAll = 300000;
    this.game = game;
    this.calTime = function () {
        if (myself.timeRemain > 0) {
            var d = new Date();
            if (myself.startTime) {
                myself.timeRemain = myself.timeAll + myself.startTime - d.getTime();
            }
            else {
                myself.startTime = d.getTime();
            }
            if (myself.timeRemain <= 0) {
                myself.timeRemain = 0;
                myself.mylife = 1;
                myself.die();
                myself.game.displayScore();
            }
            else {
                setTimeout(myself.calTime, 500);
                myself.game.displayScore();
            }
        }
    }

    this.die = function () {
        dieOne();
        if (myself.mylife > 0) {
            myself.mylife--;
            if (myself.mylife <= 0) {
                myself.timeRemain = 0;
                var end = document.createElement("img");
                end.src = "/Images/end.jpg";
                end.style.top = (parseInt(myself.game.canvasDiv.style.top) + 250) + 'px';
                end.style.left = (parseInt(myself.game.canvasDiv.style.left) + 80) + 'px';
                end.style.position = "absolute";
                end.height = 120;
                end.width = 300;
                myself.game.canvasDiv.appendChild(end);
            }
        }
    }
    this.bear = function () {
        myself.mylife++;
    }
}

function LiveGame(canvasDiv, fps, displayHeight, displayWidth) {
    this.canvasDiv = canvasDiv;
    this.canvas = canvasDiv.getElementsByClassName('game');
    this.display = 0;
    this.gameHeight = 0;
    this.gameWidth = 0;
    this.displayHeight = displayHeight;
    this.displayWidth = displayWidth;
    this.gameBoard = [[]];
    this.balls = [];
    this.ballNumber = 0;
    this.ballSpeed = 0;
    this.ballRadius = 0;
    this.lines = [];
    this.lineSpeed = 0;
    this.lineWidth = 0;
    this.fps = fps;
    this.updateRate = 80;
    this.currLines = [];
    this.gravity = [];
    this.cover = 0;
    this.score = 0;
    var myself = this;
    var scaleX = 1;
    var scaleY = 1;
    var updateID;
    var renderID;
    for (var i = 0; i < this.canvas.length; i++) {
        this.canvas[i].style.display = 'none';
        this.canvas[i].setAttribute('width', this.displayWidth);
        this.canvas[i].setAttribute('height', this.displayHeight);
    }

    this.updateState = function (state) {
        myself.gameHeight = state.gameHeight;
        myself.gameWidth = state.gameWidth;
        myself.gameBoard = [];
        for (var i = 0; i < state.gameBoard.length; i++) {
            myself.gameBoard[i] = [];
            for (var j = 0; j < state.gameBoard[i].length; j++) {
                myself.gameBoard[i][j] = new Node(new Point(state.gameBoard[i][j].leftPoint.x, state.gameBoard[i][j].leftPoint.y), new Point(state.gameBoard[i][j].rightPoint.x, state.gameBoard[i][j].rightPoint.y));
                myself.gameBoard[i][j].hasBalls = state.gameBoard[i][j].hasBalls;
            }
        }
        for (var i = 0; i < state.gameBoard.length; i++) {
            for (var j = 0; j < state.gameBoard[i].length; j++) {
                if (state.gameBoard[i][j].neighbor[Node.UP]) myself.gameBoard[i][j].neighbor[Node.UP] = myself.gameBoard[i][j - 1];
                if (state.gameBoard[i][j].neighbor[Node.DOWN]) myself.gameBoard[i][j].neighbor[Node.DOWN] = myself.gameBoard[i][j + 1];
                if (state.gameBoard[i][j].neighbor[Node.LEFT]) myself.gameBoard[i][j].neighbor[Node.LEFT] = myself.gameBoard[i - 1][j];
                if (state.gameBoard[i][j].neighbor[Node.RIGHT]) myself.gameBoard[i][j].neighbor[Node.RIGHT] = myself.gameBoard[i + 1][j];
            }
        }
        myself.gravity = [];
        for (var i = 0; i < state.gravity.length; i++) {
            myself.gravity[i] = new Gravity(state.gravity[i].center.x, state.gravity[i].center.y, state.gravity[i].radius, state.gravity[i].a, myself);
        }
        myself.balls = [];
        for (var i = 0; i < state.balls.length; i++) {
            myself.balls[i] = new Ball(state.balls[i].position.x, state.balls[i].position.y, state.balls[i].speed.x, state.balls[i].speed.y, state.balls[i].radius, myself);
        }
        myself.ballNumber = state.ballNumber;
        myself.ballSpeed = state.ballSpeed;
        myself.ballRadius = state.ballRadius;
        myself.lines = [];
        for (var i = 0; i < state.lines.length; i++) {
            myself.lines[i] = new Line(state.lines[i].startPoint.x, state.lines[i].startPoint.y, state.lines[i].endPoint.x, state.lines[i].endPoint.y, state.lines[i].drawSpeed, myself);
            myself.lines[i].drawPoint = new Point(state.lines[i].drawPoint.x, state.lines[i].drawPoint.y);
            myself.lines[i].finished = state.lines[i].finished;
        }
        myself.lineSpeed = state.lineSpeed;
        myself.lineWidth = state.lineWidth;
        myself.currLines = [];
        for (var i = 0; i < state.currLines.length; i++) {
            myself.currLines[i] = new Line(state.currLines[i].startPoint.x, state.currLines[i].startPoint.y, state.currLines[i].endPoint.x, state.currLines[i].endPoint.y, state.currLines[i].drawSpeed, myself);
            myself.currLines[i].drawPoint = new Point(state.currLines[i].drawPoint.x, state.currLines[i].drawPoint.y);
        }
        myself.cover = state.cover;
        myself.score = state.score;
        scaleX = parseFloat(this.displayWidth) / this.gameWidth;
        scaleY = parseFloat(this.displayHeight) / this.gameHeight;
    }

    this.begin = function (state) {
        //this.updateState(state);
        updateID = setInterval(update, 1000.0 / myself.updateRate);
        renderID = setInterval(render, 1000.0 / myself.fps);
    };

    this.addNode = function (line) {
        var linePoint = line.startPoint;
        var nodePos = getNode(linePoint);
        //console.log((myself.gameBoard[nodePos.x][nodePos.y]));
        var node = myself.gameBoard[nodePos.x][nodePos.y];
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

        if (linePoint.x > nodePoint.x) {	//add column
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
        var oldCover = myself.cover;
        updateCover();
        myself.displayScore();
        checkWin();
    };

    function checkWin() {
        if (game.cover >= 75.0 && life.mylife > 0) {
            //alert("You Win!!!");
            game.nextLevel();
            life.bear();
            passOne();
        }
    }

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

    function updateCover() {
        var cover = 0;
        for (var i = 0; i < myself.gameBoard.length; i++) {
            for (var j = 0; j < myself.gameBoard[i].length; j++) {
                if (myself.gameBoard[i][j].hasBalls == false) {
                    cover += (myself.gameBoard[i][j].rightPoint.x - myself.gameBoard[i][j].leftPoint.x) * (myself.gameBoard[i][j].rightPoint.y - myself.gameBoard[i][j].leftPoint.y);
                }
            }
        }
        myself.cover = (parseFloat(cover) / (myself.gameHeight * myself.gameWidth)) * 100;
    }

    this.displayScore = function () { };

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

    function toScaleX(n) {
        return Math.max(n * scaleX, 1);
    }

    function toScaleY(n) {
        return Math.max(n * scaleY, 1);
    }

    function render() {
        myself.canvas[(myself.display - 1 + myself.canvas.length) % myself.canvas.length].style.display = 'none';
        myself.canvas[myself.display].style.display = 'block';
        myself.display = (myself.display + 1) % myself.canvas.length;
        var c = myself.canvas[myself.display];
        var ctx = c.getContext("2d");
        ctx.clearRect(0, 0, toScaleX(myself.gameWidth), toScaleY(myself.gameHeight));
        ctx.lineWidth = toScaleX(myself.lineWidth);

        // lines
        ctx.strokeStyle = "black";
        ctx.beginPath();
        for (i = 0; i < myself.lines.length; i++) {
            var line = myself.lines[i];
            if (line.finished) {
                ctx.moveTo(toScaleX(line.startPoint.x), toScaleY(line.startPoint.y));
                ctx.lineTo(toScaleX(line.drawPoint.x), toScaleY(line.drawPoint.y));
            }
        }
        ctx.stroke();

        // lines
        ctx.strokeStyle = "blue";
        ctx.beginPath();
        for (i = 0; i < myself.lines.length; i++) {
            var line = myself.lines[i];
            if (!line.finished) {
                ctx.moveTo(toScaleX(line.startPoint.x), toScaleY(line.startPoint.y));
                ctx.lineTo(toScaleX(line.drawPoint.x), toScaleY(line.drawPoint.y));
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
                    ctx.rect(toScaleX(x), toScaleY(y), toScaleX(width), toScaleY(height));
                }
            }
        }
        ctx.fill();

        // gravity
        for (var i = 0; i < myself.gravity.length; i++) {
            var g = myself.gravity[i];
            var grd = ctx.createRadialGradient(toScaleX(g.center.x), toScaleY(g.center.y), 0, toScaleX(g.center.x), toScaleY(g.center.y), toScaleX(g.radius));
            grd.addColorStop(0, "black");
            grd.addColorStop(1, "rgba(0, 0, 0, 0)");
            ctx.fillStyle = grd;
            ctx.beginPath();
            ctx.arc(toScaleX(g.center.x), toScaleY(g.center.y), toScaleX(g.radius), 0, Math.PI * 2);
            ctx.fill();
        }

        // balls
        ctx.fillStyle = "red";
        ctx.beginPath();
        for (var i = 0; i < myself.balls.length; i++) {
            ctx.arc(toScaleX(myself.balls[i].position.x), toScaleY(myself.balls[i].position.y), toScaleX(myself.balls[i].radius), 0, Math.PI * 2);
            ctx.closePath();
        }
        ctx.fill();
    }
}

function init() {
    //alert("ok");

    var gameCanvasDiv = document.getElementById("gameCanvas");
    game = new Game(gameCanvasDiv, 500, 700, 1, 100, 4, 200, 2, 60);
    //alert("ok");
    game.begin();
    life = new Life(6, game);
    life.calTime();
    //var liveCanvasDiv = document.getElementById("liveGame");
    //live = new LiveGame(liveCanvasDiv, 60, 350, 300);
    var scoreDiv;
    scoreDiv = document.getElementById("score");
    console.log(scoreDiv);
    scoreDiv.innerHTML = "Score: " + game.score.toFixed(2) + " Cleared: 0%<br>Lives Left: " + life.mylife + "<br>Time Remaining " + parseInt(life.timeRemain / 60000.0)
		+ " : " + parseInt((life.timeRemain % 60000) / 1000);
    game.displayScore = function () {
        scoreDiv.innerHTML = "Score: " + game.score.toFixed(2) + " Cleared: " + game.cover.toFixed(2) + "<br>Lives Left: " + life.mylife + "<br>Time Remaining " + parseInt(life.timeRemain / 60000.0)
		+ " : " + parseInt((life.timeRemain % 60000) / 1000);
    };
    /*
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
    window.addEventListener("keypress", invokeItem, false);*/
}

function invokeItem(event) {
    game.keyPress(event.keyCode);
}

function clickItem(type) {
    switch (type) {
        case 1:
            game.keyPress(49);
            break;
        case 2:
            game.keyPress(50);
            break;
        case 3:
            game.keyPress(51);
            break;
        case 4:
            game.keyPress(52);
            break;
        case 5:
            game.keyPress(53);
            break;
        case 6:
            game.keyPress(54);
            break;
    }
}
