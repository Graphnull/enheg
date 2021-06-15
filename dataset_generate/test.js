let tf = require('@tensorflow/tfjs-node')
let fs = require('fs')



let main = async ()=>{

    let model = await tf.loadLayersModel('file://model/model.json');
    let img = tf.node.decodeJpeg(fs.readFileSync('img.jpg'), 1).expandDims()
    let result = model.predict(img.div(255))

    let y = result.add(img.div(255).resizeBilinear([img.shape[1]*2, img.shape[2]*2]))
    
    let buf = await tf.node.encodePng(y.reshape(y.shape.slice(1)).mul(255))
    console.log('buf: ', buf);
    fs.writeFileSync('./res.png', buf)
}


main();