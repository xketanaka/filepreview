/*

  filepreview : A file preview generator for node.js
  @todo: add synchronous function es6 compatible using async / await.
  @todo: make a standalone function for images with more custom options. 
  @todo: make default options available

*/

const child_process = require('child_process');
const path = require('path');
const fs = require('fs');
const mimedb = require('./db.json');

module.exports = {
  /**
   * Used promise for creating thumbnail from documents file.
   * Creates a pdf from any document using command line tool unoconv.
   * Creates a thumbnail from the pdf generated using imagemagic command line tool convert. 
   */
  generateAsync: (input_original, output, options = {}) => new Promise( (resolve, reject) => {
    
    let input = input_original;

    // Check for supported output format
    let extOutput = path.extname(output).toLowerCase().replace('.','');
    let extInput = path.extname(input).toLowerCase().replace('.','');
    let fileNameOrignal = path.basename(input, '.' + extInput);

    if (
      extOutput != 'gif' &&
      extOutput != 'jpg' &&
      extOutput != 'png'
    ) {
      resolve();
    }

    let fileType = 'other';

    root:
    for ( let index in mimedb ) {
      if ( 'extensions' in mimedb[index] ) {
        for ( let indexExt in mimedb[index].extensions ) {
          if ( mimedb[index].extensions[indexExt] == extInput ) {
            if ( index.split('/')[0] == 'image' ) {
              fileType = 'image';
            } else if ( index.split('/')[0] == 'video' ) {
              fileType = 'video';
            } else {
              fileType = 'other';
            }

            break root;
          }
        }
      }
    }

    if ( extInput == 'pdf' ) {
      fileType = 'image';
    }

    fs.lstat(input, function(error, stats) {
      if (error) reject(error);
      if (!stats.isFile()) {
        resolve();
      } else {
        if ( fileType == 'video' ) {
          let ffmpegArgs = ['-y', '-i', input, '-vf', 'thumbnail', '-frames:v', '1', output];
          if (options.width > 0 && options.height > 0) {
            ffmpegArgs.splice(4, 1, 'thumbnail,scale=' + options.width + ':' + options.height);
          }
          child_process.execFile('ffmpeg', ffmpegArgs, function(error) {
            if (error) reject(error);
            resolve();
          });
        }

        if ( fileType == 'image' ) {
          let convertArgs = [input + '[0]', output];
          if (options.width > 0 && options.height > 0) {
            convertArgs.splice(0, 0, '-resize', options.width + 'x' + options.height);
          }
          if (options.quality) {
            convertArgs.splice(0, 0, '-quality', options.quality);
          }
	  if (options.background) { 
              convertArgs.splice(0, 0, '-background', options.background);
              convertArgs.splice(0, 0, '-flatten');
          }
          child_process.execFile('convert', convertArgs, function(error) {
            if (input_original.indexOf("http://") == 0 || input_original.indexOf("https://") == 0) {
              fs.unlinkSync(input);
            }
            if (error) reject(error);
            resolve();
          });
        }

        if ( fileType == 'other' ) {

          let tempPDF = path.join(options.pdf_path, fileNameOrignal + '.pdf');

          child_process.execFile('unoconv', ['-e', 'PageRange=1', '-o', tempPDF, input], function(error) {
            if (error) reject(error);
            let convertOtherArgs = [tempPDF + '[0]', output];
            if (options.width > 0 && options.height > 0) {
              convertOtherArgs.splice(0, 0, '-resize', options.width + 'x' + options.height);
            }
            if (options.quality) {
              convertOtherArgs.splice(0, 0, '-quality', options.quality);
            }
            if (options.background) { 
              convertOtherArgs.splice(0, 0, '-background', options.background);
              convertOtherArgs.splice(0, 0, '-flatten');
            }
            child_process.execFile('convert', convertOtherArgs, function(error) {
              if (error) reject(error);
              if(!options.pdf || options.pdf == undefined) {
                fs.unlink(tempPDF, function(error) {
                  if (error) reject(error);
                  resolve();
                });
              } else {
                resolve();
              }
            });
          });
        }
      }
    });
  })
};
