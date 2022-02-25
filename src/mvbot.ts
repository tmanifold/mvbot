
import * as Discord from 'discord.js';
import * as MvbotUtil from './util/mvbotUtil';

const Auth = require('./.secret.json');
const pkg_info = require('../package.json');
const arg = require('arg');

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

export type MvbotChannel = Discord.GuildTextBasedChannel;

// switches:
//     -m      the message id(s) to be moved
//     -d      the destination channel
//     -c      a comment explaining why the message was moved (optional)
//     -n      the number of messages to be moved
//     -t      the timespan in minutes


class MvbotCommand {

    #source: MvbotChannel;
    #target: MvbotChannel;
    args: object;

    constructor(tokens: string[]) {

        this.args = arg(
            {
                "-m": String,   // specifies message(s) to be moved
                "-d": String,   // destination channel id
                "-c": String,   // comment (optional)
                "-n": Number,   // number of messages to be moved
                "-t": Number
            }, {
                argv: tokens
            }
        );
    }
}

class Mvbot {
    version: number;
    permissions: Discord.Permissions;
    #client: Discord.Client;

    constructor() {
        this.version = pkg_info.version;
        this.#client = new Discord.Client({ intents: MVBOT_INTENTS });

        this.#client.once('ready', async () => {
            try {
                this.#client.user.setPresence({
                    activities: [
                        { name: 'ver. ' + this.version }
                    ],
                    status: 'online'
                });

                console.log('mvbot ready!', this.#client.user);
        
            } catch (error) {
                console.log(error);
            }        
        });
    }

    
    public get client() : Discord.Client {
        return this.#client;
    }
    

    // register a callback for the given event
    register(event: string, callback: (...args: any[]) => void) {
        this.#client.on(event, callback);
    }
    
    async start(token: string) : Promise<string> {
        this.initClient();
        return this.#client.login(token);
    }

    stop() {
        this.#client.destroy();
    }

    async initClient() {
        this.#client.on('messageCreate', async (message: Discord.Message) => {
            
            if (this.isMvbotMessage(message) === true) {
                
                // get the message content and user information
                let source  = message.channel as MvbotChannel;
                let content = message.content;
                let member  = message.member;
                let guild   = message.guild;

                if (content.trim() === MVBOT_PREFIX) {
                    this.usage(source);
                }

                try {
                    // get a reference to the bot as a guild member
                    let self: Discord.GuildMember = await guild.members.fetch(this.#client.user);

                    // validate permissions for bot and invoking user
                    // validate perms for source channel
                    MvbotUtil.validatePermissions(self, source, MVBOT_PERMS.BOT);
                    MvbotUtil.validatePermissions(member, source, MVBOT_PERMS.USER);

                    // parse the command string
                    const tokens = this.tokenizeCommand(message.content);
                    console.log(tokens);
                    const command = new MvbotCommand(tokens);
                    console.log(command.args);

                    // need to determine options, target message(s) and channel.
                    

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

    tokenizeCommand(message: string): Array<string> {
        return message
                    .split(' ')
                    .filter(e => e != '')
                    .map(e => e.trim());
    }

    validateCommand(cmd: string) {

    }

    isMvbotMessage(message: Discord.Message): boolean {
        
        if (message.author.bot // ignore bots
            || message.channel.type === 'DM' // ignore DMs
            || message.webhookId // ignore webhooks
            || !message.content.startsWith(`${MVBOT_PREFIX}`) // command doesn't begin with MVBOT_PREFIX
            ) return false;

        return true;
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
    MvbotCommand,
    Auth,
    pkg_info,
    MvbotError,
    MVBOT_PREFIX,
    MVBOT_EMBED_COLOR,
    MVBOT_PERMS,
    MVBOT_INTENTS
};