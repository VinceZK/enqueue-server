/**
 * Created by VinceZK on 5/2/17.
 */
import { getLockQueue } from './LockTable.js';
export { ElementaryLock };
/**
 * Create an elementary lock entry
 * @param eleLock = {name:'tab1', argument:[A,B,C,@], mode:'E', owner:'O_1', waitTime:3000, timeout:3000}
 * @constructor
 */
function ElementaryLock(eleLock){
    this.name = eleLock.name;
    this.argument = eleLock.argument;
    this.mode = eleLock.mode;
    this.owner = eleLock.owner;
    this.cumCounter = 0;
    this.waitTime = eleLock.waitTime;
    this.timeout = eleLock.timeout;
    this.waitTimer = undefined;
    this.timeoutTimer = undefined;
}

ElementaryLock.prototype.acquire = function(callback){
    var thisLock = this;
    thisLock.lockQueue = getLockQueue(this.name,this.argument);

    if(thisLock.waitTime === 0 && thisLock.lockQueue.length){
        return callback(false,thisLock.lockQueue.getOwner());
    }

    thisLock.waitTimer = setTimeout(() => {
        if(thisLock !== thisLock.lockQueue[0]){
            thisLock.release();
            callback(false,thisLock.lockQueue.getOwner());
        }
        clearTimeout(thisLock.waitTimer);
        thisLock.waitTimer = undefined;
    }, thisLock.waitTime);

    thisLock.lockQueue.push(thisLock,function(){
        if (thisLock.waitTimer) {
            clearTimeout(thisLock.waitTimer);
            thisLock.waitTimer = undefined;
        }

        callback(true);

        thisLock.timeoutTimer = setTimeout(() => {
            if(thisLock === thisLock.lockQueue[0]){
                thisLock.release();
            }
            clearTimeout(thisLock.timeoutTimer);
            thisLock.timeoutTimer = undefined;
        }, thisLock.timeout);
    });
};

ElementaryLock.prototype.release = function(){
    if (this.waitTimer) {
        clearTimeout(this.waitTimer);
        this.waitTimer = undefined;
    }

    if (this.timeoutTimer) {
        clearTimeout(this.timeoutTimer);
        this.timeoutTimer = undefined;
    }

    this.lockQueue.remove(this);
};