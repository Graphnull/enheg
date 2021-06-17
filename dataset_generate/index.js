let sharp = require('sharp/lib/index');
let w = 720*2;
let h = 1280*2;
let wh = w/2;
let hh = h/2;



module.exports = async (params ={})=>{
    params.quality = params.quality||60;
    params.lineHeightDispersion = params.lineHeightDispersion||30;

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
    let pointImage = sharp({
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
    let points = []
    for(let y = 60; y< h-160;y+=60){

        for(let x = 50; x< w-200;x+=width){
            text = (new Array(Math.floor(Math.random()*10)).fill(0).map(v=>alphabet[Math.floor(Math.random()*alphabet.length)])).join('')+' '

            width = text.length*16
            texts.push(`<text x="${x}" y="${y}" style="Rrrrr">`+text+`</text>`)
        }
        let lineOffset = Math.floor(Math.random()*params.lineHeightDispersion-params.lineHeightDispersion/2)
        lines.push(`<line x1="${50}" y1="${y+20+lineOffset}" x2="${w-150}" y2="${y+20+lineOffset}" stroke="black" />`)
        points.push(`<circle cx="${50}" cy="${y+20+lineOffset}" r="4"/>`)
        points.push(`<circle cx="${w-150}" cy="${y+20+lineOffset}" r="4"/>`)
    }        
    const textedSVG = Buffer.from(`<svg x="0px" y="0px" width="${w}px" height="${h}px" viewBox="0 0 ${w} ${h}">
            <style>
            text { font: italic 24px serif; fill: black; }
          </style>
                ${texts.join('')}
            </svg>`);      

    
    lineImage = await lineImage.composite([{input:Buffer.from(`<svg x="0px" y="0px" width="${w}px" height="${h}px" viewBox="0 0 ${w} ${h}">
    <style>
    line { stroke: #fff; }
  </style>
        ${lines.join('')}
    </svg>`)}])

    pointImage = await pointImage.composite([{input:Buffer.from(`<svg x="0px" y="0px" width="${w}px" height="${h}px" viewBox="0 0 ${w} ${h}">
    <style>
    circle { stroke: #fff;fill: #FFF }
  </style>
        ${points.join('')}
    </svg>`)}])

    origin = await origin.composite([{input:textedSVG}, {input:Buffer.from(`<svg x="0px" y="0px" width="${w}px" height="${h}px" viewBox="0 0 ${w} ${h}">
    <style>
    line { stroke: #000;  }
  </style>
        ${lines.join('')}
    </svg>`)}])
    lineImage = sharp(await lineImage.toBuffer(),{raw:{width:w, height:h, channels:4}})
    pointImage = sharp(await pointImage.toBuffer(),{raw:{width:w, height:h, channels:4}})
    origin = sharp(await origin.toBuffer(),{raw:{width:w, height:h, channels:4}})
    
    lineImage = sharp(await lineImage.toBuffer(),{raw:{width:w, height:h, channels:4}}).rotate(degree).extract({left:0, top:0, width:w, height:h})
    pointImage = sharp(await pointImage.toBuffer(),{raw:{width:w, height:h, channels:4}}).rotate(degree).extract({left:0, top:0, width:w, height:h})
    origin = sharp(await origin.toBuffer(),{raw:{width:w, height:h, channels:4}}).rotate(degree).extract({left:0, top:0, width:w, height:h})
    let originData = await origin.clone().extractChannel(0).toColorspace('b-w').raw().toBuffer()



    let out ={ width:w, height:h};

    let resized = await origin.resize(wh,hh).jpeg({quality:params.quality}).toBuffer()
    out.lines = await lineImage.resize(wh, hh).extractChannel(0).toColorspace('b-w').threshold(64).toBuffer()
    out.points = await pointImage.resize(wh, hh).extractChannel(0).toColorspace('b-w').threshold(64).toBuffer()
    out.result = await sharp(resized).raw().extractChannel(0).toColorspace('b-w').toBuffer()
    out.origin = originData;

    return out
}
// module.exports({}).then((res)=>{

//     sharp(res.lines,{raw:{width:res.width/2,height:res.height/2, channels:1}}).png().toFile('lines.png')
//     sharp(res.points,{raw:{width:res.width/2,height:res.height/2, channels:1}}).png().toFile('points.png')
// })