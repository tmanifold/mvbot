import * as Discord from 'discord.js';
// import * as Mvbot from '../mvbot';
import { MvbotChannel } from '../mvbot';

(async () => {

    // import assert = require('assert');    

    const Mvbot = require('../mvbot');
    
    const test_cfg = require('./config.json');
    
    const bot = new Mvbot.Mvbot();
    // bot.start(Mvbot.Auth.token.dev);
    
    const guild: Discord.Guild = bot.client.guilds.fetch(test_cfg.guild);
    // const channel: Discord.GuildTextBasedChannel = await guild.channels.fetch(test_cfg.channel) as Discord.GuildTextBasedChannel;

    beforeAll(() => {
        jest.setTimeout(10000);
    });

    test('Login', () => {
        // expect.assertions(1);
        //return expect(bot.start(Mvbot.Auth.token.dev)).resolves.toBe(Mvbot.Auth.token.dev);
        return bot.start(Mvbot.Auth.token.dev);
    }); 
    
    // test('Send message', () => {
    //     channel.send('!mv test');
    // });

    afterAll(() => {
        bot.stop();
    });

})();
