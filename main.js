var argv = require('minimist')(process.argv.slice(2));
    redis = require('redis'),
    _ = require('underscore'),
    client = redis.createClient(),
    MsgBot = require('./bot.js');

client.on("connect", function (){
    console.log("Connected to Redis");
    
});

client.on("error", function (err){
    throw new Error('Failed to connect Redis. Error: '+err);
});

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
    setTimeout(onComplete, Math.floor(Math.random()*1000));
}

var bot = new MsgBot(client, getMessage, eventHandler);
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