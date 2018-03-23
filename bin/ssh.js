const sssh = require('simple-ssh')

module.exports = {
  /*
   * Connect to server via Simple SSH
   * @params {Object} settings, {Object} env
   * @return {Object} server
   */
  connect: function(settings, env) {
    const server = new sssh({
      host: settings[env].host || settings.default.host,
      user: settings[env].user || settings.default.user,
      baseDir: settings[env].path || settings.default.path,
      agent: process.env.SSH_AUTH_SOCK,
      agentForward: true
    })
    // Just in case we get an error, let's output something
    server.on('error', err => {
      console.error(err)
      server.end()
    })
    return server
  }
}
