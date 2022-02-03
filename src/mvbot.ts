import * as Discord from 'discord.js';
const Auth = require('../.env.json');
const pkg_info = require('../package.json');
const MvbotErrors = require('./mvbotError.js');
const PREFIX = '!mv';
const MVBOT_EMBED_COLOR = 0x2b1b4a;

// required permissions for the user to invoke the bot
const requiredPermsUser = new Discord.Permissions([
    'MANAGE_MESSAGES'
]);

// require permissions for the bot to do its thing
const requiredPermsBot = new Discord.Permissions([
    'ATTACH_FILES',
    'EMBED_LINKS',
    'MANAGE_MESSAGES',
    'READ_MESSAGE_HISTORY',
    'SEND_MESSAGES',
    'VIEW_CHANNEL'
]);

// Initialize bot and ClientOptions
// https://discord.js.org/#/docs/main/stable/typedef/ClientOptions
const botIntents = new Discord.Intents([
    Discord.Intents.FLAGS.GUILD_MEMBERS,
    Discord.Intents.FLAGS.GUILD_MESSAGES,
    Discord.Intents.FLAGS.GUILD_WEBHOOKS
]);

const bot = new Discord.Client(Object.assign({intents: botIntents}));
function usage(channel: Discord.TextChannel | Discord.NewsChannel) {
    channel.send( {
        embed: {
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
                        '`-m message`: One or more message IDs or URLs, separated by space.\n' +
                        '`-d dest`: Destination channel.'
                },
                {
                    name: 'Options',
                    value:
                        '`-c comment`: A text string explaining why the message was moved.\n' +
                        '`-n number`: Moves the specifed number of messages, beginning with the one given by `-m message`. Cannot be used with a list of messages.'
                        //'-t time        Move all messages within the timeframe, in minutes.' +
                },
                // {
                //     name: 'Legacy',
                //     value: 'usage: `!mv <message-id> <target channel> ["reason"]`',
                // },
            ],
            footer: {
                text: 'mvbot v' + pkg_info.version,
            },
        }
    });
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
const validatePermissions = (user: Discord.GuildMember, channel: Discord.TextChannel, perms: Discord.PermissionResolvable) => {
    
    return user.permissionsIn(channel).has(perms, true);
}

bot.once('ready', async () => {
    try {

        await bot.user.setPresence({
            activity: {
                name: 'ver. ' + pkg_info.version
            },
            status: 'online'
        });

    } catch (error) {
        console.log(error);
    }

    console.log('mvbot ready!');
});

bot.on('message', async (message: Discord.Message) => {
    // ignore bots
    if (message.author.bot) return;
    // ignore DMs
    if (message.channel.type === 'dm') return;
    // ignore webhooks
    if (message.webhookID) return;

    // verify prefix
    if (message.content.startsWith(`${PREFIX}`)) {


        // get the message content and user information
        let content: string = message.content;
        let user: Discord.GuildMember = message.member;
        let channel: Discord.TextChannel | Discord.NewsChannel = message.channel;
        let guild: Discord.Guild = channel.guild;

        // validate permissions for bot and invoking user
        let self: Discord.GuildMember = await guild.members.fetch(bot.user);
        console.log(self);
        
        // create a webhook for the target channel
        // use the webhook to resend the message in the new channel
        // verify it worked
        // delete the old message
        // delete the webhook

    }
});

bot.login(Auth.token.dev)
    //.then(console.log)
    .catch(console.error);