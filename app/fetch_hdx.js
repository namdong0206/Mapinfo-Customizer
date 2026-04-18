const fetch = require('node-fetch');

async function run() {
  const r = await fetch('https://data.humdata.org/api/3/action/package_show?id=cod-ab-vnm');
  const d = await r.json();
  console.log(JSON.stringify(d.result.resources.map(res=>({name: res.name, format: res.format, url: res.url})), null, 2));
}

run();
