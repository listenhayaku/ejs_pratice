function promiseFn(para){
    return new Promise((reslove,rejects)=>{
        reslove("test"+para);
    });
}
async function getData() {
    const data1 = await promiseFn(1); // 因為 await，promise 函式被中止直到回傳
    const data2 = await promiseFn(2);
    console.log(data1, data2); // 1, 成功 2, 成功
    }
getData();