const fs = require('fs-extra');
const moment = require('moment');

fs.ensureDirSync('/astroneer/Astro/Saved/SaveGames');

function backup() {
  const date = moment().format();
  const folder = `/backup/${date}`;
  console.log(`CREATE BACKUP ${folder}`);

  fs.ensureDirSync(folder);

  fs.cpSync('/astroneer/Astro/Saved/SaveGames', folder, { recursive: true });

  setTimeout(backup, 600000);
}

backup();
