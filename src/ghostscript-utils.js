import { COMPRESSION_LEVEL } from "./models/ENUM/COMPRESSION_LEVEL";


export function _GSPS2PDF(dataStruct, responseCallback, progressCallback, statusUpdateCallback, compressionLevel) {
    console.log("[_GSPS2PDF] Start Ghostscript compression with level:", compressionLevel);
    console.log("[_GSPS2PDF] Data struct:", dataStruct);

    var xhr = new XMLHttpRequest();
    xhr.open("GET", dataStruct.psDataURL);
    xhr.responseType = "arraybuffer";
    xhr.onload = function () {
        console.log("[_GSPS2PDF] File (input.pdf) loaded from psDataURL:", dataStruct.psDataURL);
        window.URL.revokeObjectURL(dataStruct.psDataURL);

        let gsArguments;
        switch (compressionLevel) {
            case COMPRESSION_LEVEL.HIGH:
                gsArguments = [
                    '-sDEVICE=pdfwrite',
                    '-dCompatibilityLevel=1.4',
                    '-dPDFSETTINGS=/screen',
                    '-dNOPAUSE',
                    '-dQUIET',
                    '-dBATCH',
                    '-sOutputFile=output.pdf',
                    'input.pdf',
                    '-dDownsampleColorImages=true',
                    '-dDownsampleGrayImages=true',
                    '-dDownsampleMonoImages=true',
                    '-dColorImageDownsampleType=/Bicubic',
                    '-dGrayImageDownsampleType=/Bicubic',
                    '-dMonoImageDownsampleType=/Subsample',
                    '-dColorImageResolution=72',
                    '-dGrayImageResolution=72',
                    '-dMonoImageResolution=72'
                ];
                break;
            case COMPRESSION_LEVEL.MEDIUM:
                gsArguments = [
                    '-sDEVICE=pdfwrite',
                    '-dCompatibilityLevel=1.4',
                    '-dPDFSETTINGS=/ebook',
                    '-dNOPAUSE',
                    '-dQUIET',
                    '-dBATCH',
                    '-sOutputFile=output.pdf',
                    'input.pdf',
                    '-dDownsampleColorImages=true',
                    '-dDownsampleGrayImages=true',
                    '-dDownsampleMonoImages=true',
                    '-dColorImageDownsampleType=/Bicubic',
                    '-dGrayImageDownsampleType=/Bicubic',
                    '-dMonoImageDownsampleType=/Subsample',
                    '-dColorImageResolution=100',
                    '-dGrayImageResolution=100',
                    '-dMonoImageResolution=100'
                ];
                break;
            case COMPRESSION_LEVEL.LOW:
                gsArguments = [
                    '-sDEVICE=pdfwrite',
                    '-dCompatibilityLevel=1.4',
                    '-dPDFSETTINGS=/printer',
                    '-dNOPAUSE',
                    '-dQUIET',
                    '-dBATCH',
                    '-sOutputFile=output.pdf',
                    'input.pdf',
                    '-dDownsampleColorImages=true',
                    '-dDownsampleGrayImages=true',
                    '-dDownsampleMonoImages=true',
                    '-dColorImageDownsampleType=/Bicubic',
                    '-dGrayImageDownsampleType=/Bicubic',
                    '-dMonoImageDownsampleType=/Subsample',
                    '-dColorImageResolution=150',
                    '-dGrayImageResolution=150',
                    '-dMonoImageResolution=150'
                ];
                break;
            default:
                gsArguments = [
                    '-sDEVICE=pdfwrite',
                    '-dCompatibilityLevel=1.4',
                    '-dPDFSETTINGS=/screen',
                    '-dNOPAUSE',
                    '-dQUIET',
                    '-dBATCH',
                    '-sOutputFile=output.pdf',
                    'input.pdf',
                    '-dDownsampleColorImages=true',
                    '-dDownsampleGrayImages=true',
                    '-dDownsampleMonoImages=true',
                    '-dColorImageDownsampleType=/Bicubic',
                    '-dGrayImageDownsampleType=/Bicubic',
                    '-dMonoImageDownsampleType=/Subsample',
                    '-dColorImageResolution=72',
                    '-dGrayImageResolution=72',
                    '-dMonoImageResolution=72'
                ];
        }

        console.log("[_GSPS2PDF] Ghostscript arguments:", gsArguments);

        var Module = {
            preRun: [function () {
                const FS = window.FS;
                FS.writeFile('input.pdf', new Uint8Array(xhr.response));
                console.log("[_GSPS2PDF] Wrote input.pdf to FS");
            }],
            postRun: [function () {
                const FS = window.FS;
                var uarray = FS.readFile('output.pdf', { encoding: 'binary' });
                var blob = new Blob([uarray], { type: "application/pdf" });
                var pdfDataURL = window.URL.createObjectURL(blob);
                console.log("[_GSPS2PDF] Reading output.pdf and returning final result");
                responseCallback({ pdfDataURL: pdfDataURL, url: dataStruct.url });
            }],
            arguments: gsArguments,
            print: function (text) {
                statusUpdateCallback(text);
            },
            printErr: function (text) {
                statusUpdateCallback('Error: ' + text);
                console.error("[_GSPS2PDF] Ghostscript error:", text);
            },
            setStatus: function (text) {
                if (!Module.setStatus.last) Module.setStatus.last = { time: Date.now(), text: '' };
                if (text === Module.setStatus.last.text) return;
                var m = text.match(/([^(]+)\((\d+(\.\d+)?)\/(\d+)\)/);
                var now = Date.now();
                if (m && now - Module.setStatus.last.time < 30) return;
                Module.setStatus.last.time = now;
                Module.setStatus.last.text = text;
                if (m) {
                    text = m[1];
                    progressCallback(false, parseInt(m[2]) * 100, parseInt(m[4]) * 100);
                    console.log("[_GSPS2PDF] Ghostscript progress:", parseInt(m[2]) * 100, "of", parseInt(m[4]) * 100);
                } else {
                    progressCallback(true, 0, 0);
                }
                statusUpdateCallback(text);
            },
            totalDependencies: 0
        };
        console.log("[_GSPS2PDF] Loading Ghostscript...");
        window.Module = Module;
        loadScript('../public/gs.js', null);
    };

    xhr.onerror = function (err) {
        console.error("[_GSPS2PDF] Failed to load psDataURL:", err);
        statusUpdateCallback('Error loading psDataURL');
    };

    xhr.send();
}

function loadScript(url, onLoadCallback) {
    const script = document.createElement('script');
    script.type = 'module';
    script.src = url;
    script.onload = onLoadCallback;
    document.body.appendChild(script);
}

function showProgress(...args) {
    console.log('Compression Progress:', ...args);
}

function showStatusUpdate(element) {
    console.log('Ghostscript Status Update:', element);
}
