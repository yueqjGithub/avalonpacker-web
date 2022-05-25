import { List } from 'antd'
import React from 'react'

type Props = {
  list: string[]
}

const DownloadModal = ({ list }: Props) => {
  return (
    <div className='full-width scroll-bar' style={{ height: '60vh' }}>
      <List
        size='small'
        header={false}
        footer={false}
        dataSource={list}
        bordered
        renderItem={item => {
          return (
            <List.Item>
              <div className='full-width flex-row flex-jst-btw flex-ali-center'>
                <div className='font-14'>{item.split('/').pop()}</div>
                <div className='flex-row flex-jst-end flex-ali-center'>
                  <a href={item} download={item.split('/').pop()} target="_blank" rel="noreferrer">下载</a>
                </div>
              </div>
            </List.Item>
          )
        }}
      ></List>
    </div>
  )
}

export default DownloadModal
