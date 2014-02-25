

//global variable
var numPillar = 10;
var numVisiblePillar = 2;
var gap = 10;		//the gap between pillars
var pillars = [];	//the queue for pillars
var visible = [16];	//the visible data for ML
var gravity = -0.01;//(mm/ms^2)
var vJump = 10;		//constant velocity on Y-axis of the bird  	(m/s)
var vMove = -1;	//constant velocity on X-axis of pillars	(m/s)
var score = 0;		//score of the game

var Controller = { REVISION: '01' };

//an object is a function
<<<<<<< HEAD
function Bird(r, y, v, fovy)
{
	this.r = r;
	this.y = y;
	this.v = v;
	this.w = 2;
	this.h = 1;
	this.fovy = fovy;//degree
=======
function Bird(y, w, h, v, fovy)
{	
	this.y = y;				//position of eyes = upper-right corner = (0, y)
	this.w = w, this.h = h;	//lower-left corner of the body = (-w, y-h)
	this.v = v;				//velocity in y-axis
	this.fovy = fovy;		//in degree
>>>>>>> change description of bird and related functions
}
var bird = new Bird(0, 2, 1, 0, 60);

function Pillar(x)
{
	//fixed width, height, disBetweenPillar
	this.x = x;
	this.y = (Math.random() - 0.5) * 20;
	this.w = 5;
	this.h = 6;
}

Controller.init = function() {
	//initialization
	while(pillars.length > 0) pillars.pop();
	for(var i = 0, x = gap + gap; i < numPillar; ++i) {
		pillars.push(new Pillar(x));
		x += pillars[i].w + gap;
	}
	bird.y = bird.v = score = 0;
}

//call main when user start the game
Controller.update = function (delta) {
	//check visible
	vision();
	//update the bird
	hasJumped = jump(visible[16]);
	if (hasJumped) bird.v = vJump;
	move(delta);
	//collapse detection
	return [collision(), hasJumped];
}

//what the bird can see
function vision()
{
	var first = 0, second = 1;
	if (pillars[0].x + pillars[0].w <= 0) first = 1, second = 2;
	//initial value
	visible[0]  = visible[2]  = pillars[first].x;
	visible[4]  = visible[6]  = pillars[first].x + pillars[first].w;
	visible[1]  = visible[5]  = pillars[first].y + pillars[first].h/2 - bird.y;
	visible[3]  = visible[7]  = pillars[first].y - pillars[first].h/2 - bird.y;
	visible[8]  = visible[10] = pillars[second].x;
	visible[12] = visible[14] = pillars[second].x + pillars[second].w;
	visible[9]  = visible[13] = pillars[second].y + pillars[second].h/2 - bird.y;
	visible[11] = visible[15] = pillars[second].y - pillars[second].h/2 - bird.y;
	//visible check, x = -1 for invisible
	var k = Math.tan(bird.fovy * Math.PI / 360);
	for(var i = 14; i >= 0; i -= 2) {
		//fovy check
		if (visible[i] <= 0 || visible[i+1] > visible[i] * k || visible[i+1] < visible[i] * -k) {
			visible[i] = -1;	//x = -1 for invisible
			continue;
		}
		//block check
		for(var j = 0; j < i - 2; j += 4) {
			if (visible[j] > 0 && 
				(visible[i+1] * visible[j] > visible[i] * visible[j+1] || visible[i+1] * visible[j] < visible[i] * visible[j+3])) {
				visible[i] = -1;
				break;
			}
		}
	}
}

function move(delta)
{
	bird.y += delta * (bird.v + gravity * delta / 2);	//s = vt + att/2
	bird.v += delta * gravity;
	//update the pillars
	for(var i = 0; i < numPillar; ++i) 
		pillars[i].x += delta * vMove;
	while(pillars.length > 0 && pillars[0].x + pillars[0].w <= -bird.w) {
		pillars.shift();
		++score;
	}
	if (pillars.length == 0) pillars.push(new Pillar(gap + gap));
	for(var i = pillars.length; i < numPillar; ++i)
		pillars.push(new Pillar(pillars[i-1].x + pillars[i-1].w + gap));	
}

function collision()
{	
	for(var i = 0; i < numPillar; ++i) {
		if (pillars[i].x > 0) break;	//bird body: (-w, y-h) to (0, y)
		if (bird.y >= pillars[i].y + pillars[i].h/2) return true;			//collapse the upper pillar
		if (bird.y - bird.h <= pillars[i].y - pillars[i].h/2) return true;	//collapse the lower pillar		
	}
	return false;
}

//Hang's task
function jump()
{
	return (Math.random < 0.5)	
}