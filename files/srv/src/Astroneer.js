const { spawn } = require('child_process');
const clc = require('cli-color');
const fs = require('fs-extra');
const ini = require('ini');
const { get, set } = require('lodash');
const axios = require('axios');
const moment = require('moment');

const ac = new AbortController();
const { signal } = ac;

function ensureFiles() {
  fs.ensureDirSync('/astroneer/Astro/Saved/Config/WindowsServer');

  let engineIni = false;
  let astroIni = false;
  let fired = false;

  return new Promise((resolve) => {
    fs.watch('/astroneer/Astro/Saved/Config/WindowsServer', { signal }, (eventType, filename) => {
      console.log(clc.blue('CONFIG FILE DIR CHANGED', eventType, filename));
      if (eventType === 'change' && filename === 'AstroServerSettings.ini') astroIni = true;
      if (eventType === 'change' && filename === 'Engine.ini') engineIni = true;

      // Files may change multiple times. If both changed, wait another 20 second to make sure all changes are applied
      if (!fired && (astroIni && engineIni)) {
        console.log(clc.green('CONFIG FILES CREATED. WAIT FOR ANOTHER 40 SECONDS TO MAKE SURE ALL CHANGES WERE APPLIED...'));
        fired = true;
        setTimeout(() => {
          ac.abort();
          resolve();
        }, 40000);
      }
    });
  });
}

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

function Astroneer() {
  let child = undefined;

  async function init() {
    // Check if there are already config files in the WindowsServer dir.
    // If yes, this is not the first run and we can continue
    if (
      fs.existsSync('/astroneer/Astro/Saved/Config/WindowsServer/AstroServerSettings.ini')
      && fs.existsSync('/astroneer/Astro/Saved/Config/WindowsServer/Engine.ini')
    ) {
      return;
    }

    console.log(clc.yellow('NO CONFIG FILES FOUND. THIS MAY BE THE CASE IF THE SERVER RUNS THE FIRST TIME. WAIT...'));
    start();

    // If not, we have to start the server and wait for the files to be generated
    await ensureFiles();

    console.log(clc.green('CONFIGFILES WERE CREATED. SHUT DOWN THE SERVER, UPDATE CONFIG AND THE RESTART'));
    process.kill(-child.pid, 'SIGTERM');
    process.kill(-child.pid, 'SIGKILL');

    return;
  }

  // TODO: Add ability to pass ini setting as env var
  async function updateConfig() {
    const engine = ini.decode(fs.readFileSync('/astroneer/Astro/Saved/Config/WindowsServer/Engine.ini', 'utf8'));
    const astro = ini.decode(fs.readFileSync('/astroneer/Astro/Saved/Config/WindowsServer/AstroServerSettings.ini', 'utf8'));

    // ini seems to remove entries from file (bad formatted??)
    // Append stuff instead replace. does not work properly atm. as it add stuff multiple times (on every startup)
    // TODO: Make sure old entries are removed before appending shit...
    set(engine, 'URL.Port', get(process.env, 'SEVER_PORT', '8777'));
    set(engine, 'SystemSettings', { 'net.AllowEncryption': 'False' });
    set(engine, '/Script/OnlineSubsystemUtils.IpNetDriver', {
      MaxClientRate: 1048576,
      MaxInternetClientRate: 1048576
    });

    fs.writeFileSync('/astroneer/Astro/Saved/Config/WindowsServer/Engine.ini', ini.encode(engine));

    const publicIp = await getPublicIp();
    set(astro, '/Script/Astro.AstroServerSettings.ServerName', get(process.env, 'SERVER_NAME', 'Ooops... i did forget to set a server name'));
    set(astro, '/Script/Astro.AstroServerSettings.PublicIP', get(process.env, 'PUBLIC_IP', publicIp));
    set(astro, '/Script/Astro.AstroServerSettings.OwnerName', get(process.env, 'OWNER_NAME', 'Hans Wurst'));
    set(astro, '/Script/Astro.AstroServerSettings.ServerPassword', get(process.env, 'SERVER_PASSWORD', 'Well... that was clear'));
    set(astro, '/Script/Astro.AstroServerSettings.AutoSaveGameInterval', get(process.env, 'SERVER_AUTO_SAVE_INTERVAL', 600));
    set(astro, '/Script/Astro.AstroServerSettings.EnableAutoRestart', 'False');

    fs.writeFileSync('/astroneer/Astro/Saved/Config/WindowsServer/AstroServerSettings.ini', ini.encode(astro));
  }

  function start() {
    console.log(clc.green('STARTING THE SERVER'));

    child = spawn('Xvfb :99 -screen 0 1024x768x16 -nolisten tcp & DISPLAY=:99 wine64 "/astroneer/Astro/Binaries/Win64/AstroServer-Win64-Shipping.exe"', {
      shell: true,
      detached: true
    });

    child.stdout.on('data', (data) => {
      console.log(clc.blue('GOT DATA FROM CHILD: ', data.toString()));
    });

    child.on('close', (code) => {
      console.log(clc.red(`child process close all stdio with code ${code}`));
    });

    child.on('message', (message) => {
      console.log(clc.blue('GOT MESSAGE FROM CHILD: ', message));
    })

    child.on('error', (err) => {
      console.log(clc.red('WE GOT AN ERROR', err.toString()));
    });

    child.stderr.on('data', (err) => {
      console.log(clc.red('ON ERROR:', err.toString()));
    });

    child.on('exit', (code) => {
      console.log(`child process exited with code ${code}`);
    });
  }

  async function stop() {
    return new Promise((resolve) => {
      console.log(clc.yellow('GOING TO STOP THE SERVER...'));

      process.kill(-child.pid, 'SIGTERM');
      process.kill(-child.pid, 'SIGKILL');

      console.log(clc.green('SERVER STOPPED...'));

      setTimeout(resolve, 10000);
    });
  }

  function scheduleRestart(ms) {
    console.log(clc.blue(`SCHEDULE NEXT RESTART ON ${moment().add(ms, 'milliseconds').format()}`));

    setTimeout(async () => {
      const backupTarget = `/backup/restart/${moment().format()}`;
      fs.ensureDirSync(backupTarget);
      fs.cpSync('/astroneer/Astro/Saved/SaveGames', backupTarget, { recursive: true });

      await stop();

      start();

      scheduleRestart(86400 * 1000)
    }, ms);
  }

  function autoRestart() {
    const restartTime = get(process.env, 'SERVER_AUTO_RESTART_TIME', '05:00');
    const [hour, minute] = restartTime.split(':');

    const now = moment();
    const next = moment().set({ hour, minute });

    const diff = now.isAfter(next)
      ? next.add(1, 'day').diff(now, 'milliseconds')
      : next.diff(now, 'milliseconds');

    scheduleRestart(diff);
  }

  return Object.freeze({
    init,
    updateConfig,
    start,
    stop,
    autoRestart
  });
}

module.exports = Astroneer;
