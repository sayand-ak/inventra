import imageCompression from 'browser-image-compression';

const OPTIONS = {
  maxSizeMB: 1000,
  maxWidthOrHeight: 800,
  useWebWorker: true,
};

async function compressImageUrl(url: string): Promise<string> {
  try {
    const res = await fetch(url, { mode: 'cors' });
    const blob = await res.blob();
    const file = new File([blob], 'image.jpg', { type: blob.type });
    const compressed = await imageCompression(file, OPTIONS);
    return URL.createObjectURL(compressed);
  } catch {
    return url; // silently fall back to original
  }
}

export async function compressCatalogueImages(
  data: import('../api/catalogue').GenerateResponse
): Promise<import('../api/catalogue').GenerateResponse> {
  const compressedLineItems = await Promise.all(
    data.lineItems.map(async (item) => ({
      ...item,
      imageUrl: item.imageUrl ? await compressImageUrl(item.imageUrl) : item.imageUrl,
    }))
  );

  // Re-build grouped with the same compressed imageUrls
  const compressedGrouped = Object.fromEntries(
    Object.entries(data.grouped).map(([cat, items]) => [
      cat,
      items.map((item) => {
        const compressed = compressedLineItems.find(
          (c) => String(c.productId) === String(item.productId)
        );
        return compressed ?? item;
      }),
    ])
  );

  return {
    ...data,
    lineItems: compressedLineItems,
    grouped: compressedGrouped,
  };
}