const fs = require('fs-extra');
const moment = require('moment');

fs.watch('/astroneer/Astro/Saved/SaveGames', () => {
  const date = moment().format();
  const folder = `/backup/${date}`;

  fs.ensureDirSync();

  fs.cpSync('/astroneer/Astro/Saved/SaveGames', folder, { recursive: true });
});
