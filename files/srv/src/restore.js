const fs = require('fs-extra');
const { chain } = require('lodash');
const moment = require('moment');
const clc = require('cli-color');

(async function restore() {
  fs.readdirSync('/backup/restore')
    .filter((file) => !fs.lstatSync(`/backup/restore/${file}`).isDirectory())
    .forEach((file) => {
      const name = chain(file)
        .replace('.savegame', '')
        .split('$')
        .first()
        .value();

      console.log(clc.yellow(`${moment().format()}: Backup to restore with name ${name} (${file}) found`));
      console.log(clc.blue(`${moment().format()}: Remove save games starting with ${name} and copy backup to /astroneer/Astro/Saved/SaveGames/`));

      fs.removeSync(`/astroneer/Astro/Saved/SaveGames/${name}*.savegame`);
      fs.copySync(`/backup/restore/${file}`, `/astroneer/Astro/Saved/SaveGames/${name}$${moment().format('YYYY.MM.DD-HH.mm.ss')}.savegame`);

      console.log(clc.green(`${moment().format()}: Current files removed / backups restored!`));
    });

  process.exit(0);
}());
