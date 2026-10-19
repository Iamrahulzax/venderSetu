import { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Upload directory path
const uploadDir = path.resolve(__dirname, '../../public/uploads');

// Ensure upload directory exists
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer disk storage configuration
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const cleanBase = path
      .basename(file.originalname, ext)
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .slice(0, 30);
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
    cb(null, `${cleanBase}-${uniqueSuffix}${ext}`);
  }
});

// Strict whitelist of permitted MIME types and their matching extensions
const ALLOWED_MIME_EXTENSIONS: Record<string, string[]> = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/webp': ['.webp'],
  'image/avif': ['.avif'],
  'image/gif': ['.gif'],
  'application/pdf': ['.pdf']
};

// File filter: strict cross-validation of MIME type and extension
const fileFilter = (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const mime = file.mimetype.toLowerCase();
  const ext = path.extname(file.originalname).toLowerCase();

  const allowedExts = ALLOWED_MIME_EXTENSIONS[mime];
  if (!allowedExts || !allowedExts.includes(ext)) {
    cb(new Error(`Security Error: Disallowed or mismatched file format (${ext} / ${mime}). Only standard JPG, PNG, WebP, AVIF, GIF, and PDF files are allowed.`));
    return;
  }

  // Prevent dangerous double extensions (e.g. payload.php.png or bad.html.pdf)
  const baseName = path.basename(file.originalname, ext);
  if (/\.(php|phtml|html|htm|shtml|js|jsx|ts|tsx|exe|bat|cmd|sh|py|pl|cgi|jar|war|svg|xml)$/i.test(baseName)) {
    cb(new Error('Security Error: Malicious multi-extension file detected.'));
    return;
  }

  cb(null, true);
};

export const uploadMiddleware = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Handler for single file upload
export const handleSingleUpload = (req: Request, res: Response): void => {
  try {
    if (!req.file) {
      res.status(400).json({ success: false, message: 'No file uploaded.' });
      return;
    }

    const file = req.file;
    const isPdf = file.mimetype === 'application/pdf';
    const relativeUrl = `/uploads/${file.filename}`;

    res.json({
      success: true,
      message: 'File uploaded successfully',
      file: {
        url: relativeUrl,
        filename: file.filename,
        originalName: file.originalname,
        size: file.size,
        mimetype: file.mimetype,
        fileType: isPdf ? 'pdf' : 'image'
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Handler for multiple file uploads
export const handleMultipleUpload = (req: Request, res: Response): void => {
  try {
    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      res.status(400).json({ success: false, message: 'No files uploaded.' });
      return;
    }

    const uploaded = files.map((file) => ({
      url: `/uploads/${file.filename}`,
      filename: file.filename,
      originalName: file.originalname,
      size: file.size,
      mimetype: file.mimetype,
      fileType: file.mimetype === 'application/pdf' ? 'pdf' : 'image'
    }));

    res.json({
      success: true,
      message: `${uploaded.length} files uploaded successfully`,
      files: uploaded
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
