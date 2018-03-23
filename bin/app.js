#!/usr/bin/env node
'use strict'

// Application modules
const cmd = require('./cmd.js')
const ssh = require('./ssh.js')

// Load settings
let settings = require('./settings.js')

// Connect to server
const connectedServer = ssh.connect(settings.environment, settings.env)

// Bring in dependencies
const color = require('colorful')
const git = require('simple-git')
const inquirer = require('inquirer')
const prependFile = require('prepend-file')
const moment = require('moment')
const args = require('args-parser')(process.argv)

/*
 * Creates a confirm screen before deploying or canceling
 */
function deployPrompt() {
  cmd.steps(settings)
  if (args.f) {
    deploy()
  } else {
    inquirer.prompt(settings.deployQuestion).then(answers => {
      if (answers.deploy) {
        deploy()
      } else {
        cancel()
      }
    })
  }
}
/*
 * Simple message for quiting deployment
 */
function cancel() {
  console.log(color.grey('Okay, no worries.\n\n'))
}

/*
 * Gets commit data based on a commit hash
 * @param {String} hash - commit hash for look up
 */
function deployFromCommit(hash) {
  git().log(['-n', '1', hash], (e, r) => {
    if (!e) {
      // error will be output to the console via simple-git anyway
      setCommitData(r)
      deployPrompt()
    }
  })
}

/*
 * Grabs commit data and stores it for reference later
 * @param {Object} data - contains the information for a specific commit
 */
function setCommitData(data) {
  settings.commitData = data.latest
  settings.hash = data.latest.hash
}

/*
 * Checks the current repo for latest branch and commit then confirms next steps
 * @return {Promise}
 */
function findHash() {
  return new Promise((resolve, reject) => {
    // Well we didn't get a good hash, so let's figure out some things...
    // Get the current `git status`
    git().status((err, result) => {
      if (err) {
        reject(err)
      } else {
        // Store which branch we are currently in
        var currentBranch = result.current
        // Grab the last commit info from the log
        git().log(['-1'], (e, r) => {
          console.log(color.bold(`\n\nLast commit on ${currentBranch} branch:`))
          console.log(`author: ${color.green(r.latest.author_name)}`)
          console.log(`message: ${color.green(r.latest.message)}`)
          console.log(`date: ${color.green(r.latest.date)}`)
          console.log(`commit: ${color.green(r.latest.hash)}`)
          // Purpose deploying the latest commit
          setCommitData(r)
          resolve(true)
        })
      }
    })
  })
}

function compareServer() {
  return new Promise((resolve, reject) => {
    connectedServer
      .exec('git log -n 1 --pretty=format:"%H"', {
        out: function(stdout) {
          settings.serverHash = stdout.trim()
        },
        err: err => {
          reject()
        },
        exit: code => {
          if (code === 0) {
            resolve(true)
          }
        }
      })
      .start()
  })
}

/*
 * Logs into environment server via SSH and runs the deploy script (aka force checkout)
 */
function deploy() {
  return new Promise((resolve, reject) => {
    console.log(color.yellow('\n\n××× DEPLOY START ××××××××××××'))
    connectedServer
      .exec(`git fetch --all && git checkout --force ${settings.hash}`, {
        out: stdout => {
          console.log(color.grey(stdout))
        },
        err: err => {
          // Show these errors in grey since some stuff that is not errors comes through output
          console.log(color.grey(err))
        },
        exit: code => {
          if (code === 0) {
            console.log(color.yellow('××× DEPLOY END ××××××××××××××\n\n'))
          } else {
            console.log(
              color.red(color.bold('Something went wrong:') + ` [${code}]`)
            )
          }
        }
      })
      .start()
  })
}

/*
 * Starts the setup process
 */
function setup() {
  if (!settings.envFile) {
    inquirer
      .prompt([
        {
          type: 'confirm',
          name: 'default',
          message: 'Would you like to use the default configuration?',
          default: true
        }
      ])
      .then(a => {
        // console.log(a)
        if (a.default) {
          console.log(`Okay we just need to know a couple things.`)
          inquirer
            .prompt([
              {
                type: 'input',
                name: 'HOST',
                message: 'Server IP Address'
              },
              {
                type: 'input',
                name: 'SSH_USER',
                message: 'Username'
              }
            ])
            .then(answers => {
              var answersStr = ''
              for (var v in answers) {
                if (answers.hasOwnProperty(v)) {
                  answersStr += v + '=' + answers[v] + '\n'
                }
              }
              answersStr += `SERVER_PATH=~/www/dev_html\nDEV_PATH=~/www/dev_html\nSTAGING_PATH=~/www/staging_html\nPROD_PATH=~/www/public_html`
              prependFile('.env', answersStr, err => {
                if (err) {
                  console.log(color.red(err))
                } else {
                  console.log(
                    color.bold(`\n\nSUCCESS!\n`) +
                      `Environement configuration file (.env) has been created with the following:\n\n`
                  )
                  console.log(color.green(answersStr) + '\n\n')
                }
              })
            })
        } else {
          console.log(
            'Okay, then you’re on your own.\nBut here are all the values that we will read if you want to copy paste them into a new .env file. ;)\n'
          )
          console.log(
            color.green(
              `HOST=[server_ip_address]\nSERVER_PATH=[path/to/files]\nSSH_USER=[username]\nDEV_HOST=[server_ip_address]\nDEV_PATH=~/www/dev_html\nDEV_USER=[server_ip_address]\nSTAGING_HOST=[server_ip_address]\nSTAGING_PATH=[path/to/files]\nSTAGING_USER=[username]\nPROD_HOST=[server_ip_address]\nPROD_PATH=[path/to/files]\nPROD_USER=[username]\n\n`
            )
          )
        }
      })
  } else {
    console.log(
      color.red(
        'Your environment config file (.env) already exists. Please remove or rename this file before trying again.'
      )
    )
    inquirer
      .prompt([
        {
          type: 'list',
          name: 'remove_env',
          message: `Would you like us to remove the file for you?`,
          choices: [
            {
              name: 'No, I changed my mind.',
              value: 0
            },
            {
              name: 'Yes, repleace the current .env.',
              value: 1
            }
          ]
        }
      ])
      .then(answers => {
        if (answers.remove_env) {
          cmd.run(`rm .env`).then((err, data, stderr) => {
            if (err || stderr) {
              console.log(color.red(err))
              console.log(color.red(stderr))
            }
            console.log(color.grey('Removed old .env file'))
            setup()
          })
        } else {
          console.log(color.grey('Okay, no worries.'))
        }
      })
  }
}

/*
 * Starts the whole process by checking if a hash was included in the arguments
 */
function init() {
  // Confirm commit hash is at least 7 characters
  if (settings.hash && settings.hash.length > 6) {
    deployFromCommit(settings.hash)
  } else {
    findHash().then(deployPrompt)
  }
}

// Check if someone is looking for help
if (args.help) {
  console.log(color.bold(`\nDeploy Kit v${settings.version}`))
  console.log(color.blue(`Usage: deploy -[environment] c=[commit hash]\n`))
  console.log(
    color.grey(`To deploy a specific commit to development:\n`) +
      `deploy -d c=3f3sf4\n`
  )
  console.log(
    color.grey(`To deploy the latest commit to development:\n`) +
      `deploy -d\n\n`
  )
}

if (args.compare) {
  findHash().then(compareServer).then(() => {
    cmd.compareHashes(settings.hash, settings.serverHash)
  })
}

// Get things rolling if we are actually deploying
if (args.length !== 0) {
  if (settings.deploying) {
    init()
  } else if (args.init) {
    setup()
  }
} else {
  console.log(color.grey(`Nothing to do.`))
}
