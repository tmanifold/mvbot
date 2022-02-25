
import * as Discord from 'discord.js';
// import * as Mvbot from '../mvbot';
import { MvbotChannel } from '../mvbot';

(async () => {

    // import assert = require('assert');    

    const Mvbot = require('../mvbot');
    
    const test_cfg = require('./config.json');
    
    const bot = new Mvbot.Mvbot();
    // bot.start(Mvbot.Auth.token.dev);
    
    var guild: Discord.Guild;
    var channel: Discord.GuildTextBasedChannel;
    // const channel: Discord.GuildTextBasedChannel = await guild.channels.fetch(test_cfg.channel) as Discord.GuildTextBasedChannel;

    beforeAll(() => {
        jest.setTimeout(10000);
    });

    afterAll(() => {
        bot.stop();
    });

    describe('Setup', () => {

        test('Login', () => {

            return bot.start(Mvbot.Auth.token.dev);
        });

        test('Guild reference', () => {
            return bot.guilds
                .fetch(test_cfg.guild)
                    .then(g => {
                        guild = g;
                    })
                    .catch(console.error);
        });

        test('Channel reference', () => {
            return guild.channels
                .fetch(test_cfg.channel)
                    .then(ch => {
                        channel = ch as Discord.GuildTextBasedChannel;
                    })
                    .catch(console.error);
        });

    });
    
    var test_string: string = '!mv test_target' + Date.now();
    var message: Discord.Message;
    
    describe('Messaging', () => {

        test('Send message', () => {
            return channel.send(test_string).then(m => {
                message = m;
            });
        });

        test('Read message content', () => {

            expect(message.content).toEqual(test_string);
        });

    });
    
    describe('Commands', () => {

        test('Tokenize command string', () => {

            expect(bot.tokenizeCommand(message.content)).toEqual(bot.tokenizeCommand(test_string));
        });


    });

})();
