/**
 * Created by VinceZK on 5/1/17.
 */
const net = require('net');

const lockServer = net.createServer((socket) => {
    console.log('CLIENT CONNECTED: ' +
        socket.remoteAddress + ':' + socket.remotePort);

    socket.on('error', function(error){
        console.log('error:'+error);
        socket.end();
    });

    socket.on('end',function(){
        console.log('CLIENT DISCONNECTED');
    });

    socket.on('timeout', function(){

    });

    socket.on('data', function(data){
        console.log('data:'+data);
    });

});

lockServer.on('error', (err) => {
    throw err;
});

lockServer.listen(3721, () => {
    console.log('server bound');
});