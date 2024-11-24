const clc = require('cli-color');
const fs = require('fs-extra');
const ini = require('ini');
const { get, setWith, isNil, pickBy, isEmpty } = require('lodash');
const axios = require('axios');
const moment = require('moment');
const dns = require('dns').promises;

function AstroServerConfig() {
  /**
   * Check if the given env var is set and not empty
   *
   * @param   {[type]}  name  [name description]
   *
   * @return  {[type]}        [return description]
   */
  function hasEnvVar(name) {
    const value = get(process.env, name);

    return !isNil(value) && get(value, 'length', 0) > 0;
  }

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
    return !hasEnvVar(name)
      ? defaultReturn
      : get(process.env, name);
  }

  /**
   * Check if ASTRO_SERVER_DOMAIN_NAME is set and try to resolve it
   *
   * @return  {String} ip IP Address
   */
  async function resolveDomainName() {
    const domain = getEnvVar('ASTRO_SERVER_DOMAIN_NAME');
    console.log(clc.blue(`${moment().format()}: Try to resolve ${domain}`));

    try {
      const { address } = await dns.lookup(domain, { family: 4 });

      console.log(clc.blue(`${moment().format()}: Public ip address resolved for ${domain}: ${address}`));

      return address;
    } catch (error) {
      console.error(clc.yellow(`${moment().format()}: Unable to resolve ${domain}!`, error));

      return undefined;
    }
  }

  /**
   * Try to resolve the servers ip address via https://api.ipify.org/
   *
   * @return  {String}  ip  IP Address
   */
  async function resolvePublicIpAddress() {
    console.log(clc.blue(`${moment().format()}: Try to get public ip address from https://api.ipify.org`));

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
   * Try to resolve the public ip
   *
   * @return  {String}  ip  IP Address
   */
  async function getIpAddress() {
    // ASTRO_SERVER_PUBLIC_IP must overrule other values
    if (hasEnvVar('ASTRO_SERVER_PUBLIC_IP')) {
      return getEnvVar('ASTRO_SERVER_PUBLIC_IP');
    }

    return hasEnvVar('ASTRO_SERVER_DOMAIN_NAME')
      ? resolveDomainName()
      : resolvePublicIpAddress();
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

    const values = {
      ASTRO_SERVER_PUBLIC_IP: await getIpAddress(),
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
    console.log(clc.blue(`${moment().format()}: Server URI: ${ASTRO_SERVER_PUBLIC_IP}:${ASTRO_SERVER_PORT}`));
    console.log(clc.green(`${moment().format()}: -------------------------------------`));
  }

  return Object.freeze({
    hasEnvVar,
    getEnvVar,
    resolveDomainName,
    resolvePublicIpAddress,
    getIpAddress,
    update
  });
}

module.exports = AstroServerConfig;
