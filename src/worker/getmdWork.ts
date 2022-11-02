import BMF from 'browser-md5-file'

onmessage = (e) => {
  const bmf = new BMF()

  bmf.md5(e.data, (err, md5) => {
    if (err) {
      postMessage({
        success: false,
        err
      })
    } else {
      postMessage({
        success: true,
        md5
      })
    }
  })
}
