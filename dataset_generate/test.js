let tf = require('@tensorflow/tfjs-node')
let fs = require('fs')



let main = async ()=>{

    let model = await tf.loadLayersModel('file://firsLinesModel/model.json');
    let img = tf.node.decodeJpeg(fs.readFileSync('lines.jpg'), 1).expandDims()
    let imgMin = img.min().dataSync()[0];
    let imgMax =  img.max().dataSync()[0]-imgMin;
    let result = model.predict(img.sub(imgMin).mul(255/imgMax).div(255))
    console.log('img', img.min().dataSync(),);
    let y = result//.add(img.div(100).resizeBilinear([img.shape[1]*2, img.shape[2]*2]))
    
    let max = y.max().dataSync()[0]
    console.log('max: ', max);
    let min = y.min().dataSync()[0]

    let buf = await tf.node.encodePng(y.reshape(y.shape.slice(1)).mul(1/max).mul(255).maximum(0).minimum(255))
    console.log('buf: ', buf);
    fs.writeFileSync('./res.png', buf)
}


main();