import { message, Spin } from 'antd'
import React, { useEffect, useState } from 'react'
import { httpApi } from '../../../service/axios'
import { State } from '../../../store/state'

type Props = {
  targetId: string,
  state: State
}

const FailReason = ({ targetId, state }: Props) => {
  const [loading, setLoading] = useState<boolean>(false)
  const [reason, setReason] = useState<string>('')
  const queryHandler = async () => {
    setLoading(true)
    try {
      const { data: res } = await httpApi({
        apiId: 'queryreason',
        state,
        targetId: targetId
      }).request
      if (res.status === 0) {
        setReason(res.data)
      } else {
        message.error(res.message)
      }
    } catch (e) {
      message.error((e as Error).message)
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => {
    queryHandler()
  }, [])
  return (
    <Spin spinning={loading}>
      <p>{reason}</p>
    </Spin>
  )
}

export default FailReason
