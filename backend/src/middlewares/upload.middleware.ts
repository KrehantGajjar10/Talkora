import multer from 'multer';
import { Request, Response, NextFunction } from 'express';
import { sendError } from '../utils/api-response.js';

export class UnsupportedMediaError extends Error {
  public readonly statusCode = 415;

  constructor(
    message: string = 'Invalid or unsupported image format. Allowed formats: JPEG, PNG, WebP'
  ) {
    super(message);
    this.name = 'UnsupportedMediaError';
  }
}

export function isValidImageSignature(
  buffer: Buffer
): 'image/jpeg' | 'image/png' | 'image/webp' | null {
  if (!buffer || buffer.length < 12) return null;

  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return 'image/jpeg';
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return 'image/png';
  }

  // WebP: RIFF (bytes 0-3) and WEBP (bytes 8-11)
  if (
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  ) {
    return 'image/webp';
  }

  return null;
}

const storage = multer.memoryStorage();

const multerUpload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB
    files: 1,
  },
  fileFilter: (_req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedMimes.includes(file.mimetype.toLowerCase())) {
      return cb(new UnsupportedMediaError());
    }
    cb(null, true);
  },
}).single('image');

export function uploadSingleImage(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  multerUpload(req, res, (err: unknown) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          sendError(res, 413, 'Image too large. Maximum size allowed is 5 MB', []);
          return;
        }
        sendError(res, 400, err.message, []);
        return;
      }
      if (err instanceof UnsupportedMediaError) {
        sendError(res, 415, err.message, []);
        return;
      }
      sendError(res, 400, err instanceof Error ? err.message : 'Upload failed', []);
      return;
    }

    if (req.file) {
      const detectedMime = isValidImageSignature(req.file.buffer);
      const declaredMime = req.file.mimetype.toLowerCase();
      const normalizedDeclared = declaredMime === 'image/jpg' ? 'image/jpeg' : declaredMime;

      if (!detectedMime || detectedMime !== normalizedDeclared) {
        sendError(
          res,
          415,
          'Invalid or spoofed image format. File signature does not match declared MIME type.',
          []
        );
        return;
      }
    }

    next();
  });
}

export function uploadOptionalImage(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (req.is('multipart/form-data')) {
    uploadSingleImage(req, res, next);
  } else {
    next();
  }
}
