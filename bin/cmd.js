const color = require('colorful')
const exec = require('child_process').exec
const git = require('simple-git')

// Saving this bit for later…
// const repoHostRegex = new RegExp(/[^@]+(?=:)/g)

module.exports = {
  /*
   * Runs a shell command
   * @param {String} command - the command to run
   * @return {Promise}
   */
  run: function(cmd) {
    // console.log(color.grey(`\n${cmd}`))
    return new Promise((resolve, reject) => {
      exec(cmd, (err, data, stderr) => {
        if (err) {
          reject(err, data, stderr)
        } else {
          resolve(data)
        }
      })
    })
  },
  setup: function() {},
  /*
   * Compares local hash to server hash
   * @params {String} hash, {String} serverHash
   * @return {Promise}
   */
  compareHashes: function(hash, serverHash) {
    var that = this
    return new Promise((resolve, reject) => {
      that
        .run(`git rev-list ${hash} ^${serverHash} --count --right-only`)
        .then(count => {
          count = count.trim()
          console.log(color.grey('----------------------------------------'))
          if (count > 0) {
            var v = count > 1 ? 'commits' : 'commit'
            console.log(color.bold(color.red(`Server is ${count} ${v} behind`)))
            console.log(color.yellow(`commit: ${serverHash}`))
          } else {
            console.log(
              color.bold(color.green('Server is on the latest commit'))
            )
            console.log(color.green(`commit: ${serverHash}`))
          }
          console.log('\n')
          resolve(true)
        })
    })
  },
  /*
   * Shows the steps that will be taken during the deployment process
   * @params {Object} settings
   * @return N/A
   */
  steps: function(settings) {
    var host =
      settings.environment[settings.env].host ||
      settings.environment.default.host
    var path =
      settings.environment[settings.env].path ||
      settings.environment.default.path
    console.log(
      `\n\nHere are the steps we will perform should you choose to deploy now:\n` +
        color.green(
          `1. SSH into ${host}\n2. Go to the directory: ${path}\n3. Force checkout commit hash: ` +
            settings.hash +
            `\n`
        )
    )
  }
}
