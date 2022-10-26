import { AxiosRequestConfig } from 'axios'
import { httpApi } from '../service/axios'
import { ApiIdForSDK } from '../service/urls'
import { State } from '../store/state'
import SparkMD5 from 'spark-md5'
// 分割文件
export type BufferItem = { file: ArrayBuffer | string | undefined, hash: string, idx: number, fileName: string }

/**
 * 切割文件
 * @param file // 目标文件
 * @param size // 切割大小，单位：mb
 * @returns BufferItem[]
 */
const splitFile: (file: File, size: number) => Promise<BufferItem[]> = (file, size = 5) => {
  // 生成标识-小体量并发小，可以使用如下方法生成，并发高请换成md5生成
  return new Promise((resolve, reject) => {
    const fr = new FileReader()
    fr.readAsBinaryString(file)

    fr.onload = (ev) => {
      const spark = new SparkMD5.ArrayBuffer()
      const bufferAll = ev.target?.result
      spark.append(bufferAll as ArrayBuffer)
      const cusHash = spark.end()
      const bufferArr: BufferItem[] = []
      let cur = 0
      let idx = 0
      while (cur < file.size) {
        bufferArr.push({ file: (bufferAll as ArrayBuffer)?.slice(cur, cur + size * 1024 * 1024), hash: cusHash, idx, fileName: file.name })
        cur += size * 1024 * 1024
        idx++
      }
      resolve(bufferArr)
    }
  })
}

type BufferUpload = (
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  bufferList: BufferItem[],
  apiId: ApiIdForSDK,
  state: State,
  otherData?: Object,
  httpCustomConfig?: AxiosRequestConfig | null,
) => any

const bufferUpload: BufferUpload = (method, bufferList, apiId, state, httpCustomConfig, otherData) => {
  const promiseList = bufferList.map((item, idx) => {
    const fm = new FormData()
    fm.append('file', item.file as string)
    fm.append('hash', item.hash)
    fm.append('idx', idx.toString())
    fm.append('length', bufferList.length.toString())
    if (otherData) {
      for (const k in otherData) {
        fm.append(k, otherData[k])
      }
    }
    return new Promise((resolve, reject) => {
      httpApi({
        apiId,
        state,
        method,
        data: fm,
        httpCustomConfig
      }).request.then(res => resolve(res), err => reject(err))
    })
  })
  return Promise.all(promiseList)
}

export { splitFile, bufferUpload }
