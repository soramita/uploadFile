import axios from 'axios'
const requst = axios.create({
    baseURL: 'http://localhost:3001'
})
export const postUploadFile = (data: FormData, onUploadProgress?: any,cancelTokens?: any) =>{
    return requst({
        url:'/upload',
        data:data,
        method:'post',
        onUploadProgress:onUploadProgress,
        cancelToken:cancelTokens
    })
}

export const postMergeFile = (file: any) =>{
    return requst({
        url:'/mergeFile',
        data:file,
        method:'post',
    })
}

export const postVerifyUpload = (fileHash: string, fileName: string) =>{
    return requst({
        url:'/verifyUpload',
        data:{
            fileHash,
            fileName
        },
        method:'post',
    })
}