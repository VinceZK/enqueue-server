/**
 * Created by VinceZK on 5/1/17.
 */
import { LockQueue } from './LockQueue.js';
export { getLockQueue };

var LockTable = [];

function getLockQueue(name, argument){

    let lockQueue =  LockTable.find((LockQueue) => {
        if(LockQueue.name === name && _checkArgumentCollision(LockQueue.argument, argument))
            return true;
    });


    if (!lockQueue) {
        lockQueue = new LockQueue(name,argument);
        LockTable.push(lockQueue);
    }

    return lockQueue;
}

function _checkArgumentCollision(argument1, argument2){
    if( !Array.isArray(argument1) || !Array.isArray(argument2)){
        throw new Error('Lock argument must be array!');
    }

    if(argument1.length !== argument2.length)return false;

    let isCollision = true;
    for(var i=0;i<argument1.length; i++){
        if(argument1[i] !== argument2[i] && (argument1[i] !== '@' || argument2[i] !== '@')){
            isCollision = false;
            break;
        }
    }

    return isCollision;
}