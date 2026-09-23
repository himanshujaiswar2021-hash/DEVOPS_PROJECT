const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const browser = fs.existsSync(chromePath) ? chromePath : edgePath;

const inputHtml = path.resolve(__dirname, 'docs', 'Project_Execution_Steps_Report.html');
const outputPdf = path.resolve(__dirname, 'docs', 'Project_Execution_Steps_Report.pdf');

console.log('Using browser:', browser);
console.log('Input HTML:', inputHtml);
console.log('Output PDF:', outputPdf);

const cmd = `"${browser}" --headless --disable-gpu --no-pdf-header-footer --print-to-pdf="${outputPdf}" "file:///${inputHtml.replace(/\\/g, '/')}"`;

console.log('Executing command...');
try {
  execSync(cmd, { stdio: 'inherit' });
  console.log('PDF generated successfully!');
  if (fs.existsSync(outputPdf)) {
    const stats = fs.statSync(outputPdf);
    console.log(`Verified PDF exists! Size: ${stats.size} bytes`);
  } else {
    console.error('File does not exist after execution.');
  }
} catch (err) {
  console.error('Error generating PDF:', err.message);
}
