const { spawn } = require('child_process');
const clc = require('cli-color');

const Config = require('./Config');

function AstroneerServer() {
  const config = Config();
  let child = undefined;

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
  }

  /**
   * Start the server
   *
   * @return  void
   */
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

  /**
   * Stop the server
   *
   * @return void
   */
  async function stop() {
    return new Promise((resolve) => {
      console.log(clc.yellow('GOING TO STOP THE SERVER...'));

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
