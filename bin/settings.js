// Load .env file into process.env
require('dotenv').config()
const args = require('args-parser')(process.argv)
const fileExists = require('file-exists')

module.exports = {
  version: '0.2.0',
  envFile: fileExists('.env'),
  env:
    args.production || args.prod || args.p
      ? 'production'
      : args.staging || args.s ? 'staging' : 'development',
  environment: {
    default: {
      host: process.env.HOST || '127.0.0.1',
      path: process.env.SERVER_PATH || process.env.PWD,
      user: process.env.SSH_USER || process.env.USER
    },
    development: {
      host: process.env.DEV_HOST || process.env.HOST || '127.0.0.1',
      path: process.env.DEV_PATH || process.env.SERVER_PATH || process.env.PWD,
      user: process.env.DEV_USER || process.env.SSH_USER || process.env.USER
    },
    staging: {
      host: process.env.STAGING_HOST || process.env.HOST || '127.0.0.1',
      path:
        process.env.STAGING_PATH || process.env.SERVER_PATH || process.env.PWD,
      user: process.env.STAGING_USER || process.env.SSH_USER || process.env.USER
    },
    production: {
      host: process.env.PROD_HOST || process.env.HOST || '127.0.0.1',
      path: process.env.PROD_PATH || process.env.SERVER_PATH || process.env.PWD,
      user: process.env.PROD_USER || process.env.SSH_USER || process.env.USER
    }
  },
  deploying: !args.init && !args.help && !args.compare ? true : false,
  hash: args.commit || args.c || process.argv[3] || '',
  serverHash: '',
  commitData: {},
  deployQuestion: [
    {
      type: 'list',
      name: 'deploy',
      message: 'What would you like to do?',
      choices: [
        {
          name: 'Cancel',
          value: 0
        },
        {
          name: 'Deploy',
          value: 1
        }
      ]
    }
  ]
}
