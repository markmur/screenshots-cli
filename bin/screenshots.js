#!/usr/bin/env node

const createCLI = require('meow')
const chalk = require('chalk')
const screenshots = require('../src')

class UsageError extends Error {
  constructor(message) {
    super(message)
    this.message = chalk`

    {red.bold ${message}}

    ${usage}
    `
  }
}

const usage = chalk`
{gray Usage}
  $ {green.bold screenshots} {gray.italic <options>}

{gray Options}
  {white.bold --version}          Output version
  {white.bold --urls}             List of comma-separated URLs to visit. (Must include protocol)
  {white.bold --viewports}        List of comma-separated viewport dimensions to take screenshots.
                        Specify both width and height like: {bold.underline 1440x768,768x768}
                        OR only specify the width to capture the entire page.
                        You can use a combination of both.

  {white.bold --outputDir, -o}    Screenshots directory name. Defaults to {underline $pwd/screenshots}
  {white.bold --emptyDir, -rm}    Empty the output directory

{gray Authentication Options}
  {white.bold --loginUrl}         URL to authenticate with username/password
  {white.bold --username, -u}     Auth username
  {white.bold --password, -p}     Auth password

{gray Examples}
  $ {green.bold screenshots} \
      --urls={cyan.bold https://google.com} \
      --viewports={cyan.bold 1440x768,768,480,320}
`

const cli = createCLI(usage, {
  flags: {
    urls: {
      type: 'string',
    },
    version: {
      type: 'boolean',
      alias: 'v',
    },
    viewports: {
      type: 'string',
    },
    outputDir: {
      type: 'string',
      alias: 'o',
    },
    emptyDir: {
      type: 'boolean',
      alias: 'rm',
      default: false,
    },
    loginUrl: {
      type: 'string',
    },
    username: {
      type: 'string',
      alias: 'u',
    },
    password: {
      type: 'string',
      alias: 'p',
    },
  },
})

/**
 * Parse viewports arg and return array of tuples
 * @param {String} viewports - comma separated list of viewport dimensions
 * @returns {Array<Tuple[width,height]>} returns array of tuples
 */
const parseViewports = (viewports = '') => {
  // Use the defaults if none given
  if (!viewports) return undefined

  const options = viewports.split(',')
  if (!options.every(option => /\d+(x\d+)?/gi.test(option))) {
    throw new UsageError(
      '`viewports` option should be a comma separated list of viewport dimensions like: 200x300,400x500',
    )
  }

  return options.map(option => option.split('x').map(Number))
}

const main = async () => {
  const { flags } = cli
  const {
    urls,
    viewports,
    outputDir,
    emptyDir,
    loginUrl,
    username,
    password,
  } = flags

  if (!urls) {
    throw new UsageError('`--urls` argument is required')
  }

  try {
    urls.split(',').map(url => new URL(url))
  } catch (error) {
    throw new UsageError(
      'One or more of the specified URLs are invalid. Make sure they are well formed and include a protocol.',
    )
  }

  const hasAuthFlag = loginUrl || username || password

  if (
    hasAuthFlag &&
    ![loginUrl, username, password].every(x => x && typeof x !== 'undefined')
  ) {
    throw new UsageError(
      `--loginUrl, --username (-u) and --password (-p) are all required to authenticate`,
    )
  }

  return screenshots({
    outputDir,
    emptyDir,
    loginUrl,
    username,
    password,
    urls: urls.split(','),
    viewports: parseViewports(viewports),
  })
}

main().catch(error => console.log(error.message))
