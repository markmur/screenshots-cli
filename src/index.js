const path = require('path')
const chalk = require('chalk')
const fs = require('fs-extra')
const puppeteer = require('puppeteer')

const { sequential } = require('./utils')
const { InvalidURLError } = require('./errors')

// Heights are intentionally omitted to capture the full page
const DEFAULT_VIEWPORTS = [[1440], [768], [425], [375]]
const DEFAULT_DIR = path.join(process.cwd(), 'screenshots')
const DEFAULT_SELECTORS = {
  username: 'input[type="email"]',
  password: 'input[type="password"]',
  submit: 'form input[type="submit"]',
}

const DEFAULT_FILENAME_FORMAT = ({ outputDir, url, width, height }) => {
  const { hostname } = new URL(url)
  const pathname = getPathname(url) || 'home'

  return path.join(
    outputDir,
    `${hostname}-${pathname}-${width}${height ? `x${height}` : ''}.png`,
  )
}

/**
 * Parse viewports arg and return array of tuples
 * @param {String} viewports - comma separated list of dimensions
 * @returns {Array<Tuple[width,height]>} returns array of tuples
 */
const validateViewports = (viewports = []) => {
  const validViewports = viewports.every(viewport => {
    if (!Array.isArray(viewport)) return false
    const [width, height] = viewport
    return (
      typeof width === 'number' &&
      (typeof height === 'undefined' ? true : typeof height === 'number')
    )
  })

  if (!validViewports) {
    throw new Error(
      '`viewports` option should be an array of [width, height] arrays with the `height` element being optional.',
    )
  }

  return viewports
}

/**
 * Format a url pathname to remove slashes
 * @param {String} url - url path
 * @returns {String} returns new pathname
 */
const getPathname = url => {
  const { pathname } = new URL(url)
  return pathname.slice(pathname.indexOf('/') + 1).replace('/', '-')
}

/**
 * Take a screenshot for a given url and dimensions
 * @param {Object} chrome - instance of puppeteer
 * @param {String} filename - filename
 * @param {Tuple[width,height]} dimensions - array of width and height
 * @returns void nothing
 */
const takeScreenshot = (chrome, filename, dimensions) => async () => {
  const { width, height = 0 } = dimensions
  await chrome.setViewport({ width, height })

  if (process.env.DEBUG === 'true') {
    console.log(
      chalk`{white.bold Taking screenshot... {cyan.bold ${filename.slice(
        filename.lastIndexOf('/'),
      )}} {green.bold (${width}px${height ? ` x ${height}px` : ''})}}`,
    )
  }

  await chrome.screenshot({
    path: filename,
    fullPage: typeof height !== 'number' || height === 0,
  })

  const uri = await fs.readFile(filename, 'base64')

  return {
    uri,
    filename,
    createdAt: new Date().toISOString(),
  }
}

/**
 * Take multiple screenshots for a given url
 * @param {*} chrome - instance of puppeteer
 * @param {String} url - page url
 * @param {Array<Tuple[width,height]>} viewportDimensions - list of dimensions
 * @returns void
 */
const takeScreenshotsForUrl = (
  chrome,
  { url, formatFilename, viewports, outputDir },
) => async () => {
  await chrome.goto(url, { waitUntil: 'networkidle0' })

  const screenshotRequests = viewports.map(([width, height]) => {
    const filename = formatFilename({ outputDir, url, width, height })
    return takeScreenshot(chrome, filename, { width, height })
  })

  const screenshots = await sequential(screenshotRequests)

  return screenshots
}

const handleAuthentication = async (
  chrome,
  { loginUrl, username, password, selectors },
) => {
  await chrome.goto(loginUrl)
  await chrome.waitFor(selectors.username)
  await chrome.waitFor(selectors.password)
  await chrome.type(selectors.username, username)
  await chrome.type(selectors.password, password)
  await chrome.click(selectors.submit)
  await chrome.waitForNavigation()
}

const screenshots = async (options = {}) => {
  const {
    urls,
    viewports,
    loginUrl,
    username,
    password,
    outputDir = DEFAULT_DIR,
    emptyDir = false,
    formatFilename = DEFAULT_FILENAME_FORMAT,
  } = options

  const selectors = {
    ...DEFAULT_SELECTORS,
    ...options.selectors,
  }

  if (!Array.isArray(urls) || !urls.every(url => typeof url === 'string')) {
    throw new TypeError('`urls` parameter should be an array of URLs')
  }

  try {
    urls.map(url => new URL(url))
  } catch (error) {
    throw new InvalidURLError()
  }

  if (loginUrl) {
    try {
      new URL(loginUrl)
    } catch (error) {
      throw new InvalidURLError()
    }
  }

  if (typeof outputDir !== 'string') {
    throw new TypeError('`outputDir` must be a string')
  }

  if (typeof formatFilename !== 'function') {
    throw new TypeError('`formatFilename` must be a function')
  }

  const shouldAuthenticate = loginUrl || username || password

  if (
    shouldAuthenticate &&
    ![loginUrl, username, password].every(x => x && typeof x !== 'undefined')
  ) {
    throw new TypeError(
      '`loginUrl`, `username` and `password` are all required to authenticate`',
    )
  }

  await fs.ensureDir(outputDir)

  if (emptyDir) await fs.emptyDir(outputDir)

  const browser = await puppeteer.launch({ headless: true })

  try {
    const chrome = await browser.newPage()

    if (shouldAuthenticate) {
      await handleAuthentication(chrome, {
        loginUrl,
        username,
        password,
        selectors,
      })
    }

    const dimensions = viewports
      ? validateViewports(viewports)
      : DEFAULT_VIEWPORTS

    const requests = urls.map(url =>
      takeScreenshotsForUrl(chrome, {
        url,
        viewports: dimensions,
        outputDir,
        formatFilename,
      }),
    )

    return await sequential(requests)
  } catch (error) {
    console.log(chalk.red.bold(error))
  } finally {
    await browser.close()
  }
}

module.exports = screenshots
