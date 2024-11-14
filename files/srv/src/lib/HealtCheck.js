const fs = require('fs-extra');
const { chain, noop, first, size } = require('lodash');
const clc = require('cli-color');
const moment = require('moment');
const path = require('path');

function HealthCheck() {
  let intervalID;
  let callback = noop;

  /**
   * Init the health check.
   * Not sure why but after running the server for a while, savegames seems to get corrupted.
   * In this case, the server creates a new save game file and ignores the existing one.
   * Not sure if there is a better solution to detect that problem but now we are
   * simply going to count the number of files in the SaveGames folder.
   * As there should only be one save game, multiple files indicate
   * a potential problem with the old one...
   *
   * @return  void
   */
  function init() {
    intervalID = setInterval(() => {
      // It may take a while until the save game was created... Just log and wait or the next run
      if (!fs.existsSync('/astroneer/Astro/Saved/SaveGames')) {
        console.log(clc.yellow(`${moment().format()}: Unable to init health check as there are no save game files!`));
        return;
      }

      const files = fs.readdirSync('/astroneer/Astro/Saved/SaveGames');
      const broken = chain(files)
        .filter((file) => !fs.lstatSync(`/astroneer/Astro/Saved/SaveGames/${file}`).isDirectory())
        .filter((file) => path.extname(file) === '.savegame')
        .groupBy((file) => first(file.split('$')))
        .pickBy((f) => size(f) > 1)
        .keys()
        .value();

      if (size(broken) > 0) {
        console.log(clc.red(`${moment().format()} Multiple save game files with the same name detected (${broken.join(', ')})! This indicates a broken save game...`));
        callback(broken);
      }
    }, 20000);

    console.log(clc.green(`${moment().format()}: Health check is now running`));
  }

  /**
   * Stop the health check
   *
   * @return  void
   */
  function stop() {
    clearInterval(intervalID);
    console.log(clc.green(`${moment().format()}: Health check stopped!`));
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
