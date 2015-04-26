var ROLE_GENERATOR = 1,
    ROLE_HANDLER = 2,
    MSG_QUEUE = 'MessageQueue',
    ERR_LOG = 'ErrorLog',
    GENERATOR = 'Generator',
    GENERATE_INTERVAL = 500;
    ADD_EXPIRE_NETLAG = 100; //maximum netlag in ms for our genetator bot  
var Id = require('./id.js');

// TODO:
// Redis Error Handler
function handleRedisError(err){
    throw new Error("Bot gets Redis communication failure: "+err);
};


// Class Bot
// @redisClient
// @fnGenerator message gererator 
// @fnHandler message handler
// Bot.runMe() runs bot
// Bot.getErrors(callback) send to callback(list) errors from server
// TODO: check arguments!

function Bot(redisClient,fnGenerator,fnHandler){
    this._id = Id();
    this._generator = fnGenerator;
    this._handler = fnGenerator;
    this._rClient = redisClient;
}

Bot.prototype._doRole = function(){
    switch(this.role) {
        case ROLE_GENERATOR: 
            this.generateMsg();
            break;
        case ROLE_HANDLER:
            this.handleMsg();
            break;
        default
            this.runMe(); 
    };   
};

Bot.prototype.runMe = function(){
    this._rClient.get(GENERATOR,function (err,ret){
        if (err){
            handleRedisError(err); 
        } else {
        if !(ret) { // GENERATOR BOT IS UNDEFINED OR EXPIRED
            this._rClient.set(GENERATOR, this._id);
            this._rClient.pexpire(GENERATOR, GENERATE_INTERVAL+ADD_EXPIRE_NETLAG);
            this.role = ret == this._id? ROLE_GENERATOR
        } else {
            this.role = ret == this._id? ROLE_GENERATOR : ROLE_HANDLER;
        }
        this._doRole();     
    });
};

Bot.prototype.generateMsg = function(){
    var newMsg = this._generator();
    this._rClient.lpush(MSG_QUEUE,newMsg,function (err,ret){
        console.log('New Msg sent',newMsg,err,ret);
    });
    setTimeout(this.decideWhoAmI, GENERATE_INTERVAL-10); // 10ms to push msg is enough?
};

Bot.prototype._postProcessMsg = function(err,msg){
    if (err) {
        this.logError(err,msg);
    } else {
        this.runMe();
    }
};

Bot.prototype.logError = function(err,msg){
    if (err) {
        this._rClient.rpush(ERR_LOG,msg,function (err,ret){
            if (err) { 
                console.log('Failed to send MSG to  '+ERR_LOG,msg);
                handleRedisError(err);
            } else {
                console.log('Msg sent to '+ERR_LOG,msg);
            }
        });
    }
};


Bot.prototype.handleMsg = function(){
    var me = this;
    this.rClient.rpop(MSG_QUEUE,function (err,ret){
        console.log('debug New Msg got for processing:',err,ret);
        if (!err) {
            me._handler(ret,this._postProcessMsg);
        } else {
            handleRedisError(err);   
        }
    });
};

Bot.prototype.getErrors = function(callback){
    this._rClient.lrange(ERR_LOG,0,-1,function (err,ret){
        if (!err) {
            this._rClient.del(ERR_LOG);
            callback(ret);
        } else {
            handleRedisError(err);   
        };    
    };  
};


module.exports = Bot;