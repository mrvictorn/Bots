var argv = require('minimist')(process.argv.slice(2));
    redis = require('redis'),
    _ = require('underscore'),
    //redisPass = 'redisPaswertJHjkdhwk834748954jhkd',
    //redisServer = 'dev.vkafe.org',
    //client = redis.createClient(6379,redisServer,{auth_pass:redisPass}),
    client = redis.createClient();
var MsgBot = require('./bot.js');



function getMessage(){
    this.cnt = this.cnt || 0;
    return this.cnt++;
}

function eventHandler(msg, callback){
    function onComplete(){
    var error = Math.random() > 0.85;
        callback(error, msg);
    }
    // processing takes time...
    //setTimeout(onComplete, Math.floor(Math.random()*1000));
    setTimeout(onComplete, Math.floor(Math.random()*3));

}

client.on("connect", function (){
    console.log("Connected to Redis");
    
});

client.on("error", function (err){
    throw new Error('Failed to connect Redis. Error: '+err);
});


var bot = new MsgBot(client,getMessage,eventHandler);
if (argv.getErrors) {
    listErrors =function(list){
        console.log('Error log:');
        _.each(list,function(e){console.log(e);});
        client.quit();
    };    
    bot.getErrors(listErrors);

} else {
    bot.runMe();
};

