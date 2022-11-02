import Mywork from '../worker/getmdWork.ts?worker'
// 分割文件
export type BufferItem = { file: Blob, hash: string, idx: number, fileName: string }

/**
 * 切割文件
 * @param file // 目标文件
 * @param size // 切割大小，单位：mb
 * @returns BufferItem[]
 */
const splitFile: (file: File, size: number) => Promise<BufferItem[]> = (file, size = 5) => {
  // 生成标识-小体量并发小，可以使用如下方法生成，并发高请换成md5生成
  return new Promise((resolve, reject) => {
    const mywork = new Mywork()
    mywork.postMessage(file)
    mywork.onmessage = (data) => {
      if (data.data.success) {
        const bufferArr: BufferItem[] = []
        let cur = 0
        let idx = 0
        while (cur < file.size) {
          bufferArr.push({ file: file.slice(cur, cur + (size * 1024 * 1024)), hash: data.data.md5, idx, fileName: file.name })
          cur += size * 1024 * 1024
          idx++
        }
        resolve(bufferArr)
      } else {
        reject(data.data.err)
      }
    }
  })
}

export { splitFile }
