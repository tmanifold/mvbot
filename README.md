# mvbot

[Invite mvbot](https://discordapp.com/api/oauth2/authorize?client_id=706927667043237928&permissions=125952&scope=bot) | [Top.gg](https://top.gg/bot/706927667043237928)

A simple bot to move messages from one discord channel to another.

If you like mvbot and want to support the project, consider donating:

[![Donate](https://img.shields.io/badge/Donate-PayPal-green.svg)](https://paypal.me/tmanifold?locale.x=en_US)

<a href="https://www.buymeacoffee.com/jawugiti" target="_blank"><img src="https://cdn.buymeacoffee.com/buttons/v2/arial-yellow.png" alt="Buy Me A Coffee" style="height: 50px !important;width: 145px !important;" ></a>

### Usage
`!mv -m message [...] -d dest [options]`
#### Info
| Argument | Description |
|---|---|
| `-m message` | One or more message IDs or URLs, separated by space.|
| `-d dest` | Destination channel. |

#### Options
| Dption | Description |
|---|---|
|`-c comment` | A text string explaining why the message was moved. |
|`-n number` | Moves the specified number of messages, beginning with the one given by `-m message`. Cannot be used with a list of messages. |


#### Legacy Format:
```
!mv <message-id> <target-channel> ["reason"]
```
The three arguments are as follows:
  - *message-id*: The Message Link (right-click -> Copy Message Link) or Message ID. Note:  You will need to [enable developer mode](https://discordia.me/en/developer-mode) to use Message ID.
  - *target-channel*: Channels can be referenced by the standard #<channel-name>.
  - *reason (optional)*: Can be left blank, or provide a reason why the message is being moved. Must be enclosed in double-quotes.


### Permissions
Only users with the *MANAGE_MESSAGES* permission will be able to invoke the bot.

***mvbot*** also requires the following permissions on *every* channel to/from which messages should be movable.
- ATTACH_FILES
- EMBED_LINKS
- MANAGE_MESSAGES
- READ_MESSAGE_HISTORY
- SEND_MESSAGES
- VIEW_CHANNEL

### Example

![Example command](./img/example2.PNG)
![Example result](./img/example.PNG)
