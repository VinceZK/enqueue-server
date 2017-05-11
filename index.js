/**
 * Created by VinceZK on 5/1/17.
 */
var enqueueServer = require('./dist/LockServer.js').lockServer;
var port = process.argv[2]?process.argv[2]:3721;
var maxConn = process.argv[3]?process.argv[3]:2000;

enqueueServer.on('error', (err) => {
    throw err;
});

enqueueServer.on('close', () => {
    console.log('Enqueue Server is closed!');
});

enqueueServer.maxConnections = maxConn;

enqueueServer.listen(port, () => {
    console.log('Enqueue Server is running on port: '+port);
    console.log('Allow max connections: '+maxConn);
});