function accelerate(m) {
    if (!checkEnergy(350)) return;
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
    if (!checkEnergy(300)) return;
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

function split() {
    if (!checkEnergy(350)) return;
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
    if (!checkEnergy(150)) return;
    game.gravity.push(new Gravity(parseInt(Math.random() * (game.gameWidth - 200) + 100), parseInt(Math.random() * (game.gameHeight - 200) + 100), 50, 50000));
    setTimeout(function () {
        game.gravity.shift();
    }, 5000);
}

function hole() {
    if (!checkEnergy(80)) return;
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
    image.src = "hole.png";
    image.addEventListener("click", p1, false);
    image.addEventListener("contextmenu", p1, false);
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
    if (!checkEnergy(150)) return;
    var j = 0;
    var x = document.getElementById("gameCanvas");
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

}

function checkEnergy(cost) {
    if (cost <= game.getEnergy()) {
        game.decreaseEnergy(cost);
        return true;
    } else {
        return false;
    }
}

function initButton() {
    var buttonDiv = document.getElementById("buttonContainer");
    var canvasDiv = document.getElementById("gameCanvas");
    buttonDiv.style.top = (parseInt(canvasDiv.style.top) + parseInt(canvasDiv.offsetHeight) + parseInt(canvasDiv.style.height)) + 'px';
    buttonDiv.style.left = canvasDiv.style.left;
    buttonDiv.style.position = "absolute";

}

function initHoleDiv() {

}

window.addEventListener("load", initHoleDiv, false);

//window.addEventListener("load", initButton, false);