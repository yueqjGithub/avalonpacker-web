import { Apis, IamBarValue } from 'avalon-iam-util-client'
import { getApiUrl, getLimit } from '../utils/utils'

// const getApiUrl = ({ state }): string => {
//     return 'http://10.172.188.22:8082'
// }

/** 通用apiId */
export type ApiIdForSDK =
    | 'gamelist'
    | 'channel'
    | 'pluginstypes'
    | 'plugins'
    | 'mediaflag'
    | 'packrecord'
    | 'addrecord'
    | 'setplugins'
    | 'setmedia'
    | 'uploadimg'
    | 'updaterecord'
    | 'dopackage'
    | 'querySourceList'
    | 'querystatus'
    | 'getdownload'
    | 'queryreason'
    | 'queryhistory'
    | 'historydetail'
    | 'getchannelsource'
    | 'querysignpath'
    | 'querychannelsignpath'
    | 'envlist'
    | 'iamuserlist'
    | 'uploadipa'
    | 'donwloadxcode'
/** 通用api */
export const apisForSDK: Apis<ApiIdForSDK> = [
  {
    id: 'gamelist',
    url: '/packer/admin/app',
    name: '应用列表',
    allowEmpty: true,
    urlTranform: ({ url, state }) => {
      const limits = getLimit({ moduleName: '应用管理', state, name: '应用列表', limitName: 'appLimit', route: '/packer/admin/app' })
      const apiUrl = getApiUrl({ state })
      return `${apiUrl}${url}?appLimit=${limits ? limits === '*' ? limits : limits.join(',') : '*'}`
    }
  },
  {
    id: 'channel',
    url: '/packer/admin/channel',
    name: '渠道列表',
    allowEmpty: true,
    urlTranform: ({ url, state }) => {
      const apiUrl = getApiUrl({ state })
      return `${apiUrl}${url}`
    }
  },
  {
    id: 'pluginstypes',
    url: '/packer/admin/plugins/types',
    name: '获取插件类型',
    allowEmpty: true,
    urlTranform: ({ url, state }) => {
      const apiUrl = getApiUrl({ state })
      return `${apiUrl}${url}`
    }
  },
  {
    id: 'plugins',
    url: '/packer/admin/plugins',
    name: '插件列表',
    allowEmpty: true,
    urlTranform: ({ url, state }) => {
      const apiUrl = getApiUrl({ state })
      return `${apiUrl}${url}`
    }
  },
  {
    id: 'mediaflag',
    url: '/packer/admin/mediaFlag',
    name: '媒体标识',
    allowEmpty: true,
    urlTranform: ({ url, state }) => {
      const apiUrl = getApiUrl({ state })
      return `${apiUrl}${url}`
    }
  },
  {
    id: 'packrecord',
    url: '/packer/admin/packerRecord',
    name: '配置列表',
    allowEmpty: true,
    urlTranform: ({ url, state }) => {
      const apiUrl = getApiUrl({ state })
      return `${apiUrl}${url}`
    }
  },
  {
    id: 'addrecord',
    url: '/packer/admin/packerRecord/add',
    name: '添加分包配置',
    allowEmpty: true,
    urlTranform: ({ url, state }) => {
      const apiUrl = getApiUrl({ state })
      return `${apiUrl}${url}`
    }
  },
  {
    id: 'setplugins',
    url: '/packer/admin/packerRecord/setPlugins',
    name: '配置设置插件',
    allowEmpty: true,
    urlTranform: ({ url, state }) => {
      const apiUrl = getApiUrl({ state })
      return `${apiUrl}${url}`
    }
  },
  {
    id: 'setmedia',
    url: '/packer/admin/packerRecord/setMedia',
    name: '配置设置媒体标识',
    allowEmpty: true,
    urlTranform: ({ url, state }) => {
      const apiUrl = getApiUrl({ state })
      return `${apiUrl}${url}`
    }
  },
  {
    id: 'uploadimg',
    url: '/packer/file/upload',
    name: '图片上传',
    allowEmpty: true,
    urlTranform: ({ url, state }) => {
      const apiUrl = getApiUrl({ state })
      return `${apiUrl}${url}`
    }
  },
  {
    id: 'updaterecord',
    url: '/packer/admin/packerRecord/update',
    name: '更新配置',
    allowEmpty: true,
    urlTranform: ({ url, state }) => {
      const apiUrl = getApiUrl({ state })
      return `${apiUrl}${url}`
    }
  },
  {
    id: 'dopackage',
    url: '/packer/admin/packerRecord/package',
    name: '分包',
    allowEmpty: true,
    urlTranform: ({ url, state }) => {
      const apiUrl = getApiUrl({ state })
      return `${apiUrl}${url}`
    }
  },
  {
    id: 'querySourceList',
    url: '/packer/admin/packerRecord/querySourceList',
    name: '获取母包列表',
    allowEmpty: true,
    urlTranform: ({ url, state }) => {
      const apiUrl = getApiUrl({ state })
      return `${apiUrl}${url}`
    }
  },
  {
    id: 'querystatus',
    url: '/packer/admin/packerStatus',
    name: '获取打包状态',
    allowEmpty: true,
    urlTranform: ({ url, state }) => {
      const apiUrl = getApiUrl({ state })
      return `${apiUrl}${url}`
    }
  },
  {
    id: 'getdownload',
    url: '/packer/admin/packerStatus/download',
    name: '获取下载链接',
    allowEmpty: true,
    urlTranform: ({ url, state }) => {
      const apiUrl = getApiUrl({ state })
      return `${apiUrl}${url}`
    }
  },
  {
    id: 'queryreason',
    url: '/packer/admin/packerStatus/failReason',
    name: '获取失败原因',
    allowEmpty: true,
    urlTranform: ({ url, state }) => {
      const apiUrl = getApiUrl({ state })
      return `${apiUrl}${url}`
    }
  },
  {
    id: 'queryhistory',
    url: '/packer/admin/history-record/doPage',
    name: '分包历史',
    allowEmpty: true,
    urlTranform: ({ url, state }) => {
      const apiUrl = getApiUrl({ state })
      return `${apiUrl}${url}`
    }
  },
  {
    id: 'historydetail',
    url: '/packer/admin/history-record/detailList',
    name: '历史记录详情',
    allowEmpty: true,
    urlTranform: ({ url, state }) => {
      const apiUrl = getApiUrl({ state })
      return `${apiUrl}${url}`
    }
  },
  {
    id: 'getchannelsource',
    url: '/packer/admin/packerRecord/doChannelVersions',
    name: '获取渠道版本',
    allowEmpty: true,
    urlTranform: ({ url, state }) => {
      const apiUrl = getApiUrl({ state })
      return `${apiUrl}${url}`
    }
  },
  {
    id: 'querysignpath',
    url: '/packer/admin/app/signFile',
    name: '获取签名文件列表',
    allowEmpty: true,
    urlTranform: ({ url, state }) => {
      const apiUrl = getApiUrl({ state })
      return `${apiUrl}${url}`
    }
  },
  {
    id: 'querychannelsignpath',
    url: '/packer/admin/channel/signFile',
    name: '渠道签名文件列表',
    allowEmpty: true,
    urlTranform: ({ url, state }) => {
      const apiUrl = getApiUrl({ state })
      return `${apiUrl}${url}`
    }
  },
  {
    id: 'envlist',
    url: '/packer/admin/systemEnv',
    name: '环境列表',
    allowEmpty: true,
    urlTranform: ({ url, state }) => {
      const apiUrl = getApiUrl({ state })
      return `${apiUrl}${url}`
    }
  },
  // 从iam取出
  {
    id: 'iamuserlist',
    url: '/iam-manage/v1/users',
    name: '用户列表',
    allowEmpty: true,
    urlTranform: ({ url, state }) => {
      const { project = [] } = state as IamBarValue
      const apiUrl = project.find(d => d.id === 'iam')?.api_url
      return `${apiUrl}${url}`
    }
  },
  {
    id: 'uploadipa',
    url: '/packer/admin/history-record/upload',
    name: '上传ipa',
    allowEmpty: true,
    urlTranform: ({ url, state }) => {
      const apiUrl = getApiUrl({ state })
      return `${apiUrl}${url}`
    }
  },
  {
    id: 'donwloadxcode',
    url: '/packer/admin/packerRecord/downloadXcode',
    name: '下载xcode',
    allowEmpty: true,
    urlTranform: ({ url, state }) => {
      const apiUrl = getApiUrl({ state })
      return `${apiUrl}${url}`
    }
  }
]

/** 服务器存储的多语言单行格式 */
// export interface MultiLanguageServerValueRow extends Pick<MultiLanguageValue[0], 'code'> {
//     value: string
// }

/** 服务器存储的多语言格式 */
// export type MultiLanguageServerValue = Array<MultiLanguageServerValueRow>
