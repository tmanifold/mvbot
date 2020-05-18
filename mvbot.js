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

        args = message.content.split(' ');

        // syntax: !mv <message> <channel> "<reason>"

        if (!args[2]) {
            message.channel.send('Invalid number of arguments');
            usage(message.channel);
            return;
        }

        var target_message = '';

        if (args[1].search(/^(https:\/\/discordapp.com\/channels\/)/) >= 0) {
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

            var bot_embed = new MessageEmbed();

            // determine if the msg was posted by the bot itself
            // if (msg.author.tag == bot.user.tag) {

            //     if (msg.embeds.length > 0) {
            //         embed = new MessageEmbed(msg.embeds[0]);

            //         msg.attachments.forEach( element => {
            //             embed.attachFiles(element);
            //         });

            //         target_channel.send(embed);
            //         msg.delete();

            //         return;
            //     }
            // }

            var mvstr = '<@' + msg.member + '> | <#' + message.channel + '>\n';
            mvstr += message.createdAt + '\n';
            mvstr += (args[3] == null) ? '' : '*\"' + message.content.split('\"', 2)[1] + '\"*';
            mvstr += ' - <@' + message.member + '>\n\n';
            var embeds = [];
            var attachments = [];

            // bot_embed.setAuthor(message.author.username, message.author.avatarURL())
            // //.setTitle('#' + message.channel.name)
            // .setDescription(message.createdAt)
            // .setFooter('Moved by @' + message.member.displayName + ' with mvbot.' 
            //     + (args[3] == null ? '' : ' Reason: ' + message.content.split('\"', 2)[1]))
            // .setTimestamp(new Date());
            
            var urls = '';

            if (msg.embeds.length > 0) {
                
                //console.log(msg.embeds);

                // loop through embeds and process them base on their .type

                msg.embeds.forEach( element => {

                    console.log(element);
                    embeds.push(element);
                  // urls += element.url + '\n';

                }, err => {
                    console.log(err);
                });    
                
                // embeds.push(bot_embed);

            } else {

                if (msg.attachments.size > 0) {

                    msg.attachments.each(a => {
                        console.log(a);
                        attachments.push(a.url);

                        //urls += a.url + '\n';
                    });
                    //embed.setImage(msg.attachments.first().attachment);
                }  
            }

            //console.log(args);


                //embed.addField(' ', message.content);
            // var urls = '';

            // msg.attachments.forEach( a => {

            //     urls += a.url + '\n';
            // });

      

                //target_channel.send(embed);

            
            
            target_channel.send(msg.content == '' ? mvstr :  mvstr + '>>> ' + msg.content, {
                files: attachments,
                embeds: embeds
            });

            // if (msg.content) {
            //     target_channel.send(msg.content);
            // }
            // target_channel.send(embed);

           msg.delete();
        }, () => {
            message.channel.send('I was unable to find the message you want to move. Ensure you are entering a valid message ID.');
        });
    }

});

bot.on('error', err => {
    console.log(err);
});

bot.login(Auth.bot_token);