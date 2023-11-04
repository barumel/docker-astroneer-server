const fs = require('fs-extra');
const moment = require('moment');

fs.ensureDirSync('/astroneer/Astro/Saved/SaveGames');

function backup() {
  const date = moment().format();
  const dest = `/backup/${date}`;
  console.log(`CREATE BACKUP ${dest}`);

  fs.ensureDirSync(dest);
  const options = {
    preserveTimestamps: true,
    recursive: true
  };

  fs.cp('/astroneer/Astro/Saved/SaveGames', dest, options, (err) => {
    if (err) {
      console.log('ERROR IN BACKUP SCRIPT: CANNOT COPY FILES', err);
    } else {
      console.log('BACKUP CREATED');
    }
  });

  setTimeout(backup, 600000);
}

backup();
