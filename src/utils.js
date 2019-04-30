/**
 * Execute an array of functions in series
 * @param {Array} fns list of async functions
 * @returns {Array} function responses
 */
const sequential = async fns => {
  const AsyncFunction = (async () => {}).constructor

  if (!fns.every(fn => fn instanceof AsyncFunction)) {
    throw new TypeError('`fns` argument should be an array of Async functions')
  }

  const responses = []
  for (const fn of fns) {
    const response = await fn()
    responses.push(response)
  }

  return responses
}

module.exports = {
  sequential,
}
