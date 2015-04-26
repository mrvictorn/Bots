var ROLE_GENERATOR = 1,
    ROLE_HANDLER = 2,
    MSG_QUEUE = 'MessageQueue',
    ERR_LOG = 'ErrorLog',
    GENERATOR = 'Generator',
    PROCESSED_COUNT = 'TotalMsgProcessed',
    GENERATED_COUNT = 'TotalMsgGenerated',
    GENERATE_INTERVAL = 500,
    ADD_EXPIRE_NETLAG = 30, //maximum netlag in ms for our genetator bot  
    id = require('./id.js');

function handleRedisError(err) {
    throw new Error("Bot gets Redis communication failure: " + err);
};

// Class Bot
// @redisClient
// @fnGenerator message gererator 
// @fnHandler message handler
// Bot.runMe() runs bot
// Bot.getErrors(callback) pushes to callback(list) list of saved errors 
// TODO: check arguments!

function Bot(redisClient, fnGenerator, fnHandler) {
    this._id = id();
    this._generator = fnGenerator;
    this._handler = fnHandler;
    this._rClient = redisClient;
    this.runMe = function () {
        var me = this;
        me._rClient.get(GENERATOR, function (err, ret){
            if (err){
                handleRedisError(err); 
            } else {
                if (!ret) { // GENERATOR BOT IS UNDEFINED OR EXPIRED
                    me._rClient.set(GENERATOR, me._id);
                    me._rClient.pexpire(GENERATOR, GENERATE_INTERVAL+ADD_EXPIRE_NETLAG);
                    me.role = ROLE_GENERATOR;
                } else {
                    me.role = ret == me._id? ROLE_GENERATOR : ROLE_HANDLER;
                }
                me._doRole();     
            };
        });
    };
    this.getErrors = function (callback) {
        var me = this;
        me._rClient.lrange(ERR_LOG,0,-1,function (err, ret) {
            if (!err) {
                me._rClient.del(ERR_LOG);
                callback(ret);
            } else {
                handleRedisError(err);   
            };    
        });  
    };
    this._doRole = function () {
        switch(this.role) {
            case ROLE_GENERATOR: 
                this.generateMsg();
                break;
            case ROLE_HANDLER:
                this.handleMsg();
                break;
            default:
                this.runMe(); 
        };   
    };
    this.generateMsg = function () {
        var newMsg = this._generator();
        this._rClient.lpush(MSG_QUEUE,newMsg,function (err, ret) {
            console.log('Generated',newMsg,ret);
        });
        this._rClient.pexpire(GENERATOR, GENERATE_INTERVAL+ADD_EXPIRE_NETLAG);
        this._logMsgGenerated();
        setTimeout(this.runMe.bind(this), GENERATE_INTERVAL-2); // 2ms to push msg is enough?
    };
    this._logMsgProcessed = function () {
         this._rClient.incr(PROCESSED_COUNT);
    };
    this._logMsgGenerated = function () {
         this._rClient.incr(GENERATED_COUNT);
    };
    this._postProcessMsg = function (err, msg) {
        if (err) {
            this.logError(err,msg);
        } 
        this._logMsgProcessed();
        this.runMe();
    };
    this.logError = function (err, msg) {
        if (err) {
            this._rClient.rpush(ERR_LOG,msg,function (err, ret) {
                if (err) { 
                    console.log('Failed to send MSG to  '+ERR_LOG,msg);
                    handleRedisError(err);
                } else {
                    console.log('Msg sent to '+ERR_LOG,msg);
                }
            });
        }
    };
    this.handleMsg = function() {
        var me = this;
        me._rClient.rpop(MSG_QUEUE,function (err, ret){
            if (!err) {
                if (!ret) {me.runMe(); return;}; // queue is empty!
                console.log('Processing:',ret);
                me._handler(ret,me._postProcessMsg.bind(me));
            } else {
                handleRedisError(err);   
            }
        });
    };


};

module.exports = Bot;