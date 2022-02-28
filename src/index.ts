//import * as Discord from 'discord.js';
import { Mvbot } from './mvbot.js';
import Auth = require('./.secret.json');

const bot = new Mvbot();
bot.start(Auth.token.dev);

