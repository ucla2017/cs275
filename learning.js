//Hang's task
var Learning = { REVISION: '01' };
Learning.jump = function jump()
{	
	//return false;
	//you can directly read visible[0] ~ visible[15] here
	//x: -1 for invisible, range from 0~70
	//y: -50 ~ 50 (it depends on fovy actually)
	return (Math.random() < 0.05);
}