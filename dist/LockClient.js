'use strict';
var net = require('net');
Object.defineProperty(exports, "__esModule", {
    value: true
});
/**
 * Created by VinceZK on 5/1/17.
 */

function lock(elementaryLock, callback) {
    elementaryLock['uuid'] = _generateUUID();
    var req = { reqUUID: _generateUUID(), OP: '1', eleLock: elementaryLock };
    _requestEnqueueServer(req, function (err, res) {
        if(err)return callback(elementaryLock.uuid,'3',err);
        switch (res.RC){
            case '0':
                callback(elementaryLock.uuid, res.RC);
                break;
            case '1':
                callback(elementaryLock.uuid, res.RC, res.OWNER);
                break;
            case '4':
                callback(elementaryLock.uuid, res.RC, res.MSG);
                break;
            default :
        }

    });
}

function unlock(lockUUID, callback) {
    var req = { reqUUID: _generateUUID(), OP: '2', lockUUID: lockUUID };
    _requestEnqueueServer(req, function (err, res) {
        if(err)return callback('3',err);
        callback(res.RC, res.MSG);
    });
}

function promote(lockUUID, callback) {
    var req = { reqUUID: _generateUUID(), OP: '3', lockUUID: lockUUID };
    _requestEnqueueServer(req, function (err, res) {
        if(err)return callback('3',err);
        callback(res.RC, res.MSG);
    });
}

function getLocksBy(lockName,lockOwner,callback) {
    var req = { reqUUID: _generateUUID(), OP: '4', lockName: lockName, lockOwner: lockOwner };
    _requestEnqueueServer(req, function (err, res) {
        if(err)callback('3',err);
        else callback('0',res.locks);
    });
}

function _requestEnqueueServer(req, callback) {
    var leftPart = "";
    var client = net.createConnection(3721, "127.0.0.1", function () {
        client.write(JSON.stringify(req) + "#");
        client.on('data', function (res) {
            var temp = leftPart.concat(res.toString());
            var results = temp.split("#");
            leftPart = results.pop();
            var rightRes = results.find(function (element) {
                return JSON.parse(element).reqUUID = req.reqUUID;
            });
            if (rightRes) {
                client.end();
                callback(null,JSON.parse(rightRes));
            }
        });
    });

    client.on('error',function(err){
        callback(err);
    })

}

var lut = [];
for (var i = 0; i < 256; i++) {
    lut[i] = (i < 16 ? '0' : '') + i.toString(16);
}
function _generateUUID() {
    var d0 = Math.random() * 0xffffffff | 0;
    var d1 = Math.random() * 0xffffffff | 0;
    var d2 = Math.random() * 0xffffffff | 0;
    var d3 = Math.random() * 0xffffffff | 0;
    return lut[d0 & 0xff] + lut[d0 >> 8 & 0xff] + lut[d0 >> 16 & 0xff] + lut[d0 >> 24 & 0xff] + lut[d1 & 0xff] + lut[d1 >> 8 & 0xff] + lut[d1 >> 16 & 0x0f | 0x40] + lut[d1 >> 24 & 0xff] + lut[d2 & 0x3f | 0x80] + lut[d2 >> 8 & 0xff] + lut[d2 >> 16 & 0xff] + lut[d2 >> 24 & 0xff] + lut[d3 & 0xff] + lut[d3 >> 8 & 0xff] + lut[d3 >> 16 & 0xff] + lut[d3 >> 24 & 0xff];
}

exports.lock = lock;
exports.unlock = unlock;
exports.promote = promote;
exports.getLocksBy = getLocksBy;