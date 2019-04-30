class InvalidURLError extends TypeError {
  constructor(message) {
    const defaultMessage =
      message ||
      'One or more of the specified URLs are invalid. Make sure they are well formed and include a protocol.'
    super(defaultMessage)
    this.message = defaultMessage
  }
}

module.exports = {
  InvalidURLError,
}
