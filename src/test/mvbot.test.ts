
import assert = require('assert');
import * as Discord from 'discord.js';

const Mvbot = require('./mvbot');
const Auth  = require('../.secret.json');

const testGuildId = require('config.json');

const testGetGuild = async (client: Discord.Client) => {
    let guild: Discord.Guild = await client.guilds.fetch(testGuildId);
    console.log(testGuildId, guild);
};

function testMessageSplit(client: Discord.Client) {
    
}

const bot = new Mvbot.Mvbot();
bot.start(Auth.token.dev);