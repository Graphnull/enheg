let sharp = require('sharp/lib/index');
let w = 186;
let h = 36;


let left = async (params = {}) => {
    params.quality = params.quality || (Math.random() < 0.05 ? 60 : 80);
    params.lineHeightDispersion = params.lineHeightDispersion || 7;

    params.rotate = params.rotate || 10;

    let light = 255 - Math.floor(Math.random() * 100);
    let temperature = Math.floor(Math.random() * 48) - 24;
    let textLight = 0 + Math.floor(Math.random() * 100);
    let background = { r: light - temperature, g: light, b: light + temperature, alpha: 1 }
    let origin = sharp({
        create: {
            width: w,
            height: h,
            channels: 3,
            background
        }
    })

    let degree = Math.random() * 2 * params.rotate - params.rotate;


    let alphabet = 'йцукенгшщзхъфывапрололджэячсмитьбю.ЙЦУКЕНГШЩЗХЪФЫВАПРОЛДЖЭЯЧСМИТЬБЮ,12!%?*   '


    let texts = []
    let lines = []

    let text = (new Array(Math.floor(Math.random() * 25 + 5)).fill(0).map(v => alphabet[Math.floor(Math.random() * alphabet.length)]))
    if(Math.random()<0.05){
        let engAlp = 'QWERTYUIOPASDFGHJKLZXCVBNM'
        text[Math.floor(Math.random()*text.length)] = ' '+(new Array(Math.floor(Math.random() * 3 + 1)).fill(0).map(v => engAlp[Math.floor(Math.random() * engAlp.length)])).join('')+' '
    }
    if(Math.random()<0.1){
        text[Math.floor(Math.random()*text.length)]=' ('
        text.push(')')
    }


    text = text.join('')
    text= text.trim()

    text = text.slice(0,15)//убираем перенос строки
    //text = 'Базофилы, %'
    let width = text.length * 10
    let x = 10;
    let y = 25;
    if (text.length > 15) {
        y = 15
        texts.push(`<text x="${x}" y="${y}" style="Rrrrr">` + text.slice(0, 15) + `</text>`)
        texts.push(`<text x="${x}" y="${y + 15}" style="Rrrrr">` + text.slice(15) + `</text>`)

    } else {
        texts.push(`<text x="${x}" y="${y}" style="Rrrrr">` + text + `</text>`)
    }

    let lineOffset = y - 15 + Math.floor(Math.random() * 2)

    lines.push(`<line x1="${0}" y1="${lineOffset}" x2="${w}" y2="${lineOffset}" stroke="black" />`)
    let lineOffset2 = Math.floor(Math.random() * 6) + 27
    if (text.length <= 15) {
        lines.push(`<line x1="${0}" y1="${lineOffset2}" x2="${w}" y2="${lineOffset2}" stroke="black" />`)
    }
    



    const textedSVG = Buffer.from(`<svg x="0px" y="0px" width="${w}px" height="${h}px" viewBox="0 0 ${w} ${h}">
            <style>
            text { font: ${14}px AstoriaRoman; fill: rgb(${textLight}, ${textLight},${textLight}); }
          </style>
                ${texts.join('')}
            </svg>`);


    origin = await origin.composite([{ input: textedSVG }, {
        input: Buffer.from(`<svg x="0px" y="0px" width="${w}px" height="${h}px" viewBox="0 0 ${w} ${h}">
    <style>
    line { stroke: #000;  }
  </style>
        ${lines.join('')}
    </svg>`)
    }])
    width = w

    origin = sharp(await origin.toBuffer(), { raw: { width: w, height: h, channels: 4 } })

    let { info } = await sharp(await origin.toBuffer(), { raw: { width: w, height: h, channels: 4 } })
        .rotate(degree, { background: { r: light - temperature, g: light, b: light + temperature, alpha: 1 } }).toBuffer({ resolveWithObject: true })


    origin = await sharp(await origin.toBuffer(), { raw: { width: w, height: h, channels: 4 } })
        .rotate(degree, { background: { r: light - temperature, g: light, b: light + temperature, alpha: 1 } }).removeAlpha().toBuffer()


    let out = { width: width, height: h };

    let resized = sharp(origin, { raw: { width: info.width, height: info.height, channels: 3 } }).resize(width, h)

    if (Math.random() < 0.05) {// 5% blur
        resized = resized.blur(1)
    }

    resized = await resized.jpeg({ quality: params.quality }).toBuffer()

    out.result = await sharp(resized).raw().toBuffer()
    if (text.length > 15) {
        out.text = text.slice(0, 15) + ' ' + text.slice(15);
    } else {
        out.text = text;
    }
    out.text = text
    .replace(/\*/gi,'_')
    return out
}

let right = async (params = {}) => {
    params.quality = params.quality || (Math.random() < 0.05 ? 60 : 80);
    params.lineHeightDispersion = params.lineHeightDispersion || 7;

    params.rotate = params.rotate || 10;


    let redBack = (Math.random() < 0.2);

    let grayRedBack = redBack?Math.random()<0.5:false;

    let light = 255 - Math.floor(Math.random() * 100);
    let temperature = Math.floor(Math.random() * 48) - 24;
    let textLight = (redBack ? 155 : 0) + Math.floor(Math.random() * 100);
    let background = { r: light - temperature - (grayRedBack?100:0), g: light - (redBack ?  (grayRedBack?100:155) : 0), b: light + temperature - (redBack ? (grayRedBack?100:155) : 0), alpha: 1 }
    let origin = sharp({
        create: {
            width: w,
            height: h,
            channels: 3,
            background
        }
    })

    let degree = Math.random() * 2 * params.rotate - params.rotate;

    let Ralphabet = '1234567890,.-*<>+()'


    let texts = []
    let lines = []

    let text = (new Array(Math.floor(Math.random() * 5) + 1).fill(0).map(v => Ralphabet[Math.floor(Math.random() * Ralphabet.length)])).join('')
    if (Math.random()<0.6) {
        text = String(Math.floor(Math.random()*99999)/(Math.pow(10,Math.floor(Math.random()*5)))).slice(0,5)
        if(text[text.length-1]==='.'){
            let char = text[text.length-2]
            text=text.slice(0,-2)+(Math.random()<0.5?'.':',')+char
        }
    }
    if(params.text){
        text=params.text
    }


    //text = 'Базофилы, %'
    let width = text.length * 10
    let x = 10;
    let y = 25;
    texts.push(`<text x="${x}" y="${y}" style="Rrrrr">` + text.replace(/\</gi,'&lt;') + `</text>`)
    

    let lineOffset = y - 15 + Math.floor(Math.random() * 2)
        lineOffset = 1
        lines.push(`<line x1="${0}" y1="${lineOffset}" x2="${w}" y2="${lineOffset}" stroke="black" />`)
        let lineOffset2 = 35
        lines.push(`<line x1="${0}" y1="${lineOffset2}" x2="${w}" y2="${lineOffset2}" stroke="black" />`)




    const textedSVG = Buffer.from(`<svg x="0px" y="0px" width="${w}px" height="${h}px" viewBox="0 0 ${w} ${h}">
            <style>
            text { font: ${20}px AstoriaRoman; fill: rgb(${textLight}, ${textLight},${textLight}); }
          </style>
                ${texts.join('')}
            </svg>`);


    origin = await origin.composite([{ input: textedSVG }, {
        input: Buffer.from(`<svg x="0px" y="0px" width="${w}px" height="${h}px" viewBox="0 0 ${w} ${h}">
    <style>
    line { stroke: #000;  }
  </style>
        ${lines.join('')}
    </svg>`)
    }])
    width = w

    origin = sharp(await origin.toBuffer(), { raw: { width: w, height: h, channels: 4 } })

    let { info } = await sharp(await origin.toBuffer(), { raw: { width: w, height: h, channels: 4 } })
        .rotate(degree, { background: { r: light - temperature, g: light, b: light + temperature, alpha: 1 } }).toBuffer({ resolveWithObject: true })


    origin = await sharp(await origin.toBuffer(), { raw: { width: w, height: h, channels: 4 } })
        .rotate(degree, { background: { r: light - temperature, g: light, b: light + temperature, alpha: 1 } }).removeAlpha().toBuffer()


    let out = { width: width, height: h };

    let resized = sharp(origin, { raw: { width: info.width, height: info.height, channels: 3 } }).resize(width, h)

    if (Math.random() < 0.05) {// 5% blur
        resized = resized.blur(2)
    }

    resized = await resized.jpeg({ quality: params.quality }).toBuffer()

    
    out.result = await sharp(resized).raw().toBuffer()

    out.text = text
    .replace(/\*/gi,'_')
    .replace(/\</gi,'^')
    .replace(/\>/gi,'$');
    

    return out
}

let main = async () => {
    for (let i = 0; i !== 5000; i++) {
        let res = await left({ rotate: 5 })
        await sharp(res.result, { raw: { width: res.width, height: res.height, channels: 3 } }).jpeg({ quality: 100 }).toFile('./leftCells/' + res.text + '.jpg')
    }
    let constAlp = ['см.комм.', 'отрицат.', 'необнар.','необнар','комм.','см.комм', 'комм.см','комм.см.','ко.мм.см','нет','светло-желтый','желтый', 'обнаружено','полная','неполная','результат']
    
    for(let i=0;i!== constAlp.length;i++){
        let res = await left({ rotate: 5, text: constAlp[i] })
        await sharp(res.result, { raw: { width: res.width, height: res.height, channels: 3 } }).jpeg({ quality: 100 }).toFile('./leftCells/' + res.text + '.jpg')
    }
    for (let i = 0; i !== 0; i++) {
        let res = await right({ rotate: 5 })
        await sharp(res.result, { raw: { width: res.width, height: res.height, channels: 3 } }).jpeg({ quality: 100 }).toFile('./rightCells/' + res.text + '.jpg')
    }
}


main();

