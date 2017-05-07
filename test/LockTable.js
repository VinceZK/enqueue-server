/**
 * Created by VinceZK on 5/1/17.
 */
var LockTable = require('../dist/LockTable.js');

describe('Lock Table Unit Tests', function(){

    describe('eXclusive non-cumulative Lock and Argument Collision Tests',function(){
        var lock = {uuid:'1',
            name:'tab1',
            argument:['A','B','C','@'],
            mode:'X',
            owner:'O_1',
            waitTime:0,
            timeout:0};

        it('should success',function(){
            LockTable.addLock(lock, function(success){
                success.should.eql(true);
            });
        });

        it('should throw exception: Lock already exists!',function(){
            LockTable.addLock.bind(null,lock).should.throw('Lock already exists!');
        });

        it('should fail', function(){
            lock.uuid = '2';
            LockTable.addLock(lock, function(success,owner){
                success.should.eql(false);
                owner.should.be.eql('O_1');
            });
        });

        it('should fail', function(){
            lock.uuid = '3';
            lock.argument = ['A','B','C','D'];
            LockTable.addLock(lock, function(success,owner){
                success.should.eql(false);
                owner.should.be.eql('O_1');
            });
        });

        it('should fail', function(){
            lock.uuid = '4';
            lock.argument = ['@','B','C','D'];
            LockTable.addLock(lock, function(success,owner){
                success.should.eql(false);
                owner.should.be.eql('O_1');
            });
        });

        it('should success', function(){
            lock.uuid = '5';
            lock.argument = ['A','E','C','D'];
            LockTable.addLock(lock, function(success){
                success.should.eql(true);
            });
        });

        it('should success', function(){
            lock.uuid = '6';
            lock.argument = ['A','E','F','@'];
            LockTable.addLock(lock, function(success){
                success.should.eql(true);
            });
        });

        it('should remove all the locks', function(){
            LockTable.getLocksBy(null,'O_1').length.should.eql(3);
            LockTable.removeLock('1');
            LockTable.removeLock('5');
            LockTable.removeLock('6');
            LockTable.getLocksBy(null,'O_1').length.should.eql(0);
        })
    });

    describe('Share Lock Tests', function(){
        var lock = {uuid:'7',
            name:'tab2',
            argument:['A'],
            mode:'S',
            owner:'O_1',
            waitTime:0,
            timeout:0};

        it('should success', function(){
            LockTable.addLock(lock, function(success){
                success.should.eql(true);
            });
        });

        it('should success in 2nd lock', function(){
            lock.uuid = '8';
            LockTable.addLock(lock, function(success){
                success.should.eql(true);
            });
        });

        it('should fail', function(){
            lock.uuid = '9';
            lock.mode = 'E';
            LockTable.addLock(lock, function(success,owner){
                success.should.eql(false);
                owner.should.be.eql('O_1');
            });
        });

        it('should fail', function(){
            lock.uuid = '10';
            lock.mode = 'X';
            LockTable.addLock(lock, function(success,owner){
                success.should.eql(false);
                owner.should.be.eql('O_1');
            });
        });

        it('should fail', function(){
            lock.uuid = '11';
            lock.mode = 'O';
            LockTable.addLock(lock, function(success,owner){
                success.should.eql(false);
                owner.should.be.eql('O_1');
            });
        });

        it('should throw exception:The lock does not exist!', function(){
            LockTable.removeLock.bind(null,'AABB').should.throw('The lock does not exist!');
        });

        it('should remove the lock', function(){
            lock.uuid = '12';
            lock.mode = 'E';
            lock.owner = 'O_2';
            LockTable.removeLock('7');
            LockTable.addLock(lock, function(success,owner){
                success.should.eql(false);
                owner.should.be.eql('O_1');
                LockTable.removeLock('8');
                LockTable.addLock(lock, function(success){
                    success.should.eql(true);
                })
            });
        });

        it('should wait 1s, and fail', function(done){
            lock.uuid = '13';
            lock.mode = 'S';
            lock.waitTime = 1000;
            LockTable.addLock(lock, function(success,owner){
                success.should.eql(false);
                owner.should.be.eql('O_2');
                done();
            })
        });

        it('should wait 1s, and success', function(done){
            LockTable.removeLock('12');
            lock.uuid = '14';
            lock.mode = 'E';
            lock.waitTime = 0;
            lock.timeout = 500;
            LockTable.addLock(lock, function(success){
                success.should.eql(true);
                lock.uuid = '15';
                lock.mode = 'S';
                lock.waitTime = 1000;
                lock.timeout = 0;
                LockTable.addLock(lock,function(success){
                    success.should.eql(true);
                    done();
                })
            })
        });

        it('should clear all the locks', function(){
            LockTable.getLocksBy('tab2').length.should.eql(1);
            LockTable.removeLock('15');
            LockTable.getLocksBy('tab2').length.should.eql(0);
        })
    });

    describe('Exclusive Lock Tests', function(){
        var lock = {uuid:'16',
                    name:'tab3',
                    argument:['A'],
                    mode:'E',
                    owner:'O_1',
                    waitTime:0,
                    timeout:0};

        it('should success', function(){
            LockTable.addLock(lock, function(success){
                success.should.eql(true);
            });
        });

        it('should success for the 2nd lock from the same owner', function(){
            lock.uuid = '17';
            LockTable.addLock(lock, function(success){
                success.should.eql(true);
            });
        });

        it('should fail with different owner', function(){
            lock.uuid = '18';
            lock.owner = 'O_2';
            LockTable.addLock(lock, function(success,owner){
                success.should.eql(false);
                owner.should.be.eql('O_1');
            });
        });

        it('should wait 1s, and fail', function(done){
            lock.uuid = '19';
            lock.owner = 'O_2';
            lock.waitTime = 1000;
            LockTable.addLock(lock, function(success,owner){
                success.should.eql(false);
                owner.should.be.eql('O_1');
                done();
            })
        });

        it('should clear all the locks', function(){
            LockTable.getLocksBy().length.should.eql(2);
            LockTable.removeLock('16');
            LockTable.removeLock('17');
            LockTable.getLocksBy().length.should.eql(0);
        })
    });

    describe('Optimistic Lock Tests', function() {
        var lock = {
            uuid: '20',
            name: 'tab4',
            argument: ['A'],
            mode: 'O',
            owner: 'O_1',
            waitTime: 0,
            timeout: 0
        };

        it('should success', function () {
            LockTable.addLock(lock, function (success) {
                success.should.eql(true);
            });
        });

        it('should success for the 2nd lock from different owner', function(){
            lock.uuid = '21';
            lock.owner = 'O_2';
            LockTable.addLock(lock, function(success){
                success.should.eql(true);
            });
        });

        it('should fail for an S type lock', function(){
            lock.uuid = '22';
            lock.owner = 'O_1';
            lock.mode = 'S';
            LockTable.addLock(lock, function(success,owner){
                success.should.eql(false);
                owner.should.eql('O_1');
            });
        });

        it('should promote the Optimistic to Exclusive', function(done){
            lock.uuid = '22';
            lock.owner = 'O_1';
            lock.mode = 'E';
            lock.waitTime = 1000;
            LockTable.addLock(lock, function(success,owner){
                success.should.eql(false);
                owner.should.eql('O_1');
                done();
            });

            LockTable.promoteOptimisticLock('20').should.eql(true);
            LockTable.promoteOptimisticLock('21').should.eql(false);
            LockTable.getLocksBy('tab4','O_1').length.should.eql(2);
        });

        it('should clear all the locks', function(){
            LockTable.getLocksBy('tab4','O_1').length.should.eql(1);
            LockTable.removeLock('20');
            LockTable.getLocksBy('tab4','O_1').length.should.eql(0);
        })
    })
});