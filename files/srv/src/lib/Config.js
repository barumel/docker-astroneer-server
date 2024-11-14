const clc = require('cli-color');
const fs = require('fs-extra');
const ini = require('ini');
const { get, setWith, isNil } = require('lodash');
const axios = require('axios');
const moment = require('moment');

function AstroServerConfig() {
  /**
   * Get a single var from env.
   * Return the defaultReturn if var is not set or an empty string
   *
   * @param   {String}  name           Var name
   * @param   {String}  defaultReturn  Default return if nil or empty
   *
   * @return  {String}  value  Env var value
   */
  function getEnvVar(name, defaultReturn) {
    const value = get(process.env, name);

    return isNil(value) || get(value, 'length', 0) === 0
      ? defaultReturn
      : value;
  }

  /**
   * Get the servers ip address from https://api.ipify.org/
   *
   * @return  {String}  ip  IP Address
   */
  async function getPublicIp() {
    const url = 'https://api.ipify.org/';

    const { data } = await axios({
      url,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json'
      }
    });

    console.log(`${moment().format()}: PUBLIC IP IS ${data}`);

    return data;
  }

  /**
   * Check if all necessary config values are set
   *
   * @return  {Boolean}
   */
  function validate() {
    const required = ['ASTRO_SERVER_NAME', 'ASTRO_SERVER_OWNER_NAME', 'ASTRO_SERVER_PASSWORD'];

    required.forEach((key) => {
      const value = getEnvVar(key);

      if (isNil(value)) {
        throw new Error(`${moment().format()}: Environment variable ${key} is required but not set!`);
      }
    });
  }

  /**
   * Update config in ini files
   *
   * @return  void
   */
  async function update() {
    console.log(clc.green(`${moment().format()}: Going to update config files with current env variables...`));

    validate();

    const engine = ini.decode(fs.readFileSync('/astroneer/Astro/Saved/Config/WindowsServer/Engine.ini', 'utf8'));
    const astro = ini.decode(fs.readFileSync('/astroneer/Astro/Saved/Config/WindowsServer/AstroServerSettings.ini', 'utf8'));

    setWith(engine, 'URL.Port', getEnvVar('ASTRO_SERVER_PORT', '8777'), Object);
    setWith(engine, 'SystemSettings', { 'net.AllowEncryption': 'False' }, Object);
    setWith(engine, '/Script/OnlineSubsystemUtils.IpNetDriver', {
      MaxClientRate: 1048576,
      MaxInternetClientRate: 1048576
    }, Object);

    fs.writeFileSync('/astroneer/Astro/Saved/Config/WindowsServer/Engine.ini', ini.encode(engine));

    const publicIp = await getPublicIp();
    setWith(astro, '/Script/Astro.AstroServerSettings.ServerName', getEnvVar('ASTRO_SERVER_NAME', 'Ooops... i forgot to set a server name'), Object);
    setWith(astro, '/Script/Astro.AstroServerSettings.PublicIP', getEnvVar('ASTRO_SERVER_PUBLIC_IP', publicIp), Object);
    setWith(astro, '/Script/Astro.AstroServerSettings.OwnerName', getEnvVar('ASTRO_SERVER_OWNER_NAME', 'Hans Wurst'), Object);
    setWith(astro, '/Script/Astro.AstroServerSettings.ServerPassword', getEnvVar('ASTRO_SERVER_PASSWORD', 'Well... that was clear'), Object);
    setWith(astro, '/Script/Astro.AstroServerSettings.AutoSaveGameInterval', getEnvVar('ASTRO_SERVER_AUTO_SAVE_INTERVAL', 60), Object);
    setWith(astro, '/Script/Astro.AstroServerSettings.EnableAutoRestart', 'False', Object);
    // setWith(astro, '/Script/Astro.AstroServerSettings.ActiveSaveFileDescriptiveName', 'SERVER', Object);

    fs.writeFileSync('/astroneer/Astro/Saved/Config/WindowsServer/AstroServerSettings.ini', ini.encode(astro));

    console.log(clc.green(`${moment().format()}: Successfully updated config files!`));
  }

  return Object.freeze({
    getEnvVar,
    getPublicIp,
    update
  });
}

module.exports = AstroServerConfig;
