'use strict';

const { CommandType } = require('ranvier');

/**
 * Interpreter.. you guessed it, interprets command input
 */
class CommandParser {
  /**
   * Parse a given string to find the resulting command/arguments
   * @param {GameState} state
   * @param {string} data
   * @param {Player} player
   * @return {{
   *   type: CommandType,
   *   command: Command,
   *   skill: Skill,
   *   channel: Channel,
   *   args: string,
   *   originalCommand: string
   * }}
   */
  static parse(state, data, player) {
    data = data.trim();

    const parts = data.split(' ');

    const command = parts.shift().toLowerCase();
    if (!command.length) {
      throw new InvalidCommandError();
    }

    const args = parts.join(' ');

    // Kludge so that 'l' alone will always force a look,
    // instead of mixing it up with lock or list.
    // TODO: replace this a priority list
    if (command === 'l') {
      return {
        type: CommandType.COMMAND,
        command: state.CommandManager.get('look'),
        args: args
      };
    }

    // Same with 'i' and inventory.
    if (command === 'i') {
      return {
        type: CommandType.COMMAND,
        command: state.CommandManager.get('inventory'),
        args: args
      };
    }

    const roomExit = this.canGo(player, command);

    // See if the command is an exit and the player can go that way
    if (roomExit) {
      return {
        type: CommandType.MOVEMENT,
        args,
        originalCommand: command,
        roomExit,
      };
    }

    // see if they matched exactly a command
    if (state.CommandManager.get(command)) {
      return {
        type: CommandType.COMMAND,
        command: state.CommandManager.get(command),
        args,
        originalCommand: command
      };
    }

    // see if they typed at least the beginning of a command and try to match
    let found = state.CommandManager.find(command, /* returnAlias: */ true);
    if (found) {
      return {
        type: CommandType.COMMAND,
        command: found.command,
        args,
        originalCommand: found.alias
      };
    }

    // check channels
    found = state.ChannelManager.find(command);
    if (found) {
      return {
        type: CommandType.CHANNEL,
        channel: found,
        args
      };
    }

    // finally check skills
    found = state.SkillManager.find(command);
    if (found) {
      return {
        type: CommandType.SKILL,
        skill: found,
        args
      };
    }

    throw new InvalidCommandError();
  }

  /**
   * Determine if a player can leave the current room to a given direction
   * @param {Player} direction
   * @param {string} direction
   * @return {boolean}
   */
  static canGo(player, direction)
  {
    if (!player.room) {
      return false;
    }

    // n/s/e/w/etc. get handled by indexOf. ne/se/etc have to be special-cased
    const directions = {
      'ne': 'northeast',
      'se': 'southeast',
      'nw': 'northwest',
      'sw': 'southwest',
    };

    direction = directions[direction] || direction;

    return player.room.findExit(direction);
  }
}
exports.CommandParser = CommandParser;

/**
 * Used when the player enters a bad command
 * @extends Error
 */
class InvalidCommandError extends Error {}
/**
 * Used when the player tries a command they don't have access to
 * @extends Error
 */
class RestrictedCommandError extends Error {}
exports.InvalidCommandError = InvalidCommandError;
exports.RestrictedCommandError = RestrictedCommandError;
