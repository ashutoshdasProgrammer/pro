const express = require('express');
// const multer = require('multer');
const path = require('path');
const userModel = require('./models/userModel');
const expressLayout = require('express-ejs-layouts');
const upload = require('./public/js/multer_setup');
const mongoooseConnection = require('./config/mongoose');
const fs = require('fs');
const {extractSkillsFromPdf} = require('./public/js/extractSkills');
const pdf = require('pdf-parse');
const s = require('./public/js/skillGemini');

const app = express();

// parsers
app.use(express.json());
app.use(expressLayout);
app.use(express.urlencoded({extended: true}));
app.use(express.static(path.join(__dirname, 'public')));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

const port = 3000;
mongoooseConnection.connect()
.then(() => {
    app.listen(port, function(){
        console.log(`Server running on port ${port}`);
    });
})
.catch(err => {
    console.error('Database connection failed', err);
    process.exit(1);
});

app.get('/', async function(req, res){
    try{
        const files = await userModel.find({});
        res.render('index', {files});
    }
    catch(err){
        console.error(err);
        res.status(500).send('Error loading files');
    }
});

// upload.single -> it takes a single file from the uplaod 
// upload -> it is the variable name above (therefore uplaod.single(<name from inoput in index.ejs file>));

app.post('/upload', upload.single('pdfFile'), async function(req, res){
    try {
        if (!req.file) {
            return res.status(400).send('No file uploaded in app.js');
        }
        
        // Check file size (MongoDB has 16MB document limit)
        if (req.file.size > 15000000) { // ~15MB
            return res.status(400).send('File too large (max 15MB)');
        }

        const newFile = new userModel({
            filename: req.file.originalname,
            data: req.file.buffer,
            contentType: req.file.mimetype
        });
        await newFile.save();
        res.redirect('/');
    } catch(err) {
        console.error(err);
        res.status(500).send('Error uploading file');
    }
});

// to delete the file in the database
app.post('/delete/:id', async function(req, res){
    try{
        const fileId = req.params.id;
        const deletedFile = await userModel.findByIdAndDelete(fileId);
        if(!deletedFile){
            return res.status(404).send('File not found');
        }
        res.redirect('/');
    }
    catch(err){
        console.error(err);
        res.status(500).send('Error deleting file');
    }
});

// to extract the skills section from the pdf
app.post('/extract/:id', async function(req, res) {
    try{
        const fileId = req.params.id;
        const file = await userModel.findById(fileId);
        if(!file){
            return res.status(404).send('File not found');
        }

        // check if the file data exist and is valid
        if(!file.data || file.data.length === 0){
            console.log(file.data);
            return res.status(400).send('Invalid file data in app.js');
        }
        // Extract skills from PDF
        // convert the buffer into Uint8Array
        const pdfData = new Uint8Array(file.data);
        // file.data is the binary data of the pdf that was stored in the database
        const skills = await extractSkillsFromPdf(pdfData);
        res.render('skills', {skills});
    }
    catch(err){
        console.error(err);
        res.status(500).send('Error extracting skills in app.js');
    }
});

app.post('/sendtoGemini', async function(req, res) {
    try{
        if(!req.body.skills){
            return res.status(400).send('skills not found in the requst');
        }
        const skills = req.body.skills; // get the skills value
        const geminiskill = await s.sendSkillsToGemini(skills);
        // res.send(geminiskill);
        res.render('gemini', {geminiskill});
    }catch(err){
        console.error(err);
        res.status(500).send('Error sending to Gemini');
    }
});