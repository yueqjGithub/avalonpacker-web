import React from 'react'
import PageContainer from '../../components/pageContainer'
import { ApiIdForSDK } from '../../service/urls'
import { State } from '../../store/state'
import Main from './main'
type Props = {
  state: State
  dispatch: any
}

const apiId:ApiIdForSDK = 'channel'

const Channel = ({ state, dispatch }: Props) => {
  return (
    <PageContainer
      state={state}
      dispatch={dispatch}
      data={[{ id: apiId },
        {
          id: 'getchannelids',
          delHeaderAction: true
        }]}
    >
      <Main state={state} dispatch={dispatch}></Main>
    </PageContainer>
  )
}

export default Channel
