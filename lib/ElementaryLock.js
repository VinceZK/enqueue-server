/**
 * Created by VinceZK on 5/2/17.
 */

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
    this.waitTimer = undefined;
    this.timemoutTimer = undefined;
}

ElementaryLock.prototype.acquire = function(callback){

};