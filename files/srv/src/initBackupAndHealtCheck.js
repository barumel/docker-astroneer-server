const fs = require('fs-extra');
const clc = require('cli-color');
const { chain } = require('lodash');

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
    const backups = broken.map((b) => backup.getLatest(b));
    chain(backups)
      .compact()
      .forEach((b) => {
        console.log(clc.blue(`Latest backup of ${b.name} is ${b.timestamp}. Copy it to /backup/restore`));

        fs.copySync(b.path, `/backup/restore/${b.name}.savegame`);
      })
      .value();

    console.log(clc.blue('Exit process... Be aware that you manually have to restart the container if it is not started with "--restart always"'));

    process.exit(1);
  }

  await backup.init();
  healthCheck.onFailed(onHealthCheckFailed);
  await healthCheck.init();
}());
