# Deploy Kit

## Setup

Deploy kit is a set of command line tools for deploying to a server using ssh
and git. In order for everything you work you'll first need your repo cloned to
the server you'll be connecting to.

```bash
# Clone the repo
git clone git@github.com:levibeach/deploy.git

# Navigate to the root of the project
cd deploy

# Install the app globally
npm install -g
```

## Use

To deploy a repo do the following:

```bash
# Make sure you have a `.env` file in the root of your repo.
# A quick to do this is to run `deploy init` from the root of your project
deploy init

# Ensure you have your key ready for SSH forwarding
ssh-add

# If you haven't already added your key to the server you'll be deploying to:
ssh-copy-id user@123.45.56.78

# Deploy the latest pushed commit
deploy -d
```

### Default Settings
```bash
# Defaults
# --------
# These are used if an environment specific settings is not available
HOST=127.0.0.1
SERVER_PATH=~/www/dev_html
SSH_USER=sampleuser_default

# Development
DEV_HOST=127.0.0.1
DEV_PATH=~/www/dev_html
DEV_USER=sampleuser_dev

# Staging
STAGING_HOST=127.0.0.1
STAGING_PATH=~/www/staging_html
STAGING_USER=sampleuser_staging

# Production
PROD_HOST=127.0.0.1
PROD_PATH=~/www/public_html
PROD_USER=sampleuser_production
```

### Examples

```bash
# Run the .env setup
deploy init

# Deploy a specific commit to the staging environment
deploy -s c=bc489f8f0c65defea22b8a29c7f3d4c1d222618b
# You must use at least 6 characters of the commit hash
deploy -s c=bc489f

# Deploy the current branch's latest commit to development
deploy -d

# Deploy the current branch's latest commit to staging
deploy -s

# Deploy the current branch's latest commit to production
deploy -p

# Compare local with staging
deploy compare -s

# For more help pass the help argument
deploy help
```
