const fs = require('fs-extra');
const moment = require('moment');

fs.ensureDirSync('/astroneer/Astro/Saved/SaveGames');

function backup() {
  const date = moment().format();
  const target = `/backup/${date}`;
  console.log(`CREATE BACKUP ${target}`);

  fs.ensureDirSync(target);

  fs.cp('/astroneer/Astro/Saved/SaveGames', target, (err) => {
    if (err) {
      console.log('ERROR IN BACKUP SCRIPT: CANNOT COPY FILES', err);
    } else {
      console.log('BACKUP CREATED');
    }
  });

  setTimeout(backup, 600000);
}

backup();
