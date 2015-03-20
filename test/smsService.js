var should = require('should');
var request = require('request');
var bodyParser = require('body-parser');
var sinon = require('sinon');
var config = require('../config');
var express = require('express');
var subscriptionManager = require('../lib/subscription');
var responseManager = require('../lib/response');

var app = express();

try {
    var provider = require('../lib/providers/'+config.provider);
}
catch (err) {
    debug('Error : couldn\'t load provider %o: %o', config.provider, err);
    process.exit(1);
}

var dispatcher = require('../lib/dispatcher');

process.env.PORT=8082;

require('../app.js');

var phone = '0033684253208';
var localUrl = 'http://127.0.0.1:8082';
var token = '1234';


describe('Sms send', function () {
    it('should return 200 Ok', function (done) {
        var params = {phone: phone, msg: 'sending test'};
        var url = localUrl + '/api/v1/send';
        var opts = {url: url, method:'POST', json:true, headers: {token: token}, body: params};

        request(opts, function (error, response, body) {
            should.not.exist(error);
            (200).should.equal(response.statusCode);
            done();
        });
    });

    it('with a wrong pattern of phone parameter should return 400 Error', function (done) {
        var params = {phone: '033684273228', msg: 'sending test'};
        var url = localUrl + '/api/v1/send';
        var opts = {url: url, method:'POST', json:true, headers: {token: token}, body: params};

        request(opts, function (error, response, body) {
            (400).should.equal(response.statusCode);
            done();
        });
    });

    it('with no msg parameter should return 400 Error', function (done) {
        var params = {phone: phone};
        var url = localUrl + '/api/v1/send';
        var opts = {url: url, method:'POST', json:true, headers: {token: token}, body: params};

        request(opts, function (error, response, body) {
            (400).should.equal(response.statusCode);
            done();
        });
    });

    it('with no parameter should return 400 Error', function (done) {
        var params = {};
        var url = localUrl + '/api/v1/send';
        var opts = {url: url, method:'POST', json:true, headers: {token: token}, body: params};

        request(opts, function (error, response, body) {
            (400).should.equal(response.statusCode);
            done();
        });
    });
});

describe('Sms subscribe', function () {
    it('should return 200 Ok', function (done) {
        var params = {description: 'blabla', phone: phone, callbackUrl: localUrl};
        var url = localUrl + '/api/v1/subscribe';
        var opts = {url: url, method:'POST', json:true, headers: {token: token}, body: params};

        request(opts, function (error, response, body) {
            (200).should.equal(response.statusCode);
            done();
        });
    });

    it('with no description parameter should return 400 Error', function (done) {
        var params = {phone: phone, callbackUrl: localUrl};
        var url = localUrl + '/api/v1/subscribe';
        var opts = {url: url, method:'POST', json:true, headers: {token: token}, body: params};

        request(opts, function (error, response, body) {
            (400).should.equal(response.statusCode);
            done();
        });
    });

    it('with wrong pattern of phone parameter should return 400 Error', function (done) {
        var params = {description: 'blabla', phone: '033684273228', callbackUrl: localUrl};
        var url = localUrl + '/api/v1/subscribe';
        var opts = {url: url, method:'POST', json:true, headers: {token: token}, body: params};

        request(opts, function (error, response, body) {
            (400).should.equal(response.statusCode);
            done();
        });
    });

    it('with no parameter should return 400 Error', function (done) {
        var params = {};
        var url = localUrl + '/api/v1/subscribe';
        var opts = {url: url, method:'POST', json:true, headers: {token: token}, body: params};

        request(opts, function (error, response, body) {
            (400).should.equal(response.statusCode);
            done();
        });
    });
});


describe('Sms unsubscribe', function () {
    it('should return 200 Ok', function (done) {
        var params = {phone: phone, callbackUrl: localUrl};
        var url = localUrl + '/api/v1/unsubscribe';
        var opts = {url: url, method:'POST', json:true, headers: {token: token}, body: params};

        request(opts, function (error, response, body) {
            (200).should.equal(response.statusCode);
            done();
        });
    });

    it('with wrong pattern of phone parameter should return 400 Error', function (done) {
        var params = {phone: '033684273228', callbackUrl: localUrl};
        var url = localUrl + '/api/v1/unsubscribe';
        var opts = {url: url, method:'POST', json:true, headers: {token: token}, body: params};

        request(opts, function (error, response, body) {
            (400).should.equal(response.statusCode);
            done();
        });
    });

    it('with none existing subscription should return 401 Error', function (done) {
        var params = {phone: phone, callbackUrl: localUrl+'blalaal'};
        var url = localUrl + '/api/v1/unsubscribe';
        var opts = {url: url, method:'POST', json:true, headers: {token: token}, body: params};

        request(opts, function (error, response, body) {
            (200).should.equal(response.statusCode);
            done();
        });
    });
});


describe('onIncomingSms', function () {
    var dispatcherMock = sinon.mock(dispatcher);
    var port = 3000;

    before(function (done) {
        // Server to simulate the callback
        app.use(bodyParser.urlencoded({extended: true}));
        app.use(bodyParser.json());
        app.post('/', function (req, res) {
            should.exist(req.body);
            should.exist(req.body.phone);
            should.exist(req.body.msg);
            should.exist(req.body.time);
            should.exist(req.body.description);
            res.send('done');
        });
        app.post('/404', function (req, res) {
            res.status(404).json({});
        });
        app.listen(port);
        done();
    });

    beforeEach(function (done) {
        // delete subscription for the phone number
        subscriptionManager.remove({'phone': phone}, function(error) {
            if(error) {
                should.not.exist(error);
                done();
            }
            responseManager.remove({'phone': phone}, function(error) {
                if(error) {
                    should.not.exist(error);
                }
                done();
            });
        });
    });

    afterEach(function(done) {
        dispatcherMock.restore();
        done();
    });

    it('should callback when receiver responds', function (done) {
        var params = {phone: phone, callbackUrl: 'http://localhost:'+port+'/', description: 'bablab'};
        var url = localUrl + '/api/v1/subscribe';
        var opts = {url: url, method:'POST', json:true, headers: {token: token}, body: params};

        request(opts, function (error, response, body) { // save the subscription
            should.not.exist(error);

            dispatcher.onIncomingSms({phone: phone, msg: 'C', time: new Date().getTime()}, function(err) {
                should.not.exist(err);
                done();
            });
        });
    });


    it('should no callback when receiver responds because no subscription', function (done) {
        dispatcherMock.expects('sendToCallbackUrl').never();
        dispatcher.onIncomingSms({phone: phone, msg: 'C', time: new Date().getTime()}, function(err) {
            should.not.exist(err);
            dispatcherMock.verify();
            done();
        });
    });

    it('should delete the subscription when callback return 404', function (done) {
        var params = {phone: phone, callbackUrl: 'http://localhost:'+port+'/404', description: 'bablab'};
        var url = localUrl + '/api/v1/subscribe';
        var opts = {url: url, method:'POST', json:true, headers: {token: token}, body: params};

        request(opts, function (error, response, body) { // save the subscription
            should.not.exist(error);

            dispatcher.onIncomingSms({phone: phone, msg: 'C', time: new Date().getTime()}, function(err) {
                should.not.exist(err);

                // check if the subscription is deleted
                subscriptionManager.find({phone: phone, callbackUrl: 'http://localhost:'+port+'/404'}, function (err, subscriptions) {
                    should.not.exist(err);
                    subscriptions.should.be.instanceof(Array).and.have.lengthOf(0);
                    done();
                });
            });
        });
    });

    it('should ask "which is recipient" because 2 subscriptions for this number', function (done) {
        var params = {phone: phone, callbackUrl: 'http://localhost:'+port+'/', description: 'bablab'};
        var url = localUrl + '/api/v1/subscribe';
        var opts = {url: url, method:'POST', json:true, headers: {token: token}, body: params};

        request(opts, function (error, response, body) { // save the subscription
            should.not.exist(error);
            var params = {phone: phone, callbackUrl: 'http://localhost:'+port+'/otherUrl', description: 'bablab'};
            var opts = {url: url, method:'POST', json:true, headers: {token: token}, body: params};

            request(opts, function (err, response, body) { // save the 2nd subscription
                should.not.exist(err);

                dispatcher.onIncomingSms({phone: phone, msg: 'C', time: new Date().getTime()}, function (err) {
                    should.not.exist(err);

                    dispatcher.onIncomingSms({phone: phone, msg: '2', time: new Date().getTime()}, function (err) {
                        should.not.exist(err);
                        done();
                    });
                });
            });
        });
    });

    it('saved 2 subscriptions; only the last one has to be saved in db', function (done) {
        var params = {phone: phone, callbackUrl: 'http://localhost:'+port+'/', description: 'bablab'};
        var url = localUrl + '/api/v1/subscribe';
        var opts = {url: url, method:'POST', json:true, headers: {token: token}, body: params};

        request(opts, function (error, response, body) { // save the subscription
            should.not.exist(error);
            var params = {phone: phone, callbackUrl: 'http://localhost:'+port+'/', description: 'test2'};
            var opts = {url: url, method:'POST', json:true, headers: {token: token}, body: params};

            request(opts, function (error, response, body) { // save the 2nd subscription
                should.not.exist(error);

                // check if there is only one subscription in the database
                subscriptionManager.find({phone: phone, callbackUrl: 'http://localhost:'+port+'/'}, function (err, subscriptions) {
                    should.not.exist(err);
                    subscriptions.should.be.instanceof(Array).and.have.lengthOf(1);
                    subscriptions[0].description.should.be.instanceof(String).and.equal('test2');
                    done();
                });
            });
        });
    });
});
