jest.mock('fs-extra')
jest.mock('puppeteer')

const fs = require('fs-extra')
const puppeteer = require('puppeteer')
const screenshots = require('.')

let chrome

puppeteer.launch.mockImplementation(() => ({
  newPage: jest.fn(() => {
    chrome = {
      goto: jest.fn(),
      screenshot: jest.fn(),
      setViewport: jest.fn(),
      waitFor: jest.fn(),
      type: jest.fn(),
      click: jest.fn(),
      waitForNavigation: jest.fn(),
      test: jest.fn(),
    }
    return chrome
  }),
  close: jest.fn(),
}))

const urls = ['https://test.com']

const validArgs = {
  urls,
}

const validAuthArgs = {
  urls,
  loginUrl: 'https://test.com/login',
  username: 'admin',
  password: 'admin',
}

describe('Exports', () => {
  describe('Required params', () => {
    it('should throw if no options', () => {
      expect(screenshots()).rejects.toThrow()
      return expect(screenshots({})).rejects.toThrow()
    })

    it('should throw if urls invalid', () => {
      const typeError = '`urls` parameter should be an array of URLs'
      const validationError =
        'One or more of the specified URLs are invalid. Make sure they are well formed and include a protocol.'
      expect(screenshots({ urls: 'string' })).rejects.toThrow(typeError)
      expect(screenshots({ urls: ['invalid-url'] })).rejects.toThrow(
        validationError,
      )
      return expect(screenshots({ urls: ['test.com'] })).rejects.toThrow(
        validationError,
      )
    })

    it('should throw if no outputDir', () => {
      return expect(screenshots({ outputDir: null, urls })).rejects.toThrow(
        '`outputDir` must be a string',
      )
    })

    it('should throw if formatFilename is not a function', () => {
      return expect(
        screenshots({ formatFilename: null, urls }),
      ).rejects.toThrow('`formatFilename` must be a function')
    })

    describe('Authentication', () => {
      it('should throw if any required params missing', () => {
        const error =
          '`loginUrl`, `username` and `password` are all required to authenticate`'

        expect(screenshots({ urls, loginUrl: urls[0] })).rejects.toThrow(error)
        expect(screenshots({ urls, username: 'test' })).rejects.toThrow(error)
        expect(screenshots({ urls, password: 'test' })).rejects.toThrow(error)
        expect(
          screenshots({ urls, loginUrl: urls[0], username: 'test' }),
        ).rejects.toThrow(error)
        expect(
          screenshots({ urls, loginUrl: urls[0], password: 'test' }),
        ).rejects.toThrow(error)
        return expect(
          screenshots({ urls, username: 'test', password: 'test' }),
        ).rejects.toThrow(error)
      })

      it('try to login', async () => {
        await screenshots({
          ...validAuthArgs,
          selectors: { submit: 'input[type="submit"]' },
        })
        expect(chrome.waitFor).toHaveBeenCalledTimes(2)
        expect(chrome.type).toHaveBeenCalledTimes(2)
        expect(chrome.click).toHaveBeenCalledWith('input[type="submit"]')
        expect(chrome.waitForNavigation).toHaveBeenCalled()
      })
    })
  })

  describe('FileSystem', () => {
    afterEach(() => {
      fs.ensureDir.mockReset()
      fs.emptyDir.mockReset()
    })

    it('should ensure the directory exists and not empty by default', async () => {
      await screenshots(validArgs)
      expect(fs.ensureDir).toHaveBeenCalledWith(`${process.cwd()}/screenshots`)
      expect(fs.emptyDir).not.toHaveBeenCalled()
    })

    it('should ensure the directory exists with custom dir', async () => {
      const outputDir = 'tests'
      await screenshots({ ...validArgs, outputDir: 'tests' })
      expect(fs.ensureDir).toHaveBeenCalledWith(outputDir)
    })

    it('should empty the dir', async () => {
      const outputDir = 'tests'
      await screenshots({ ...validArgs, outputDir: 'tests', emptyDir: true })
      expect(fs.ensureDir).toHaveBeenCalledWith(outputDir)
      expect(fs.emptyDir).toHaveBeenCalledWith(outputDir)
    })
  })
})
