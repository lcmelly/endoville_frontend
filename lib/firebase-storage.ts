"use client";

type UploadOptions = {
  folder: string;
  maxWidth: number;
  maxHeight: number;
  quality: number;
};

type UploadResult = {
  url: string;
  refPath: string;
};

const loadImage = (file: File) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });

const resizeImage = async (file: File, options: UploadOptions) => {
  const img = await loadImage(file);
  const scale = Math.min(
    options.maxWidth / img.width,
    options.maxHeight / img.height,
    1
  );
  const width = Math.round(img.width * scale);
  const height = Math.round(img.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Canvas not supported.");
  }
  ctx.drawImage(img, 0, 0, width, height);
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error("Failed to resize image."));
        }
      },
      "image/jpeg",
      options.quality
    );
  });
};

const blobToDataUrl = (blob: Blob) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });

export const uploadImageToFirebase = async (
  file: File,
  options: UploadOptions
): Promise<UploadResult> => {
  const resized = await resizeImage(file, options);
  const url = await blobToDataUrl(resized);
  const refPath = `${options.folder}/${Date.now()}-${file.name}`;
  return { url, refPath };
};

export const deleteImageFromFirebase = async (_refPath: string) => {
  // Placeholder for real Firebase deletion.
  return Promise.resolve();
};
