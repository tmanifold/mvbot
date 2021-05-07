
"use strict";

const {Client, MessageEmbed, Permissions, DiscordAPIError} = require('discord.js')
const Auth = require('./auth.json')
const pkg_info = require('./package.json')
const MvbotErrors = require('./mvbotError.js');
const PREFIX = '!mv';

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
    return: String
*/
function parseOption(args, startidx, endchar) {

    let endidx = args.indexOf(endchar, startidx);

    return args.substring(startidx, (endidx == -1 ? args.length : endidx));
}

/*
    getopts: Extracts options from the given command
    parameters:
        cmd (Message): The command from which to extract arguments
    return: Map
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

    for (let i in switches) {
        opts.set(switches[i], args[i]);
    }

    return opts;
}

/*
    validateArgs: validates the given map of arguments
    parameters:
        args (Map): a map of switches and their corresponding values
    return: Number

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

    var has_m = args.has('-m');
    var has_d = args.has('-d');
    var has_n = args.has('-n');
    var has_t = args.has('-t');

    // // validate switch compatibility
    // var compat  = has_m << 3;
    //     compat |= has_d << 2;
    //     compat |= has_n << 1;
    //     compat |= has_t;
    //
    // console.log(compat);

    // check message is specified
    if (!has_m) {
        throw new MvbotErrors.MessageError();
    }
    // a message or range of messages was not specified: missing both -m and -t
    if (!has_t && !has_m)  {
        throw new MvbotErrors.MessageError();
        //return 12;
    }
    // check if the target destination is specified
    if (!has_d) {
        throw new MvbotErrors.DestinationError();
        //return 13;
    }

    // enforce mutual exclusion: -m and -t are both present or -t and -n are both present
    if ((has_t && has_m) || (has_t && has_n)) {
        throw new MvbotErrors.MutualExclusionError();
        //return 11;
    }
    // a messageId list was given along with -n option
    if (has_n && args.get('-m').split(' ').length > 1) {
        throw new MvbotErrors.MutualExclusionError();
        //return 11;
    }

    if (has_n) {
        let n = parseInt(args.get('-n'));

        if (typeof n != 'number') {
            throw new MvbotErrors.TypeError('The value given for `-n` should be a number.')
            //return 14;
        }

        if (n > 100) {
            throw new MvbotErrors.RangeError('The value for `-n` should be in the range [1,100].');
            return 15;
        }
    } else if (has_t) {
        let t = parseInt(args.get('-t'));

        if (typeof t != 'number') {
            throw new MvbotErrors.TypeError('The value given for `-t` should be a number.')
            //return 14;
        }
    }

    return 0;
}

/*
    validatePermissions: Verify the specified user has the required
                            permissions for a given channel.
    parameters:
        user (GuildMember): The user for whom permissions should be verified
        channel (TextChannel): The channel in which the user should have the given permissions
        perm (Permissions): A Permissions object containing the required permissions
    return: Boolean
*/
function validatePermissions(user, channel, perms) {

    return user.permissionsIn(channel).has(perms, true);
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
    })
    .then( () => {
        msg.delete();
    })
    .catch( e => {
        // Invalid permissions probably
        //console.error(e);
        if (e.code == 50013) {
            console.error('Throwing from mvMessages. ');
            throw new MvbotErrors.PermissionError();
        }
    });

   //msg.delete(); // delete message original message
}

/*
    mvbotHeader: Generates the mvbot message header
    parameters:
        msg (Message): The message object to be moved
        mover (Member): The user invoking the command
        comment (str): option comment
    return: String
*/
function mvbotHeader (msg, mover, comment = '') {

    // build out the message to send to the target channel
    // FORMAT:
    // @author | #original-channel
    // Weekday Month Day Year HH:MM:SS
    // "REASON" - @mover

    // Sometimes the original message author shows as <@null>.
    // I suspect this has something to do with users not being cached yet

    // var h = '<@' + msg.author + '> in <#' + msg.channel + '>\n';
    // h += msg.createdAt + '\n';
    // h += (comment == '') ? '' : '*\"' + comment + '\"*';
    // h += ' - <@' + mover + '>\n\n';

    var h = 'Moved from <#' + msg.channel + '> by <@' + mover + '>.\n'
          + (comment == '' ? '' : 'Reason: *' + comment + '*\n')
          + msg.createdAt + ': <@' + msg.author + '> said\n\n';

    return h;
}

/*
    processCommand: Begin processing commands sent to the bot
    parameters:
        cmd:    The command sent to the bot
    return: Number
*/
function processCommand (cmd) {

    // verify global permissions of the user invoking the command
    // if (!cmd.member.hasPermission('MANAGE_MESSAGES')) {

    //     errorMessage(cmd.channel, 'Sorry, ' + cmd.member.displayName + '. I can\'t let you do that.');
    //     return -1;
    // }

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
    var validationCode = 0;
    

    validationCode = validateArgs(args);


    // switch (validationCode) {
    //     case 0:
    //         // normal return code. No issues.
    //         break;
    //     case 11:
    //         errorMessage(cmd.channel, 'Mutual exclusion error: two or more incompatible switches were used.');
    //         break;

    //     case 12:
    //         errorMessage(cmd.channel, 'Invalid arguments: A message or range of messages must be specified.');
    //         break;

    //     case 13:
    //         errorMessage(cmd.channel, 'Invalid arguments: A destination channel must be specified.');
    //         break;

    //     case 14:
    //         errorMessage(cmd.channel, 'Type error: Range indicator must be a number. Ex. `-t 2` or `-n 5`.');
    //         break;

    //     case 15:
    //         errorMessage(cmd.channel, 'Range error: The Discord API only allows fetching 100 messages at once.');
    //         break;

    //     default:
    //         break;
    // }

    if (validationCode > 0) {
        console.log('validation error ', validationCode);
        return validationCode;
    }

    // obtain the destination id without prefix and suffix
    let d = args.get('-d');
    if (d == null) throw new MvbotErrors.DestinationError();

    args.set('-d',
        d.replace(/<#/, '').replace(/>/, '')
    );

    var messages = args.get('-m').split(/\s+/);

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
        throw new MvbotErrors.DestinationError();
        //errorMessage(cmd.channel, 'The target channel doesn\'t exist!');
        //return -2;
    }

    // required permissions for the user to invoke the bot
    const requiredPermsUser = new Permissions([
        'MANAGE_MESSAGES'
    ]);
    
    // require permissions for the bot to do its thing
    const requiredPermsBot = new Permissions([
        'ATTACH_FILES',
        'EMBED_LINKS',
        'MANAGE_MESSAGES',
        'READ_MESSAGE_HISTORY',
        'SEND_MESSAGES',
        'VIEW_CHANNEL'
    ]);

    // verify the user has the required permissions
    if (!validatePermissions(cmd.member, cmd.channel, requiredPermsUser)) {

        throw new MvbotErrors.PermissionError('User lacks sufficient permissions in this channel.')

    } else if (!validatePermissions(cmd.member, targetChannel, requiredPermsUser)) {

        throw new MvbotErrors.PermissionError('User lacks sufficient permissions in the destination channel.');
    }

    // verify bot has required permissions
    cmd.channel.guild.members.fetch(bot.user)
    .then( myself => {

        // // validate permissions for the current channel
        if (!validatePermissions(myself, cmd.channel, requiredPermsBot)) {

            throw new MvbotErrors.PermissionError('I lack sufficient permissions in this channel.');

            
            //return -12;
        } else if (!validatePermissions(myself, targetChannel, requiredPermsBot)) {

            //errorMessage(cmd.channel, 'Permission error: I lack sufficient permissions in the destination channel.');
            
            //return -13;

            throw new MvbotErrors.PermissionError('I lack sufficient permissions in the destination channel.');

        } else { // the bot has the required permissions

            // get a reference to the MessagesManager for the current channel
            let currentChannelMessages = cmd.channel.messages;

            // Move n number of messages
            if (args.has('-n')) {

                let n = args.get('-n');

                let theMessage = args.get('-m');
                if (theMessage == null) throw new MvbotErrors.MessageError();

                currentChannelMessages.fetch(args.get('-m'))
                .then( firstMsg => {

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
                        )
                        .then( followingMessages => {

                            let lastUser = firstMsg.author;

                            // move each message
                            followingMessages.sort().each( m => {
                                if (m.author != lastUser) {
                                    lastUser = m.author;
                                    targetChannel.send(mvbotHeader(m, cmd.member, args.get('-c')));
                                }
                                moveMessage(m, targetChannel);

                            });
                        })
                        .catch(e => {
                            console.error('SOMETHING WONKY HAPPENED:  ', e);
                            //throw new MvbotErrors.MessageError('The target message doesn\'t exist!');
                        });
                    }

                //cmd.delete(); // delete invoking command

                }, e => {
                    if (e.code == 10008) {
                        throw new MvbotErrors.MessageError('The target message doesn\'t exist!');
                    }
                });

            } else if (args.has('-t')) { // move all messages sent in the last t minutes

            } else { // move the messages specified in the list

                messages.forEach( message => {

                    currentChannelMessages.fetch(message)
                    .then( msg => {
                        targetChannel.send(mvbotHeader(msg, cmd.member, args.get('-c')));
                        moveMessage(msg, targetChannel);

                    })
                    .catch( e => {
                        throw new MvbotErrors.MessageError('The target message doesn\'t exist!');
                    });
                });

            }

            // delete the original command
            cmd.delete();
        }
    })
    .catch(e => { // handle permission errors

        errorMessage(cmd.channel, e.message);
        
        
    });
    
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
    if (message.content.startsWith(PREFIX) && !message.author.bot) {

        let exit = 0;

        // REWORK ALL OF THIS TO USE PROMISES FOR BETTER ERROR PROPAGATION
        // REF: https://medium.com/front-end-weekly/error-propagation-in-javascript-with-error-translation-pattern-78cf7178fe92
        try {
            exit = processCommand(message);
        }
        catch (err) {
            if (err instanceof MvbotErrors.MvbotError) {
                errorMessage(message.channel, err.message);
                exit = err.code;

            }
            console.error(err);
        }

        console.log('exit ', exit);
    }
});

bot.on('error', err => {

    //console.error('ERROR HAPPENED', err);
});

// process.on('unhandledRejection', err => {

//     console.error('UNHANDLED PROMISE REJECTION: ', err);
// });

// bot.on('rateLimit', lim => {

//     console.log(lim);
// });

bot.login(Auth.dev_token);
