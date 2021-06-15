const { createCanvas, loadImage } = require('canvas')
let fs = require('fs')
let w = 720*2;
let h = 1280*2;
const canvas = createCanvas(w, h)
const ctx = canvas.getContext('2d')


let light = 255 - Math.floor(Math.random()*128);
let temperature = Math.floor(Math.random()*64)-32;

let degree = Math.random()*20-10;
ctx.rotate(degree * Math.PI / 180)
if(degree>0){
    // ctx.translate((720*2)*0.1, (1280*2)*0.1);
ctx.translate((720*2)*0.1, 0);
}else{
    ctx.translate(0, (1280*2)*0.1);
}

ctx.scale(0.8, 0.8);

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


const resizedCanvas = createCanvas(w/2, h/2)
const resizedCtx = resizedCanvas.getContext('2d')
resizedCtx.drawImage(canvas, 0, 0, w/2, h/2)

resizedCtx.getImageData(0,0,w/2, h/2)

let buf = resizedCanvas.toBuffer('image/jpeg', {quality:0.75})
fs.writeFileSync('./img.jpg', buf)
console.log('buf: ', buf);
