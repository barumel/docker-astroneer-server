const { get } = require('lodash');

const SteamCmd = require('./src/SteamCmd');
const Astroneer = require('./src/Astroneer');

async function run() {
  const steamCmd = SteamCmd();
  const astroneer = Astroneer();

  await steamCmd.updateCmd();
  await steamCmd.updateGame();
  await astroneer.init();
  await astroneer.updateConfig();
  await astroneer.start();

  if (get(process.env, 'SERVER_AUTO_RESTART', true)) {
    astroneer.autoRestart();
  }
}

run();
