import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import multer from 'multer';
import { readFile, writeFile } from 'fs/promises';
import { PDFDocument } from 'pdf-lib';

const app = express();
const port = 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const upload = multer({ dest: 'uploads/' });

app.use(express.static('public'));

app.get('/', (req, res) => {
    res.sendFile(join(__dirname, "templates/index.html"));
});

app.post('/merge', upload.array('pdfs', 20), async (req, res) => {
    try {
        const files = req.files;
        const mergedPdf = await mergePDFs(files);
        const timestamp = Date.now(); // Get current timestamp
        const mergedFileName = `merged_${timestamp}.pdf`; // Add timestamp to file name
        const outputPath = join(__dirname, 'public', mergedFileName);
        const mergedPdfBytes = await mergedPdf.save();
        await writeFile(outputPath, mergedPdfBytes);
        res.redirect(`/${mergedFileName}`);
    } catch (error) {
        console.error('Error merging PDFs:', error);
        res.status(500).send('Internal Server Error');
    }
});

async function mergePDFs(files) {
    const mergedPdf = await PDFDocument.create();
    for (const file of files) {
        const pdfBytes = await readFile(file.path);
        const pdfDoc = await PDFDocument.load(pdfBytes);
        const pages = await mergedPdf.copyPages(pdfDoc, pdfDoc.getPageIndices());
        for (const page of pages) {
            mergedPdf.addPage(page);
        }
    }
    return mergedPdf;
}

app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});