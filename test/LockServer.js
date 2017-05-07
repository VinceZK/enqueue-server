/**
 * Created by VinceZK on 5/6/17.
 * To run this test suite, you must first start the Enqueue Server.
 * $node index.js
 */

const net = require("net");

var client = undefined;

describe('Lock Server Test', function(){
    this.timeout(10000);
    describe('Basic Tests', function(){
        var lock = {"uuid":"1","name":"tab1","argument":["A","@"],"mode":"E","owner":"O_1","waitTime":0,"timeout":0};

        beforeEach(function(done) {
            client = net.createConnection(3721, "127.0.0.1", function(){
                console.log('connected to server!');
                done();
            });
        });

        it('should add a lock successfully', function(done){
            client.write(JSON.stringify({OP:'1', eleLock:lock})+"#");
            client.on('data',(data)=>{
                JSON.parse(data).RST.should.eql('0');
                done();
            })
        });

        it('should report error: Lock already exists!', function(done){
            client.write(JSON.stringify({OP:'1', eleLock:lock})+"#");
            client.on('data',(data)=>{
                let response = JSON.parse(data);
                response.RST.should.eql('4');
                response.MSG.should.eql('Lock already exists!');
                done();
            })
        });

        it('should fail to add a lock with collision', function(done){
            lock.uuid = '2';
            lock.owner = 'O_2';
            client.write(JSON.stringify({OP:'1', eleLock:lock})+"#");
            client.on('data',(data)=>{
                let response = JSON.parse(data);
                response.RST.should.eql('1');
                response.OWNER.should.eql('O_1');
                done();
            })
        });

        it('should have one entry in lock table', function(done){
            client.write(JSON.stringify({OP:'4'})+"#");
            client.on('data',(data)=>{
                JSON.parse(data).length.should.eql(1);
                done();
            })
        });

        it('should remove a lock', function(done){
            client.write(JSON.stringify({OP:'2', lockID:'1'})+"#");
            client.on('data',(data)=>{
                JSON.parse(data).RST.should.eql('0');
                done();
            })
        });

        it('should be no item in the lock table', function(done){
            client.write(JSON.stringify({OP:'4'})+"#");
            client.on('data',(data)=>{
                JSON.parse(data).length.should.eql(0);
                done();
            })
        });

        it('should add an Optimistic Lock', function(done){
            lock.mode = 'O';
            lock.uuid = '2';
            client.write(JSON.stringify({OP:'1', eleLock:lock})+"#");
            client.on('data',(data)=>{
                JSON.parse(data).RST.should.eql('0');
                done();
            })
        });

        it('should add a 2nd Optimistic Lock', function(done){
            lock.mode = 'O';
            lock.uuid = '3';
            client.write(JSON.stringify({OP:'1', eleLock:lock})+"#");
            client.on('data',(data)=>{
                JSON.parse(data).RST.should.eql('0');
                done();
            })
        });

        it('should have 2 items in the lock table', function(done){
            client.write(JSON.stringify({OP:'4',lockOwner:'O_2'})+"#");
            client.on('data',(data)=>{
                JSON.parse(data).length.should.eql(2);
                done();
            })
        });

        it('should promote the first Optimistic Lock', function(done){
            client.write(JSON.stringify({OP:'3', lockID:'2'})+"#");
            client.on('data',(data)=>{
                JSON.parse(data).RST.should.eql('0');
                done();
            })
        });

        it('should have 1 item in the lock table', function(done){
            client.write(JSON.stringify({OP:'4',lockName:'tab1'})+"#");
            client.on('data',(data)=>{
                JSON.parse(data).length.should.eql(1);
                done();
            })
        });

        it('should fail to promote the second Optimistic Lock', function(done){
            client.write(JSON.stringify({OP:'3', lockID:'3'})+"#");
            client.on('data',(data)=>{
                JSON.parse(data).RST.should.eql('2');
                done();
            })
        });

        it('should remove the lock', function(done){
            client.write(JSON.stringify({OP:'2', lockID:'2'})+"#");
            client.on('data',(data)=>{
                JSON.parse(data).RST.should.eql('0');
                done();
            })
        });

        it('should report error: The lock does not exist!', function(done){
            client.write(JSON.stringify({OP:'2', lockID:'2'})+"#");
            client.on('data',(data)=>{
                let response = JSON.parse(data);
                response.RST.should.eql('4');
                response.MSG.should.eql('The lock does not exist!');
                done();
            })
        });

        it('should have no item in the lock table', function(done){
            client.write(JSON.stringify({OP:'4',lockName:'tab1',lockOwner:'O_2'})+"#");
            client.on('data',(data)=>{
                JSON.parse(data).length.should.eql(0);
                done();
            })
        });
    });

    describe('Test locks with waiting time and timeout', function(){
        var lock = {"uuid":"1","name":"tab1","argument":["A","@"],"mode":"X","owner":"O_1","waitTime":1000,"timeout":0};

        beforeEach(function(done) {
            client = net.createConnection(3721, "127.0.0.1", function(){
                console.log('connected to server!');
                done();
            });
        });

        it('should add a X lock', function(done){
            client.write(JSON.stringify({OP:'1', eleLock:lock})+"#");
            client.on('data',(data)=>{
                JSON.parse(data).RST.should.eql('0');
                done();
            })
        });

        it('should fail to add the second X lock after 1s', function(done){
            lock.uuid = '2';
            client.write(JSON.stringify({OP:'1', eleLock:lock})+"#");
            let t0 = Date.now();
            client.on('data',(data)=>{
                let t1 = Date.now();
                let response = JSON.parse(data);
                response.RST.should.eql('1');
                response.OWNER.should.eql('O_1');
                (t1-t0).should.be.greaterThanOrEqual(1000);
                done();
            })
        });

        it('should success to add the second X lock after 1s', function(done){
            lock.uuid = '2';
            lock.timeout = 500;
            client.write(JSON.stringify({OP:'1', eleLock:lock})+"#");
            var client2 = net.createConnection(3721, "127.0.0.1", function(){
                setTimeout(()=>{client2.write(JSON.stringify({OP:'2', lockID:'1'})+"#")},500);
            }); //Unlock the first lock after 500ms

            let t0 = Date.now();
            client.on('data',(data)=>{
                let t1 = Date.now();
                let response = JSON.parse(data);
                response.RST.should.eql('0');
                (t1-t0).should.be.lessThan(1000);
                done();
            })
        });

        it('should success to add the third X lock as the second one should timeout', function(done){
            lock.uuid = '3';
            lock.timeout = 0;
            client.write(JSON.stringify({OP:'1', eleLock:lock})+"#");
            let t0 = Date.now();
            client.on('data',(data)=>{
                let t1 = Date.now();
                let response = JSON.parse(data);
                response.RST.should.eql('0');
                (t1-t0).should.be.lessThan(1000);
                done();
            })
        });

        it('should remove the third lock', function(done){
            client.write(JSON.stringify({OP:'2', lockID:'3'})+"#");
            client.on('data',(data)=>{
                JSON.parse(data).RST.should.eql('0');
                done();
            })
        });

        it('should have no item in the lock table', function(done){
            client.write(JSON.stringify({OP:'4'})+"#");
            client.on('data',(data)=>{
                JSON.parse(data).length.should.eql(0);
                done();
            })
        });
    });

    describe.only('Performance Test', function(){
        this.timeout(3000);
        var lock = {"uuid":"1","name":"tab1","argument":["A","@"],"mode":"X","owner":"O_1","waitTime":1000,"timeout":0};

        it('should add 1000 X locks', function(done){
            var t0 = Date.now();
            for (let i=1; i<1000; i++){
                client = net.createConnection(3721, "127.0.0.1", function(){
                    lock.uuid = i;
                    lock.name = 'tab'+i;
                    client.write(JSON.stringify({OP:'1', eleLock:lock})+"#");
                    client.on('data',(data)=>{
                        //console.log(data);
                        //var temp = leftPart.concat(data);
                        client.end();
                        var response = data.toString().split("#");
                        //leftPart = requests.pop();rst
                        response.forEach(function(res){
                            console.log(res);
                            let rst = JSON.parse(res);
                            //console.log('lockID:'+rst.UUID+' RST:'+rst.RST);
                            //console.log(res);
                            if(rst.UUID === '999')done();

                        });
                        //console.log('lockID:'+lock.uuid+' lockName:'+lock.name+' response:'+data);
                        //if(lock.uuid === '1000'){
                        //    var t1 = Date.now();
                        //    console.log('Total time(ms): '+(t1-t0));
                        //    done();
                        //}
                    })
                });
            }
        });

    });
});