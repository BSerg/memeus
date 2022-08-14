const MAX_WIDTH = 800;
const MIN_ASPECT_RATIO = 0.3;
const MAX_ASPECT_RATIO = 3;

function _draw(canvas, img, width, height) {
    if (!width || !height) {
        canvas.width = img.width < MAX_WIDTH ? img.width : MAX_WIDTH;
        canvas.height = canvas.width / (img.width / img.height);
    }
    else {
        canvas.width = width;
        canvas.height = height;
    }
    let ctx = canvas.getContext("2d");
    let aspectRatioImage = img.width / img.height;
    let aspectRatioCanvas = canvas.width / canvas.height;
    let drawWidth, drawHeight, drawX, drawY;
    if (aspectRatioImage >= aspectRatioCanvas) {
        drawHeight = canvas.height;
        drawY = 0;
        drawWidth = img.width * (canvas.height / img.height);
        drawX = (canvas.width - drawWidth);
    }
    else {
        drawWidth = canvas.width;
        drawX = 0;
        drawHeight = img.height * (canvas.width / img.width);
        drawY = (canvas.height - drawHeight) / 2;
    }
    ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);
}

function _getCanvasBlob(canvas) {
    let base64 = canvas.toDataURL();
    let byteString = window.atob(base64.split(',')[1]);
    let ab = new ArrayBuffer(byteString.length);
    let ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
    }
    let file = new Blob([ia], {type: 'image/jpeg'});
    return file;
}

export function processImageClient(canvas, imageBlob, width=0, height=0) {

    return new Promise((resolve, reject) => {
        let img = new Image();
        img.crossOrigin = "Anonymous";
        img.onload = () => {
            let aspectRatio = img.width / img.height;
            if ((!img.width || !img.height) || (aspectRatio < MIN_ASPECT_RATIO || aspectRatio > MAX_ASPECT_RATIO) ) {
                
                return reject('aspect');
            }
            try {
                _draw(canvas, img, width, height);
                let f = _getCanvasBlob(canvas);
                return resolve(f);
            }
            catch (err) {
                return reject(err);
            }
        }
        img.src = imageBlob;
    })
}