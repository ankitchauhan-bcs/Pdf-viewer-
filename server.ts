import express from "express";
import { createServer as createViteServer } from "vite";
import multer from "multer";
import { PDFDocument, rgb } from "pdf-lib";
import path from "path";

const upload = multer({ storage: multer.memoryStorage() });

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.post("/api/pdf/merge", upload.array("files"), async (req, res) => {
    try {
      const files = req.files as Express.Multer.File[];
      if (!files || files.length < 2) {
        return res.status(400).json({ error: "Please provide at least two PDF files to merge." });
      }

      const mergedPdf = await PDFDocument.create();

      for (const file of files) {
        const pdf = await PDFDocument.load(file.buffer);
        const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
        copiedPages.forEach((page) => mergedPdf.addPage(page));
      }

      const mergedPdfBytes = await mergedPdf.save();
      
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", 'attachment; filename="merged.pdf"');
      res.send(Buffer.from(mergedPdfBytes));
    } catch (error) {
      console.error("Merge error:", error);
      res.status(500).json({ error: "Failed to merge PDFs." });
    }
  });

  app.post("/api/pdf/split", upload.single("file"), async (req, res) => {
    try {
      const file = req.file;
      const { ranges } = req.body; // e.g., "1-2, 4, 5-7"
      
      if (!file) {
        return res.status(400).json({ error: "Please provide a PDF file." });
      }

      const pdf = await PDFDocument.load(file.buffer);
      const totalPages = pdf.getPageCount();
      
      let pagesToExtract: number[] = [];
      
      if (ranges) {
        const parts = ranges.split(",");
        for (const part of parts) {
          const range = part.trim();
          if (range.includes("-")) {
            const [start, end] = range.split("-").map(Number);
            if (start > 0 && end <= totalPages && start <= end) {
              for (let i = start; i <= end; i++) {
                pagesToExtract.push(i - 1);
              }
            }
          } else {
            const pageNum = Number(range);
            if (pageNum > 0 && pageNum <= totalPages) {
              pagesToExtract.push(pageNum - 1);
            }
          }
        }
      } else {
        // If no ranges provided, extract all pages
        pagesToExtract = pdf.getPageIndices();
      }

      // Remove duplicates and sort
      pagesToExtract = [...new Set(pagesToExtract)].sort((a, b) => a - b);

      if (pagesToExtract.length === 0) {
        return res.status(400).json({ error: "Invalid page ranges provided." });
      }

      const newPdf = await PDFDocument.create();
      const copiedPages = await newPdf.copyPages(pdf, pagesToExtract);
      copiedPages.forEach((page) => newPdf.addPage(page));

      const newPdfBytes = await newPdf.save();
      
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", 'attachment; filename="split.pdf"');
      res.send(Buffer.from(newPdfBytes));
    } catch (error) {
      console.error("Split error:", error);
      res.status(500).json({ error: "Failed to split PDF." });
    }
  });

  app.post("/api/pdf/annotate", upload.single("file"), async (req, res) => {
    try {
      const file = req.file;
      const { text, page: pageNumStr, x: xStr, y: yStr, size: sizeStr } = req.body;
      
      if (!file) {
        return res.status(400).json({ error: "Please provide a PDF file." });
      }
      if (!text) {
        return res.status(400).json({ error: "Please provide text to annotate." });
      }

      const pdf = await PDFDocument.load(file.buffer);
      const pageNum = Number(pageNumStr) || 1;
      
      if (pageNum < 1 || pageNum > pdf.getPageCount()) {
        return res.status(400).json({ error: "Invalid page number." });
      }

      const page = pdf.getPage(pageNum - 1);
      const { width, height } = page.getSize();
      
      const x = Number(xStr) || 50;
      const y = Number(yStr) || height - 50;
      const size = Number(sizeStr) || 24;

      page.drawText(text, {
        x,
        y,
        size,
        color: rgb(1, 0, 0), // Red color for annotation
      });

      const annotatedPdfBytes = await pdf.save();
      
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", 'attachment; filename="annotated.pdf"');
      res.send(Buffer.from(annotatedPdfBytes));
    } catch (error) {
      console.error("Annotate error:", error);
      res.status(500).json({ error: "Failed to annotate PDF." });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
