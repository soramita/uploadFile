import SparkMD5 from 'spark-md5';
import { postUploadFile } from "../api"

/**
 * @description: 创建文件分片
 */
export const createChunkList = (file: any, chunkSize: any) => {
    const fileChunkList = []
    let cur = 0
    while(cur < file.size) {
        fileChunkList.push(file.slice(cur, cur + chunkSize))
        cur += chunkSize
    }
    return fileChunkList
}

/**
 * @description: 生成文件hash
 */
export const createMD5 = (fileChunkList: any):any => {
    return new Promise((resolve,reject)=>{
        const chunks = fileChunkList.length
        let currentChunk = 0
        let spark = new SparkMD5.ArrayBuffer()
        let fileReader = new FileReader()
        //读取文件切片
        fileReader.onload = function(e) {
            spark.append(e.target!.result as ArrayBuffer)
            currentChunk++
            if(currentChunk < chunks) {
                loadChunk()
            }else {
                resolve(spark.end())
            }
        }
        fileReader.onerror = function(e) {
            reject(e)
        }
        function loadChunk() {
            fileReader.readAsArrayBuffer(fileChunkList[currentChunk])
        }
        loadChunk()
    })
}

export const limitRequest = (list: any,limit: number) => {
    return new Promise((res,rej)=>{
        let i = 0
        for (let excuteCount = 0; excuteCount < limit; excuteCount++) {
            run()
            i+=1
        }
        function run(){
            postUploadFile(list[i].data, list[i].fn, list[i].cancel).then(()=>{
                if (i < list.length) {
                    run()
                    i+=1
                }
                else {
                    res(true)
                }   
            }).catch((e)=>{
                
            })
              
        }
    })
}