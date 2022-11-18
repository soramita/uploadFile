<template>
  <div class="file-upload-fragment">
    <div class="file-upload-fragment-container">
      <el-upload class="fufc-upload"
        action=""
        :on-change="handleFileChange"
        multiple
        :auto-upload="false"
        :show-file-list="false"
      >
        <template #trigger>
          <el-button class="fufc-upload-file" size="small" type="primary">
            选择文件
          </el-button>
        </template>
        <el-button
          class="fufc-upload-server"
          size="small"
          type="success"
          @click="handleUploadFile"
        >
          上传到服务器
        </el-button>
        <el-button
          class="fufc-upload-stop"
          size="small"
          type="primary"
          @click="stopUpload"
        >
          暂停上传
        </el-button>
        <el-button
          class="fufc-upload-continue"
          size="small"
          type="success"
          @click="continueUpload"
          >继续上传</el-button
        >
      </el-upload>
      <el-progress :text-inside="true" :stroke-width="26" :percentage="percentage" color="#409eff" />
    </div>
  </div>
</template>
<script setup lang="ts">
import { UploadFile } from 'element-plus';
import { sum } from 'lodash';
import { postMergeFile, postVerifyUpload } from './api';
import { createChunkList, createMD5, limitRequest } from './utils/uploadFile';
import axios from 'axios'
const cancelToken = axios.CancelToken
let currentFile = ref<UploadFile>()
let fileHash = ref('')
let chunkFormData = ref<Array<any>>()
const chunkSize = ref(0)
const isUpload = ref(false)
let percentage = computed(() => {
  if (!chunkFormData.value?.length) return 0
  let uploaded = chunkFormData.value.map((item) => item.percentage)
  return Number((((sum(uploaded) || 0) / (chunkFormData.value.length * 100))* 100).toFixed(2))
})

const uploadProgress = (item: any) => {
  return (e: any)=>{
    item.percentage = parseInt(String((e.loaded / e.total) * 100))
  }
}
/**
 * @description: 文件上传 Change 事件
 * @param {*}
 * @return {*}
 */
const handleFileChange = async (file: any) => {
  if(!file) return
  currentFile.value = file
  chunkSize.value = Math.ceil((file.size / 6))
  console.log(file,'上传的文件');
}
/**
 * @description: 文件上传 Click 事件
 * @param {*}
 * @return {*}
 */
const handleUploadFile = async () => {
  if(!currentFile.value) {
    ElMessage.warning('请选择文件')
    return
  }
  //文件分片
  let fileChunkList = createChunkList(currentFile.value.raw,chunkSize.value)
  //创建文件hash值
  fileHash.value = await createMD5(fileChunkList)
  let chunkList = fileChunkList.map((file, index) =>{
    return {
      file: file,
      chunkHash: fileHash.value + '-' + index,
      fileHash: fileHash.value
    }
  })
  chunkFormData.value = chunkList.map((chunk) => {
    let formData = new FormData()
    formData.append(chunk.chunkHash,chunk.file)
    formData.append('chunkHash',chunk.chunkHash)
    formData.append('fileHash',chunk.fileHash)
    return {
      formData:formData,
      cancelToken:cancelToken.source()
    }
  })
  const { data } = await postVerifyUpload(fileHash.value, currentFile.value.name)
  if(data.code == 200) {
    ElMessage.warning(data.msg)
    return
  }
  isUpload.value = true

  const dataList: any = []
  chunkFormData.value.forEach((data) => {
    dataList.push({
      data:data.formData,
      fn:uploadProgress(data),
      cancel:data.cancelToken.token
    })
  })
  limitRequest(dataList,1).then((res)=>{
    if(res) {
      postMergeFile({
        fileName:currentFile.value?.name,
        fileHash:fileHash.value,
        chunkSize:chunkSize.value
      }).then(res=>{
        console.log(res);
      })
    }
  })
  
}
/**
 * @description: 暂停上传 Click 事件
 * @param {*}
 * @return {*}
 */
const stopUpload = () => {
  isUpload.value = false
  chunkFormData.value?.forEach(data => {
    data.cancelToken.cancel('取消上传')
    data.cancelToken = cancelToken.source()
  })
}
/**
 * @description: 继续上传 Click 事件
 * @param {*}
 * @return {*}
 */
const continueUpload = () => {
  if(!isUpload.value) {
    isUpload.value = true
    const notuploaded = chunkFormData.value!.filter(item=> {
      return item.percentage !== 100 || !item.percentage
    })
    const dataList: any = []
    notuploaded.map((data) => {
      dataList.push({
        data:data.formData,
        fn:uploadProgress(data),
        cancel:data.cancelToken.token
      })
    })
    limitRequest(dataList,1).then((res)=>{
      if(res) {
        postMergeFile({
          fileName:currentFile.value?.name,
          fileHash:fileHash.value,
          chunkSize:chunkSize.value
        }).then(res=>{
          console.log(res);
        })
      }
    })
  }
}
</script>

<style scoped lang="scss">
.file-upload-fragment {
  width: 100%;
  height: 100%;
  padding: 10px;
  &-container {
    position: relative;
    margin: 0 auto;
    width: 600px;
    height: 300px;
    top: calc(50% - 150px);
    min-width: 400px;
    .fufc-upload {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .el-progress {
      margin-top: 10px;
      ::v-deep(.el-progress__text) {
        min-width: 0px;
      }
    }
  }
}
</style>