import React from 'react'
import PageContainer from '../../components/pageContainer'
// import { ApiIdForSDK } from '../../service/urls'
import { State } from '../../store/state'
import Main from './main'
type Props = {
  state: State
  dispatch: any
}

// const apiId:ApiIdForSDK = 'queryhistory'
const packHistory = ({ state, dispatch }: Props) => {
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
          id: 'gamelist',
          httpCustomConfig: {
            headers: {
              dependPath: '/packer/admin/history-record/doPage',
              dependAction: encodeURIComponent('分包历史')
            }
          }
        },
        {
          id: 'channel',
          httpCustomConfig: {
            headers: {
              dependPath: '/packer/admin/history-record/doPage',
              dependAction: encodeURIComponent('分包历史')
            }
          }
        },
        {
          id: 'mediaflag',
          httpCustomConfig: {
            headers: {
              dependPath: '/packer/admin/history-record/doPage',
              dependAction: encodeURIComponent('分包历史')
            }
          }
        },
        {
          id: 'packrecord',
          data: { appId: state.currentGame },
          httpCustomConfig: {
            headers: {
              dependPath: '/packer/admin/history-record/doPage',
              dependAction: encodeURIComponent('分包历史')
            }
          }
        }
      ]}
    >
      <Main state={state} dispatch={dispatch}></Main>
    </PageContainer>
  )
}

export default packHistory
