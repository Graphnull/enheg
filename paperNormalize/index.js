
let fs = require('fs')
let sharp = require('sharp')

//Конвертирует все изображения с inputDir в папку ./normalizedFiles
let inputDir = './../../invitroDataset';

Math.clamp = (v, min,max)=>Math.max(Math.min(v,max), min)
Math.maxIndex = (arr)=>{
    let maxV = -Infinity
    let maxI = 0
    arr.forEach((v, i)=>{
        if(v>maxV){
            maxV = v
            maxI = i;
        }
    })
    return maxI
}
Math.minIndex = (arr)=>{
    let minV = Infinity
    let minI = 0
    arr.forEach((v, i)=>{
        if(v<minV){
            minV = v
            minI = i;
        }
    })
    return minI
}

let getColumn = (data, width, i)=>{
    let height = data.length/width;
    let out = new data.constructor(height);
    for(let y=0;y!==height;y++){
        out[y]=data[y*width+i]
    }
    return out
}

let inputFiles = fs.readdirSync(inputDir).filter(f=>f.slice(-4)==='.jpg');

let getHistogram = (data)=>{
    let hR = new Uint32Array(64);
    let hG = new Uint32Array(64);
    let hB = new Uint32Array(64);
    for(let p=0;p!==data.length/3;p++){
        if(data[p*3+0]===undefined){
            continue;
        }
        hR[Math.floor(data[p*3+0]/4)]++;
        hG[Math.floor(data[p*3+1]/4)]++;
        hB[Math.floor(data[p*3+2]/4)]++;
        
    }
    return [hR, hG, hB];
}

let main = async ()=>{

    for(let i =0 ; i!==inputFiles.length;i++){
        let fileName = inputFiles[i]
        let {data, info} = await sharp(inputDir+'/'+ fileName).removeAlpha().raw().toBuffer({resolveWithObject:true});
        let [hR, hG, hB] = getHistogram(data);

        let maxR = Math.maxIndex(hR);
        let maxG = Math.maxIndex(hG);
        let maxB = Math.maxIndex(hB);


        let blockSize = Math.ceil(Math.min(info.width,info.height )/8);
        let bW = Math.ceil(info.width/blockSize);
        let bH = Math.ceil(info.height/blockSize);
        let blocks=new Uint8Array(bW*bH);
        let blockLights=new Uint8Array(bW*bH*3);
        let blockDarks=new Uint8Array(bW*bH*3);
        //самые темные пиксели для контраста
        let minV = [999,999,999]
        //изображение делим на блоки по blockSizeхblockSize и для каждого блока вычисляем гистограмму
        for(let y =0;y<bH;y++){
            for(let x =0;x<bW;x++){
                let block = [];
                for(let dy =0;dy<blockSize;dy++){
                    for(let dx =0;dx<blockSize;dx++){
                        block[dy*blockSize*3+dx*3+0]=data[(y*blockSize+dy)*info.width*3+(x*blockSize+dx)*3+0];
                        block[dy*blockSize*3+dx*3+1]=data[(y*blockSize+dy)*info.width*3+(x*blockSize+dx)*3+1];
                        block[dy*blockSize*3+dx*3+2]=data[(y*blockSize+dy)*info.width*3+(x*blockSize+dx)*3+2];
                    }
                }
                let histogram = getHistogram(block)
                let maxBlockR = Math.maxIndex(histogram[0]);
                let maxBlockG = Math.maxIndex(histogram[1]);
                let maxblockB = Math.maxIndex(histogram[2]);
                blockLights[(y*bW+x)*3+0] = maxBlockR;
                blockLights[(y*bW+x)*3+1] = maxBlockG;
                blockLights[(y*bW+x)*3+2] = maxblockB;

                blockDarks[(y*bW+x)*3+0] = histogram[0].findIndex(v=>v>1)
                blockDarks[(y*bW+x)*3+1] = histogram[1].findIndex(v=>v>1)
                blockDarks[(y*bW+x)*3+2] = histogram[2].findIndex(v=>v>1)

                
                if(Math.abs(maxBlockR-maxR)>16||Math.abs(maxBlockG-maxG)>16||Math.abs(maxblockB-maxB)>16){
                    //в блоке не преобладает бумага
                    blocks[y*bW+x]=0;
                }else{
                    blocks[y*bW+x]=1;
                    //если в блоке преобладает бумага, то записываем самый темный уровень
                    minV[0]=Math.min(minV[0], histogram[0].findIndex(v=>v>1))
                    minV[1]=Math.min(minV[1], histogram[1].findIndex(v=>v>1))
                    minV[2]=Math.min(minV[2], histogram[2].findIndex(v=>v>1))
                }
            }
        }
        
        let minY = 0;
        // crop отключен
        // for(let y=0;y!==bH;y++){
        //     if(Math.max(...(blocks.slice(y*bW,y*bW+bW)))===1){
        //         minY=y;
        //         break;
        //     }
        // }
        let maxY = 10000;
        // for(let y=bH-1;y>=0;y--){
        //     if(Math.max(...blocks.slice(y*bW,y*bW+bW))===1){
        //         maxY=y+1;
        //         break;
        //     }
        // }

        //в гистограмме берем только светлую часть
        hR = hR.slice(32)
        hG = hG.slice(32)
        hB = hB.slice(32)

        let blockLightsResized = await sharp(blockLights.map(v=>v*4-12),{raw:{width:bW, height:bH, channels:3}})
        .resize(info.width,info.height).toBuffer()
        // let blockDarksResized = await sharp(blockDarks.map(v=>v*4),{raw:{width:bW, height:bH, channels:3}})
        // .resize(info.width,info.height).toBuffer()
        //находим контраст по самой светлой части и самой темной
        

        //применяем контраст
        for(let p=0;p!==data.length/3;p++){
            let lightR = 255/(blockLightsResized[p*3+0]-minV[0])//-minV[0]*4)
            let lightG = 255/(blockLightsResized[p*3+1]-minV[1])//-minV[1]*4)
            let lightB = 255/(blockLightsResized[p*3+2]-minV[2])//-minV[2]*4)
            data[p*3+0]=Math.clamp((data[p*3+0]-minV[0])*lightR,0,255);
            data[p*3+1]=Math.clamp((data[p*3+1]-minV[1])*lightG,0,255);
            data[p*3+2]=Math.clamp((data[p*3+2]-minV[2])*lightB,0,255);
        }
        //await sharp(blockLightsResized,{raw:{width:info.width, height:info.height, channels:3}})
        //.png().toFile('./normalizedFiles/'+ fileName.slice(0, -4)+'small.png')
        await sharp(data,{raw:{width: info.width,height: info.height,channels:3}})
            .extract({top:minY*blockSize,left:0, width:info.width, height:Math.min(info.height-minY*blockSize,(maxY - minY)*blockSize)})
            .png().toFile('./normalizedFiles/'+ fileName.slice(0, -4)+'.png');
    }

}

main()