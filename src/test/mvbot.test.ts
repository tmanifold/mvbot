/* eslint-disable @typescript-eslint/no-var-requires */

import * as Discord from 'discord.js';
import { MvbotChannel } from '../mvbot';  

const Mvbot = require('../mvbot');
const test_cfg = require('./config.json');

const bot = new Mvbot.Mvbot();

let guild: Discord.Guild;
let channel: Discord.GuildTextBasedChannel;

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

const test_string: string = '!mv test_target' + Date.now();
let message: Discord.Message;

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


