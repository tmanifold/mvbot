const {Client, MessageEmbed} = require('discord.js')
const Auth = require('./auth.json')

var bot = new Client();

function usage(channel) {

    channel.send('usage:\n `!mv <message-id> <target channel> ["reason"]`');
}

bot.on('ready', () => {

    console.log('mvbot ready!\n');
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

        message.channel.messages.fetch(args[1]).then(msg => {

            if (!message.member.hasPermission("MANAGE_MESSAGES")) {
                
                message.channel.send('Sorry, ' + message.member.displayName + '. I can\'t let you do that.');
                return;
            }

                        
            target_channel = bot.channels.resolve(
                args[2].replace(/<#/, '')
                        .replace(/>/, '')
                        );

            var embed = new MessageEmbed();

            // determine if the msg was posted by the bot itself
            if (msg.author.tag == bot.user.tag) {

                if (msg.embeds.length > 0) {
                    embed = new MessageEmbed(msg.embeds[0]);

                    msg.attachments.forEach( element => {
                        embed.attachFiles(element);
                    });

                    target_channel.send(embed);

                    return;
                }
            }

            embed.setAuthor(message.author.username, message.author.avatarURL())
            //.setTitle('#' + message.channel.name)
            .setDescription(message.createdAt)
            .setFooter('Moved by @' + message.member.displayName + ' with mvbot.' 
                + (args[3] == null ? '' : ' Reason: ' + message.content.split('\"', 2)[1]))
            .setTimestamp(new Date());
            
            if (msg.embeds.length > 0) {
                
                //console.log(msg.embeds);

                // loop through embeds and process them base on their .type

                msg.embeds.forEach( element => {

                    switch (element.type)
                    {
                        // case 'rich':
                        //     break;
                        case 'image':
                            embed.attachFiles(element.url);
                            break;
                        case 'video':
                            break;
                        case 'gifv':
                            embed.setImage(element.url);
                            break;
                        // case 'article':
                        //     break;
                         case 'link':
                            break;
                        default:
                            embed.attachFiles(element.url);
                            break;
                    }

                    //console.log(element);
                }, err => {
                    console.log(err);
                });                

            } else {

                if (msg.attachments.size > 0) {

                    msg.attachments.each(a => {
                        embed.attachFiles(a);
                    });
                    //embed.setImage(msg.attachments.first().attachment);
                }  
            }

            //console.log(args);


                //embed.addField(' ', message.content);
            var urls = '';

            msg.attachments.forEach( a => {

                urls += a.url + '\n';
            });

            embed.addField('#' + message.channel.name, (msg.content == '' ? urls : msg.content));

                //target_channel.send(embed);
            
            
            target_channel.send(embed);

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