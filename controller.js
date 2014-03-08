//constant
var k_N = 20;			//# of pillars
var k_Gap = 12;			//the gap between pillars
var k_Gravity = -100;	//gravity
var k_Vjump = 32;		//constant velocity on Y-axis of the bird
var k_Vmove = -10;		//constant velocity on X-axis of pillars

//global variable
var curScore = 0;		//current score of the game
var maxScore = 0;		//max score of the game
var pillars = [];		//the queue for pillars
var curView = [16];		//what the bird can see in this frame for Learning
var preView = [16];		//what the bird saw in the last frame for Learning

var Controller = { REVISION: '01' };

//an object is a function
function Bird(y, w, h, v, fovy)
{
	this.y = y;				//position of eyes = upper-right corner = (0, y)
	this.w = w, this.h = h;	//lower-left corner of the body = (-w, y-h)
	this.v = v;				//velocity in y-axis
	this.fovy = fovy;		//in degree
}
var bird = new Bird(0, 2, 1, 0, 60);

function Pillar(x)
{
	this.x = x;
	this.y = 0;//(Math.random() - 0.5) * 10;
	this.w = 5;		//fixed width
	this.h = 8;		//fixed height of the hole
}

//initialization before a new game
Controller.init = function()
{
	while(pillars.length > 0) pillars.pop();
	for(var i = 0, x = k_Gap; i < k_N; ++i) {
		pillars.push(new Pillar(x));
		x += pillars[i].w + k_Gap;
	}
	bird.y = bird.v = curScore = 0;
	Controller.perception();
}

//what the bird can curView
Controller.perception = function perception()
{
	//save the last view, cannot use preView:=curView directly, since it will copy pointer which is incorrect
	for(var i = 0; i < 16; ++i) preView[i] = curView[i];
	//percept the new view
	var first = 0, second = 1;
	if (pillars[0].x + pillars[0].w <= 0) first = 1, second = 2;
	//initial value
	curView[0]  = curView[2]  = pillars[first].x;
	curView[4]  = curView[6]  = pillars[first].x + pillars[first].w;
	curView[1]  = curView[5]  = pillars[first].y + pillars[first].h/2 - bird.y;
	curView[3]  = curView[7]  = pillars[first].y - pillars[first].h/2 - bird.y;
	curView[8]  = curView[10] = pillars[second].x;
	curView[12] = curView[14] = pillars[second].x + pillars[second].w;
	curView[9]  = curView[13] = pillars[second].y + pillars[second].h/2 - bird.y;
	curView[11] = curView[15] = pillars[second].y - pillars[second].h/2 - bird.y;
	//visible check, x = -1 for invisible
	var k = Math.tan(bird.fovy * Math.PI / 360);
	for(var i = 14; i >= 0; i -= 2) {
		//fovy check
		if (curView[i] <= 0 || curView[i+1] > curView[i] * k || curView[i+1] < curView[i] * -k) {
			curView[i] = -1;	//x = -1 for invisible
			continue;
		}
		//block check
		for(var j = 0; j < i - 2; j += 4) {
			if (curView[j] > 0 &&
				(curView[i+1] * curView[j] > curView[i] * curView[j+1] || curView[i+1] * curView[j] < curView[i] * curView[j+3])) {
				curView[i] = -1;
				break;
			}
		}
	}	
}

Controller.getPreView = function getPreView()
{
	return preView;
}

Controller.getCurView = function getCurView()
{
	return curView;
}

//update positions
Controller.move = function move(delta)
{
	bird.y += delta * (bird.v + k_Gravity * delta / 2);	//s = vt + att/2
	bird.v += delta * k_Gravity;
	//update the pillars
	for(var i = 0; i < k_N; ++i)
		pillars[i].x += delta * k_Vmove;
	while(pillars.length > 0 && pillars[0].x + pillars[0].w <= -bird.w) {
		pillars.shift();
		++curScore;
	}
	if (pillars.length == 0) pillars.push(new Pillar(k_Gap * 4));
	for(var i = pillars.length; i < k_N; ++i)
		pillars.push(new Pillar(pillars[i-1].x + pillars[i-1].w + k_Gap));
	maxScore = Math.max(maxScore, curScore);
}

//collision detection, return true if the bird hit a pillar
Controller.collision = function collision()
{
	if (bird.y < -30 || bird.y > 30) return true;
	for(var i = 0; i < k_N; ++i) {
		if (pillars[i].x > 0) break;	//bird body: (-w, y-h) to (0, y)
		if (bird.y >= pillars[i].y + pillars[i].h/2) return true;			//collapse the upper pillar
		if (bird.y - bird.h <= pillars[i].y - pillars[i].h/2) return true;	//collapse the lower pillar
	}
	return false;
}