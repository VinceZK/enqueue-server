# enqueue-server
Node enqueue server is a clean NodeJS implementation for providing locking and concurrency controls on business object level.
It supports 4 types of locks:

1. Shared lock
2. Exclusive Lock
3. Exclusive but not cumulative Lock
4. Optimistic Lock

## Example
User A is editing a product master data, while user B also attempts to edit the same product. 
On the UI of product mater data maintenance, B is told that the product is currently locked by A, 
and he can only display it. This is a very usual case of pessimistic lock, 
and it can be easily achieved using enqueue-server's exclusive lock.

```javascript
var lockClient = require('enqueue-client');
var lock = {"name":"product","argument":["Computer"],"mode":"E","owner":"B"};

lockClient.lock(lock, function(lockUUID,RC,OWNER){
   if(RC === '0'){ //Lock is acquired
     //Allow Editing
     lockClient.unlock(lockUUID); //Unlock the object after finish editing
   }else{
     //Report message: "The product Computer is now locked by <OWNER>"
   }  
});    
```

## Architecture and Deployment
Enqueue server is started in one single Node process. 
It can be either deployed in the same server with your application, or be deployed in a standalone server.
In both cases, it can be shared among multiple application server processes. 

![Enqueue Server is behind application server process](ServerAccess.png)


## To Begin
1. Install it:

   ```bash
   $ npm install -g enqueue-server 
   ```
 
2. Start the enqueue server:

   CD to the install path of EnqueueServer

   ```bash
   $ node index.js 
   ``` 

3. Test to connect:   

    Download the [enqueue-client](https://www.npmjs.com/package/enqueue-client), 
    and execute following javascript in NodeJS.
    
    ```javascript    
    var lockClient = require('enqueue-client');
    lockClient.setEnqueueServerConnection('127.0.0.1', 3721);
    
    var lock = {"name":"product","argument":["Computer"],"mode":"E","owner":"B"};
    lockClient.lock(lock, function(lockUUID,RC,OWNER){
       console.log('Lock is acquired with lock UUID: '+lockUUID);
   
    });
    ```
## Lock Types
4 lock types are supported.

### Shared Lock (S)
Several users (transactions) can access locked data at the same time in display mode. 
Requests from further shared locks are accepted, even if they are from different users.

An exclusive lock (E) set by another user on an object that already has a shared lock will be rejected. 
Every extended exclusive lock (X) will also be rejected.

### Exclusive Locks (E)
An exclusive lock protects the locked object against all types of locks from other transactions. 
Only the same lock owner can reset the lock (accumulate).

### eXclusive non-cumulative (X)
Whereas exclusive locks can be requested several times by the same transaction and released one by one, 
an exclusive, non-cumulative lock can only be requested once by the same transaction. 
Each further lock request will be rejected.

### Optimistic Lock (O)
Optimistic locks initially behave like shared locks and can be converted into exclusive locks.

## Elementary Lock
An elementary lock contains following attributes:

**name**: lock object name, usually you can use the database table name.

**argument**: the key of the object, it is an array, 
as the object key may be combined with several fields. 
For example, an object has the key combined with 3 fields.
The argument ['A', 'B', '@'] stands for the object with first 2 key fields equals 'A' and 'B',
the wildcard letter represented here by '@'.

**mode**: 4 lock types: S, E, X, O.

**owner**: the owner who holds the lock, it can be a login user ID.

**waitTime**: time to wait until the lock is acquired, default is 0.

**timeout**: the time to hold the lock, after which the elementary lock will be released automatically. 
Default is 15 minutes.

## APIs
5 APIs are provided in the enqueue-client.

### lockClient.lock(elementaryLock, callback)
Acquire a lock for the elementaryLock. The _callback_ will be called once the result is received. 

```javascript    
var elementaryLock = {"name":"product","argument":["Computer"],"mode":"E","owner":"B"};
lockClient.lock(elementaryLock, function(lockUUID,RC,MSG){
   //lockUUID is a unique id for the acquired lock, you must record it so that you can unlock it afterward;
   //RC stands for the return code. 0:Success, 1:Fail, 3:Error in client, 4:Error in server;
   //MSG returns the detail error message if RC is 3 or 4, and the lock owner if RC is 1;      
});
```

### lockClient.unlock(lockUUID [,callback])
Release the lock with the specified lock UUID. The _callback_ is optional. 

```javascript
lockClient.unlock(lockUUID, function(RC,MSG){
   //RC: 0:Success, 4:Error in server;
   //MSG returns the detail error message if RC is 4;      
});
```
    
### lockClient.promote(lockUUID, callback)
Promote the optimistic lock with the specified lock UUID. The _callback_ receives the response from server. 

```javascript
lockClient.promote(lockUUID, function(RC,MSG){
   //RC: 0:Success, 2:Fail, 3:Error in client, 4:Error in server;
   //MSG returns the detail error message if RC is 3 or 4, and the existing lock owner if RC is 2;      
});
```
 
### lockClient.getLocksBy(lockName, lockOwner, callback)
Get a list of existing locks in the enqueue server by lockName and lockOwner. 
The callback receives an array of locks. 
If you give both lockName and lockOwner, it filters with both. 
If you only give either lockName or lockOwner, it filters with one of the given.
If you assign null for both, it return the complete lock list. 

```javascript
lockClient.getLocksBy(null, null, function(RC,locks){
   //RC: 0:Success, 3:Error in client;
   //locks is an array contains the locks if RC is 0 , and an error message if RC is 2;      
});
```
    
### lockClient.setEnqueueServerConnection(host, port)
Set the remote enqueue server's host and port. 
The method is optional if the enqueue server lies on the same server as the lock client. 
As the default host and port are "127.0.0.1" and "3721".
    
## Tests
You can find all the unit tests in the _test_ folder, and run them by:

   ```bash
   $ npm run test 
   ``` 

## Performance
Performance is tested to support around 3000 lock/unlock requests per second.

## License
[The MIT License](http://opensource.org/licenses/MIT)