import axios from "axios";
const request = axios.create({
    baseURL:'http://localhost:3001'
})

export const uploadFile = (data: any, onUploadProgress: any,cancelToken: any) =>{
    return request({
        url:'/upload',
        method:'post',
        data:data,
        onUploadProgress,
        cancelToken
    })
}

type MergeFile = {
    fileHash: string
    fileName: string
    chunkSize: number
}
export const mergeFile = (data: MergeFile) =>{
    return request({
        url:'/mergeFile',
        method:'post',
        data:data
    })
}