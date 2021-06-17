let tf = require('@tensorflow/tfjs-node')
let fs = require('fs')


let main = async ()=>{

    let lineModel = await tf.loadLayersModel('file://firsLinesModel/model.json');
    let pointModel = await tf.loadLayersModel('file://model/model.json');
    let img = tf.node.decodeJpeg(fs.readFileSync('78.jpg'), 1).expandDims()
    let imgMin = img.min().dataSync()[0];
    let imgMax =  img.max().dataSync()[0]-imgMin;
    let lines = lineModel.predict(img.sub(imgMin).mul(255/imgMax).div(255))

    let max = lines.max().dataSync()[0]
    console.log('max: ', max);
    lines = lines.mul(1/max).maximum(0)

    let y = pointModel.predict(lines)
    
    let maxP = y.max().dataSync()[0]
    console.log('maxP: ', maxP);

    y = y.mul(1/maxP).maximum(0)

    let data = y.dataSync();

    let ids = new Uint8Array(data.length);
    //let idsCounts = []
    let idsWeightX = []
    let idsWeightY = []
    let idsWeight = []
    let uid = 0;
    for(let dy=0;dy!==y.shape[1];dy++){
        for(let dx=0;dx!==y.shape[2];dx++){

            let val = data[dy*y.shape[2]+dx]
            if(val>(64/255)){
                let id = ids[dy*y.shape[2]+dx]||uid++;
                
                //idsCounts[id]=(idsCounts[id]+1)||1;
                idsWeightX[id]=(idsWeightX[id]+dx*val)||dx*val;
                idsWeightY[id]=(idsWeightY[id]+dy*val)||dy*val;
                idsWeight[id]=(idsWeight[id]+val)||val;


                if(dy+1<y.shape[1]){
                    ids[(dy+1)*y.shape[2]+dx]= id;
                    if(dx>-1){
                        ids[(dy+1)*y.shape[2]+dx-1]= id;
                    }
                    if(dx+1<y.shape[2]){
                        ids[(dy)*y.shape[2]+dx+1]= id;
                        ids[(dy+1)*y.shape[2]+dx+1]= id;
                    }
                }

            } 

        }
    }
    console.log('uid',idsWeight, idsWeightX.map((v,i)=>v/idsWeight[i]), idsWeightY.map((v,i)=>v/idsWeight[i]));
    fs.writeFileSync('./ids.png',await tf.node.encodePng(tf.tensor(ids,y.shape.slice(1))))

    let buf = await tf.node.encodePng(y.reshape(y.shape.slice(1)).mul(255).maximum(0).minimum(255))

    fs.writeFileSync('./res.png', buf)
    let bufl = await tf.node.encodePng(lines.reshape(lines.shape.slice(1)).mul(255).maximum(0).minimum(255))
    
    fs.writeFileSync('./lines.png', bufl)
}


main();