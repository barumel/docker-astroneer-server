const fs = require('fs-extra');
const { get, noop } = require('lodash');
const clc = require('cli-color');
const moment = require('moment');

function HealthCheck() {
  let intervalID;
  let callback = noop;

  /**
   * Init the health check.
   * Not sure why but after running the server for a while, savegames seems to get corrupted.
   * In this case, the server creates a new save game file and ignores the existing one.
   * Not sure if there is a better solution to detect that problem but now we are
   * simply going to count the number of files in the SaveGames folder.
   * As there should only be one save game, multiple files indicate a potential problem with the old one...
   *
   * @return  void
   */
  function init() {
    intervalID = setInterval(() => {
      // It may take a while until the save game was created... Just log and wait or the next run
      if (!fs.existsSync('/astroneer/Astro/Saved/SaveGames')) {
        console.log(clc.yellow(`${moment().format()} UNABLE TO INIT HEALTH CHECK AS THERE IS NO SAVE GAME FILE!`));

        return;
      }

      const files = fs.readdirSync('/astroneer/Astro/Saved/SaveGames');
      const count = get(files, 'length', 0);

      if (count > 1) {
        console.log(clc.red(`${moment().format()} MULTIPLE SAVE GAME FILES DETECTED! THIS INDICATES A BROKEN SAVE GAME...`));
        return callback();
      }
    }, 20000);

    console.log(clc.green('HEALTH CHECK IS NOW RUNNING'));
  }

  /**
   * Stop the health check
   *
   * @return  void
   */
  function stop() {
    clearInterval(intervalID);
    console.log(clc.green('HEALTH CHECK STOPPED!'));
  }

  /**
   * Register failed callback
   *
   * @param   {Function}  cb  Callback to execute if the healt check fails
   *
   * @return  void
   */
  function onFailed(cb) {
    callback = cb;
  }

  return Object.freeze({
    init,
    stop,
    onFailed
  });
}

module.exports = HealthCheck;
