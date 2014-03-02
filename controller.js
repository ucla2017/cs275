//constant
var k_N = 20;			//# of pillars
var k_Gap = 12;			//the gap between pillars
var k_Gravity = -100;	//gravity
var k_Vjump = 32;		//constant velocity on Y-axis of the bird
var k_Vmove = -10;		//constant velocity on X-axis of pillars

//global variable
var score = 0;			//score of the game
var max_score = 0;		//max score of the game
var pillars = [];		//the queue for pillars
var visible = [16];		//the visible data for ML

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
	this.y = (Math.random() - 0.5) * 25;
	this.w = 5;		//fixed width
	this.h = 8;	//fixed height of the hole
}

//initialization before a new game
Controller.init = function()
{
	while(pillars.length > 0) pillars.pop();
	for(var i = 0, x = k_Gap * 4; i < k_N; ++i) {
		pillars.push(new Pillar(x));
		x += pillars[i].w + k_Gap;
	}
	bird.y = bird.v = score = died = 0;
}

//what the bird can see
Controller.perception = function perception()
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
	return visible;
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
		++score;
	}
	if (pillars.length == 0) pillars.push(new Pillar(k_Gap * 4));
	for(var i = pillars.length; i < k_N; ++i)
		pillars.push(new Pillar(pillars[i-1].x + pillars[i-1].w + k_Gap));
	max_score = Math.max(max_score, score);
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
