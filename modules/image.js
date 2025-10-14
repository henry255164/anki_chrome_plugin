// modules/image.js

/**
 * Fetches an image from a URL, resizes it to a max dimension,
 * and returns it as a Base64-encoded JPEG string.
 * @param {string} imageUrl The URL of the image to process.
 * @returns {Promise<string>} A promise that resolves to the Base64 string (without data URL prefix).
 */
export async function processImage(imageUrl) {
  const MAX_SIZE = 1024;
  const image = new Image();
  image.crossOrigin = "anonymous"; // Handle CORS for images from other domains
  image.src = imageUrl;

  try {
    await image.decode();
  } catch (error) {
    console.error("Failed to decode image. It might be a cross-origin issue or an invalid image.", error);
    throw new Error("Could not process the image. Check browser console for details.");
  }

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  let { width, height } = image;
  if (width > height) {
    if (width > MAX_SIZE) {
      height = Math.round((height * MAX_SIZE) / width);
      width = MAX_SIZE;
    }
  } else {
    if (height > MAX_SIZE) {
      width = Math.round((width * MAX_SIZE) / height);
      height = MAX_SIZE;
    }
  }

  canvas.width = width;
  canvas.height = height;
  ctx.drawImage(image, 0, 0, width, height);

  // Return Base64 string (without data URL prefix)
  return canvas.toDataURL('image/jpeg', 0.9).split(',')[1];
}
