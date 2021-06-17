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
    let lineImage = sharp({
        create: {
        width: w,
        height: h,
        channels: 3,
        background: { r: 0, g: 0, b: 0, alpha: 1 }
        }
    })
    let degree = Math.random()*20-10;
    

    let alphabet = 'йцукенгшщзхъфывапрололджэ\ячсмитьбю.ЙЦУКЕНГШЩЗХЪФЫВАПРОЛДЖЭ/ЯЧСМИТЬБЮ,1234567890!"№;%:?*()-=_+'

    let text = 'Awesome!'
    let width = 100;

    let texts = []
    let lines = []
    for(let y = 0; y< h;y+=60){

        for(let x = 50; x< w-150;x+=width){
            text = (new Array(Math.floor(Math.random()*10)).fill(0).map(v=>alphabet[Math.floor(Math.random()*alphabet.length)])).join('')+' '

            width = text.length*16
            texts.push(`<text x="${x}" y="${y}" style="Rrrrr">`+text+`</text>`)
        }
        let lineOffset = Math.floor(Math.random()*30)
        lines.push(`<line x1="${50}" y1="${y+10+lineOffset}" x2="${w-150}" y2="${y+10+lineOffset}" stroke="black" />`)
    }        
    const textedSVG = Buffer.from(`<svg x="0px" y="0px" width="${w}px" height="${h}px" viewBox="0 0 ${w} ${h}">
            <style>
            text { font: italic 24px serif; fill: black; }
          </style>
                ${texts.join('')}
            </svg>`);
    const linedSVG = Buffer.from(`<svg x="0px" y="0px" width="${w}px" height="${h}px" viewBox="0 0 ${w} ${h}">
            <style>
          </style>
                ${lines.join('')}
            </svg>`);        

    
    lineImage = await lineImage.composite([{input:Buffer.from(`<svg x="0px" y="0px" width="${w}px" height="${h}px" viewBox="0 0 ${w} ${h}">
    <style>
    line { stroke: #fff; }
  </style>
        ${lines.join('')}
    </svg>`)}])
    origin = await origin.composite([{input:textedSVG}, {input:Buffer.from(`<svg x="0px" y="0px" width="${w}px" height="${h}px" viewBox="0 0 ${w} ${h}">
    <style>
    line { stroke: #000; }
  </style>
        ${lines.join('')}
    </svg>`)}])
    lineImage = sharp(await lineImage.toBuffer(),{raw:{width:w, height:h, channels:4}})
    origin = sharp(await origin.toBuffer(),{raw:{width:w, height:h, channels:4}})
    
    lineImage = sharp(await lineImage.toBuffer(),{raw:{width:w, height:h, channels:4}}).rotate(degree).extract({left:0, top:0, width:w, height:h})
    origin = sharp(await origin.toBuffer(),{raw:{width:w, height:h, channels:4}}).rotate(degree).extract({left:0, top:0, width:w, height:h})
    let originData = await origin.clone().extractChannel(0).toColorspace('b-w').raw().toBuffer()



    let out ={ width:w, height:h};

    let resized = await origin.resize(wh,hh).jpeg({quality}).toBuffer()
    out.lines = await lineImage.resize(wh, hh).extractChannel(0).toColorspace('b-w').threshold(64).toBuffer()
    out.result = await sharp(resized).raw().extractChannel(0).toColorspace('b-w').toBuffer()
    out.origin = originData;

    return out
}
// module.exports().then((res)=>{
//     console.log(res.result.length, res.width*res.height );
//     sharp(res.lines,{raw:{width:res.width/2,height:res.height/2, channels:1}}).png().toFile('test.png')
// })