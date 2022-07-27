export const createSocket = (url: string) => {
  const exp: RegExp = /^wss:\/\/[a-z|A-Z|0-9]/
  if (!exp.test(url)) {
    throw new Error(`Invalid url: ${url}`)
  }
  return new WebSocket(url)
}
