import { v2 as cloudinary } from 'cloudinary';
import { env } from './env.js';
import { ServiceUnavailableError } from '../utils/errors.js';

export function isCloudinaryConfigured(): boolean {
  return Boolean(
    env.CLOUDINARY_CLOUD_NAME &&
      env.CLOUDINARY_API_KEY &&
      env.CLOUDINARY_API_SECRET &&
      env.CLOUDINARY_CLOUD_NAME.trim() !== '' &&
      env.CLOUDINARY_API_KEY.trim() !== '' &&
      env.CLOUDINARY_API_SECRET.trim() !== ''
  );
}

if (isCloudinaryConfigured()) {
  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

export interface CloudinaryUploadResult {
  secureUrl: string;
  publicId: string;
}

export function uploadImageStream(
  buffer: Buffer,
  folder: string = 'talkora/posts'
): Promise<CloudinaryUploadResult> {
  if (!isCloudinaryConfigured()) {
    throw new ServiceUnavailableError(
      'Image upload service is currently unavailable. Cloudinary storage is not configured.'
    );
  }

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'image',
      },
      (error, result) => {
        if (error || !result) {
          reject(error || new Error('Cloudinary upload returned empty result'));
        } else {
          resolve({
            secureUrl: result.secure_url,
            publicId: result.public_id,
          });
        }
      }
    );
    uploadStream.end(buffer);
  });
}

export async function deleteImage(publicId: string): Promise<void> {
  if (!isCloudinaryConfigured()) {
    console.warn(`[Cloudinary] Cannot delete image "${publicId}": Cloudinary is not configured.`);
    return;
  }

  try {
    await cloudinary.uploader.destroy(publicId, {
      resource_type: 'image',
    });
  } catch (error) {
    console.error(
      'Failed to delete image from Cloudinary:',
      error instanceof Error ? error.message : error
    );
  }
}

export default cloudinary;
