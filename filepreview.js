/*

  filepreview : A file preview generator for node.js
  @todo: add synchronous function es6 compatible using async / await.
  @todo: make a standalone function for images with more custom options.
  @todo: make default options available
  @todo:

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
  generateAsync: (input_original, output, options = {}) => new Promise((resolve, reject) => {

    let input = input_original;
    if (!fs.existsSync(input)) reject({error: "file doesnot exist please make sure you are using the right path"});

    // Check for supported output format
    let extOutput = path.extname(output).toLowerCase().replace('.', '');
    let extInput = path.extname(input).toLowerCase().replace('.', '');
    let fileNameOrignal = path.basename(input, '.' + extInput);

    if ( extOutput != 'gif' && extOutput != 'jpg' && extOutput != 'png' ) {
      reject({error: "extension not supported, use png, gif, jpg"});
    }

    let execFileOptions = ["cwd", "env", "timeout", "uid", "gid"].reduce((acc, val) => {
      return (val in options) ? Object.assign(acc, { [val]: options[val] }) : acc;
    }, {});

    let fileType = 'other';

    root:
      for (let index in mimedb) {
        if ('extensions' in mimedb[index]) {
          for (let indexExt in mimedb[index].extensions) {
            if (mimedb[index].extensions[indexExt] == extInput) {
              if (index.split('/')[0] == 'image') {
                fileType = 'image';
              } else if (index.split('/')[0] == 'video') {
                fileType = 'video';
              } else {
                fileType = 'other';
              }
              break root;
            }
          }
        }
      }

    if (extInput == 'pdf') {
      fileType = 'image';
    }

    fs.lstat(input, function (error, stats) {
      if (error) reject(error);
      if (!stats.isFile()) {
        reject({error: "Not a valid file."});
      } else {
        if (fileType == 'video') {
          let ffmpegArgs = ['-y', '-i', input, '-vf', 'thumbnail', '-frames:v', '1', output];
          if (options.width > 0 && options.height > 0) {
            ffmpegArgs.splice(4, 1, 'thumbnail,scale=' + options.width + ':' + options.height);
          }
          child_process.execFile('ffmpeg', ffmpegArgs, execFileOptions, function (error) {
            if (error) reject(error);
            resolve({thumbnail: output});
          });
        }

        if (fileType == 'image') {
          let convertArgs = [input + '[0]', output];
          if (options.width > 0 && options.height > 0) {
            if(options.keepAspect) {
              convertArgs.splice(0, 0, '-resize', options.width + 'x' + options.height );
            } else {
              convertArgs.splice(0, 0, '-resize', options.width + 'x' + options.height + '!');
            }
          } else if (options.height > 0) {
            convertArgs.splice(0, 0, '-resize', 'x' + options.height);
          } else if (options.width > 0) {
            convertArgs.splice(0, 0, '-resize', options.width);
          }
          if (options.quality) {
            convertArgs.splice(0, 0, '-quality', options.quality);
          }
          if (options.background) {
            convertArgs.splice(0, 0, '-background', options.background);
            convertArgs.splice(0, 0, '-flatten');
          }
          child_process.execFile('convert', convertArgs, execFileOptions, function (error) {
            if (error) reject(error);
            resolve({thumbnail: output});
          });
        }

        if (fileType == 'other') {

          let tempPDF = path.join(options.pdf_path, fileNameOrignal + '.pdf');

          child_process.execFile('unoconv', ['-e', 'PageRange=1', '-o', tempPDF, input], execFileOptions, function (error) {
            if (error) reject(error);
            let convertOtherArgs = [tempPDF + '[0]', output];
            if (options.width > 0 && options.height > 0) {
              if(options.keepAspect) {
                convertOtherArgs.splice(0, 0, '-resize', options.width + 'x' + options.height );
              } else {
                convertOtherArgs.splice(0, 0, '-resize', options.width + 'x' + options.height + '!');
              }
            } else if (options.height > 0) {
              convertOtherArgs.splice(0, 0, '-resize', 'x' + options.height);
            } else if (options.width > 0) {
              convertOtherArgs.splice(0, 0, '-resize', options.width);
            }
            if (options.quality) {
              convertOtherArgs.splice(0, 0, '-quality', options.quality);
            }
            if (options.background) {
              convertOtherArgs.splice(0, 0, '-background', options.background);
              convertOtherArgs.splice(0, 0, '-flatten');
            }
            child_process.execFile('convert', convertOtherArgs, execFileOptions, function (error) {
              if (error) reject(error);
              if (!options.pdf || options.pdf == undefined) {
                fs.unlink(tempPDF, function (error) {
                  if (error) reject(error);
                  resolve({thumbnail: output});
                });
              } else {
                resolve({thumbnail: output, pdf: tempPDF});
              }
            });
          });
        }
      }
    });
  }),

  /**
   * Synchronous function for generating thumbnail
   */
  generateSync: (input_original, output, options = {}) => new Promise((resolve, reject) => {

    let input = input_original;
    if (!fs.existsSync(input)) reject({error: "file doesnot exist please make sure you are using the right path"});
    // Check for supported output format
    let extOutput = path.extname(output).toLowerCase().replace('.', '');
    let extInput = path.extname(input).toLowerCase().replace('.', '');
    let fileNameOrignal = path.basename(input, '.' + extInput);

    if ( extOutput != 'gif' && extOutput != 'jpg' && extOutput != 'png' ) {
      reject({error: "extension not supported, use png, gif, jpg"});
    }

    let fileType = 'other';

    root:
      for (let index in mimedb) {
        if ('extensions' in mimedb[index]) {
          for (let indexExt in mimedb[index].extensions) {
            if (mimedb[index].extensions[indexExt] == extInput) {
              if (index.split('/')[0] == 'image') {
                fileType = 'image';
              } else if (index.split('/')[0] == 'video') {
                fileType = 'video';
              } else {
                fileType = 'other';
              }
              break root;
            }
          }
        }
      }

    if (extInput == 'pdf') {
      fileType = 'image';
    }

    try {
      stats = fs.lstatSync(input);

      if (!stats.isFile()) {
        reject(false);
      }
    } catch (e) {
      reject(false);
    }

    if (fileType == 'video') {
      try {
        let ffmpegArgs = ['-y', '-i', input, '-vf', 'thumbnail', '-frames:v', '1', output];
        if (options.width > 0 && options.height > 0) {
          ffmpegArgs.splice(4, 1, 'thumbnail,scale=' + options.width + ':' + options.height)
        }
        child_process.execFileSync('ffmpeg', ffmpegArgs);
        resolve({thumbnail: output});
      } catch (e) {
        reject(e);
      }
    }

    if (fileType == 'image') {
      try {
        let convertArgs = [input + '[0]', output];
        if (options.width > 0 && options.height > 0) {
          if(options.keepAspect) {
            convertArgs.splice(0, 0, '-resize', options.width + 'x' + options.height);
          } else {
            convertArgs.splice(0, 0, '-resize', options.width + 'x' + options.height + '!');
          }
        } else if (options.height > 0) {
          convertArgs.splice(0, 0, '-resize', 'x' + options.height);
        } else if (options.width > 0) {
          convertArgs.splice(0, 0, '-resize', options.width);
        }
        if (options.quality) {
          convertArgs.splice(0, 0, '-quality', options.quality);
        }
        child_process.execFileSync('convert', convertArgs);
        resolve({thumbnail: output});
      } catch (e) {
        reject(e);
      }
    }

    if (fileType == 'other') {
      try {
        let tempPDF = path.join(options.pdf_path, fileNameOrignal + '.pdf');

        child_process.execFileSync('unoconv', ['-e', 'PageRange=1', '-o', tempPDF, input]);

        let convertOtherArgs = [tempPDF + '[0]', output];
        if (options.width > 0 && options.height > 0) {
          if(options.keepAspect) {
            convertOtherArgs.splice(0, 0, '-resize', options.width + 'x' + options.height );
          } else {
            convertOtherArgs.splice(0, 0, '-resize', options.width + 'x' + options.height + '!');
          }
        } else if (options.height > 0) {
          convertOtherArgs.splice(0, 0, '-resize', 'x' + options.height);
        } else if (options.width > 0) {
          convertOtherArgs.splice(0, 0, '-resize', options.width);
        }
        if (options.quality) {
          convertOtherArgs.splice(0, 0, '-quality', options.quality);
        }
        if (options.background) {
          convertOtherArgs.splice(0, 0, '-background', options.background);
          convertOtherArgs.splice(0, 0, '-flatten');
        }
        child_process.execFileSync('convert', convertOtherArgs);

        if (!options.pdf || options.pdf == undefined) {
          try {
            fs.unlinkSync(tempPDF);
            resolve({thumbnail: output});
          } catch (e) {
            reject(e);
          }
        }
        resolve({thumbnail: output, pdf: tempPDF});
      } catch (e) {
        reject(e);
      }
    }
  })

};
