const {Client, MessageEmbed} = require('discord.js')
const Auth = require('./auth.json')
const pkg_info = require('./package.json')

var bot = new Client();

function usage(channel) {

    channel.send('usage:\n `!mv <message-id> <target channel> ["reason"]`');
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

    if (message.content.startsWith('!mv')) {

        let args = message.content.split(' ');

        // syntax: !mv <message> <channel> "<reason>"

        if (!args[2]) {
            message.channel.send('Invalid number of arguments');
            usage(message.channel);
            return;
        }

        let target_message = '';

        if (args[1].search(/^(https:\/\/discord.com\/channels\/)/) >= 0) {
            // The target is given by url
            target_message = args[1].substring(args[1].lastIndexOf('/') + 1);
        } else {
            // assume a message id is given
            target_message = args[1];
        }

        message.channel.messages.fetch(target_message).then(msg => {

            if (!message.member.hasPermission("MANAGE_MESSAGES")) {

                message.channel.send('Sorry, ' + message.member.displayName + '. I can\'t let you do that.');
                return;
            }

            target_channel = bot.channels.resolve(
                args[2].replace(/<#/, '')
                        .replace(/>/, '')
                        );

            if (!target_channel) {
                message.channel.send('The target channel doesn\'t exist!');
                usage(message.channel);
                return;
            }

            let mvstr = '<@' + msg.member + '> | <#' + message.channel + '>\n';
            mvstr += message.createdAt + '\n';
            mvstr += (args[3] == null) ? '' : '*\"' + message.content.split('\"', 2)[1] + '\"*';
            mvstr += ' - <@' + message.member + '>\n\n';
            let embeds = [];
            let attachments = [];


            if (msg.embeds.length > 0) {

                msg.embeds.forEach( element => {

                    console.log(element);
                    embeds.push(element);

                }, err => {
                    console.log(err);
                });

            } else {

                if (msg.attachments.size > 0) {

                    msg.attachments.each(a => {
                        console.log(a);
                        attachments.push(a.proxyURL);
                    });
                }
            }

            target_channel.send(msg.content == '' ? mvstr :  mvstr + '>>> ' + msg.content, {
                files: attachments,
                embeds: embeds
            });

           msg.delete(); // delete message to be moved.
           message.delete(); // delete invoking message

        }, () => {
            message.channel.send('I was unable to find the message you want to move. Ensure you are entering a valid message ID.');
        });
    }

});

bot.on('error', err => {
    console.log(err);
});

bot.login(Auth.bot_token);
