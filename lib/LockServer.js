/**
 * Created by VinceZK on 5/1/17.
 */
const net = require('net');
const lockTable = require('./LockTable.js');

const lockServer = net.createServer((socket) => {
    var leftPart ="";

    socket.on('error', function(error){
        console.log(error);
        socket.destroy();
    });

    /**
     * Request Format:
     *  Lock:{"OP":"1","eleLock":
     *        {"uuid":"1","name":"tab1","argument":["A","@"],"mode":"E","owner":"O_1","waitTime":3000,"timeout":0}}
     *  Unlock:{"OP":"2", "lockID":"1"}
     *  Promote:{"OP":"3", "lockID":"1"}
     *  GetLocks:{"OP":"4", "lockName":"tab1", "lockOwner":"O_1"}
     */
    socket.on('data', function(data){
        let temp = leftPart.concat(data);
        let requests = temp.split("#");
        leftPart = requests.pop();

        requests.forEach((req)=>{
            //console.log(req);
            _processLockTable(JSON.parse(req),socket);
        });
    });
});

function _processLockTable(req,socket){
    switch (req.OP){
        case '1':
            try{
                lockTable.addLock(req.eleLock,(success,owner)=>{
                    if(success)socket.write(JSON.stringify({UUID:req.eleLock.uuid,RST:'0'})+"#");
                    else socket.write(JSON.stringify({UUID:req.eleLock.uuid,RST:'1',OWNER:owner})+"#");
                });
            }catch(err){
                socket.write(JSON.stringify({UUID:req.eleLock.uuid,RST:'4',MSG:err.message})+"#");
            }
            break;
        case '2':
            try{
                lockTable.removeLock(req.lockID);
                socket.write(JSON.stringify({UUID:req.eleLock.uuid,RST:'0'})+"#");
            }catch(err){
                socket.write(JSON.stringify({UUID:req.eleLock.uuid,RST:'4',MSG:err.message})+"#");
            }
            break;
        case '3':
            try{
                if(lockTable.promoteOptimisticLock(req.lockID))
                    socket.write(JSON.stringify({UUID:req.eleLock.uuid,RST:'0'})+"#");
                else
                    socket.write(JSON.stringify({UUID:req.eleLock.uuid,RST:'2'})+"#");
            }catch(err){
                socket.write(JSON.stringify({UUID:req.eleLock.uuid,RST:'4',MSG:err.message})+"#");
            }
            break;
        case '4':
            socket.write(JSON.stringify(lockTable.getLocksBy(req.lockName,req.lockOwner))+"#");
            break;
        default:
    }    
}
export {lockServer};