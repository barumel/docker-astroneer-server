const { spawn } = require('child_process');
const clc = require('cli-color');

const Config = require('./Config');
const HealthCheck = require('./HealthCheck');
const Backup = require('./Backup');

function AstroneerServer() {
  const config = Config();
  const healthCheck = HealthCheck();
  const backup = Backup();
  let child = undefined;

  /**
   * Callback for healt check.
   * Stop health check / backup, shut down the server, restore the backup and init / restart
   *
   * @return  void
   */
  async function onHealthCheckFailed() {
    console.log(clc.red('--------------HEALT CHECK FAILED!--------------'));
    console.log(clc.red('GOING TO RESTORE LATEST BACKUP...'));

    const latest = backup.getLatest();
    console.log(clc.blue(`LATEST BACKUP IS ${latest.timestamp}`));
    console.log(clc.blue('GOING TO STOP HEALTH CHECK / BACKUP /SERVER...'));

    healthCheck.stop();
    backup.stop();

    await stop();

    backup.restore(latest.timestamp);
    await init();
    start();

    console.log(clc.green('BACKUP SUCESSFULLY RESTORED!'));
  }

  /**
   * Init the server
   * - Check if configuration is already initialized
   * - If not (first run), start the server and wait until the config files were created
   * - Shut down the server
   * - Update current files with values from env vars
   *
   * @return  {Promise}
   */
  async function init() {
    console.log(clc.blue('--------------INIT THE SERVER--------------'));

    if (!config.isInitialized()) {
      console.log(clc.yellow('NO CONFIG FILES FOUND. THIS MAY BE THE CASE IF THE SERVER RUNS THE FIRST TIME. WAIT...'));

      // Start the server. This will create the necessary config files (may take a while)
      start();

      await config.init();
      console.log(clc.green('CONFIGFILES WERE CREATED. SHUT DOWN THE SERVER, UPDATE CONFIG AND THEN RESTART'));
      await stop();
    }

    // Update config
    await config.update();
    // Init backup
    await backup.init();
    // Init health check
    healthCheck.onFailed(onHealthCheckFailed);
    await healthCheck.init();
  }

  /**
   * Start the server
   *
   * @return  void
   */
  function start() {
    console.log(clc.blue('--------------START THE SERVER--------------'));

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

  /**
   * Stop the server
   *
   * @return void
   */
  async function stop() {
    console.log(clc.blue('--------------STOP THE SERVER--------------'));

    return new Promise((resolve) => {
      console.log(clc.blue('GOING TO STOP THE SERVER...'));

      healthCheck.stop();
      backup.stop();

      process.kill(-child.pid, 'SIGTERM');
      process.kill(-child.pid, 'SIGKILL');

      console.log(clc.green('SERVER STOPPED...'));

      setTimeout(resolve, 10000);
    });
  }

  return Object.freeze({
    init,
    start,
    stop
  });
}


module.exports = AstroneerServer;
