/**
 * Created by VinceZK on 5/1/17.
 */
var LockTable = require('../dist/LockTable.js');

describe('Lock Table Unit Tests', function(){
  it('should write the elementary lock request to lock table',function(){
      LockTable.write(obj, opt, function(fail, callback){
      if (fail) {
        // lock failed
        callback(fail);
        return;
      }
      // do whatever you want with your shared resource

      callback(undefined, {well: "done"});
    });
  });

});