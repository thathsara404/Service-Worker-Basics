const https = require('https');
const fs = require('fs');
var path = require('path');

const port = 3000;
const hostName = '127.0.0.1';

const options = {
  key: fs.readFileSync('./cert.key'),
  cert: fs.readFileSync('./cert.pem')
};

// This will generate a JS file with a randome number each time server starts.
(function(number) {
    fs.writeFileSync('./_js/change.js', `document.querySelector('h2').innerText = 'Server Version: ' + ${number}`, err => {
        if (err) {
            console.log("Error in generating a new JS file");
        }
    });
}(Math.random()));

// Prepare file path to serve the content
const preparePath = (url) => {
    let filePath = '.' + url;
    if (filePath == './') {
        filePath = './index.html';
    }
    return filePath;
}

// API Mappings
const API = {
    GET: {
        getStudents: () => {
            return [{id: 1, name: 'saman', adddress: 'galle', gender: 'male'},
                    {id: 1, name: 'gayan', adddress: 'galle', gender: 'male'}];
        }
    },
    POST: {
        registerStudent: () => {

        }
    }
}

// Generate the API call result
const hanleAPIResult = (path, method) => {
    let pathItems = path.split('/');
    pathItems.splice(pathItems.indexOf('.'), 1); // remove first dot in the file path items array
    const calleeMethod = pathItems[1];
    console.log('Requested API route: ', calleeMethod);
    console.log('HTTP Method: ', method);
    if (API.hasOwnProperty(method) && API[method].hasOwnProperty(calleeMethod)) {
        return JSON.stringify(API[method][calleeMethod]());
    }
    return null;
}

// Get the mime type form the file extention
const getMimeType = (filePath) => {
    const extname = String(path.extname(filePath)).toLowerCase();
    const mimeTypes = {
        '.html': 'text/html',
        '.js': 'text/javascript',
        '.css': 'text/css',
        '.json': 'application/json',
        '.png': 'image/png',
        '.jpg': 'image/jpg',
        '.gif': 'image/gif',
        '.svg': 'image/svg+xml',
        '.wav': 'audio/wav',
        '.mp4': 'video/mp4'
    };
    return mimeTypes[extname] || 'application/octet-stream';
}

// Initiate HTTPS Server
https.createServer(options, function (req, res) {
    
    const filePath = preparePath(req.url);

    // API handling switch
    if (filePath.includes('/api/')) {
        console.log('Generating API result');
        const result = hanleAPIResult(filePath, req.method);
        if (result) {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({data: result}));
        } else {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({error: 'Internal Server Error'}));
        }
    }

    const contentType = getMimeType(filePath);
    fs.readFile(filePath, function(error, content) {
        if (error) {
            if(error.code == 'ENOENT') {
                fs.readFile('./404.html', function(error, content) {
                    res.writeHead(404, { 'Content-Type': 'text/html' });
                    res.end(content, 'utf-8');
                });
            }
            else {
                res.writeHead(500);
                res.end('Sorry, check with the site admin for error: '+error.code+' ..\n');
            }
        }
        else {
            console.log('file path', filePath);
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
        }
    });
}).listen(port, hostName, () => {
    console.log(`server is running https://${hostName}:${port}`);
});