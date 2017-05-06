/**
 * Created by VinceZK on 5/1/17.
 */
export {addLock, removeLock, promoteOptimisticLock, getLocksBy};

var LockTable = [];
var LockIndex = {};
/**
 * Add a lock
 * @param lock = {uuid:'1', name:'tab1', argument:[A,B,C,@], mode:'E', owner:'O_1', waitTime:3000, timeout:3000}
 * @param callback
 */
function addLock(lock, callback){
    if(LockIndex[lock.uuid]){
        throw new Error('Lock already exists!');
    }

    var lockQueue = _getLockQueue(lock.name, lock.argument);
    var thisLock = new ElementaryLock(lock);

    if(thisLock.waitTime > 0)
    thisLock.waitTimer = setTimeout(() => {
        if(thisLock.uuid !== lockQueue.queue[0].uuid){
            lockQueue.remove(thisLock.uuid);
            callback(false,lockQueue.getOwner());
        }
        clearTimeout(thisLock.waitTimer);
        thisLock.waitTimer = undefined;
    }, thisLock.waitTime);

    thisLock.lockOn = function(){
        if (thisLock.waitTimer) {
            clearTimeout(thisLock.waitTimer);
            thisLock.waitTimer = undefined;
        }

        callback(true);

        if (thisLock.timeout === 0)thisLock.timeout = 900000; //15 min by default
        thisLock.timeoutTimer = setTimeout(() => {
            if(thisLock.uuid === lockQueue.queue[0].uuid){
                lockQueue.remove(thisLock.uuid);
            }
            clearTimeout(thisLock.timeoutTimer);
            thisLock.timeoutTimer = undefined;
        }, thisLock.timeout);
    };

    thisLock.lockFail = function(){
        callback(false,lockQueue.getOwner())
    };

    lockQueue.push(thisLock);
}


function removeLock(lockUUID){
    if(!LockIndex[lockUUID])throw Error("The lock does not exist!");
    LockIndex[lockUUID].lockQueue.remove(lockUUID);
}

function promoteOptimisticLock(lockUUID){
    if(!LockIndex[lockUUID])return false;

    var lockQueue = LockIndex[lockUUID].lockQueue;
    var thisLock  = LockIndex[lockUUID].eleLock;

    if(lockQueue.getMode() === 'O'){
        thisLock.mode = 'E';
        let otherOptimisticLocks = lockQueue.queue.filter(function (eleLock) {
            return eleLock.mode === 'O';
        });
        otherOptimisticLocks.forEach((eleLock)=>{
            lockQueue.remove(eleLock.uuid);
        });
        return true;
    }else{
        return false
    }
}

function getLocksBy(name, owner){
    let eleLocks = Object.values(LockIndex).filter((item)=>{
        if(name && owner){
            return item.eleLock.name === name && item.eleLock.owner === owner;
        }else if(name && !owner){
            return item.eleLock.name === name;
        }else if(!name && owner){
            return item.eleLock.owner === owner;
        }else{
            return true;
        }
    });

    return eleLocks.map((item)=>{
        return {
            uuid:item.eleLock.uuid,
            name:item.eleLock.name,
            argument:item.eleLock.argument.toString(),
            mode:item.eleLock.mode,
            owner:item.eleLock.owner,
            waitTime:item.eleLock.waitTime,
            timeout:item.eleLock.timeout,
            timestamp:item.eleLock.timestamp
        }
    })
}

function _getLockQueue(name,argument){

    let lockQueue = LockTable.find((LockQueue) => {
        if(LockQueue.name === name && _checkArgumentCollision(LockQueue.getArgument(),argument))
            return true;
    });

    if (!lockQueue) {
        lockQueue = new LockQueue(name);
        LockTable.push(lockQueue);
    }

    return lockQueue;
}

function _checkArgumentCollision(argument1, argument2){
    let isCollision = true;

    if(!argument1) return isCollision; //Null argument1 means a complete set

    if( !Array.isArray(argument1) || !Array.isArray(argument2)){
        throw new Error('Lock argument must be array!');
    }

    if(argument1.length !== argument2.length)return !isCollision;

    for(var i=0;i<argument1.length; i++){
        if(argument1[i] !== argument2[i] && argument1[i] !== '@' && argument2[i] !== '@'){
            isCollision = false;
            break;
        }
    }

    return isCollision;
}

/**
 *
 * @param name
 * @param argument
 * @constructor
 */
function LockQueue(name){
    this.name = name;
    this.queue = [];
}

/**
 * Push an elementary lock to the lock queue.
 * @param eleLock: Elementary lock
 */
LockQueue.prototype.push = function(eleLock){
    switch(eleLock.mode){
        case 'S':
            /**
             * Share(S): Several users can access locked data at the same time in display mode.
             * Requests from further shared locks are accepted, even if they are from different users.
             * An exclusive lock (E) set by another user on an object that already has a shared lock will be rejected.
             */
            if(this.queue.length === 0){
                this.queue.push(eleLock);
                LockIndex[eleLock.uuid] = {lockQueue: this, eleLock: eleLock};
                eleLock.lockOn();
            }else if(this.queue.length > 0 && this.getMode() === 'S'){
                this.queue.splice(1,0,eleLock); //Insert the lock to the second position
                LockIndex[eleLock.uuid] = {lockQueue: this, eleLock: eleLock};
                eleLock.lockOn();
            }else if(eleLock.waitTimer){
                this.queue.push(eleLock);
                LockIndex[eleLock.uuid] = {lockQueue: this, eleLock: eleLock};
            }else{
                eleLock.lockFail();
            }
            break;
        case 'E':
            /**
             * Exclusive(E): An exclusive lock protects the locked object against all types of locks
             * from other transactions. Only the same lock owner can reset the lock (accumulate)
             */
            if(this.queue.length === 0){
                this.queue.push(eleLock);
                LockIndex[eleLock.uuid] = {lockQueue: this, eleLock: eleLock};
                eleLock.lockOn();
            }else if(this.getMode() === 'E' && this.getOwner() === eleLock.owner){
                this.queue.push(eleLock);
                LockIndex[eleLock.uuid] = {lockQueue: this, eleLock: eleLock};
                eleLock.lockOn();
            }else if(eleLock.waitTimer){
                this.queue.push(eleLock);
                LockIndex[eleLock.uuid] = {lockQueue: this, eleLock: eleLock};
            }else{
                eleLock.lockFail();
            }
            break;
        case 'X':
            /**
             * eXclusive non-cumulative(X): An exclusive, non-cumulative lock can only be requested once
             * by the same transaction. Each further lock request will be rejected.
             */
            if(this.queue.length === 0){
                this.queue.push(eleLock);
                LockIndex[eleLock.uuid] = {lockQueue: this, eleLock: eleLock};
                eleLock.lockOn();
            }else if(eleLock.waitTimer){
                this.queue.push(eleLock);
                LockIndex[eleLock.uuid] = {lockQueue: this, eleLock: eleLock};
            }else{
                eleLock.lockFail();
            }
            break;
        case 'O':
            /**
             * Optimistic(O): Optimistic locks initially behave like shared locks and can be
             * converted into exclusive locks.
             */
            if(this.queue.length === 0){
                this.queue.push(eleLock);
                LockIndex[eleLock.uuid] = {lockQueue: this, eleLock: eleLock};
                eleLock.lockOn();
            }else if(this.queue.length && this.getMode() === 'O'){
                this.queue.splice(1,0,eleLock); //Insert the lock to the second position
                LockIndex[eleLock.uuid] = {lockQueue: this, eleLock: eleLock};
                eleLock.lockOn();
            }else if(eleLock.waitTimer){
                this.queue.push(eleLock);
                LockIndex[eleLock.uuid] = {lockQueue: this, eleLock: eleLock};
            }else{
                eleLock.lockFail();
            }
            break;
        default :

    }
};

LockQueue.prototype.remove = function(lockUUID){
    let firstLock = this.queue[0];
    if (firstLock && firstLock.uuid === lockUUID) {
        this.queue.shift();
        firstLock = this.queue[0];
        if (firstLock)firstLock.lockOn();
    } else {
        this.queue = this.queue.filter(function(eleLock) {
            return eleLock.uuid !== lockUUID;
        });
    }
    delete LockIndex[lockUUID];
};

LockQueue.prototype.getOwner = function(){
    return this.queue.length?this.queue[0].owner:null;
};

LockQueue.prototype.getMode = function(){
    return this.queue.length?this.queue[0].mode:null;
};

LockQueue.prototype.getArgument = function(){
    return this.queue.length?this.queue[0].argument:null;
};

LockQueue.prototype.getLength = function(){
    return this.queue.length;
};

/**
 * Elementary lock entry
 * @param eleLock = {uuid:'1', name:'tab1', argument:[A,B,C,@], mode:'E', owner:'O_1', waitTime:3000, timeout:3000}
 * @constructor
 */
function ElementaryLock(eleLock){
    this.uuid = eleLock.uuid;
    this.name = eleLock.name;
    this.argument = eleLock.argument;
    this.mode = eleLock.mode;
    this.owner = eleLock.owner;
    this.waitTime = eleLock.waitTime;
    this.timeout = eleLock.timeout;
    this.waitTimer = undefined;
    this.lockOn = undefined;
    this.lockFail = undefined;
    this.timeoutTimer = undefined;
    this.timestamp = new Date().toLocaleString();
}