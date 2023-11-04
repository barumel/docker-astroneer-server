const { get, set } = require('lodash');

const ConfigFile = require('./ConfigFile');

function Engine(filename) {
  const content = ConfigFile(filename);

  const systemSettings = content?.['SystemSettings'] || {};
  const ipNetDriver = content?.['/Script/OnlineSubsystemUtils.IpNetDriver'] || {};

  set(content, 'URL.Port', get(process.env, 'SEVER_PORT', '8777'));
  set(content, 'SystemSettings', {
    ...systemSettings,
    'net.AllowEncryption': 'False'
  });

  set(content, '/Script/OnlineSubsystemUtils.IpNetDriver', {
    ...ipNetDriver,
    MaxClientRate: 1048576,
    MaxInternetClientRate: 1048576
  });

  return content;
}

module.exports = Engine;
