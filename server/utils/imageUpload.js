import cloudinary from "./cloudinary.js";

export const uploadImagesToCloudinary = async (files) => {
  if (!files || files.length === 0) return [];
  console.log("Uploading images to Cloudinary...");

  const uploads = await Promise.all(
    files.map((file) =>
      new Promise((resolve, reject) => {
        cloudinary.uploader
          .upload_stream({ folder: "products" }, (error, result) => {
            if (error) return reject(error);
            resolve({
              url: result.secure_url,
              publicId: result.public_id,
            });
          })
          .end(file.buffer);
      })
    )
  );

  return uploads;
};