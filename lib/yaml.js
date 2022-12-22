const yaml = require('js-yaml');
const fs   = require('fs');

// Get document, or throw exception on error

exports.parser = function(filename = null){
    try {
        const doc = yaml.load(fs.readFileSync(filename, 'utf8'));
        return doc;
    } catch (e) {
        console.log(e);
    }    
}


