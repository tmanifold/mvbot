
import { match } from 'assert';
import * as Discord from 'discord.js';
import * as MvbotUtil from './util/mvbotUtil';

const Auth = require('../.secret.json');
const pkg_info = require('../package.json');

const MvbotError = require('./error/mvbotError');

const MVBOT_PREFIX = '!mv';
const MVBOT_EMBED_COLOR = 0x2b1b4a;

const MVBOT_PERMS = {
    BOT: new Discord.Permissions([
        'ATTACH_FILES',
        'EMBED_LINKS',
        'MANAGE_MESSAGES',
        'READ_MESSAGE_HISTORY',
        'SEND_MESSAGES',
        'VIEW_CHANNEL'
    ]),
    USER: new Discord.Permissions([
        'MANAGE_MESSAGES'
    ])
};

// Initialize bot and ClientOptions
// https://discord.js.org/#/docs/main/stable/typedef/ClientOptions
const MVBOT_INTENTS = new Discord.Intents([
    Discord.Intents.FLAGS.GUILDS,
    Discord.Intents.FLAGS.GUILD_MEMBERS,
    Discord.Intents.FLAGS.GUILD_MESSAGES,
    Discord.Intents.FLAGS.GUILD_WEBHOOKS
]);

export type MvbotChannel = Discord.TextChannel | Discord.NewsChannel;

class Mvbot {
    version: number;
    permissions: Discord.Permissions;
    #client: Discord.Client;

    constructor() {
        this.version = pkg_info.version;

        this.initClient();
        console.log('client initialized');
    }

    start(token) {
        this.#client.login(token).catch(console.error);
    }

    initClient() {
        this.#client = new Discord.Client({ intents: MVBOT_INTENTS });

        this.#client.once('ready', async () => {
            try {
                this.#client.user.setPresence({
                    activities: [
                        { name: 'ver. ' + this.version }
                    ],
                    status: 'online'
                });
        
            } catch (error) {
                console.log(error);
            }
        
            console.log('mvbot client ready!');
        });

        this.#client.on('messageCreate', async (message: Discord.Message) => {
            // ignore bots
            if (message.author.bot) return;
            // ignore DMs
            if (message.channel.type == 'DM') return;
            // ignore webhooks
            if (message.webhookId) return;

            // verify prefix
            if (message.content.startsWith(`${MVBOT_PREFIX}`)) {

                // get the message content and user information
                let content: string = message.content;
                let user: Discord.GuildMember = message.member;
                let sourceChannel: Discord.TextBasedChannel = message.channel;
                let guild: Discord.Guild = sourceChannel.guild;

                try {
                    // validate permissions for bot and invoking user
                    let self: Discord.GuildMember = await guild.members.fetch(this.#client.user);
                    // validate perms for source channel
                    MvbotUtil.validatePermissions(self, sourceChannel, MVBOT_PERMS.BOT);
                    MvbotUtil.validatePermissions(user, sourceChannel, MVBOT_PERMS.USER);

                    // parse the command string
                    let cmd = message.content
                                .split(' ')
                                .filter(e => e != '')
                                .map(e => e.trim());
                    console.log(cmd);
                    let targetChannel: string = 'test_channel';
                    
                } catch (error) {
                    console.log(error);
                }
                
                // create a webhook for the target channel
                // use the webhook to resend the message in the new channel
                // verify it worked
                // delete the old message
                // delete the webhook

            }
        });
    }

    usage(channel: MvbotChannel) {
        channel.send({
            embeds: [
                {
                    color: MVBOT_EMBED_COLOR,
                    author: {
                        name: this.#client.user.username,
                        iconURL: this.#client.user.displayAvatarURL(),
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
                        text: 'mvbot -v' + this.version,
                    },
                }
            ]
        });

       // channel.send({ embeds: e });
    }

    move(src: MvbotChannel, dest: MvbotChannel) {

    }

    createWebhook() {

    }

    removeWebhook() {

    }
}

module.exports = {
    Mvbot,
    Auth,
    pkg_info,
    MvbotError,
    MVBOT_PREFIX,
    MVBOT_EMBED_COLOR,
    MVBOT_PERMS,
    MVBOT_INTENTS
};