const path = require('path');
const ini = require('ini');
const fs = require('fs-extra');
const { filter, toUpper, snakeCase, set } = require('lodash');

function ConfigFile(filename) {
  const file = path.join('astroneer', 'Astro', 'Saved', 'Config', 'WindowsServer', path.basename(`${filename}.ini`));
  const content = fs.existsSync(file)
    ? ini.decode(fs.readFileSync(file, 'utf-8'))
    : ini.decode('');

  filter(process.env, (value, key) => key.startsWith(`${toUpper(snakeCase(filename))}_INI`))
    .reduce((result, envValue) => {
      const [sectionKey, sectionValue] = envValue.split(':');
      const [key, value] = sectionValue.split('=');
      set(result, `[${ini.safe(sectionKey)}]['${key}']`, value);

      return result;
    }, content);

  return content;
}

module.exports = ConfigFile;
