const moment = require('moment');
const fs = require('fs-extra');
const { head, last, orderBy, isNil, chain } = require('lodash');
const clc = require('cli-color');

function Backup() {
  let backups = [];
  let backupIntervalID;
  let cleanupIntervalID;

  /**
   * Get the latest backup from backups
   *
   * @return  {String}  latest  Latest backup
   */
  function getLatest() {
    return last(backups);
  }

  /**
   * Load current backups from backup dir
   *
   * @return  {[type]}  [return description]
   */
  function load() {
    console.log(clc.blue('LOADING CURRENT BACKUPS FROM /backup AND /backup/daily'));

    const daily = fs
      .readdirSync('/backup/daily')
      .map((f) => ({
        path: `/backup/daily/${f}`,
        timestamp: f,
        type: 'daily'
      }));

    const incremental = fs
      .readdirSync('/backup/daily')
      .filter((file) => !fs.lstatSync(`/backup/${file}`).isDirectory())
      .map((f) => ({
        path: `/backup/${f}`,
        timestamp: f,
        type: 'incremental'
      }));

    return orderBy([...daily, ...incremental], ['timestamp'], ['asc']);
  }

  /**
   * Init the backup.
   * Load current backups from volume and order them by date.
   * Then start the backup intervall (10 min)
   *
   * @return  void
   */
  function init() {
    console.log(clc.blue('INIT BACKUP...'));

    fs.ensureDirSync('/backup/daily');
    backups = load();

    // Run backup every 10 minutes
    backupIntervalID = setInterval(() => {
      const timestamp = moment().format();
      console.log(clc.blue(`GOING TO CREATE INCREMENTAL BACKUP ${timestamp}...`));

      const files = fs.readdirSync('/astroneer/Astro/Saved/SaveGames');
      const file = head(files);

      // It may take a while until the save game was created... Just log and wait or the next run
      if (isNil(file)) {
        console.log(clc.yellow(`UNABLE TO CREATE BACKUP ${timestamp} AS THERE IS NO SAVE GAME FILE!`));
        return;
      }

      // Copy file
      fs.copySync(`/astroneer/Astro/Saved/SaveGames/${file}`, `/backup/${timestamp}`);

      // Add backup to backups
      backups.push({
        path: `/backup/${timestamp}`,
        timestamp,
        type: 'incremental'
      });
      console.log(clc.green(`INCREMENTAL BACKUP ${timestamp} CREATED!`));
    }, 600000);

    // Run cleanup every hour
    cleanupIntervalID = setInterval(cleanup, (60 * 60 * 1000));

    console.log(clc.green('BACKUP IS NOW RUNNING'));
  }

  /**
   * Stop the backup
   *
   * @return  void
   */
  function stop() {
    clearInterval(backupIntervalID);
    clearInterval(cleanupIntervalID);
    console.log(clc.green('BACKUP STOPPED!'));
  }

  /**
   * Restore the given backup
   *
   * @param   {String}  timestamp  Backup timestamp
   *
   * @return  void
   */
  function restore(timestamp) {
    console.log(clc.blue('--------------RESTORE BACKUP--------------'));
    console.log(clc.blue(`TRY TO RESTORE BACKUP FROM ${timestamp}`));

    const backup = backups.find((b) => b.timestamp === timestamp);
    if (isNil(backup)) {
      console.log(clc.red(`NO BACKUP FOR THE GIVEN TIMESTAMP (${timestamp}) FOUND!`));

      return;
    }

    const dest = `/astroneer/Astro/Saved/SaveGames/SERVER$${moment(timestamp).format('YYYY.MM.DD-hh.mm.ss')}.savegame`;
    console.log(clc.green(`GOING TO MOVE BACKUP TO ${dest}`));
    fs.emptyDirSync('/astroneer/Astro/Saved/SaveGames')
    fs.copySync(backup.path, dest);

    console.log(clc.green('SUCESSFULLY REPLACED SAVE GAME WITH BACKUP!'));
  }

  /**
   * Cleanup old backups
   * We are going to keep all the backups from current day and the latest one from prev days
   *
   * @return  void
   */
  function cleanup() {
    console.log(clc.blue('RUNNING PERIODIC BACKUP CLEANUP...'));

    const items = load();
    const move = chain(items)
      .filter((b) => b.type !== 'daily')
      .groupBy((b) => moment(b.timestamp).startOf('day').format())
      .omit([moment().startOf('day').format()])
      .reduce((result, b) => {
        const latest = chain(b)
          .orderBy(['timestamp'], ['asc'])
          .last()
          .value();

        return [
          ...result,
          latest
        ];
      }, [])
      .value()

    console.log(clc.blue('THE FOLLOWING BACKUPS WILL BE MOVED TO THE DAILY FOLDER:'));
    console.log(move);

    // Move files and reload backups
    move.forEach((b) => fs.moveSync(b.path, `/backup/daily/${b.timestamp}`));
    backups = load();

    console.log(clc.green('CLEANUP SUCESSFUL!'));
  }

  return Object.freeze({
    init,
    stop,
    restore,
    getLatest,
    cleanup
  });
}

module.exports = Backup;
