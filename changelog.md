# Changelog

# [0.3.0-alpha.1] - 2022-02-04
### Added
- index.ts
- mvbot.ts
- mvbotUtil.ts
- mvbotError.ts
### Changed
- moved most functional bot code to Mvbot class



## [0.3.0-alpha] - 2022-02-02
### Changed
- began converting to TypeScript
### Planned
- Rewrite much of the codebase
- Tests
- Support for Intents
- Support for Threads
- Use Webhooks to move messages

## [0.2.0-alpha.4] - 2021-08-09
### Fixed
- Now correctly validating message IDs

## [0.2.0-alpha.3] - 2021-05-14
### Added
- bot ignores DMs
- new error type: `DuplicateError`
### Changed
- updated README to reflect changes
### Fixed
- a bug that caused the bot to crash if it lacked the required permissions in the source channel
- a bug that prevented the bot from moving an embed and deleting the original

## [0.2.0-alpha.2] - 2021-05-14
### Fixed
- checking parameters for certain options are of numeric type
- The bot can now copy other rich embeds, however when removing them from the original message, a blank message is left behind and not deleted. Need to find a fix for this.
- ignoring duplicate command switches

## [0.2.0-alpha.1] - 2021-05-12
### Added
- `ClientOptions` during the creation of the bot client object
    - These are to manage rate-limiting and message caching
### Changed
- Header now uses embeds
- updated usage to match new command scheme
- usage now uses embeds
### Fixed
- A bug that caused the bot to report `<@null>` for the original user.
    - This was likely the result of the way discord.js handles user caching. Sometimes referencing a user by their `GuildMember` object results in `<@null>` because the object hasn't been cached at the time of reference. Changing the reference to a User object (independent of guild membership) seems to alleviate this.

## [0.2.0-alpha] - 2021-05-07
### Added
- Bulk Move
    - `-n N`
    - space-separated list of messages
- Other bots should  now be ignored
- Better error handling with custom errors
### Changed
- Command structure is now switch based.
- Rewrote sections of code and generally cleaned the place up a bit.
### Fixed
- Permissions checking
    - The bot should now check channel-based permissions and will no longer delete the original message if required permissions aren't met.

## [0.1.2] - 2020-11-15
### Fixed
- A bug that caused attached images to not be moved correctly

## [0.1.1] - 2020-11-02
### Changed
- The invoking command message is now deleted.

## [0.1.0] - 2020-05-17
### Added
- Ability to reference message by its link
- `@mention` original poster, mover, and link original `#channel`
### Changed
- Bot messages are now plaintext with blockquotes instead of embeds.
### Fixed
- A bug that caused old posts from mvbot to not be deleted when moving to a new location
