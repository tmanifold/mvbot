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

    channel.send('usage:\n `!mv <message-id> <target channel> ["reason"]`');
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
function getopts(cmd) {

    // split command-string at switch indices
    var args = cmd.content.split(/\s+-.\s*/g);

    // pop command prefix from array
    args.shift();
    //console.log(args);

    // get array of switches from the command-string
    // /--(\w)+(-(\w)+)*/ matches long-form switches, ex., --no-header or --help
    // /-./ matches a short-form switch, ex., -m
    var switches = cmd.content.match(/(--(\w)+(-(\w)+)*)|(-.)/g);
    //console.log(switches);

    if (!args || !switches) {
        return null;
    }

    // construct the map
    var opts = new Map();

    for (i in switches) {
        opts.set(switches[i], args[i]);
    }

    return opts;
}

/*
    validateArgs: validates the given map of arguments
    parameters:
        args (Map): a map of switches and their corresponding values
    return: an error code correspondng to the argument that failed
    validation. 0 if no errors

    switches:
        -m      the message id(s) to be moved
        -d      the destination channel
        -c      a comment explaining why the message was moved (optional)
        -n      the number of messages to be moved
        -t      the timespan in minutes


    Compatibility matrix
      m d n t r
    m - 1 1 0
    d 1 - 1 1
    n 1 1 - 0
    t 0 1 0 -
    r 1       -

    Error codes:
    11   -t and -m are mutually exclusive
    12   -m or -t not specified
    13   -d not specified
    14   value of -n or -t is NaN
*/
function validateArgs (args) {

    has_m = args.has('-m');
    has_d = args.has('-d');
    has_n = args.has('-n');
    has_t = args.has('-t');

    // // validate switch compatibility
    // var compat  = has_m << 3;
    //     compat |= has_d << 2;
    //     compat |= has_n << 1;
    //     compat |= has_t;
    //
    // console.log(compat);

    // enforce mutual exclusion: -m and -t are both present or -t and -n are both present
    if ((has_t && has_m) || (has_t && has_n)) {
        return 11;
    }
    // a messageId list was given along with -n option
    if (has_n && args.get('-m').split(' ').length > 1) {
        return 11;
    }
    // a message or range of messages was not specified: missing both -m and -t
    if (!has_t && !has_m)  {
        return 12;
    }
    // check if the target message and destination are specified
    if (!has_d) {
        return 13;
    }


    if (has_n) {
        n = parseInt(args.get('-n'));

        if (typeof n != 'number') {
            return 14;
        }
    } else if (has_t) {
        t = parseInt(args.get('-t'));

        if (typeof t != 'number') {
            return 14;
        }
    }

    return 0;
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

    // Sometimes the original message author shows as <@null>.
    // I suspect this has something to do with users not being cached yet

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

    // verify permissions of the user invoking the command
    if (!cmd.member.hasPermission('MANAGE_MESSAGES')) {

        errorMessage(cmd.channel, 'Sorry, ' + cmd.member.displayName + '. I can\'t let you do that.');
        return -1;
    }

    // extract options from the command string
    var args = getopts(cmd);
    //console.log(args);

    if (!args) {
        usage(cmd.channel);
        return 0;
    }

    /*
        validation codes:
        0   OK
        11  mutual exclusion error
        12  message(s) not specified
        13  destination not specified
        14  range indicator typeError
    */
    var validationCode = validateArgs(args);

    switch (validationCode) {
        case 0:
            // normal return code. No issues.
            break;
        case 11:
            errorMessage(cmd.channel, 'Mutual exclusion error: two or more incompatible switches were used.');
            break;

        case 12:
            errorMessage(cmd.channel, 'Invalid arguments: A message or range of messages must be specified.');
            break;

        case 13:
            errorMessage(cmd.channel, 'Invalid arguments: A destination channel must be specified.');
            break;

        case 14:
            errorMessage(cmd.channel, 'Type error: range indicator must be a number. Ex. `-t 2` or `-n 5`.');
            break;

        default:
            break;
    }

    if (validationCode > 0) {
        console.log('validation error ', validationCode);
        return validationCode;
    }

    // obtain the destination id without prefix and suffix
    args.set('-d',
        args.get('-d').replace(/<#/, '').replace(/>/, '')
    );

    messages = args.get('-m').split(/\s+/);

    // loop through messages and convert from url to id
    messages.forEach((message, i) => {
        // if the message is given by URL, extract its ID
        if (message.search(/^(https:\/\/discord.com\/channels\/)/) >= 0) {
            // The target is given by url
            messages[i] = message.substring(message.lastIndexOf('/') + 1).trim();
        }
    });

    //console.log(messages);

    // get a reference to the target channel
    var targetChannel = bot.channels.resolve(args.get('-d'));

    // ensure it exists
    if (!targetChannel) {
        errorMessage(cmd.channel, 'The target channel doesn\'t exist!');
        return -2;
    }

    // get a reference to the MessagesManager for the current channel
    var currentChannelMessages = cmd.channel.messages;

    // Move n number of messages
    if (args.has('-n')) {
        n = args.get('-n');
        currentChannelMessages.fetch(args.get('-m')).then( firstMsg => {

            // move the initial message
            targetChannel.send(mvbotHeader(firstMsg, cmd.member, args.get('-c')));
            moveMessage(firstMsg, targetChannel);

            // move subsequent messages
            if ( (n = args.get('-n')) > 1) {

                // fetch n messages after the original specified message
                currentChannelMessages.fetch({
                        limit: n - 1,
                        after: args.get('-m')
                    }
                ).then( followingMessages => {

                    var lastUser = firstMsg.author;

                    // move each message
                    followingMessages.sort().each( m => {
                        if (m.author != lastUser) {
                            lastUser = m.author;
                            targetChannel.send(mvbotHeader(m, cmd.member, args.get('-c')));
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

   } else if (args.has('-t')) { // move all messages sent in the last t minutes

   } else { // move the messages specified in the list

       messages.forEach( message => {

           currentChannelMessages.fetch(message).then( msg => {
               targetChannel.send(mvbotHeader(msg, cmd.member, args.get('-c')));
               moveMessage(msg, targetChannel);

           }, e => {
               console.log(e);
           });
       });

   }

   return 0;

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

        var exitcode = 0;

        exitcode = processCommand(message);

        console.log('exit ', exitcode)
    }

});

bot.on('error', err => {
    console.log(err);
});

bot.login(Auth.dev_token);
