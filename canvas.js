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
            myself.speed.x = myself.speed.x * -1;
        }


        if (myself.position.y > game.gameHeight - myself.radius || myself.position.y < myself.radius) {
            myself.speed.y = myself.speed.y * -1;
        }
        
        for (var i = 0; i < game.lines.length; i++) {
            if (game.lines[i].direction == Line.HORIZONTAL) {
                var larger = game.lines[i].drawPoint.x >= game.lines[i].startPoint.x ? game.lines[i].drawPoint.x : game.lines[i].startPoint.x;
                var smaller = game.lines[i].drawPoint.x >= game.lines[i].startPoint.x ? game.lines[i].startPoint.x : game.lines[i].drawPoint.x;
                if (myself.position.y <= game.lines[i].startPoint.y + 4 && myself.position.y >= game.lines[i].startPoint.y - 4 && myself.position.x > smaller && myself.position.x < larger) {
                    myself.speed.y = myself.speed.y * -1;
                }
            } else {
                var larger = game.lines[i].drawPoint.y > game.lines[i].startPoint.y ? game.lines[i].drawPoint.y : game.lines[i].startPoint.y;
                var smaller = game.lines[i].drawPoint.y > game.lines[i].startPoint.y ? game.lines[i].startPoint.y : game.lines[i].drawPoint.y;
                if (myself.position.x <= game.lines[i].startPoint.x + 4 && myself.position.x >= game.lines[i].startPoint.x - 4 && myself.position.y > smaller && myself.position.y < larger) {
                    myself.speed.x = myself.speed.x * -1;
                }
            }
        }
        myself.position.x = myself.position.x + parseFloat(myself.speed.x) / game.fps;
        myself.position.y = myself.position.y + parseFloat(myself.speed.y) / game.fps;
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
    var myself = this;
    this.draw = function () {
        //console.log(myself.drawPoint.x + " " + myself.endPoint.x);
        //console.log(myself.drawPoint.y + " " + myself.endPoint.y);
        //console.log(" ");

        if (myself.direction == 1) {
            if (myself.drawPoint.x > myself.endPoint.x) {
                myself.drawPoint.x -= parseFloat(myself.drawSpeed) / game.fps;
            } else if (myself.drawPoint.x < myself.endPoint.x) {
                myself.drawPoint.x += parseFloat(myself.drawSpeed) / game.fps;
            }
        } else {
            if (myself.drawPoint.y > myself.endPoint.y) {
                myself.drawPoint.y -= parseFloat(myself.drawSpeed) / game.fps;
            } else if (myself.drawPoint.y < myself.endPoint.y) {
                myself.drawPoint.y += parseFloat(myself.drawSpeed) / game.fps;
            }
        }
    }
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

function Game(myCanvas, height, width, ballNumber, ballSpeed, ballRadius, lineSpeed, fps) {
    this.myCanvas = myCanvas;
    this.gameHeight = height;
    this.gameWidth = width;
    this.gameBoard = [[]];
    this.balls = new Array();
    this.ballNumber = ballNumber;
    this.ballSpeed = ballSpeed;
    this.ballRadius = ballRadius;
    this.lines = new Array();
    this.lineSpeed = lineSpeed;
    this.fps = fps;
    var myself = this;
    this.myCanvas.setAttribute('width', width);
    this.myCanvas.setAttribute('height', height);
    this.begin = function () {
        //new balls
        myself.gameBoard[0][0] = new Node(new Point(0, 0), new Point(myself.gameWidth, myself.gameHeight));
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
        myself.myCanvas.addEventListener("click", drawHorizontalLine, false);
        myself.myCanvas.addEventListener("contextmenu", drawVerticalLine, false);

        //update();
        setInterval(update, 1000.0 / myself.fps);
    }

    function getNode(x, y) {
        for (var i = 0; i < myself.gameBoard.length; i++) {
            for (var j = 0; j < myself.gameBoard[i].length; j++) {
                if (x > myself.gameBoard[i][j].leftPoint.x && x < myself.gameBoard[i][j].rightPoint.x && y > myself.gameBoard[i][j].leftPoint.y && y < myself.gameBoard[i][j].rightPoint.y) {
                    return new Point(i, j);
                }
            }
        }
    }

    function drawHorizontalLine(e) {
        e.stopPropagation();
        e.preventDefault();
        var x = e.clientX - myself.myCanvas.offsetLeft;
        var y = e.clientY - myself.myCanvas.offsetTop;
        var point = getNode(x, y);
        for (var node = myself.gameBoard[point.x][point.y]; node.neighbor[Node.LEFT]; node = node.neighbor[Node.LEFT]);
        var left = node.leftPoint.x;
        var leftNewline = new Line(x, y, left, y, myself.lineSpeed);
        myself.lines.push(leftNewline);

        for (node = myself.gameBoard[point.x][point.y]; node.neighbor[Node.RIGHT]; node = node.neighbor[Node.RIGHT]);
        var right = node.rightPoint.x;
        var rightNewline = new Line(x, y, right, y, myself.lineSpeed);
        myself.lines.push(rightNewline);
    }

    function drawVerticalLine(e) {
        e.stopPropagation();
        e.preventDefault();
        var x = e.clientX - myself.myCanvas.offsetLeft;
        var y = e.clientY - myself.myCanvas.offsetTop;
        var point = getNode(x, y);
        for (var node = myself.gameBoard[point.x][point.y]; node.neighbor[Node.UP]; node = node.neighbor[Node.UP]);
        var up = node.leftPoint.y;
        var upNewline = new Line(x, y, x, up, myself.lineSpeed);
        myself.lines.push(upNewline);

        for (node = myself.gameBoard[point.x][point.y]; node.neighbor[Node.DOWN]; node = node.neighbor[Node.DOWN]);
        var down = node.rightPoint.y;
        var downNewline = new Line(x, y, x, down, myself.lineSpeed);
        myself.lines.push(downNewline);
    }

    function update() {
        var c = document.getElementById("myCanvas");
        var ctx = c.getContext("2d");
        ctx.clearRect(0, 0, myself.gameWidth, myself.gameHeight);
        for(var i = 0; i < myself.balls.length; i++) {
            myself.balls[i].move();
            ctx.fillStyle = "#FF0000";
            ctx.beginPath();
            ctx.arc(myself.balls[i].position.x, myself.balls[i].position.y, myself.balls[i].radius, 0, Math.PI * 2, true);
            ctx.closePath();
            ctx.fill();
        }
        for (i = 0; i < myself.lines.length; i++) {
            if (myself.lines[i].endPoint.x < myself.lines[i].drawPoint.x - 2 || myself.lines[i].endPoint.x > myself.lines[i].drawPoint.x + 2 || myself.lines[i].endPoint.y < myself.lines[i].drawPoint.y - 2 || myself.lines[i].endPoint.y > myself.lines[i].drawPoint.y + 2) {
                var ifHit = false;
                for (var j = 0; j < myself.balls.length; j++) {
                    if (myself.lines[i].direction == Line.HORIZONTAL) {
                        var larger = myself.lines[i].drawPoint.x >= myself.lines[i].startPoint.x ? myself.lines[i].drawPoint.x : myself.lines[i].startPoint.x;
                        var smaller = myself.lines[i].drawPoint.x >= myself.lines[i].startPoint.x ? myself.lines[i].startPoint.x : myself.lines[i].drawPoint.x;
                        if (myself.balls[j].position.y <= myself.lines[i].startPoint.y + 4 && myself.balls[j].position.y >= myself.lines[i].startPoint.y - 4 && myself.balls[j].position.x > smaller && myself.balls[j].position.x < larger) {
                            ifHit = true;
                        }
                    } else {
                        var larger = game.lines[i].drawPoint.y > game.lines[i].startPoint.y ? game.lines[i].drawPoint.y : game.lines[i].startPoint.y;
                        var smaller = game.lines[i].drawPoint.y > game.lines[i].startPoint.y ? game.lines[i].startPoint.y : game.lines[i].drawPoint.y;
                        if (myself.balls[j].position.x <= myself.lines[i].startPoint.x + 4 && myself.balls[j].position.x >= myself.lines[i].startPoint.x - 4 && myself.balls[j].position.y > smaller && myself.balls[j].position.y < larger) {
                            ifHit = true;
                        }
                    }
                    if (ifHit) {
                        myself.lines.splice(i, 1);
                        break;
                    }
                }
                if (ifHit) {
                    continue;
                } else {
                    myself.lines[i].draw();
                }
            }
            
            ctx.moveTo(myself.lines[i].startPoint.x, myself.lines[i].startPoint.y);
            ctx.lineTo(myself.lines[i].drawPoint.x,myself.lines[i].drawPoint.y);
            ctx.lineWidth = 2;
            ctx.stroke();
        }
    }
}

function init() {
    var myCanvas = document.getElementById("myCanvas");
    game = new Game(myCanvas, 700, 600, 10, 400, 4, 200, 30);
    game.begin();
}

window.addEventListener("load", init, false);