window.addEventListener("load",init,false);

var height=700;
var width=1200;
var speed=200;
var number = 10;
var fps = 100;

var drawlineSpeed = 100;
var drawing = 0;
var balls = new Array(number);
var verticallines = new Array();
var horizontallines = new Array();

function ball(id, position_x, position_y, speed_x, speed_y){
	this.id = id;
	this.position_x = position_x;
	this.position_y = position_y;
	this.speed_x = speed_x;
	this.speed_y = speed_y;
	this.radius = 4;
}

function line(status, start_x, start_y){
	this.status = status; //1 represent vertical, 2 represent horizontal.
	this.ltfinish = 0;
	this.rdfinish = 0;//0 represent notfinish, 1 represent finished, -1 represent desdroy
	this.lt_x = start_x;
	this.lt_y = start_y;
	this.rd_x = start_x;
	this.rd_y = start_y;
}

function init(){
	for(var i=0; i<number; i++){
		var x = Math.random() * width;
		var y = Math.random() * height;
		var angle = Math.random() * 2 * Math.PI;
		var speed_x = speed * Math.cos(angle);
		var speed_y = speed * Math.sin(angle);
		balls[i] = new ball(i, x, y, speed_x, speed_y);
	}
	readyDrawLine();
	setInterval(update, 1000.0/fps);
	
}

function update(){
	var c=document.getElementById("myCanvas");
	var ctx=c.getContext("2d");
	ctx.clearRect(0,0,width,height);
	for(var i=0; i<balls.length; i++){
		//cxt.clearRect(balls[i].position_x-balls[i].radius, balls[i].position_y-balls[i].radius, balls[i].radius * 2, balls[i].radius * 2);
		move(balls[i]);
		ctx.fillStyle="#FF0000";
		ctx.beginPath();
		ctx.arc(balls[i].position_x, balls[i].position_y, balls[i].radius, 0, Math.PI*2,true);
		ctx.closePath();
		ctx.fill();
	}
	ctx.moveTo(100,100);
	ctx.lineTo(400,100);
	ctx.lineWidth = 2;
	ctx.stroke();
}

function move(aball){
	if(aball.position_x > 1200 || aball.position_x < 0){
		aball.speed_x = aball.speed_x * -1;
	}
	aball.position_x = aball.position_x + parseFloat(aball.speed_x/fps);
	
	if(aball.position_y > 700 || aball.position_y < 0){
		aball.speed_y = aball.speed_y * -1;
	}
	aball.position_y = aball.position_y + parseFloat(aball.speed_y/fps);
	
}

function readyDrawLine(){
	myCanvas.addEventListener("mouseclick", function(event){
		event.preventDefault();
		event.stopPropagate();
		if(drawing == 0){
			var x = event.clientX - myCanvas.offsetLeft;
			var y = event.clientY - myCanvas.offsetTop;
			drawing = new line(2, x, y);
		}
	},false);
}

function drawLine(){
	if(drawing != 0){
		var c=document.getElementById("myCanvas");
		var ctx=c.getContext("2d");
		if(drwaing.status == 1){
			drawing.
		}else{
			
		}
	}
	
}















