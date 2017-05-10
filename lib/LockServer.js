/**
 * Created by VinceZK on 5/1/17.
 */
const net = require('net');
const lockTable = require('./LockTable.js');
var requestRegister = {};

const lockServer = net.createServer((socket) => {
    socket.on('error', function(error){
        console.log(error);
        socket.destroy();
    });

    /**
     * Request Format:
     *  Lock:{"reqUUID":"1","OP":"1","eleLock":
     *        {"uuid":"1","name":"tab1","argument":["A","@"],"mode":"E","owner":"O_1","waitTime":3000,"timeout":0}}
     *  Unlock:{"reqUUID":"1", "OP":"2", "lockUUID":"1"}
     *  Promote:{"reqUUID":"1", "OP":"3", "lockUUID":"1"}
     *  GetLocks:{"reqUUID":"1", "OP":"4", "lockName":"tab1", "lockOwner":"O_1"}
     */
    socket.on('data', function(data){
        _processLockTable(JSON.parse(data),socket);
    });

});

function _processLockTable(req,socket){
    switch (req.OP){
        case '1':
            try{
                lockTable.addLock(req.eleLock,(success,owner)=>{
                    if(success)socket.write(JSON.stringify({RC:'0'}));
                    else socket.write(JSON.stringify({RC:'1',OWNER:owner}));
                });
            }catch(err){
                socket.write(JSON.stringify({RC:'4',MSG:err.message}));
            }
            break;
        case '2':
            try{
                lockTable.removeLock(req.lockUUID);
                socket.write(JSON.stringify({RC:'0'}));
            }catch(err){
                socket.write(JSON.stringify({RC:'4',MSG:err.message}));
            }
            break;
        case '3':
            try{
                if(lockTable.promoteOptimisticLock(req.lockUUID))
                    socket.write(JSON.stringify({RC:'0'}));
                else
                    socket.write(JSON.stringify({RC:'2'}));
            }catch(err){
                socket.write(JSON.stringify({RC:'4',MSG:err.message}));
            }
            break;
        case '4':
            socket.write(JSON.stringify({locks:lockTable.getLocksBy(req.lockName,req.lockOwner)}));
            break;
        default:
    }
}
export {lockServer};