import fs from 'fs';
import path from 'path';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

async function generateSamples() {
  const sampleDir = './sample-data';
  if (!fs.existsSync(sampleDir)) {
    fs.mkdirSync(sampleDir, { recursive: true });
  }

  const pdfDoc = await PDFDocument.create();
  const timesRomanFont = await pdfDoc.embedFont(StandardFonts.Helvetica);

  const page = pdfDoc.addPage([600, 400]);
  const { height } = page.getSize();

  page.drawText('DocuMind Enterprise Cloud Architecture Proposal', {
    x: 50,
    y: height - 50,
    size: 16,
    font: timesRomanFont,
    color: rgb(0, 0, 0),
  });

  page.drawText('Executive Summary: Cloud infrastructure modernization project for Enterprise SaaS Platform.', {
    x: 50,
    y: height - 90,
    size: 11,
    font: timesRomanFont,
    color: rgb(0.2, 0.2, 0.2),
  });

  page.drawText('Key Objectives: Reduce latency by 45% using microservices architecture.', {
    x: 50,
    y: height - 120,
    size: 11,
    font: timesRomanFont,
    color: rgb(0.2, 0.2, 0.2),
  });

  page.drawText('Requirements: All APIs must maintain 99.99% availability with $150,000 budget.', {
    x: 50,
    y: height - 150,
    size: 11,
    font: timesRomanFont,
    color: rgb(0.2, 0.2, 0.2),
  });

  const pdfBytes = await pdfDoc.save({ useObjectStreams: false });
  fs.writeFileSync(path.join(sampleDir, 'sample_proposal.pdf'), pdfBytes);
  console.log('Sample PDF generated cleanly using pdf-lib at sample-data/sample_proposal.pdf');
}

generateSamples();
