
'use strict';

//const {Client, MessageEmbed, Permissions, DiscordAPIError} = require('discord.js')
const DiscordJS = require('discord.js');
const Auth = require('./auth.json')
const pkg_info = require('./package.json')
const MvbotErrors = require('./mvbotError.js');
const PREFIX = '!mv';
const MVBOT_EMBED_COLOR = 0x5500AA;

// Initialize bot and ClientOptions
// https://discord.js.org/#/docs/main/stable/typedef/ClientOptions
var bot = new DiscordJS.Client({
    options: {
        // limit message cache lifetime to the last 24 hours
        // 60s * 60m * 24h = 86400s/day
        messageCacheLifetime: 86400,
        // check daily for sweepable message
        messageSweepInterval: 86400,
        // time in milliseconds to wait between REST requests. Trying to avoid rate limiting
        restTimeOffset: 2500,
    }
});

/*
    usage: Display help message and useage information
    parameters:
        channel (Channel): The channel to which the help message should be written
    return: None
*/
function usage(channel) {

    var u = {
        color: MVBOT_EMBED_COLOR,
        author: {
            name: bot.user.username,
            icon_url: bot.user.displayAvatarURL(),
        },
        description: '[GitHub](https://github.com/tmanifold/mvbot) | [Top.gg](https://top.gg/bot/706927667043237928)',
        fields: [
            {
            // switches:
            //     -m      the message id(s) to be moved
            //     -d      the destination channel
            //     -c      a comment explaining why the message was moved (optional)
            //     -n      the number of messages to be moved
            //     -t      the timespan in minutes
                name: '\u200b',
                value: 'usage: `!mv -m message [...] -d dest [options]`',
            },
            {
                name: 'Info:',
                value:
                    '```' +
                    '-m message     One or more message IDs or URLs, separated by space.\n' +
                    `-d dest        Destination channel. user and bot must have correct permissions.\n` +
                    '```',
            },
            {
                name: 'Options',
                value:
                    '```' +
                    '-c comment     A text string explaining why the message was moved.\n' +
                    '-n number      Moves the specifed number of messages, beginning with the one\n' +
                    '               given by -m message. Cannot be used with a list of messages.\n' +
                    '-t time        Move all messages within the timeframe, in minutes.' +
                    '```',
            },
            {
                name: 'Legacy',
                value: 'usage: `!mv <message-id> <target channel> ["reason"]`',
            },
        ],
        footer: {
            text: 'mvbot v' + pkg_info.version,
        },
    };

    channel.send('', {embed: u});
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
        //usage(channel);
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
    //var switches = cmd.content.match(/(--(\w)+(-(\w)+)*)|(-.)/g);
    var switches = cmd.content.match(/(-.)/g);
    console.log(switches);

    if (!args || !switches) {
        return null;
    }

    // check duplicates
    var s = new Set(switches);
    if (s.size != switches.length) throw new MvbotErrors.MvbotError('Duplicate options detected.');

    // construct the map
    var opts = new Map();

    for (let i in switches) {
        opts.set(switches[i], args[i]);
    }

    console.log('getopts: ' + opts.entries());

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

        --no-header     do not print the mvbot header
*/
function validateArgs (args) {

    console.log ('validateArgs: ', args);

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
        //let n = parseInt(args.get('-n'));
        let n = args.get('-n');

        if (isNaN(n)) {
            throw new MvbotErrors.TypeError('The value given for `-n` should be a number.')
            //return 14;
        }

        if (n > 100) {
            throw new MvbotErrors.RangeError('The value for `-n` should be in the range [1,100].');
            //return 15;
        }
    } else if (has_t) {
        let t = args.get('-t');

        if (isNaN(t)) {
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

        msg.embeds.forEach( e => {

            //console.log(element);
            //embeds.push(element);
            if (e.type == 'rich') {
                e.setColor(0x747474);
                targetChannel.send({embed: e});
            }

        }, err => {
            console.log(err);
        });

        //msg.suppressEmbeds();

    } //else {

        // gather original message attachments
        if (msg.attachments.size > 0) {

            msg.attachments.each(a => {
                //console.log(a);
                attachments.push(a.attachment);
            });
    //    }
        }
    //console.log('msg.embeds: ', embeds);
    //console.log('embeds', msg.embeds);
    //console.log('attachments: ', msg.attachments);

    // send the original message content as a new message to the targetChannel
    targetChannel.send(msg.content == '' ? '' : msg.content, {
        files: attachments,
        //embeds: embeds,
    })
    .then( () => {
        //console.log(msg);
        msg.delete({timeout:1000})
        .catch(e => {
            console.error('error deleting message: ', e);
        });
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
    return: MessageEmbed
*/
function mvbotHeader (msg, mover, comment = '') {

    var h = {
        color: MVBOT_EMBED_COLOR,
        author: {
            name: msg.author.username,
            icon_url: msg.author.displayAvatarURL(),
        },
        description: 'Shared in <#' + msg.channel + '>',
        fields: [
            {
                name: '\u200b',
                value: comment == '' ? 'Moved by <@' + mover + '>.' : '*\"' + comment + '\"* - <@' + mover + '>',
            },
        ],
        footer: {
            text: 'mvbot',
        },
        timestamp: msg.createdAt,
    };

    //var d = msg.createdAt.form

    // var h = 'Channel: <#' + msg.channel + '> | Author: <@' + msg.author + '>\n'
    //       + msg.createdAt.toUTCString() + '\n'
    //       + (comment == ''  ? 'Moved by <@' + mover + '>\n' : 'Reason: *\"' + comment + '\"* - <@' + mover + '>\n');

    return new DiscordJS.MessageEmbed(h);
    //return h;
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
    const requiredPermsUser = new DiscordJS.Permissions([
        'MANAGE_MESSAGES'
    ]);

    // require permissions for the bot to do its thing
    const requiredPermsBot = new DiscordJS.Permissions([
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
                console.log(theMessage);
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
                        console.error(e);
                        throw new MvbotErrors.MessageError('The target message doesn\'t exist!');
                    }
                });

            } else if (args.has('-t')) { // move all messages sent in the last t minutes

            } else { // move the messages specified in the list

                messages.forEach( message => {
                    console.log('message: ', message);

                    currentChannelMessages.fetch(message)
                    .then( msg => {
                        console.log('fetched: ', msg);
                        targetChannel.send(mvbotHeader(msg, cmd.member, args.get('-c')));
                        moveMessage(msg, targetChannel);

                    })
                    .catch( e => {
                        console.error(e);
                        throw new MvbotErrors.MessageError('The target message doesn\'t exist!');
                    });
                });

            }

            // delete the original command
            cmd.delete();
        }
    })
    .catch(e => { // handle permission errors

        if (e instanceof MvbotErrors.PermissionToError)
            cmd.user

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
    if (message.content.startsWith(PREFIX)) {

        if (message.author.bot) return;

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
