"use strict";
const crypto = require('crypto');
const fs = require('fs-extra');
const join = require('path').join;
const express = require('express');
const app = express();
const port = 3000;
const outputDir = __dirname+'\\output\\assets\\minecraft\\mcpatcher\\cit';
var jsonFiles = [];
var indexes = new Object();

// Set routes
app.get('/', (req, res) => {
  res.send('= Express Web App =');
});

// start and listen on the Express server
app.listen(port, async () => {
	console.log(`Express is running on http://localhost:${port}`);
	console.log(`Running directory: ${__dirname}`);
	getJsonFiles(__dirname+'/../assets/minecraft/mcpatcher');
    
	fs.mkdirSync(outputDir, { recursive: true });
	

	await jsonFiles.forEach(function(item, index){
		var hash = crypto.createHash('sha1');
		var full_dir = item.split('\\');
		var relativePath = "";
		var path = "";
		var file = "";
		for(var i=0;i<full_dir.length;i++){
			if(i == full_dir.length - 1){
				file = full_dir[i];
			}
			else{
				path += full_dir[i]+'\\';
				if(i >= 5) relativePath += full_dir[i]+'/';
			}
		}
		path = path.substring(0,path.length - 1);

		if(relativePath){
			relativePath = relativePath.substring(0,relativePath.length - 1);
			var buffer = fs.readFileSync(path+'\\'+file);
			hash.update(buffer);
			var sha1 = hash.digest('hex');

			indexes[relativePath+'/'+file] = {
				name: file.split('.')[0],
				type: file.split('.')[1],
				sha1: sha1,
				path: relativePath,
				realFile: path+'\\'+file
			}
		}
	});

	var total = Object.getOwnPropertyNames(indexes).length;
	var now = 0;
	for(var i in indexes){
		now++;

		var hash = indexes[i].sha1;
		var hash_prefix = hash.substring(0,2);
		var type = indexes[i].type;

		if(type == 'properties'){
			var content = fs.readFileSync(indexes[i].realFile,{encoding:'utf8', flag:'r'});
			var real_content = "";
			var sp_content = content.split('\n');
			for(var j = 0;j < sp_content.length;j++){
				var items = sp_content[j].split('=');

				var name = items[0];
				var values = items[1];

				if(!name) break;

				if(name.includes('texture')){
					var key = (values.includes('mcpatcher'))?values:indexes[i].path+'/'+values;
					var hash_name = indexes[key.trim()].sha1;
					var hash_name_prefix = hash_name.substring(0,2);

					var full_dir = 'assets/minecraft/mcpatcher/cit/'+hash_name_prefix+'/'+hash_name+'.png';
					values = full_dir;
				}

				real_content += name+'='+values+'\n';
			}
		}
		else{
			var content = fs.readFileSync(indexes[i].realFile);
			var real_content = content;
		}

		if(!fs.existsSync(outputDir+'\\'+hash_prefix))
			fs.mkdirSync(outputDir+'\\'+hash_prefix, { recursive: true });

		fs.writeFileSync(outputDir+'\\'+hash_prefix+'\\'+hash+'.'+type, real_content);

		let percent = Math.floor(now/total*100);
		console.log('Hashed Directory Structure: '+now+'/'+total,'('+percent+'%)');
	}



	console.warn('All done! Now exiting...');
	process.exit(0);
});

function getJsonFiles(jsonPath){
    function findJsonFile(path){
        let files = fs.readdirSync(path);
        files.forEach(function (item, index) {
				let fPath = join(path,item);
				let stat = fs.statSync(fPath);
				if(stat.isDirectory() === true) {
					findJsonFile(fPath);
				}
				if (stat.isFile() === true) { 
				  jsonFiles.push(fPath);
				}
        });
    }
    findJsonFile(jsonPath);
}