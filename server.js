// server.ts
import express from 'express';
import puppeteer from 'puppeteer';
import bodyParser from 'body-parser';

const app = express();
app.use(bodyParser.json({ limit: '1mb' }));

app.post('/generate', async (req, res) => {
  const { name, contact, summary, experience, education } = req.body;

  const html = `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <title>Resume</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600&display=swap" rel="stylesheet">
        <style>
          @page {
            margin: 2cm;
          }
          body {
            font-family: 'Inter', sans-serif;
          }
        </style>
      </head>
      <body class="text-gray-900 text-sm leading-relaxed">
        <div class="max-w-2xl mx-auto px-4">
          <h1 class="text-2xl font-bold mb-1">${name}</h1>
          <p class="mb-4">${contact.email} • ${contact.phone} • ${contact.location}</p>

          <h2 class="font-semibold text-lg mt-6 mb-2 border-b pb-1">SUMMARY</h2>
          <p class="mb-4">${summary}</p>

          <h2 class="font-semibold text-lg mt-6 mb-2 border-b pb-1">EXPERIENCE</h2>
          ${experience
            .map(
              (exp) => `
            <div class="mb-4">
              <p class="font-bold">${exp.company}</p>
              <p class="italic">${exp.jobTitle} • ${exp.years}${
                exp.location ? ` • ${exp.location}` : ""
              }</p>
              <ul class="list-disc list-outside pl-5 mt-1">
                ${exp.responsibilities
                  .map((point) => `<li>${point}</li>`)
                  .join("")}
              </ul>
            </div>
          `
            )
            .join("")}

          <h2 class="font-semibold text-lg mt-6 mb-2 border-b pb-1">EDUCATION</h2>
          ${education
            .map(
              (edu) => `
            <div class="mb-4">
              <p class="font-bold">${edu.school}</p>
              <p class="italic">${edu.degree} • ${edu.years}${
                edu.location ? ` • ${edu.location}` : ""
              }</p>
            </div>
          `
            )
            .join("")}
        </div>
      </body>
    </html>
  `;

  try {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    const pdf = await page.pdf({ format: 'A4', printBackground: true });
    await browser.close();

    res.set({ 'Content-Type': 'application/pdf', 'Content-Disposition': 'attachment; filename="resume.pdf"' });
    res.send(pdf);
  } catch (err) {
    console.error('PDF generation error:', err);
    res.status(500).json({ error: 'Failed to generate PDF' });
  }
});

app.get('/', (_, res) => res.send('Resume PDF generator is running.'));

const PORT = process.env.PORT || 4242;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
