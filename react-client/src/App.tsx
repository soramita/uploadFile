import type { UploadProps } from 'antd';
import { Button, Upload, Progress } from 'antd';
import React, { useState } from 'react';
import { mergeFile, uploadFile } from './api';
import './App.css'
import { createChunkList, createHash, limitUpload } from './utils/uploadFile';
import axios from 'axios'
import { sum } from 'lodash'
let cancelToken = axios.CancelToken
let currentFile: File
let chunkSize: number
let chunkHash: string
let chunkList: Array<Blob>
let chunkFormList: Array<{
  file:Blob
  chunkHash:string
  fileHash:string
}>
let formDataList: Array<{
  formData: FormData
  cancelToken: any
  percentage?: number
}>
const props: UploadProps = {
  name: 'file',
  showUploadList:false,
  beforeUpload(file) {
    currentFile = file
    chunkSize = Math.ceil(currentFile.size / 6)
  },
  customRequest(){}
};
const App: React.FC = () => {
  const [percent,setPercent] = useState(0)
  const uploadProgress = (item: any) =>{
    return (e: any)=>{
      const sumSize = formDataList.length * 100
      item.percentage = parseInt(String((e.loaded / e.total) * 100))
      const per = formDataList.map(item=> item.percentage)
      setPercent(Number(((sum(per) / sumSize) * 100).toFixed(0)))
    }
  }
  const handleUpload = async() =>{
    chunkList = createChunkList(currentFile, chunkSize)
    chunkHash = await createHash(chunkList)
    chunkFormList = chunkList.map((item, index)=>{
      return {
        file: item,
        chunkHash: chunkHash + '-' + index,
        fileHash:chunkHash
      }
    })
    formDataList = chunkFormList.map(chunk=>{
      const formData = new FormData()
      formData.append(chunk.chunkHash,chunk.file)
      formData.append('chunkHash',chunk.chunkHash)
      formData.append('fileHash',chunk.fileHash)
      return {
        formData,
        cancelToken:cancelToken.source()
      }
    })
    const list: any = []
    formDataList.forEach(item=>{
      list.push({
        formData:item?.formData,
        cancelToken:item?.cancelToken.token,
        uploadProgress:uploadProgress(item)
      })
    })
    limitUpload(list,1).then(()=>{
      mergeFile({
        fileName: currentFile.name,
        chunkSize: chunkSize,
        fileHash: chunkHash
      })
    }).catch(()=>{

    })
  }
  const stopUpload = () =>{
    formDataList.forEach(item=>{
      item.cancelToken.cancel('取消上传')
      item.cancelToken = cancelToken.source()
    })
  }
  const continueUpload = () =>{
    const continueList = formDataList.filter(item=> {
      if(item.percentage != 100) {
        return item
      }
    })
    const list: any = []
    console.log(continueList);
    
    continueList.forEach(item=>{
      list.push({
        formData:item?.formData,
        cancelToken:item?.cancelToken.token,
        uploadProgress:uploadProgress(item)
      })
    })
    limitUpload(list,1).then(()=>{
      mergeFile({
        fileName: currentFile.name,
        chunkSize: chunkSize,
        fileHash: chunkHash
      })
    }).catch(()=>{

    })
    
  }
  return (
    <>
      <div className='box'>
        <div style={{display:'flex',justifyContent:'space-between'}}>
          <Upload {...props}>
            <Button type='primary'>
              选择文件
            </Button>
          </Upload>
          <Button type='primary' onClick={handleUpload}>上传到服务器</Button>
          <Button type='primary' onClick={stopUpload}>暂停上传</Button>
          <Button type='primary' onClick={continueUpload}>继续上传</Button>
        </div>
        <Progress percent={percent} style={{marginTop:'10px'}} />
      </div>
    </>
  );
}

export default App;