import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import multer from "multer";
import axios from "axios";
import FormData from "form-data";

// Set up memory storage for Multer
const upload = multer({ storage: multer.memoryStorage() });

const termaiKey = 'AIzaBj7z2z3xBjsk';
const termaiDomain = 'https://c.termai.cc';

async function uploadToTermai(buffer: Buffer, filename: string = 'image.jpg') {
    const form = new FormData();
    form.append('file', buffer, { filename });
    
    // Convert headers safely
    const headers = form.getHeaders() as Record<string, string>;
    headers['User-Agent'] = 'Mozilla/5.0';

    const response = await axios.post(`${termaiDomain}/api/upload?key=${termaiKey}`, form, {
        headers,
        timeout: 60000
    });
    
    if (response.data?.status && response.data?.path) {
        let imageUrl = response.data.path as string;
        // Ensure it's a full URL
        if (!imageUrl.startsWith('http')) {
            imageUrl = `${termaiDomain}${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`;
        }
        return imageUrl;
    }
    
    throw new Error('Termai upload failed. Response: ' + JSON.stringify(response.data));
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Body parser for JSON
  app.use(express.json());

  // API Route for The Jansen filter
  app.post("/api/maker/thejansen", upload.single("image"), async (req, res) => {
    try {
      if (!req.file) {
        res.status(400).json({ error: "No image file provided" });
        return;
      }

      console.log("Uploading file to Termai...", req.file.originalname);
      const uploadedUrl = await uploadToTermai(req.file.buffer, req.file.originalname);
      console.log("Uploaded successfully. URL:", uploadedUrl);

      // Hit Cuki API with the uploaded URL
      const cukiUrl = `https://api.cuki.biz.id/api/maker/thejansen?apikey=cuki-x&image=${encodeURIComponent(uploadedUrl)}`;
      console.log("Fetching processed image from Cuki...");
      
      const cukiResponse = await axios.get(cukiUrl, {
          responseType: 'arraybuffer',
          timeout: 60000
      });

      // Send the image binary back to the client
      const contentType = cukiResponse.headers['content-type'] || 'image/jpeg';
      res.setHeader('Content-Type', contentType as string);
      res.send(cukiResponse.data);

    } catch (error: any) {
      console.error("Error processing image:", error.message || error);
      res.status(500).json({ error: "Failed to process image.", details: error.message });
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
    // Production static serving
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch(console.error);
