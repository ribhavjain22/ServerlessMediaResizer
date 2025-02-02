import { COMPRESSION_LEVEL, COMPRESSION_SETTINGS } from '../models/ENUM/COMPRESSION_LEVEL';

export function buildGhostscriptArguments(options, fileSize) {
    const baseArgs = [
        '-sDEVICE=pdfwrite',
        '-dCompatibilityLevel=1.4',
        '-dNOPAUSE',
        '-dQUIET',
        '-dBATCH',
        '-dSAFER',
        '-dEmbedAllFonts=true',
        '-dSubsetFonts=true',
        '-dAutoRotatePages=/None',
        '-dDetectDuplicateImages=true',
        '-dCompressPages=true',
        '-sOutputFile=output.pdf'
    ];

    if (options.mode === 'custom' && options.targetSize) {
        return [...baseArgs, ...getCustomCompressionArgs(options.targetSize, fileSize)];
    }

    const settings = COMPRESSION_SETTINGS[options.level || COMPRESSION_LEVEL.MEDIUM];
    return [
        ...baseArgs,
        `-dColorImageResolution=${settings.imageResolution}`,
        `-dGrayImageResolution=${settings.imageResolution}`,
        `-dMonoImageResolution=${settings.imageResolution}`,
        '-dColorImageDownsampleType=/Bicubic',
        '-dGrayImageDownsampleType=/Bicubic',
        '-dMonoImageDownsampleType=/Bicubic',
        `-dColorImageDownsampleThreshold=${settings.colorImageQuality}`,
        `-dGrayImageDownsampleThreshold=${settings.grayscaleImageQuality}`,
        `-dMonoImageDownsampleThreshold=${settings.monoImageQuality}`,
        '-dColorConversionStrategy=/LeaveColorUnchanged',
        settings.compressPages ? '-dCompressPages=true' : '-dCompressPages=false',
        settings.compressFonts ? '-dCompressFonts=true' : '-dCompressFonts=false',
        settings.downsampleImages ? '-dDownsampleImages=true' : '-dDownsampleImages=false',
        '-dAutoFilterColorImages=false',
        '-dAutoFilterGrayImages=false',
        '-dColorImageFilter=/DCTEncode',
        '-dGrayImageFilter=/DCTEncode',
        '-dEncodeColorImages=true',
        '-dEncodeGrayImages=true',
        '-dEncodeMonoImages=true'
    ];
}

function getCustomCompressionArgs(targetSize, originalSize) {
    const compressionRatio = targetSize / originalSize;
    const baseResolution = Math.max(Math.round(300 * Math.sqrt(compressionRatio)), 72);
    const quality = Math.max(0.2, Math.min(1.0, compressionRatio));

    return [
        `-dColorImageResolution=${baseResolution}`,
        `-dGrayImageResolution=${baseResolution}`,
        `-dMonoImageResolution=${baseResolution}`,
        '-dColorImageDownsampleType=/Bicubic',
        '-dGrayImageDownsampleType=/Bicubic',
        '-dMonoImageDownsampleType=/Bicubic',
        `-dColorImageDownsampleThreshold=${quality}`,
        `-dGrayImageDownsampleThreshold=${quality}`,
        `-dMonoImageDownsampleThreshold=${quality}`,
        '-dCompressPages=true',
        '-dCompressFonts=true',
        '-dDownsampleImages=true'
    ];
} 