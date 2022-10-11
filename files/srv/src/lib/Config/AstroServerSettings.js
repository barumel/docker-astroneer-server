const { get, set } = require('lodash');

const ConfigFile = require('./ConfigFile');

function AstroServerSettings(filename) {
  const content = ConfigFile(filename);

  const values = new Map([
    ['ServerName', get(process.env, 'SERVER_NAME', 'Ooops... i did forget to set a server name')],
    // ['PublicIP', get(process.env, 'PUBLIC_IP', publicIp)]
    ['PublicIP', get(process.env, 'PUBLIC_IP', '123.456.7.8')],
    ['OwnerName', get(process.env, 'OWNER_NAME', 'Hans Wurst')],
    ['ServerPassword', get(process.env, 'SERVER_PASSWORD', 'Well... that was clear')],
    ['AutoSaveGameInterval', get(process.env, 'SERVER_AUTO_SAVE_INTERVAL', 600)],
    ['EnableAutoRestart', 'False']
  ]);

  values.forEach((value, key) => set(content, `[/Script/Astro.AstroServerSettings].${key}`, value))

  return content;
}

module.exports = AstroServerSettings;
