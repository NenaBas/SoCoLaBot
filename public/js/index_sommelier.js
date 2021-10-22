// Cache all DOM elements
var chatForm        = document.querySelectorAll('.chat-input-area');
var chatInputField  = document.querySelectorAll('.chat-input-area__input');
var chatLog         = document.querySelectorAll('.chat-log');

// Global loading indicator
var loading = false;

var quickReplies_btnActive = false;

/**
 * Scrolls the contents of a container to the bottom
 * @function scrollContents 
*/
function scrollContents(container) {
    container.scrollTop = container.scrollHeight;
    container.style.paddingBottom = "5px";
}

/**********************************************
 * WebSocket Setup
 */
 const socket = new WebSocket("ws://139.91.183.121:8443");

 /** types:  botMessage, userMessage, quickReplies
  *  sender: Chatbot(python), UI
  */
 var socketJSONmsg = {
    type: "types",
    text: "msgSent",
    sender: "Chatbot/UI/Server"
}
// The sender will always be the UI from here
// This time, the Chatbot is in the python code
function setupJSONmsg(type, text) {
    socketJSONmsg.type  = type;
    socketJSONmsg.sender= "UI";
    socketJSONmsg.text  = text;
}

socket.onopen = () => {
    console.log("[UI] Connected to WS Server");
}
socket.onmessage = (event) => {
    var msg = JSON.parse(event.data);
    var botMsg = msg.text;
    // if (event.data.value) {
    //     botMsg = event.data.value;
    // }
    if (msg.sender == "Chatbot" && msg.type == "botMessage") {
        addBotMsg(botMsg);
    } 
    // else if (msg.sender == "Chatbot" && msg.type == "quickReplies") {
    //     // msg.text is a string, we should convert it to array for the function to work
    //     var repliesArray = msg.text.split(";");
    //     addQuickReplies(repliesArray);
    //     addEventListener_toTheWrapper(document.querySelectorAll('.quick-replies_wrapper'));
    // }
}
socket.onclose = (event) => {
    if (event.wasClean) {
        console.log(`[WS UI CLOSE] Connection closed cleanly, code=${event.code} reason=${event.reason}`);
    } else {
        // e.g. server process killed or network down
        // event.code is usually 1006 in this case
        console.error(`[WS UI CLOSE ERROR] Connection died, code=${event.code}`);
    }
}
socket.onerror = (error) => {
    console.error(`[WS UI ERROR] ${error.message}`);
}
const sendMsg = (msgType,msgToSend) => {
    setupJSONmsg(msgType, msgToSend);
    console.log("gonna send:\n",socketJSONmsg);
    socket.send(JSON.stringify(socketJSONmsg));
}

/*****************************************************************************
 * USER MESSAGES
 *****************************************************************************/

/******* Add user message
 * Create a DOM element from a string value
 * @function getMessageElement 
 * @param {string} val
 * @param {boolean} isUser
 * @returns {HTMLElement}
*/
function getMessageElement(val, isUser) {
    // Create parent message element to append all inner elements
    var newUserMessage = document.createElement('div');
    
    // Add message variation class when the message belongs to the user
    if (isUser) {
        newUserMessage.className += 'chat-message--right ';
    }

    // Create text
    var text = document.createElement('p');
    text.append(val);
    text.className += 'chat-message__text';

    // Append elements
    newUserMessage.append(text);
    newUserMessage.className += 'chat-message ';

    return newUserMessage;
}

// add user message to UI
function addUserMsg(msg) { 
    // Add user's message to the chat log
    var newUserMessage = getMessageElement(msg, true);
    chatLog[0].append(newUserMessage);
    // Scroll to last message
    scrollContents(chatLog[0]);
}

// Handle form submit (clicking on the submit button or pressing Enter)
chatForm[0].addEventListener('submit', function(e) {
    e.preventDefault();

    var text = chatInputField[0].value;
    console.log("user said: ",text);

    // If reply is loading, wait
    if (loading) { return false; }

    // Catch empty messages
    if (!text) { return false; }

    // Add user's message to the chat log
    addUserMsg(text);

    // Clear input
    chatInputField[0].value = '';

    if (quickReplies_btnActive) {
        if (text.toUpperCase() == "YES" || text.toUpperCase() == "NO") {
            sendMsg("quickReplies",text)
            $(".quick-replies_wrapper").remove();
            quickReplies_btnActive = false;
            return;
        }
    } 
    // send the usermsg to the server via the websocket
    sendMsg("userMessage",text);
});

/*****************************************************************************
 * QUICK REPLIES HANDLER
 * ---> param replies is an array of the button replies to be generated
 *****************************************************************************/
 function addQuickReplies(replies) {
    if (Array.isArray(replies)) {
        // create a div for all the btns/replies
        var quickRepliesArea = document.createElement('div');
        quickRepliesArea.className = 'quick-replies_wrapper';

        replies.forEach(replyText => {
            var replyBtn = document.createElement('button');
            replyBtn.append(replyText);
            replyBtn.className = 'quick-reply__btn';

            // Append the btn into the div
            quickRepliesArea.append(replyBtn);
        })
        // Add the quick replies div to the chat log
        chatLog[0].append(quickRepliesArea);
        // Scroll to last message
        scrollContents(chatLog[0]);

        quickReplies_btnActive = true;
    }
}

// https://javascript.info/bubbling-and-capturing
// catch all the events inside the div wrapping the quick-reply buttons
// the event listener needs to be added AFTER the element has been created
function addEventListener_toTheWrapper(wrapper) {
    wrapper[0].addEventListener('click', (event) => {
        // check if the click was on a button and not the div
        const isButton = event.target.nodeName === 'BUTTON';
        if (!isButton) { return; }

        // use JQuery's text function
        var btnText = $(event.target).text();

        console.log("Button's text: "+btnText);

        addUserMsg(btnText);
        sendMsg("quickReplies",btnText); 
        
        // after the reply is send, remove the whole div
        $(".quick-replies_wrapper").remove();
    });
}

/*****************************************************************************
 * CHATBOT MESSAGES/REPLIES
 *****************************************************************************/
// add bot message to UI
function addBotMsg(msg) {
    // Add user's message to the chat log
    var newBotMessage = getMessageElement(msg, false);  // true is user, false is bot
    chatLog[0].append(newBotMessage);
    // Scroll to last message
    scrollContents(chatLog[0]);
}

