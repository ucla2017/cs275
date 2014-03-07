
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
QLearningController.prototype.update = function (currentState, action, reward, nextState) {
    var maxFutureReward = 0;
    if (this.Q[nextState] != null)
        maxFutureReward = Math.max(this.Q[nextState][Action.CLICK],
                                   this.Q[nextState][Action.NON_CLICK]);    
    if (this.Q[currentState] == null) {
        this.Q[currentState] = new Array(2);
        this.Q[currentState][Action.CLICK] = 0;
        this.Q[currentState][Action.NON_CLICK] = 0;
    }
    var before = this.Q[currentState][action];	//for debug only
    this.Q[currentState][action] =
        this.alpha * (reward + this.gamma * maxFutureReward) +
        (1 - this.alpha) * this.Q[currentState][action];
    var after = this.Q[currentState][action];	//for debug only
    // console.log(before.toFixed(2) + "  -> " + after.toFixed(2) + ' ' + maxFutureReward);
    //alert('current state:' + currentState + '  action:' + action + '\n Q(y:n): ' + this.Q[currentState][0].toFixed(2) + ' : ' this.Q[currentState][1].toFixed(2));
}

QLearningController.prototype.getAction = function (currentState) {
    if (this.Q[currentState] == null) return Action.NON_CLICK;
    if (this.Q[currentState][Action.CLICK] > this.Q[currentState][Action.NON_CLICK])
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
QLearningController.prototype.convertState = function (visible) {
    var stateString = "";
    for (var i = 0; i < 8; ++i) {
        if (visible[i+i] == -1){
            if (visible[i+i+1] > 0)
                stateString += '-1,1|';
            else
                stateString += '-1,-1|';           
        }
        else {
            stateString += visible[i+i].toFixed(0) + ',';
            stateString += visible[i+i+1].toFixed(0) + '|';
        }
    }
    return stateString;
}

var qController = new QLearningController();

//Hang's task
var Learning = { REVISION: '01' };
Learning.jump = function jump()
{	
    currentState = qController.convertState(visible);
    action = qController.getAction(currentState);
    return action == Action.CLICK;
}

Learning.train = function train(currentVisible, jump, hasDie, newVisible)
{
    currentState = qController.convertState(currentVisible);
    nextState = qController.convertState(newVisible);
    action = jump ? Action.CLICK : Action.NON_CLICK;
    reward = qController.getReward(hasDie);
    qController.update(currentState, action, reward, nextState);
}
