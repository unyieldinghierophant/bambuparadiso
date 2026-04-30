const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');
html = html.replace(/<a href="#" class="nav-logo"><img src="data:image\/png;base64,[^"]+" alt="Bambu Paradiso Logo"><\/a>/, '<a href="#" class="nav-logo"><img src="./images/logo.png" alt="Bambu Paradiso Logo"></a>');
fs.writeFileSync('index.html', html);
console.log('Replaced base64 logo with image path.');
