import * as Discord from 'discord.js';
// import { MvbotError } from '../error/mvbotError';
const MvbotError = require('../error/mvbotError');
/*
    validatePermissions: Verify the specified user has the required
                            permissions for a given channel.
    parameters:
        user (GuildMember): The user for whom permissions should be verified
        channel (TextChannel): The channel in which the user should have the given permissions
        perm (Permissions): A Permissions object containing the required permissions
    return: Boolean
*/
export const validatePermissions = (
    user: Discord.GuildMember, 
    channel: Discord.GuildTextBasedChannel, 
    perms: Discord.PermissionResolvable
    ) => {
    
        if (!user.permissionsIn(channel).has(perms, true)) throw new MvbotError.MvbotError();
    // return user.permissionsIn(channel).has(perms, true);
};

module.exports = {
    validatePermissions
};