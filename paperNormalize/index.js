
let fs = require('fs')
let sharp = require('sharp')

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

let getColumn = (data, width, i)=>{
    let height = data.length/width;
    let out = new data.constructor(height);
    for(let y=0;y!==height;y++){
        out[y]=data[y*width+i]
    }
    return out
}
let inputDir = '/home/eva/Загрузки/!del temp';

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


        let bW = Math.ceil(info.width/128)
        let bH = Math.ceil(info.height/128)
        let blocks=new Uint8Array(bW*bH);
        for(let y =0;y<info.height/128;y++){
            for(let x =0;x<info.width/128;x++){
                let block = [];
                for(let dy =0;dy<128;dy++){
                    for(let dx =0;dx<128;dx++){
                        block[dy*128*3+dx*3+0]=data[(y*128+dy)*info.width*3+(x*128+dx)*3+0];
                        block[dy*128*3+dx*3+1]=data[(y*128+dy)*info.width*3+(x*128+dx)*3+1];
                        block[dy*128*3+dx*3+2]=data[(y*128+dy)*info.width*3+(x*128+dx)*3+2];
                    }
                }
                let histogram = getHistogram(block)
                let maxBlockR = Math.maxIndex(histogram[0]);
                let maxBlockG = Math.maxIndex(histogram[1]);
                let maxblockB = Math.maxIndex(histogram[2]);
                fileName=== '32.jpg' && console.log(maxBlockR,maxR, maxBlockG,maxG,   maxblockB,maxB )
                if(Math.abs(maxBlockR-maxR)>16||Math.abs(maxBlockG-maxG)>16||Math.abs(maxblockB-maxB)>16){
                    blocks[y*bW+x]=0;
                }else{
                    blocks[y*bW+x]=1;
                }
            }
        }
        let minX =1000;
        let minY = 1000;
        let maxX = 0;
        let maxY = 0;

        for(let y=0;y!==bH;y++){
            if(Math.max(...(blocks.slice(y*bW,y*bW+bW)))===1){
                minY=y;
                break;
            }
        }

        for(let y=bH-1;y>=0;y--){
            if(Math.max(...blocks.slice(y*bW,y*bW+bW))===1){
                maxY=y+1;
                break;
            }
        }
        // for(let x=0;x!==bW;x++){
        //     if(Math.max(...getColumn(blocks, bW, x))===1){
        //         minX=x;
        //         break;
        //     }
        // }

        // for(let x=bW-1;x>=0;x--){
        //     if(Math.max(...getColumn(blocks, bW, x))===1){
        //         maxX=x+1;
        //         break;
        //     }
        // }

        hR = hR.slice(32)
        hG = hG.slice(32)
        hB = hB.slice(32)
        let lightR = 255/((Math.maxIndex(hR)+38)*4)
        let lightG = 255/((Math.maxIndex(hG)+38)*4)
        let lightB = 255/((Math.maxIndex(hB)+38)*4)

        for(let p=0;p!==data.length/3;p++){
            
            data[p*3+0]=Math.clamp(data[p*3+0]*lightR,0,255);
            data[p*3+1]=Math.clamp(data[p*3+1]*lightG,0,255);
            data[p*3+2]=Math.clamp(data[p*3+2]*lightB,0,255);
        }
        fileName=== '32.jpg'&& console.log('rrrrrrr',blocks.join(''), minX*128, minY*128, maxX*128, maxY*128,info);
        await sharp(data,{raw:{width: info.width,height: info.height,channels:3}}).extract({top:minY*128,left:0, width:info.width, height:Math.min(info.height-minY*128,(maxY - minY)*128)}).png().toFile('./normalizedFiles/'+ fileName.slice(0, -4)+'.png');

    }

}

main()