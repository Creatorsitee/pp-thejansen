import express, { Request, Response } from "express";
import multer from "multer";
import axios from "axios";
import FormData from "form-data";

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

const termaiKey = 'AIzaBj7z2z3xBjsk';
const termaiDomain = 'https://c.termai.cc';

async function uploadToTermai(buffer: Buffer, filename: string = 'image.jpg') {
    const form = new FormData();
    form.append('file', buffer, { filename });
    
    const headers = form.getHeaders() as Record<string, string>;
    headers['User-Agent'] = 'Mozilla/5.0';

    const response = await axios.post(`${termaiDomain}/api/upload?key=${termaiKey}`, form, {
        headers,
        timeout: 60000
    });
    
    if (response.data?.status && response.data?.path) {
        let imageUrl = response.data.path as string;
        if (!imageUrl.startsWith('http')) {
            imageUrl = `${termaiDomain}${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`;
        }
        return imageUrl;
    }
    
    throw new Error('Termai upload failed. Response: ' + JSON.stringify(response.data));
}

app.use(express.json());

app.post("/api/maker/thejansen", upload.single("image"), async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.file) {
        res.status(400).json({ error: "No image file provided" });
        return;
      }

      console.log("Uploading file to Termai...", req.file.originalname);
      const uploadedUrl = await uploadToTermai(req.file.buffer, req.file.originalname);
      console.log("Uploaded successfully. URL:", uploadedUrl);

      const cukiUrl = `https://api.cuki.biz.id/api/maker/thejansen?apikey=cuki-x&image=${encodeURIComponent(uploadedUrl)}`;
      console.log("Fetching processed image from Cuki...");
      
      const cukiResponse = await axios.get(cukiUrl, {
          responseType: 'arraybuffer',
          timeout: 60000
      });

      const contentType = cukiResponse.headers['content-type'] || 'image/jpeg';
      res.setHeader('Content-Type', contentType as string);
      res.send(cukiResponse.data);

    } catch (error: any) {
      console.error("Error processing image:", error.message || error);
      res.status(500).json({ error: "Failed to process image.", details: error.message });
    }
});

// Vercel serverless function export
export const config = {
  api: {
    bodyParser: false,
  },
};

export default app;
