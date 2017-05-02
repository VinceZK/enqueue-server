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
