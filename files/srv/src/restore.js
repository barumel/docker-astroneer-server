const fs = require('fs-extra');
const { chain } = require('lodash');
const moment = require('moment');
const clc = require('cli-color');

(async function restore() {
  console.log(clc.yellow(`${moment().format()}: Backup(s) to restore found!`));

  fs.readdirSync('/backup/restore')
    .filter((file) => !fs.lstatSync(`/backup/restore/${file}`).isDirectory())
    .forEach((file) => {
      const name = chain(file)
        .replace('.savegame', '')
        .split('$')
        .first()
        .value();

      console.log(clc.blue(`${moment().format()}: Backup to restore with name ${name} (${file}) found`));
      console.log(clc.blue(`${moment().format()}: Remove save games starting with ${name} and copy backup to /astroneer/Astro/Saved/SaveGames/`));

      const target = `/astroneer/Astro/Saved/SaveGames/${name}$${moment().format('YYYY.MM.DD-HH.mm.ss')}.savegame`;
      fs.removeSync(`/astroneer/Astro/Saved/SaveGames/${name}*.savegame`);
      fs.moveSync(`/backup/restore/${file}`, target);

      console.log(clc.green(`${moment().format()}: Current save game with name ${name}* removed...`));
      console.log(clc.green(`${moment().format()}: File ${file} moved to ${target}`));
    });

  console.log(clc.green(`${moment().format()}: Backup(s) successfully restored!`));

  process.exit(0);
}());
