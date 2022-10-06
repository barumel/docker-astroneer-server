const { spawn } = require('child_process');
var clc = require("cli-color");

function SteamCmd() {
  /**
   * Update the steam cmd itself
   *
   * @return {[type]} [description]
   */
  async function updateCmd() {
    console.log(clc.green('STEAM CMD UPDATE STARTED'));

    return new Promise((resolve, reject) => {
      const child = spawn('./steamcmd.sh +quit', {
        shell: true,
        cwd: '/steamcmd'
      });

      child.stdout.on('data', (data) => {
        console.log(clc.blue('UPDATE STEAM CMD -> INFO:'));
        console.log(data.toString());
      });

      child.stderr.on('data', (err) => {
        console.log(clc.blue('UPDATE STEAM CMD -> ERROR:'));
        console.log(err);
        reject(err);
      });

      child.on('error', (err) => {
        console.log(clc.red('UNABLE TO UPDATE STEAM CMD!'))
        console.log(err);
        reject(err);
      });

      child.on('close', (code) => {
        console.log(clc.green('SUCCESSFULLY UPDATED STEAM CMD'))
        resolve(code);
      });
    });
  }

  /**
   * Update the game
   *
   * @return {[type]} [description]
   */
  async function updateGame() {
    console.log(clc.green('GAME UPDATE STARTED'));

    return new Promise((resolve, reject) => {
      const child = spawn('./steamcmd.sh +runscript /tmp/install.txt', {
        shell: true,
        cwd: '/steamcmd'
      });

      child.stdout.on('data', (data) => {
        console.log(clc.blue('UPDATE GAME -> INFO:'));
        console.log(data.toString());
      });

      child.stderr.on('data', (err) => {
        console.log(clc.blue('UPDATE GAME -> ERROR:'));
        console.log(err);
        throw new Error('UNABLE TO UPDATE GAME!', err);
      });

      child.on('error', (err) => {
        console.log(clc.red('UNABLE TO UPDATE GAME!'))
        console.log(err);
        reject(err);
      });

      child.on('close', (code) => {
        console.log(clc.green('SUCCESSFULLY UPDATED GAME'))
        resolve(code);
      });
    });
  }

  return Object.freeze({
    updateCmd,
    updateGame
  });
}

module.exports = SteamCmd;
