/**
 * Created by VinceZK on 5/1/17.
 */
var enqueueServer = require('./dist/LockServer.js').lockServer;

enqueueServer.on('error', (err) => {
    throw err;
});

enqueueServer.listen(3721, () => {
    console.log('Enqueue Server is Running');
});