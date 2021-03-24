const {Client, MessageEmbed} = require('discord.js')
const Auth = require('./auth.json')
const pkg_info = require('./package.json')

var bot = new Client();

/*
    usage: Display help message and useage information
    parameters:
        channel (Channel): The channel to which the help message should be written
    return: None
*/
function usage(channel) {

    channel.send('usage:\n `!mv <message-id> <target channel> ["reason"]`').catch(console.log);
}

/*
    errorMessage: Send an error message
    parameters:
        channel (Channel): The channel to which the error message should be written
        message (String): The error message to send in the channel
    return: None
*/
function errorMessage(channel, message) {

        channel.send(message);
        usage(channel);
}

/*
    parseOption: Parse an option from the given command. Returns substring of args
                from startidx to indexOf(endchar)
    parameters:
        args (String): argument string to parse
        startidx (int): staring index to begin parsing
        enchar  (char): character to parse until.
    return: String containing the parsed option value
*/
function parseOption(args, startidx, endchar) {

    let endidx = args.indexOf(endchar, startidx);

    return args.substring(startidx, (endidx == -1 ? args.length : endidx));
}

/*
    getopts: Extracts options from the given command
    parameters:
        cmd (Message): The command from which to extract arguments
    return: A Map of the options and their values
*/
function getopts (cmd) {

    // remove the !mv invocation from the command string
    var args = cmd.content.slice(4);

    //console.log(args);

    var message = ''; // target message
    var destination = ''; // destination chanenel
    var comment = ''; // move comment
    var numMessages = 1;  // number of messges to move

    // get the indexOf to find start indices of options
    var m = args.indexOf('-m');
    var d = args.indexOf('-d');
    var c = args.indexOf('-c');
    var n = args.indexOf('-n');
    var N = args.indexOf('-N');

    // check if the target message and destination are specified
    if (m == -1 || d == -1) {

        cmd.channel.send('Invalid arguments: message and destination must be specified.').catch(console.error);
        usage(cmd.channel);
        //errorMessage(cmd.channel, 'Invalid arguments: message and destination must be specified.');
        return;
    }

    // add 3 characters to offset for switch width and whitespace
    m += 3;
    d += 3;

    // Map to match command switches to argument values
    var mapOptions = new Map();

    // use the option indices to parse message and destination
    message = parseOption(args, m, ' ');
    destination = parseOption(args, d, ' ').replace(/<#/, '').replace(/>/, '');

    // if the message is given by URL, extract its ID
    if (message.search(/^(https:\/\/discord.com\/channels\/)/) >= 0) {
        // The target is given by url
        message = message.substring(message.lastIndexOf('/') + 1);
    }

    // add them to the map
    mapOptions.set('m', message);
    mapOptions.set('d', destination);

    // process the comment option
    if (c != -1) {

        // check for the opening quotation
        commentStart = args.indexOf('"', c + 3);
        commentEnd = args.indexOf('"', commentStart + 1);

        if (commentStart == -1 || commentEnd == -1) {
            errorMessage(cmd.channel, 'Invalid arguments: comments must be enclosed in double quotes. Example: `\"comment\"`');
            return;
        }

        comment = args.substring(commentStart + 1, commentEnd);
    }
    mapOptions.set('c', comment);

    // set repeating header option
    mapOptions.set('repeatHeader', true);

    // process the numMessages option
    if (n != -1 && N != -1) {

        errorMessage(cmd.channel, 'Invalid arguments: `-n` and `-N` are mutually exclusive.')

    } else if (n != -1) { // set number of subsequent messages to move

        numMessages = parseInt(parseOption(args, n + 3, ' '));

    } else  if (N != -1) { // update repeating header option
        numMessages = parseInt(parseOption(args, N + 3, ' '));
        mapOptions.set('repeatHeader', false);
    }

    // return if numMessages is NaN
    if (typeof numMessages != "number") {

        errorMessage(cmd.channel, 'Invalid arguments: value for `-n` must be an integer.');
        return;
    }

    mapOptions.set('n', numMessages);
    console.log(mapOptions);

    return mapOptions;
}

/*
    moveMessage: Copy a specified message into the target channel
    parameters:
        msg (Message): Reference to the message object we are moving
        targetChannel (Channel): The channel to which the message should be moved
    return: None
*/
function moveMessage (msg, targetChannel) {

    // build out the message to send to the target channel
    var embeds = [];
    var attachments = [];

    // gather original message embeds
    if (msg.embeds.length > 0) {

        msg.embeds.forEach( element => {

            //console.log(element);
            embeds.push(element);

        }, err => {
            console.log(err);
        });

    } else {

        // gather original message attachments
        if (msg.attachments.size > 0) {

            msg.attachments.each(a => {
                //console.log(a);
                attachments.push(a.proxyURL);
            });
        }
    }

    // send the original message content as a new message to the targetChannel
    targetChannel.send(msg.content == '' ? '' : '>>> ' + msg.content, {
        files: attachments,
        embeds: embeds
    });

   msg.delete(); // delete message original message
}

/*
    mvbotHeader: Generates the mvbot message header
    parameters:
        msg (Message): The message object to be moved
        mover (Member): The user invoking the command
        comment (str): option comment
    return: The completed header string
*/
function mvbotHeader (msg, mover, comment = '') {

    // build out the message to send to the target channel
    // FORMAT:
    // @author | #original-channel
    // Weekday Month Day Year HH:MM:SS
    // "REASON" - @mover

    var h = '<@' + /*(msg.member ? msg.member : msg.author)*/ msg.author + '> in <#' + msg.channel + '>\n';
    h += msg.createdAt + '\n';
    h += (comment == '') ? '' : '*\"' + comment + '\"*';
    h += ' - <@' + mover + '>\n\n';

    return h;
}

/*
    processCommand: Begin processing commands sent to the bot
    parameters:
        cmd:    The command sent to the bot
    return: none
*/
function processCommand (cmd) {

    // extract options from the command string
    var args = getopts(cmd);

    // verify permissions of the user invoking the command
    if (!cmd.member.hasPermission('MANAGE_MESSAGES')) {

        cmd.channel.send('Sorry, ' + cmd.member.displayName + '. I can\'t let you do that.');
        return;
    }

    // get a reference to the target channel
    var targetChannel = bot.channels.resolve(args.get('d'));

    // ensure it exists
    if (!targetChannel) {
        errorMessage(cmd.channel, 'The target channel doesn\'t exist!');
        return;
    }

    // set batch move options
    var repeat = args.get('repeatHeader');

    // get a reference to the MessagesManager for the current channel
    var currentChannelMessages = cmd.channel.messages;

    // Fetch the desired message
    currentChannelMessages.fetch(args.get('m')).then( msg => {

        // move the initial message
        targetChannel.send(mvbotHeader(msg, cmd.member, args.get('c')));
        moveMessage(msg, targetChannel);

        // move subsequent messages
        if (args.get('n') > 1) {

            // fetch n messages after the original specified message
            currentChannelMessages.fetch({limit: args.get('n') - 1, after: args.get('m')}).then( followingMessages => {

                // move each message
                followingMessages.sort().each( m => {
                    if (repeat) {
                        targetChannel.send(mvbotHeader(msg, cmd.member, args.get('c')));
                    }
                    moveMessage(m, targetChannel);
                });

            }, err => {
                console.log(err);
            });
        }

        //cmd.delete(); // delete invoking command

   }, e => {
       cmd.channel.send('I was unable to find the message you want to move. Ensure you are entering a valid message ID.');
       console.log(e);
   });


}

bot.on('ready', () => {

    bot.user.setPresence({
        activity: {
            name: 'ver. ' + pkg_info.version
        },
        status: 'online'
    }).then(console.log).catch(console.error);

    // console.log('mvbot ready!\n');
});

bot.on('message', message => {

    // check message for bot invocation
    if (message.content.startsWith('!mv')) {

        processCommand(message);
    }

});

bot.on('error', err => {
    console.log(err);
});

bot.login(Auth.dev_token);
