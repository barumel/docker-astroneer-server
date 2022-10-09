const fs = require('fs-extra');
const moment = require('moment');

fs.ensureDirSync('/astroneer/Astro/Saved/SaveGames');

fs.watch('/astroneer/Astro/Saved/SaveGames', (eventType, filename) => {
  console.log('BACKUP TRIGGERED', eventType, filename);
  const date = moment().format();
  const folder = `/backup/${date}`;

  fs.ensureDirSync(folder);

  fs.cpSync('/astroneer/Astro/Saved/SaveGames', folder, { recursive: true });
});
