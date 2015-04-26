var redis = require("redis"),
    ROLE_GENERATOR = 1,
    ROLE_HANDLER = 2,
    MSG_QUEUE = 'MessageQueue',
    GENERATE_INTERVAL = 500;
var redisPass = 'redisPaswertJHjkdhwk834748954jhkd';
var redisServer = 'dev.vkafe.org';
var client = redis.createClient(6379,redisServer,{auth_pass:redisPass});


client.on("error", function (err) {
    console.log("Error " + err);
});

function Bot(){
    this.role = this.whoAmI();
    if (this.role == ROLE_GENERATOR) {
        this.launchGenerateMsgLoop();
    } else {
        this.launchProcessMsgLoop();
    }
}

Bot.prototype.whoAmI = function(){
    //TODO: obtain info from redis, decide whoAmI
    return ROLE_GENERATOR;  
};

Bot.prototype.generateMsg = function(){
    var newMsg = getMessage();
    client.lpush(MSG_QUEUE,newMsg,function (err,ret){
        console.log('New Msg sent',newMsg,err,ret);
    });
    client.lpop(MSG_QUEUE,function (err,ret){
        console.log('debug New Msg sent',err,ret);
    });

    
};


Bot.prototype.launchGenerateMsgLoop = function(){
    setInterval(this.generateMsg, GENERATE_INTERVAL)
};

Bot.prototype.processMsgLoop = function(){


};


Bot.prototype.getNewMsg = function(){
    client.rpop(MSG_QUEUE,function (err,ret){
        console.log(err,ret);
    });
};


function getMessage(){
    this.cnt = this.cnt || 0;
    return this.cnt++;
}





client.on("connect", function (){
    console.log("Connected to server");
    mainBot = new Bot();
});
