import SparkMD5 from 'spark-md5'
import { uploadFile } from '../api'

export const createChunkList = (file: File, chunkSize: number) =>{
    const fileChunkList: Array<Blob> = []
    let cur = 0
    while (cur < file.size) {
        fileChunkList.push(file.slice(cur, cur + chunkSize))
        cur+=chunkSize
    }
    return fileChunkList
}

export const createHash = (fileList: Array<Blob>): Promise<string> =>{
    return new Promise((res,rej)=>{
        const chunks = fileList.length
        let index = 0
        const spark = new SparkMD5.ArrayBuffer()
        const fileReader = new FileReader()
        fileReader.onload = function(e) {
            if(index < chunks) {
                spark.append(e.target?.result as ArrayBuffer)
                load()
                index+=1
            } else {
                res(spark.end())
            }
        }
        function load() {
            fileReader.readAsArrayBuffer(fileList[index])
        }
        load()
    })
}

export const limitUpload = (formDataList: any, limit: number) =>{
    return new Promise((res,rej) => {
        let index = 0
        for (let i = 0; i< limit; i++) {
            upload()
            index += 1
        }
        function upload() {
            uploadFile(
                formDataList[index].formData,
                formDataList[index].uploadProgress,
                formDataList[index].cancelToken,
            ).then(()=>{
                if(index < formDataList.length) {
                    upload()
                    index+=1
                }else {
                    res(true)
                }
            }).catch(()=>{})
        }
    })
}