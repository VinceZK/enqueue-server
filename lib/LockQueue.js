/**
 * Created by VinceZK on 5/2/17.
 */
import { ElementaryLock } from './ElementaryLock.js';
export { LockQueue };

function LockQueue(name, argument){
    this.name = name;
    this.argument = argument;
    this.queue = [];
}

LockQueue.prototype.push = function(eleLock, callback){
    switch(eleLock.mode){
        case 'S':
            if(this.queue.length && this.queue[0].eleLock.mode === 'S'){

            }
            break;
        case 'E':
            break;
        case 'X':
            break;
        case 'O':
            break;
        default :

    }

    this.queue.push({
        eleLock  : eleLock,
        callback : callback
    });

    if (this.queue.length === 1) {
        callback();
    }
};

LockQueue.prototype.remove = function(eleLock){
    let first = this.queue[0];
    if (first && first.eleLock === eleLock) {
        this.queue.shift();
        first = this.queue[0];

        if (first && first.callback)
            first.callback();
    } else {
        this.queue = this.queue.filter(function(item) {
            return item.eleLock !== eleLock;
        });
    }
};

LockQueue.prototype.getOwner = function(){
    return this.queue[0].owner;
};