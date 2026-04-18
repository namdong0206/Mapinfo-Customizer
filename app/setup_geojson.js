const fetch = require('node-fetch');
const unzipper = require('unzipper');
const fs = require('fs');

async function run() {
  if (!fs.existsSync('./public')) {
    fs.mkdirSync('./public');
  }

  const url = 'https://data.humdata.org/dataset/3cb544a9-9d04-4f54-94e2-93230efd8ceb/resource/048a6012-a8c2-4fa9-be87-cb6c01e9afbf/download/vnm_admin_boundaries.geojson.zip';
  console.log('Fetching', url);
  const response = await fetch(url);
  
  const directory = await unzipper.Open.buffer(await response.buffer());
  const file = directory.files.find(d => d.path === 'vnm_admin1.geojson');
  
  if (file) {
    const content = await file.buffer();
    fs.writeFileSync('./public/vnm_admin1.geojson', content);
    console.log('Saved to public/vnm_admin1.geojson');
  } else {
    console.log('File not found inside ZIP');
  }
}

run();
