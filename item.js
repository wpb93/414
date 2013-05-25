function accelerate(m){
	for (var i = 0; i < game.balls.length; i++) {
			game.balls[i].speed.x *= m;
			game.balls[i].speed.y *= m;
		}
	setTimeout(function f(){
		for (var i = 0; i < game.balls.length; i++) {
			game.balls[i].speed.x /= m;
			game.balls[i].speed.y /= m;
		}
	},5000);
	return;
}

function bigger(m){
	for (var i = 0; i < game.balls.length; i++) {
			if(game.balls[i].radius*m <= 50)
				game.balls[i].radius *= m;
		}
	setTimeout(function f(){
		for (var i = 0; i < game.balls.length; i++) {
			if(game.balls[i].radius*m >= 50)
				game.balls[i].radius /= m;
		}
	},5000);
	return;
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
		game.balls[oldLen + i] = new Ball(game.balls[i].position.x,game.balls[i].position.y,speed_x,speed_y,game.ballRadius);
	}
	setTimeout(function (){
		game.balls.length /= 2;
		game.ballNumber /= 2;
	},8000);"
	
	return;

}

function curve(){

}
