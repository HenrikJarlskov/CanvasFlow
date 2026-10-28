const https = require('https');
const fs = require('fs');
const path = require('path');

function fetch(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

function parseLibrary(xml) {
  const match = xml.match(/<mxlibrary>([\s\S]*?)<\/mxlibrary>/i);
  let content = match ? match[1].trim() : xml.trim();
  content = content.replace(/<!--[\s\S]*?-->/g, '');
  return JSON.parse(content);
}

function categorizeService(title, id) {
  const lower = (title + ' ' + id).toLowerCase();
  if (lower.includes('business ai') || lower.includes('machine learning') || lower.includes('document information') || lower.includes('extraction') || lower.includes('genai') || lower.includes('ai core') || lower.includes('ai platform')) {
    return 'Business AI';
  }
  if (lower.includes('integration') || lower.includes('api') || lower.includes('event') || lower.includes('connector') || lower.includes('messaging') || lower.includes('gateway') || lower.includes('cpi')) {
    return 'Integration Suite';
  }
  if (lower.includes('hana') || lower.includes('data') || lower.includes('analytics') || lower.includes('master data') || lower.includes('warehouse')) {
    return 'Data & Analytics';
  }
  if (lower.includes('identity') || lower.includes('security') || lower.includes('keystore') || lower.includes('credential') || lower.includes('authorization') || lower.includes('audit') || lower.includes('ias') || lower.includes('ips') || lower.includes('custom domain')) {
    return 'Security & Identity';
  }
  if (lower.includes('build') || lower.includes('work zone') || lower.includes('fiori') || lower.includes('portal') || lower.includes('mobile') || lower.includes('app') || lower.includes('forms') || lower.includes('workflow')) {
    return 'App Development & Automation';
  }
  return 'Foundation & Runtimes';
}

function categorizeGeneric(title, id) {
  const lower = (title + ' ' + id).toLowerCase();
  if (lower.startsWith('ai ') || lower.includes('ai agent') || lower.includes(' ai ') || lower.includes('machine learning')) {
    return 'Business AI';
  }
  if (lower.includes('user') || lower.includes('admin') || lower.includes('developer') || lower.includes('person') || lower.includes('actor') || lower.includes('auditor') || lower.includes('manager') || lower.includes('employee') || lower.includes('customer')) {
    return 'Architecture Actors';
  }
  if (lower.includes('database') || lower.includes('storage') || lower.includes('file') || lower.includes('server') || lower.includes('cloud') || lower.includes('device') || lower.includes('laptop') || lower.includes('mobile') || lower.includes('disk') || lower.includes('cluster')) {
    return 'Infrastructure & Storage';
  }
  if (lower.includes('network') || lower.includes('firewall') || lower.includes('router') || lower.includes('gateway') || lower.includes('internet') || lower.includes('vpn') || lower.includes('api') || lower.includes('adapter') || lower.includes('protocol')) {
    return 'Network & Connectivity';
  }
  return 'Generic Architecture';
}

async function main() {
  console.log('Fetching SAP BTP services and generic icons from GitHub...');
  const serviceXml = await fetch('https://raw.githubusercontent.com/SAP/btp-solution-diagrams/main/assets/shape-libraries-and-editable-presets/draw.io/20-02-99-sap-btp-service-icons-all/20-02-99-02-sap-btp-service-icons-all-size-M.xml');
  const genericXml = await fetch('https://raw.githubusercontent.com/SAP/btp-solution-diagrams/main/assets/shape-libraries-and-editable-presets/draw.io/20-03-generic-icons/sap-generic-icons-size-M-200302.xml');

  const services = parseLibrary(serviceXml);
  const generics = parseLibrary(genericXml);

  console.log('Retrieved ' + services.length + ' service icons and ' + generics.length + ' generic icons');

  const allIcons = [];

  // Parse Services
  for (const item of services) {
    const decodedXml = item.xml
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&amp;/g, '&');

    const valueMatch = decodedXml.match(/value="([^"]*)"/);
    const imageMatch = decodedXml.match(/image=([^;\"'>]+)/);

    let cleanTitle = valueMatch ? valueMatch[1].replace(/&#10;/g, ' ').replace(/\s+/g, ' ').trim() : item.title;
    if (!cleanTitle) cleanTitle = item.title;

    const dataUri = imageMatch ? imageMatch[1] : '';
    const category = categorizeService(cleanTitle, item.title);

    const tags = Array.from(new Set([
      ...cleanTitle.toLowerCase().split(/[\s\-_]+/),
      ...item.title.toLowerCase().split(/[\s\-_]+/),
      'sap', 'btp', category.toLowerCase(), 'service'
    ])).filter(t => t.length > 1 && !['size', 'sd', 'the', 'and', 'for', 'icon'].includes(t));

    allIcons.push({
      id: item.title,
      title: cleanTitle,
      category,
      iconType: 'service',
      description: 'Official SAP BTP service icon: ' + cleanTitle,
      dataUri,
      tags
    });
  }

  // Parse Generics
  for (const item of generics) {
    let cleanTitle = item.title.replace(/Size\s+[SML]/gi, '').replace(/Highlight/gi, '').replace(/[_\-]+/g, ' ').trim();
    if (!cleanTitle) cleanTitle = item.title;

    const category = categorizeGeneric(cleanTitle, item.title);
    const tags = Array.from(new Set([
      ...cleanTitle.toLowerCase().split(/[\s\-_]+/),
      ...item.title.toLowerCase().split(/[\s\-_]+/),
      'generic', 'architecture', category.toLowerCase()
    ])).filter(t => t.length > 1 && !['size', 'sd', 'the', 'and', 'for', 'icon'].includes(t));

    let dataUri = item.data;
    if (!dataUri && item.xml) {
      const decoded = item.xml
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&amp;/g, '&');
      const imgMatch = decoded.match(/image=([^;\"'>]+)/);
      if (imgMatch) {
        dataUri = imgMatch[1];
      }
    }

    allIcons.push({
      id: item.title,
      title: cleanTitle,
      category,
      iconType: 'generic',
      description: 'Official SAP generic architecture icon: ' + cleanTitle,
      dataUri: dataUri || '',
      tags
    });
  }

  console.log('Total combined icons: ' + allIcons.length);
  const outputPath = path.join(__dirname, '..', 'src', 'utils', 'sapIconsAll.json');
  fs.writeFileSync(outputPath, JSON.stringify(allIcons, null, 2));
  console.log('Saved icons to ' + outputPath);
}

main().catch(console.error);
