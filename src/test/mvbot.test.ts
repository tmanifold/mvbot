import * as Discord from 'discord.js';
// import * as Mvbot from '../mvbot';
import { MvbotChannel } from '../mvbot';

(async () => {

    // import assert = require('assert');    

    const Mvbot = require('../mvbot');
    
    const test_cfg = require('./config.json');
    
    const bot = new Mvbot.Mvbot();
    // bot.start(Mvbot.Auth.token.dev);
    
    let guild: Discord.Guild;
    let channel: Discord.GuildTextBasedChannel;
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

        test('Ready check', () => {
            // expect.assertions(1);
            //return expect(bot.start(Mvbot.Auth.token.dev)).resolves.toBe(Mvbot.Auth.token.dev);
            expect(bot.isReady()).toBe(true);
        });
    });


    
    
    // test('Send message', () => {
    //     channel.send('!mv test');
    // });


})();
