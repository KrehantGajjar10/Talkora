import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export interface CloudinaryUploadResult {
  secureUrl: string;
  publicId: string;
}

export function uploadImageStream(
  buffer: Buffer,
  folder: string = 'talkora/posts'
): Promise<CloudinaryUploadResult> {
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
