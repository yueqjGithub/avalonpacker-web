import React from 'react'
import PageContainer from '../../components/pageContainer'
import { State } from '../../store/state'
import Main from './main'
type Props = {
  state: State
  dispatch: any
}

const Channel = ({ state, dispatch }: Props) => {
  const { currentGame } = state
  return (
    <PageContainer
      state={state}
      dispatch={dispatch}
      data={[{ id: 'querySourceList', data: { appId: currentGame } }, { id: 'envlist', data: { isEnable: 1 } }, { id: 'channel' }, { id: 'mediaflag' }, { id: 'pluginstypes' }, { id: 'plugins' }]}
    >
      <Main state={state} dispatch={dispatch}></Main>
    </PageContainer>
  )
}

export default Channel
