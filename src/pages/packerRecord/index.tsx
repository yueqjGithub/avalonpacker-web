import React from 'react'
import PageContainer from '../../components/pageContainer'
import { State } from '../../store/state'
import Main from './main'
type Props = {
  state: State
  dispatch: any
}

const Channel = ({ state, dispatch }: Props) => {
  return (
    <PageContainer
      state={state}
      dispatch={dispatch}
      data={[
        {
          id: 'iamuserlist',
          delHeaderAction: true
        },
        {
          id: 'envlist',
          httpCustomConfig: {
            headers: {
              dependPath: '/packer/admin/packerRecord',
              dependAction: encodeURIComponent('配置列表')
            }
          }
        },
        {
          id: 'channel',
          httpCustomConfig: {
            headers: {
              dependPath: '/packer/admin/packerRecord',
              dependAction: encodeURIComponent('配置列表')
            }
          }
        },
        {
          id: 'mediaflag',
          httpCustomConfig: {
            headers: {
              dependPath: '/packer/admin/packerRecord',
              dependAction: encodeURIComponent('配置列表')
            }
          }
        },
        {
          id: 'pluginstypes',
          httpCustomConfig: {
            headers: {
              dependPath: '/packer/admin/packerRecord',
              dependAction: encodeURIComponent('配置列表')
            }
          }
        },
        {
          id: 'plugins',
          httpCustomConfig: {
            headers: {
              dependPath: '/packer/admin/packerRecord',
              dependAction: encodeURIComponent('配置列表')
            }
          },
          responseTransform: (data) => {
            if (data.status === 0) {
              const list = data.data
              list.forEach(item => {
                item.versions = []
              })
              data.data = list
            }
            return data
          }
        }
      ]}
    >
      <Main state={state} dispatch={dispatch}></Main>
    </PageContainer>
  )
}

export default Channel
