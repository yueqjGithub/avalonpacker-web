import React, { useContext } from 'react'
import PageContainer from '../../components/pageContainer'
import { Context } from '../../store/context'
import Main from './main'

const OutPage = () => {
  const { state, dispatch } = useContext(Context)
  return (
    <PageContainer
      state={state}
      dispatch={dispatch}
      data={[
        // { id: 'querySourceList', data: { appId: currentGame } },
        { id: 'channel', httpCustomConfig: { headers: { dependPath: '/packer/admin/packerRecord/package', dependAction: encodeURIComponent('分包') } } }
        // { id: 'packrecord', data: { appId: currentGame } }
      ]}
    >
      <Main></Main>
    </PageContainer>
  )
}

export default OutPage
