/**
 * Created by VinceZK on 5/6/17.
 * To run this test suite, you must first start the Enqueue Server.
 * $node index.js
 */

var lockClient = require('enqueue-client');

describe('Lock Server Test', function(){
    this.timeout(10000);
    describe('Basic Tests', function(){
        var lock = {"name":"tab1","argument":["A","@"],"mode":"E","owner":"O_1","waitTime":0,"timeout":0};
        var firstLockUUID = "";
        var secondLockUUID = "";
        it('should add a lock successfully', function(done){
            lockClient.lock(lock, function(lockUUID,RC){
                firstLockUUID = lockUUID;
                RC.should.eql('0');
                done();
            })
        });

        it('should fail to add a lock with collision', function(done){
            lock.owner = 'O_2';
            lockClient.lock(lock, function(lockUUID,RC,OWNER){
                RC.should.eql('1');
                OWNER.should.eql('O_1');
                done();
            })
        });

        it('should have one entry in lock table', function(done){
            lockClient.getLocksBy(null, null, function(RC, locks){
                RC.should.eql('0');
                locks.length.should.eql(1);
                done();
            })
        });

        it('should remove a lock', function(done){
            lockClient.unlock(firstLockUUID,function(RC){
                RC.should.eql('0');
                done();
            })
        });

        it('should be no item in the lock table', function(done){
            lockClient.getLocksBy(null, null, function(RC, locks){
                RC.should.eql('0');
                locks.length.should.eql(0);
                done();
            })
        });

        it('should add an Optimistic Lock', function(done){
            lock.mode = 'O';
            lock.uuid = '2';
            lockClient.lock(lock, function(lockUUID,RC){
                firstLockUUID = lockUUID;
                RC.should.eql('0');
                done();
            })
        });

        it('should add a 2nd Optimistic Lock', function(done){
            lock.mode = 'O';
            lock.uuid = '3';
            lockClient.lock(lock, function(lockUUID,RC){
                secondLockUUID = lockUUID;
                RC.should.eql('0');
                done();
            })
        });

        it('should have 2 items in the lock table', function(done){
            lockClient.getLocksBy(null, 'O_2', function(RC, locks){
                RC.should.eql('0');
                locks.length.should.eql(2);
                done();
            })
        });

        it('should promote the first Optimistic Lock', function(done){
            lockClient.promote(firstLockUUID, function(RC){
                RC.should.eql('0');
                done();
            })
        });

        it('should have 1 item in the lock table', function(done){
            lockClient.getLocksBy('tab1', null, function(RC, locks){
                RC.should.eql('0');
                locks.length.should.eql(1);
                done();
            })
        });

        it('should fail to promote the second Optimistic Lock', function(done){
            lockClient.promote(secondLockUUID, function(RC){
                RC.should.eql('2');
                done();
            })
        });

        it('should remove the first lock', function(done){
            lockClient.unlock(firstLockUUID,function(RC){
                RC.should.eql('0');
                done();
            })
        });

        it('should report error: The lock does not exist!', function(done){
            lockClient.unlock(secondLockUUID,function(RC,MSG){
                RC.should.eql('4');
                MSG.should.eql('The lock does not exist!');
                done();
            })
        });

        it('should have no item in the lock table', function(done){
            lockClient.getLocksBy('tab1', 'O_2', function(RC, locks){
                RC.should.eql('0');
                locks.length.should.eql(0);
                done();
            })
        });
    });

    describe('Test locks with waiting time and timeout', function(){
        var lock = {"name":"tab1","argument":["A","@"],"mode":"X","owner":"O_1","waitTime":1000,"timeout":0};
        var firstLockUUID = "";
        var secondLockUUID = "";
        var thirdLockUUID = "";

        it('should add a X lock', function(done){
            lockClient.lock(lock, function(lockUUID,RC){
                firstLockUUID = lockUUID;
                RC.should.eql('0');
                done();
            })
        });

        it('should fail to add the second X lock after 1s', function(done){
            let t0 = Date.now();
            lockClient.lock(lock, function(lockUUID,RC,OWNER){
                let t1 = Date.now();
                RC.should.eql('1');
                OWNER.should.eql('O_1');
                (t1-t0).should.be.greaterThanOrEqual(1000);
                done();
            })
        });

        it('should success to add the second X lock after 1s', function(done){
            lock.timeout = 500;
            setTimeout(()=>{lockClient.unlock(firstLockUUID,()=>{})},500);//Unlock the first lock after 500ms
            let t0 = Date.now();
            lockClient.lock(lock, function(lockUUID,RC){
                secondLockUUID = lockUUID;
                let t1 = Date.now();
                RC.should.eql('0');
                (t1-t0).should.be.lessThan(1000);
                done();
            })
        });

        it('should success to add the third X lock as the second one should timeout', function(done){
            lock.timeout = 0;
            let t0 = Date.now();
            lockClient.lock(lock, function(lockUUID,RC){
                thirdLockUUID = lockUUID;
                let t1 = Date.now();
                RC.should.eql('0');
                (t1-t0).should.be.lessThan(1000);
                done();
            })
        });

        it('should remove the third lock', function(done){
            lockClient.unlock(thirdLockUUID,function(RC){
                RC.should.eql('0');
                done();
            })
        });

        it('should have no item in the lock table', function(done){
            lockClient.getLocksBy(null,null,function(RC,locks){
                RC.should.eql('0');
                locks.length.should.eql(0);
                done();
            })
        });
    });

    describe('Performance Test', function(){
        this.timeout(10000);
        var lock = {"name":"tab1","argument":["A","@"],"mode":"X","owner":"O_1","waitTime":0,"timeout":0};
        var totalReq = 1000;
        it('should add 1000 X locks', function(done){
            var t0 = Date.now();
            var count = 0;
            for (let i=1; i<=totalReq; i++){
                lock.name = 'tab'+i;
                lockClient.lock(lock,function(lockUUID,RC,MSG){
                    count++;
                    console.log("lockUUID:"+lockUUID+" RC:"+RC+" MSG:"+MSG);
                    if(count === totalReq){
                        var t1 = Date.now();
                        console.log('Total time(ms):' + (t1-t0));
                        done();
                    }
                });
            }
        });
    });
});