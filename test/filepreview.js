const chai = require('chai');
const expect = chai.expect;
const should = chai.should;
const path = require("path");

const filepreview = require('../filepreview');

describe("Test to create a thumbnail from docx file", () => {
    it("Should create a thumbnail fom a docx file", done => {
        const fileName = "example.docx";
        const filePath = path.resolve("test","documents", fileName);
        const options = {
            width: 300,
            height: 200,
            quality: 100,
            background: '#fff',
            pdf: true,
            pdf_path: path.resolve("test","pdfs")
        }
        const outPath = path.resolve ("test", "thumbnail", `${fileName.replace(/\.[^/.]+$/, "")}.png`);
        filepreview.generateAsync(filePath , outPath, options)
        .then( () => done() )
        .catch( error => done(error));
    });
});

describe("Test to create a thumbnail using sync methid", () => {
    it("Should create a thumbnail synchronously from a docx file", done => {
        const fileName = "example-sync.docx";
        const filePath = path.resolve("test","documents", fileName);
        const options = {
            width: 300,
            height: 200,
            quality: 100,
            background: '#fff',
            pdf: true,
            pdf_path: path.resolve("test","pdfs")
        }
        const outPath = path.resolve ("test", "thumbnail", `${fileName.replace(/\.[^/.]+$/, "")}-sync.png`);
        filepreview.generateSync(filePath , outPath, options)
        .then( () => done() )
        .catch( error => done(error));
    })
});

