const {Wit, log} = require('node-wit');

const ws        = require('ws');
const stringify = require('json-stringify-pretty-compact');

module.exports = function(wsServer) {
    
    // types:   botMessage, userMessage quickReplies
    // sender:  Chatbot, GUI
    var socketJSONmsg = {
        type: "types",  
        text: "msgSent",
        sender: "Server"
    }
    function setupSocketMsg(type, sender, text) {
        socketJSONmsg.type  = type;
        socketJSONmsg.sender= sender;
        socketJSONmsg.text  = text;
    }
    function setupSocketMsg(type, text) {   // the sender is always Server
        socketJSONmsg.type  = type;
        socketJSONmsg.text  = text;
    }
    //----------------------------------------------
    // check if a JSON obj is empty
    function isEmptyObject(obj) {
        for (var key in obj) {
          if (Object.prototype.hasOwnProperty.call(obj, key)) {
            return false;
          }
        }
        return true;
    }

    
    //----------------------------------------------
    // Web Server Socket handling
    wsServer.on('connection', function connection(socket, req) {
        const clientIP = req.socket.remoteAddress;
        

        const introMsg = [
            "Hello Sommelier! :)"
        ];

        // Generate a random number based on the length of the array
        const introMessage = {
            value: introMsg[Math.floor(Math.random() * introMsg.length)],
            id: -1,
            timestamp: new Date(),
        };
        setupSocketMsg("botMessage", introMessage.value);
        socket.send(JSON.stringify(socketJSONmsg));

        
        socket.on('message', message => {
            // console.log("---------------Client said:\n"+message);
            var msgFromClient = JSON.parse(message);
            // console.log("Client told me: "+message);
            console.log(`[${msgFromClient.sender}] msg: ${msgFromClient.text}`);
            
            // broadcast the message to all the clients
            wsServer.clients.forEach(client => {
                if (client !== socket && client.readyState === ws.OPEN) {
                    client.send(message);
                }
            });
            if (msgFromClient.sender == "Chatbot") {
                // console.log(`Client:${msgFromClient.sender} said ${msgFromClient.text}`);
            }    
        });

        // we want the server to speak to all the clients
        function sendToClients(data) {
            wsServer.clients.forEach(client => {
                client.send(JSON.stringify(data));
            })
        }

    });
}
