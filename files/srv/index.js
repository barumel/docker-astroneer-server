const Server = require('./src/Server.js');

async function run() {
  const server = Server();

  await server.init();
  await server.start();
}

run();
