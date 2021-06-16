let sharp = require('sharp/lib/index');
let w = 720*2;
let h = 1280*2;
let wh = w/2;
let hh = h/2;



module.exports = async (quality = 60)=>{

    let light = 255 - Math.floor(Math.random()*128);
    let temperature = Math.floor(Math.random()*64)-32;
    let origin = sharp({
        create: {
        width: w,
        height: h,
        channels: 3,
        background: { r: light-temperature, g: light, b: light+temperature, alpha: 1 }
        }
    })
    let degree = Math.random()*20-10;
    

    let alphabet = 'йцукенгшщзхъфывапрололджэ\ячсмитьбю.ЙЦУКЕНГШЩЗХЪФЫВАПРОЛДЖЭ/ЯЧСМИТЬБЮ,1234567890!"№;%:?*()-=_+'

    let text = 'Awesome!'
    let width = 100;

    let texts = []
    for(let y = 0; y< h;y+=60){

        for(let x = 50; x< w-150;x+=width){
            text = (new Array(Math.floor(Math.random()*10)).fill(0).map(v=>alphabet[Math.floor(Math.random()*alphabet.length)])).join('')+' '

            width = text.length*16
            texts.push(`<text x="${x}" y="${y}" font-size="24px" fill="#000">`+text+`</text>`)
        }
    }        
    const textedSVG = Buffer.from(`<svg x="0px" y="0px" width="${w}px" height="${h}px" viewBox="0 0 ${w} ${h}">
            <style>
            .Rrrrr { font: italic 24px serif; fill: black; }
          </style>
                ${texts.join('')}
            </svg>`)
            origin = await origin.composite([{input:textedSVG}])
            origin = sharp(await origin.toBuffer(),{raw:{width:w, height:h, channels:4}})
    
    origin = sharp(await origin.toBuffer(),{raw:{width:w, height:h, channels:4}}).rotate(degree).extract({left:0, top:0, width:w, height:h})
    let originData = await origin.clone().extractChannel(0).toColorspace('b-w').raw().toBuffer()



    let out ={ width:w, height:h};

    let resized = await origin.resize(wh,hh).jpeg({quality}).toBuffer()
    out.result = await sharp(resized).raw().extractChannel(0).toColorspace('b-w').toBuffer()
    out.origin = originData;

    return out
}