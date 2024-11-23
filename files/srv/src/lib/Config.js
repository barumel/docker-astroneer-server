const clc = require('cli-color');
const fs = require('fs-extra');
const ini = require('ini');
const { get, setWith, isNil, pickBy, isEmpty } = require('lodash');
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
  function getEnvVar(name, defaultReturn = undefined) {
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
    try {
      const url = 'https://api.ipify.org/';

      const { data } = await axios({
        url,
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json'
        }
      });

      console.log(clc.blue(`${moment().format()}: Public ip address returned from https://api.ipify.org: ${data}`));

      return data;
    } catch (error) {
      console.log(clc.yellow(`${moment().format()}: Unable to get public ip address from https://api.ipify.org`, error));

      return undefined;
    }
  }

  /**
   * Update engine.ini with values from env
   *
   * @return  void
   */
  async function updateEngine() {
    const engine = ini.decode(fs.readFileSync('/astroneer/Astro/Saved/Config/WindowsServer/Engine.ini', 'utf8'));

    const values = {
      ASTRO_SERVER_PORT: getEnvVar('ASTRO_SERVER_PORT', '8777')
    };

    setWith(engine, 'URL.Port', values.ASTRO_SERVER_PORT, Object);
    setWith(engine, 'SystemSettings', { 'net.AllowEncryption': 'False' }, Object);
    setWith(engine, '/Script/OnlineSubsystemUtils.IpNetDriver', {
      MaxClientRate: 1048576,
      MaxInternetClientRate: 1048576
    }, Object);

    fs.writeFileSync('/astroneer/Astro/Saved/Config/WindowsServer/Engine.ini', ini.encode(engine));

    return values;
  }

  /**
   * Update AstroServerSettings with values from env
   *
   * @return  void
   */
  async function updateAstroServerSettings() {
    const astro = ini.decode(fs.readFileSync('/astroneer/Astro/Saved/Config/WindowsServer/AstroServerSettings.ini', 'utf8'));

    const publicIp = await getPublicIp();
    const values = {
      ASTRO_SERVER_PUBLIC_IP: getEnvVar('ASTRO_SERVER_PUBLIC_IP', publicIp),
      ASTRO_SERVER_NAME: getEnvVar('ASTRO_SERVER_NAME'),
      ASTRO_SERVER_OWNER_NAME: getEnvVar('ASTRO_SERVER_OWNER_NAME'),
      ASTRO_SERVER_PASSWORD: getEnvVar('ASTRO_SERVER_PASSWORD'),
      ASTRO_SERVER_AUTO_SAVE_INTERVAL: getEnvVar('ASTRO_SERVER_AUTO_SAVE_INTERVAL', 60)
    };

    const missing = pickBy(values, (value) => isNil(value));
    if (!isEmpty(missing)) {
      console.log(clc.red(`${moment().format()}: One or more required env variables are missing!`, Object.values(missing).join(', ')));

      process.exit(1);
    }

    setWith(astro, '/Script/Astro.AstroServerSettings.PublicIP', values.ASTRO_SERVER_PUBLIC_IP, Object);
    setWith(astro, '/Script/Astro.AstroServerSettings.ServerName', values.ASTRO_SERVER_NAME, Object);
    setWith(astro, '/Script/Astro.AstroServerSettings.OwnerName', values.ASTRO_SERVER_OWNER_NAME, Object);
    setWith(astro, '/Script/Astro.AstroServerSettings.ServerPassword', values.ASTRO_SERVER_PASSWORD, Object);
    setWith(astro, '/Script/Astro.AstroServerSettings.AutoSaveGameInterval', values.ASTRO_SERVER_AUTO_SAVE_INTERVAL, Object);
    setWith(astro, '/Script/Astro.AstroServerSettings.EnableAutoRestart', 'False', Object);

    fs.writeFileSync('/astroneer/Astro/Saved/Config/WindowsServer/AstroServerSettings.ini', ini.encode(astro));

    return values;
  }

  /**
   * Update config in ini files
   *
   * @return  void
   */
  async function update() {
    console.log(clc.blue(`${moment().format()}: Going to update config files with current env variables...`));

    const { ASTRO_SERVER_PORT } = await updateEngine();
    const { ASTRO_SERVER_PUBLIC_IP } = await updateAstroServerSettings();

    console.log(clc.green(`${moment().format()}: Successfully updated config files!`));
    console.log(clc.green(`${moment().format()}: -------------------------------------`));
    console.log(clc.blue(`${moment().format()}: Server IP: ${ASTRO_SERVER_PUBLIC_IP}`));
    console.log(clc.blue(`${moment().format()}: Server Port: ${ASTRO_SERVER_PORT}`));
    console.log(clc.blue(`${moment().format()}: Server URL: ${ASTRO_SERVER_PUBLIC_IP}:${ASTRO_SERVER_PORT}`));
    console.log(clc.green(`${moment().format()}: -------------------------------------`));
  }

  return Object.freeze({
    getEnvVar,
    getPublicIp,
    update
  });
}

module.exports = AstroServerConfig;
