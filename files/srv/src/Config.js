const clc = require('cli-color');
const fs = require('fs-extra');
const ini = require('ini');
const { get, setWith, isNil } = require('lodash');
const axios = require('axios');
const ac = new AbortController();

const { signal } = ac;

function Config() {
  /**
   * Wait until the necessary config files have been created by astro server
   *
   * @return  {Promise}
   */
  function ensureConfigFiles() {
    fs.ensureDirSync('/astroneer/Astro/Saved/Config/WindowsServer');

    let engineIni = false;
    let astroIni = false;
    let fired = false;

    return new Promise((resolve) => {
      fs.watch('/astroneer/Astro/Saved/Config/WindowsServer', { signal }, (eventType, filename) => {
        console.log(clc.blue('CONFIG FILE DIR CHANGED', eventType, filename));
        if (eventType === 'change' && filename === 'AstroServerSettings.ini') astroIni = true;
        if (eventType === 'change' && filename === 'Engine.ini') engineIni = true;

        // Files may change multiple times. If both changed, wait another 40 second to make sure all changes are applied
        // It seems that the server automatically stops after everything was done.
        // This shouldn't be a problem as we are going to restart it after 40 seconds
        if (!fired && (astroIni && engineIni)) {
          console.log(clc.green('CONFIG FILES CREATED. WAIT FOR ANOTHER 40 SECONDS TO MAKE SURE ALL CHANGES WERE APPLIED...'));
          fired = true;
          setTimeout(() => {
            console.log(clc.green('DONE'));
            ac.abort();
            resolve();
          }, 40000);
        }
      });
    });
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
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });

    console.log('PUBLIC IP IS: ', data);

    return data;
  }

  /**
   * Check if the necessary config files were already created
   *
   * @return  {Boolean}
   */
  function isInitialized() {
    // Check if there are already config files in the WindowsServer dir.
    // If yes, this is not the first run and we can continue
    return (
      fs.existsSync('/astroneer/Astro/Saved/Config/WindowsServer/AstroServerSettings.ini')
      && fs.existsSync('/astroneer/Astro/Saved/Config/WindowsServer/Engine.ini')
    );
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
  function getEnvVar(name, defaultReturn) {
    const value = get(process.env, name);

    return isNil(value) || get(value, 'length', 0) === 0
      ? defaultReturn
      : value;
  }

  /**
   * Init the config.
   * Wait until all necessary config files were created by astro server
   *
   * @return  {Promise}
   */
  async function init() {
    console.log(clc.green('GOING TO INIT THE SERVER CONFIGURATION...'));
    await ensureConfigFiles();
  }

  function validate() {
    const required = ['ASTRO_SERVER_NAME', 'ASTRO_SERVER_OWNER_NAME', 'ASTRO_SERVER_PASSWORD'];

    required.forEach((key) => {
      const value = getEnvVar(key);

      if (isNil(value)) {
        throw new Error(`ENVIRONMENT VARIABLE ${key} IS REQUIRED BUT NOT SET!`);
      }
    })
  }

  /**
   * Update config files with values from evn
   *
   * @return  void
   */
  async function update() {
    console.log(clc.green('GOING TO UPDATE THE SERVER CONFIGURATION BASED ON CURRENT ENV VARIABLES...'));

    validate();

    const engine = ini.decode(fs.readFileSync('/astroneer/Astro/Saved/Config/WindowsServer/Engine.ini', 'utf8'));
    const astro = ini.decode(fs.readFileSync('/astroneer/Astro/Saved/Config/WindowsServer/AstroServerSettings.ini', 'utf8'));

    // ini seems to remove entries from file (bad formatted??)
    // Append stuff instead replace. does not work properly atm. as it add stuff multiple times (on every startup)
    // TODO: Make sure old entries are removed before appending shit...
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
    setWith(astro, '/Script/Astro.AstroServerSettings.ActiveSaveFileDescriptiveName', 'SERVER', Object);

    fs.writeFileSync('/astroneer/Astro/Saved/Config/WindowsServer/AstroServerSettings.ini', ini.encode(astro));
  }

  return Object.freeze({
    isInitialized,
    init,
    update
  });
}

module.exports = Config;
