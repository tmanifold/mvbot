# Changelog

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
