const fs = require('fs-extra');
const clc = require('cli-color');
const { chain } = require('lodash');
const moment = require('moment');

const Backup = require('./lib/Backup');
const HealthCheck = require('./lib/HealtCheck');

(async function initBackupAndHealtCheck() {
  const backup = Backup();
  const healthCheck = HealthCheck();

  /**
   * Callback if the health check failed.
   * Copy the latest backup to /backup/restore and exit the process.
   * This should restart the container with the copied backup
   *
   * @param {Array} broken List of broken save game base names (e.G. SAVE_1, SAVE_2...)
   *
   * @return  {[type]}  [return description]
   */
  function onHealthCheckFailed(broken = []) {
    chain(broken)
      .map((b) => backup.getLatest(b))
      .compact()
      .forEach((b) => {
        console.log(clc.blue(`${moment().format()}: Latest backup of ${b.name} is ${b.timestamp}. Copy it to /backup/restore`));

        fs.copySync(b.path, `/backup/restore/${b.name}`);
      })
      .value();

    console.log(clc.blue(`${moment().format()}: Exit process...`));
    console.log(clc.blue(`${moment().format()}: Be aware that you manually have to restart the container if it is not started with "--restart always"`));

    process.exit(1);
  }

  await backup.init();
  healthCheck.onFailed(onHealthCheckFailed);
  await healthCheck.init();
}());
