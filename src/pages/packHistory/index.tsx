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
        { id: 'gamelist' },
        { id: 'channel' },
        { id: 'mediaflag' },
        { id: 'packrecord', data: { appId: state.currentGame } }
      ]}
    >
      <Main state={state} dispatch={dispatch}></Main>
    </PageContainer>
  )
}

export default packHistory
