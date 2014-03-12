
// Action: 2 possible actions
var Action = {
    CLICK 		: 0,
    NON_CLICK	: 1,
};

function QLearningController(){
    this.init();
}

QLearningController.prototype.init = function () {
    // Init the state space: S x A -> R
    this.Q = new Object();
    this.alpha = 0.7;  // 0.7
    this.gamma = 1;
}

// Update the Q array given one data point <s,a,r,s'>
// Q[s,a] ←(1-α) Q[s,a] + α(r+ γmaxa' Q[s',a']).
QLearningController.prototype.update = function (preState, action, reward, curState) {
    var maxFutureReward = 0;
    if (this.Q[curState] != null)
        maxFutureReward = Math.max(this.Q[curState][Action.CLICK],
                                   this.Q[curState][Action.NON_CLICK]);    
    if (this.Q[preState] == null) {
        this.Q[preState] = new Array(2);
        this.Q[preState][Action.CLICK] = 0;
        this.Q[preState][Action.NON_CLICK] = 0;
    }
    var before = this.Q[preState][action];	//for debug only
    this.Q[preState][action] =
        this.alpha * (reward + this.gamma * maxFutureReward) +
        (1 - this.alpha) * this.Q[preState][action];
    var after = this.Q[preState][action];	//for debug only
    // console.log(before.toFixed(2) + "  -> " + after.toFixed(2) + ' ' + maxFutureReward);
    //alert('current state:' + preState + '  action:' + action + '\n Q(y:n): ' + this.Q[preState][0].toFixed(2) + ' : ' this.Q[preState][1].toFixed(2));
}

QLearningController.prototype.getAction = function (curState) {
    if (this.Q[curState] == null) return Action.NON_CLICK;
    if (this.Q[curState][Action.CLICK] > this.Q[curState][Action.NON_CLICK])
        return Action.CLICK;
    else
        return Action.NON_CLICK;
}

QLearningController.prototype.getReward = function (hasDie){
    return (hasDie ? -1000 : 1);	
}

// State: 8 points (16 real number vector) -> state_id.
//return false;
//you can directly read visible[0] ~ visible[15] here
//x: -1 for invisible, range from 0~70
//y: -50 ~ 50 (it depends on fovy actually)
QLearningController.prototype.convertState = function (view) {
    var stateString = "";
    for (var i = 0; i < 8; ++i) {
        if (view[i+i] == -1){
            // if (view[i+i+1] > 0)
            //     stateString += '-1,1|';
            // else
            //     stateString += '-1,-1|';           
        }
        else {
            stateString += view[i+i].toFixed(1) + ',';
            stateString += view[i+i+1].toFixed(1) + '|';
        }
    }
    return stateString;
}

var qController = new QLearningController();

//Hang's task
var Learning = { REVISION: '01' };
Learning.jump = function jump(curView)
{	
    curState = qController.convertState(curView);    
    return qController.getAction(curState) == Action.CLICK;
}

Learning.train = function train(preView, jump, hasDie, curView)
{
    preState = qController.convertState(preView);
    curState = qController.convertState(curView);
    var action = jump ? Action.CLICK : Action.NON_CLICK;
    var reward = qController.getReward(hasDie);
    qController.update(preState, action, reward, curState);
}