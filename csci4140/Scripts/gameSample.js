window.addEventListener("load",init,false);
var number = 1;
var balls = new Array(number);

function ball(id, position_x, position_y, speed_x, speed_y){
	this.id = id;
	this.position_x = position_x;
	this.position_y = position_y;
	this.speed_x = speed_x;
	this.speed_y = speed_y;
	this.radius = 4;
}

function init(){
	for(var i=0; i<number; i++){
		var x = Math.random() * 400;
		var y = Math.random() * 300;
		balls[i] = new ball(i, x, y, 1, 1);
	}
	display(balls);
	begin();

}
var times=0;

function begin(){
	update(balls);
	setTimeout(begin,10);
}

function update(balls){
	var c=document.getElementById("sampleCanvas");
	var cxt=c.getContext("2d");
	cxt.clearRect(0,0,400,300);
	for(var i=0; i<balls.length; i++){
		//cxt.clearRect(balls[i].position_x-balls[i].radius, balls[i].position_y-balls[i].radius, balls[i].radius * 2, balls[i].radius * 2);
		move(balls[i]);
		cxt.fillStyle="#FF0000";
		cxt.beginPath();
		cxt.arc(balls[i].position_x, balls[i].position_y, balls[i].radius, 0, Math.PI*2,true);
		cxt.closePath();
		cxt.fill();
	}
}


function display(balls){
	var c=document.getElementById("sampleCanvas");
	var cxt=c.getContext("2d");
	cxt.fillStyle="#FF0000";
	cxt.beginPath();
	for(var i=0; i<balls.length; i++){
		cxt.arc(balls[i].position_x, balls[i].position_y, balls[i].radius, 0, Math.PI*2,true);
	}
	cxt.closePath();
	cxt.fill();
	setTimeout(function(){cxt.clearRect(0,0,400,300);},10);
}


function move(aball){
	if(aball.position_x > 400 || aball.position_x < 0){
		aball.speed_x = aball.speed_x * -1;
	}
	aball.position_x = aball.position_x + aball.speed_x;
	
	if(aball.position_y > 300 || aball.position_y < 0){
		aball.speed_y = aball.speed_y * -1;
	}
	aball.position_y = aball.position_y + aball.speed_y;
	
}
