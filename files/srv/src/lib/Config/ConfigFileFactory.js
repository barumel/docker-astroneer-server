const { get } = require('lodash');

const AstroServerSettings = require('./AstroServerSettings');
const Engine = require('./Engine');
const ConfigFile = require('./ConfigFile');

const factories = {
  AstroServerSettings,
  Engine
};

function ConfigFileFactory(filename) {
  const Factory = get(factories, filename, ConfigFile);

  return Factory(filename);
}

module.exports = ConfigFileFactory;
