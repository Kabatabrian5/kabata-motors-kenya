import { put } from '@vercel/blob';

const MAX_DATA_URL_LENGTH = 2_500_000;

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Please use the image upload form.' });
  }

  if (!process.env.KABATA_ADMIN_PIN || request.headers['x-admin-pin'] !== process.env.KABATA_ADMIN_PIN) {
    return response.status(401).json({ error: 'Please enter the correct admin PIN before uploading images.' });
  }

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return response.status(503).json({ error: 'Image storage is not configured yet. Please contact the site administrator.' });
  }

  try {
    const { dataUrl } = request.body || {};
    if (typeof dataUrl !== 'string' || !dataUrl.startsWith('data:image/')) {
      return response.status(400).json({ error: 'Please choose a valid image file.' });
    }
    if (dataUrl.length > MAX_DATA_URL_LENGTH) {
      return response.status(413).json({ error: 'This image is too large. Please choose a smaller photo.' });
    }

    const match = dataUrl.match(/^data:(image\/[a-z0-9.+-]+);base64,(.+)$/i);
    if (!match) return response.status(400).json({ error: 'This image format could not be read. Please choose a JPG, PNG, or WebP photo.' });

    const imageBuffer = Buffer.from(match[2], 'base64');
    const blob = await put(`cars/${Date.now()}-${crypto.randomUUID()}.jpg`, imageBuffer, {
      access: 'public',
      addRandomSuffix: false,
      contentType: 'image/jpeg',
    });

    return response.status(200).json({ url: blob.url });
  } catch (error) {
    console.error('Kabata image upload failed', error);
    return response.status(500).json({ error: 'We could not upload this image. Please try again.' });
  }
}
