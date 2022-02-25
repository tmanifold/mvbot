//import * as Discord from 'discord.js';
const Mvbot = require('./mvbot');
const Auth  = require('./.secret.json');

const bot = new Mvbot.Mvbot();
bot.start(Auth.token.dev);

