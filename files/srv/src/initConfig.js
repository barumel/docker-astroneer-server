const AstroServerConfig = require('./lib/Config');

(async function initAstroServerConfig() {
  const config = AstroServerConfig();
  await config.update();

  process.exit(0);
}());
