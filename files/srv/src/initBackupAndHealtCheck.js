const Backup = require('./lib/Backup');

(async function initBackupAndHealtCheck() {
  const backup = Backup();

  await backup.init();
}());
