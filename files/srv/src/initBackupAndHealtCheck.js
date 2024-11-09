const fs = require('fs-extra');
const { isNil } = require('lodash');
const clc = require('cli-color');

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
   * @return  {[type]}  [return description]
   */
  function onHealthCheckFailed() {
    const latest = backup.getLatest();

    if (isNil(latest)) {
      console.log(clc.red('NO LATEST BACKUP FOUND!'));
      return;
    }

    console.log(clc.blue(`LATEST BACKUP IS ${latest.timestamp}. COPY TO /backup/restore`));

    fs.copySync(latest.path, '/backup/restore/SERVER.savegame');

    console.log(clc.blue('EXIT PROCESS TO TRIGGER A RESTART OF THE CONTAINER'));

    process.exit(1);
  }

  await backup.init();
  healthCheck.onFailed(onHealthCheckFailed);
  await healthCheck.init();
}());
