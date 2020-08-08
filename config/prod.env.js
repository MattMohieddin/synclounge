const settings = new (require('../SettingsHelper'))();

console.log('Production settings', settings);
if (process.env.API_OVERRIDE) {
  console.log('Building with API_OVERRIDE', process.env.API_OVERRIDE);
}

module.exports = {
  NODE_ENV: '"production"',

  webroot: `"${settings.webroot}"`,
  API_OVERRIDE: `"${process.env.API_OVERRIDE}"` || undefined,
};
