'use strict';

import { Snowflake, SnowflakeUtil, UserResolvable } from "discord.js";
import { MvbotChannel } from "../mvbot";
// based heavily on DJSError

// types of errors
// CommandError: issues with command formatting
// PermissionError: 

const MvbotErrorMessages = {
    
    // command errors
    DUPLICATE_OPTIONS: "Duplicate options detected.",
    INCOMPATIBLE_SWITCHES: "Two or more incompatible switches detected.",
    MESSAGE_NOT_SPECIFIED: "A message or range of messages must be given.",


    // permission errors
    INVALID_PERMISSIONS: (u: UserResolvable, t: MvbotChannel) => `Insufficient permissions for ${u} in ${t}$`,

    // 
    CHANNEL_NOT_FOUND: `The specified channel does not exist.`,
    MESSAGE_NOT_FOUND: (id: Snowflake | string) => `The specified message ${id} does not exist.`

}

//


class MvbotError extends Error {

    timestamp: number;
    code: number;

    constructor(msg = 'An error occurred while moving the message', ...args) {
        super(...args);

        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, MvbotError);
        }

        this.name = 'MvbotError';
        this.timestamp = Date.now();
        this.code = 1;
        this.message = msg;
    }
}

// class DuplicateError extends MvbotError {
//     constructor(msg = 'Duplicate options detected.', ...args) {
//         super(...args);

//         if (Error.captureStackTrace) {
//             Error.captureStackTrace(this, MvbotError);
//         }

//         this.name = 'DuplicateError';
//         this.timestamp = Date.now();
//         this.code = 2;
//         this.message = msg;
//     }
// }

// class PermissionError extends Error {
//     constructor(msg = 'Insufficient permissions.', ...args) {
//         super(...args);

//         if (Error.captureStackTrace) {
//             Error.captureStackTrace(this, MvbotError);
//         }

//         this.name = 'PermissionError';
//         this.timestamp = Date.now();
//         this.code = 50;
//         this.message = msg;
//     }
// }

// class PermissionFromError extends PermissionError {
//     constructor(msg = 'Insufficient permissions in the source channel', ...args) {
//         super(...args);

//         if (Error.captureStackTrace) {
//             Error.captureStackTrace(this, MvbotError);
//         }

//         this.name = 'PermissionFromError';
//         this.timestamp = Date.now();
//         this.code = 51;
//         this.message = msg;
//     }
// }

// class PermissionToError extends PermissionError {
//     constructor(msg = 'Insufficient permissions in the destination channel.', ...args) {
//         super(...args);

//         if (Error.captureStackTrace) {
//             Error.captureStackTrace(this, MvbotError);
//         }

//         this.name = 'PermissionToError';
//         this.timestamp = Date.now();
//         this.code = 52;
//         this.message = msg;
//     }
// }

// class MutualExclusionError extends MvbotError {
//     constructor(msg = 'Two or more incompatible switches were used.', ...args) {
//         super(...args);

//         if (Error.captureStackTrace) {
//             Error.captureStackTrace(this, MvbotError);
//         }

//         this.name = 'MutualExclusionError';
//         this.timestamp = Date.now();
//         this.code = 100;
//         this.message = msg;
//     }
// }

// class MessageError extends MvbotError {
//     constructor(msg = 'A message or range of messages must be given.', ...args) {
//         super(...args);

//         if (Error.captureStackTrace) {
//             Error.captureStackTrace(this, MvbotError);
//         }

//         this.name = 'MessageError';
//         this.timestamp = Date.now();
//         this.code = 101;
//         this.message = msg;
//     }
// }

// class DestinationError extends MvbotError {
//     constructor(msg = 'The destination channel does not exist.', ...args) {
//         super(...args);

//         if (Error.captureStackTrace) {
//             Error.captureStackTrace(this, MvbotError);
//         }

//         this.name = 'DestinationError';
//         this.timestamp = Date.now();
//         this.code = 102;
//         this.message = msg;
//     }
// }

// class TypeError extends MvbotError {
//     constructor(msg = 'The value given to a switch was not of the expected type.', ...args) {
//         super(...args);

//         if (Error.captureStackTrace) {
//             Error.captureStackTrace(this, MvbotError);
//         }

//         this.name = 'TypeError';
//         this.timestamp = Date.now();
//         this.code = 103;
//         this.message = msg;
//     }
// }

// class RangeError extends MvbotError {
//     constructor(msg = 'Value out of range.', ...args) {
//         super(...args);

//         if (Error.captureStackTrace) {
//             Error.captureStackTrace(this, MvbotError);
//         }

//         this.name = 'RangeError';
//         this.timestamp = Date.now();
//         this.code = 104;
//         this.message = msg;
//     }
// }

module.exports = {
    MvbotError,
    // DuplicateError,
    // PermissionError,
    // PermissionFromError,
    // PermissionToError,
    // MutualExclusionError,
    // DestinationError,
    // MessageError,
    TypeError,
    RangeError
}
