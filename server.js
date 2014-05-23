var connect = require('connect');
var serverNumber = 8080;

connect.createServer(
    connect.static(__dirname)
).listen(serverNumber);