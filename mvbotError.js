'use strict';

class MvbotError extends Error {
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

class PermissionError extends Error {
    constructor(msg = 'Insufficient permissions.', ...args) {
        super(...args);

        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, MvbotError);
        }

        this.name = 'PermissionError';
        this.timestamp = Date.now();
        this.code = 50;
        this.message = msg;
    }
}

class MutualExclusionError extends MvbotError {
    constructor(msg = 'Two or more incompatible switches were used.', ...args) {
        super(...args);

        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, MvbotError);
        }

        this.name = 'MutualExclusionError';
        this.timestamp = Date.now();
        this.code = 100;
        this.message = msg;
    }
}

class MessageError extends MvbotError {
    constructor(msg = 'A message or range of messages must be given.', ...args) {
        super(...args);

        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, MvbotError);
        }

        this.name = 'MessageError';
        this.timestamp = Date.now();
        this.code = 101;
        this.message = msg;
    }
}

class DestinationError extends MvbotError {
    constructor(msg = 'The destination channel does not exist.', ...args) {
        super(...args);

        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, MvbotError);
        }

        this.name = 'DestinationError';
        this.timestamp = Date.now();
        this.code = 102;
        this.message = msg;
    }
}

class TypeError extends MvbotError {
    constructor(msg = 'The value given to a switch was not of the expected type.', ...args) {
        super(...args);

        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, MvbotError);
        }

        this.name = 'TypeError';
        this.timestamp = Date.now();
        this.code = 103;
        this.message = msg;
    }
}

class RangeError extends MvbotError {
    constructor(msg = 'Value out of range.', ...args) {
        super(...args);

        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, MvbotError);
        }

        this.name = 'RangeError';
        this.timestamp = Date.now();
        this.code = 104;
        this.message = msg;
    }
}

module.exports = {
    MvbotError,
    PermissionError,
    MutualExclusionError,
    DestinationError,
    MessageError,
    TypeError,
    RangeError
}