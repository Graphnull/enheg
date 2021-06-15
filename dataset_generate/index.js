const { createCanvas, loadImage } = require('canvas')
let w = 720*2;
let h = 1280*2;
let wh = w/2;
let hh = h/2;
const canvas = createCanvas(w, h)
const ctx = canvas.getContext('2d')

const resizedCanvas = createCanvas(w/2, h/2)
const resizedCtx = resizedCanvas.getContext('2d')

module.exports = async (quality = 0.6)=>{

    let light = 255 - Math.floor(Math.random()*128);
    let temperature = Math.floor(Math.random()*64)-32;

    let degree = Math.random()*20-10;
    
    ctx.fillStyle = `rgba(0,0,0,1)`
    ctx.fillRect(0,0, w, h)
    ctx.fill()

    ctx.rotate(degree * Math.PI / 180)
    if(degree>0){
        // ctx.translate((720*2)*0.1, (1280*2)*0.1);
    ctx.translate((720*2)*0.1, 0);
    }else{
        ctx.translate(0, (1280*2)*0.1);
    }

    ctx.scale(0.8, 0.8);

    ctx.fillStyle = `rgba(255, 255, 255,1)`
    ctx.fillRect(0,0, w, h)
    ctx.fill()
    resizedCtx.drawImage(canvas, 0, 0, wh, hh)
    let mask = resizedCtx.getImageData(0,0, wh, hh);
    ctx.fillStyle = `rgba(${light+temperature}, ${light}, ${light-temperature},1)`
    ctx.fillRect(0,0, w, h)
    ctx.fill()

    let alphabet = 'йцукенгшщзхъфывапрололджэ\ячсмитьбю.ЙЦУКЕНГШЩЗХЪФЫВАПРОЛДЖЭ/ЯЧСМИТЬБЮ,1234567890!"№;%:?*()-=_+'


    ctx.font = '24px "Times new roman"'
    ctx.fillStyle = 'rgba(0,0,0,0.8)'

    let text = 'Awesome!'
    let width = ctx.measureText(text).width;

    for(let y = 0; y< h;y+=60){

        for(let i = 50; i< w-150;i+=width){
            text = (new Array(Math.floor(Math.random()*10)).fill(0).map(v=>alphabet[Math.floor(Math.random()*alphabet.length)])).join('')+' '
            width = ctx.measureText(text).width;

            ctx.fillText(text, i, y);
        }
    }

    ctx.fill()



    resizedCtx.drawImage(canvas, 0, 0, wh, hh)


    let compressed = resizedCanvas.toDataURL('image/jpeg', quality);
    const myimg = await loadImage(compressed);
    resizedCtx.drawImage(myimg,0,0)
    let result = resizedCtx.getImageData(0,0,wh, hh);

    let origin = ctx.getImageData(0,0,w, h);

    let out ={ width:w, height:h};
    out.mask = new Uint8Array(wh*hh)
    for(let i=0;i!==wh*hh;i++){
        out.mask[i] = mask.data[i*4]
    }

    out.result = new Uint8Array(wh*hh)
    for(let i=0;i!==wh*hh;i++){
        out.result[i] = result.data[i*4]
    }
    out.origin = new Uint8Array(w*h)
    for(let i=0;i!==w*h;i++){
        out.origin[i] = origin.data[i*4]
    }

    return out
}

