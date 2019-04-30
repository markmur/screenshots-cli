# Screenshots

Use puppeteer to take screenshots of a list of URLs for multiple viewports

## Installation

```sh
yarn add --global screenshots-cli
```

## CLI Usage

```

  Take screenshots for a list of URLs and viewports

  Usage
    $ screenshots

  Options
    --version          Output version
    --urls             List of comma-separated URLs to visit. (Must include protocol)
    --viewports        List of comma-separated viewport dimensions to take screenshots.
                          Specify both width and height like: 1440x768,768x768
                          OR only specify the width to capture the entire page.
                          You can use a combination of both.

    --outputDir, -o    Screenshots directory name. Defaults to $pwd/screenshots
    --emptyDir, -rm    Empty the output directory

  Authentication Options
    --loginUrl         URL to authenticate with username/password
    --username, -u     Auth username
    --password, -p     Auth password

  Examples
    $ screenshots \
        --urls=https://mysite.com \
        --viewports=1440x768,768,480,320

```

## Programmatic Usage

```js
const path = require('path')
const screenshots = require('screenshots-cli')

screenshots({
  urls: ['https://mysite.com/login'],
  viewports: [
    [1440, 768], // [width, height] - height is optional
  ],
  outputDir: path.join(process.cwd(), 'screenshots'), // default
})
  .then()
  .catch()
```

### Usage with auth

```js
const path = require('path')
const screenshots = require('screenshots-cli')

screenshots({
  urls: ['https://mysite.com'],
  loginUrl: 'https://mysite.com/login',
  username: process.env.USERNAME,
  password: process.env.PASSWORD,
})
  .then()
  .catch()
```

### Customising login form selectors

```js
const path = require('path')
const screenshots = require('screenshots-cli')

screenshots({
  urls: ['https://mysite.com/myaccount'],
  loginUrl: 'https://mysite.com/login',
  username: process.env.USERNAME,
  password: process.env.PASSWORD,
  selectors: {
    username: 'input[type="username"]',
    password: 'input[type="password"]',
    submit: 'input[type="submit"]',
  },
})
  .then(results => {
    // Returns array of screenshot objects
    // See below for results type definition
  })
  .catch()
```

### Results schema

```ts
[
  {
    filename: String,
    createdAt: Date,
    uri: Base64
  },
  ...
]
```

### Options

| Option    | Type      | Required | Default                                                                                          | Description                              |
| --------- | --------- | -------- | ------------------------------------------------------------------------------------------------ | ---------------------------------------- |
| urls      | `Array`   | Yes      |                                                                                                  | Array of URLs to visit                   |
| viewports | `Array`   |          | `[[1440], [768], [425], [320]]`                                                                  | Viewport dimensions to take for each URL |
| outputDir | `String`  |          | `path.join(process.cwd(), 'screenshots')`                                                        | Directory to write screenshots           |
| emptyDir  | `Boolean` |          | `false`                                                                                          | Empty the output directory               |
| loginUrl  | `String`  |          |                                                                                                  | URL to authenticate                      |
| username  | `String`  |          |                                                                                                  | Auth username                            |
| password  | `String`  |          |                                                                                                  | Auth password                            |
| selectors | `Object`  |          | `{ username: 'input[type="email"]', password: 'input[type="password"]', submit: 'form button' }` | HTMLElement selectors for login form     |

## Running locally

### Unauthenticated routes

```sh
yarn start --urls=https://mysite.com
```

### Authenticated routes

> You will be prompted for your username and password. The password will be
> hidden

```sh
yarn start:auth --urls=https://mysite.com/myaccount
```

## Diffing two images

Make sure you have `imagemagick` installed locally:

```sh
brew install imagemagick
```

Compare images:

```sh
compare screenshots/one.png screenshots/two.png [-highlight-color blue] -compose src diff.png
```
