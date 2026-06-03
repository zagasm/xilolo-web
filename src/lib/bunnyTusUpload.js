export async function uploadToBunnyTus({ file, upload, onProgress }) {
  if (!(file instanceof File)) {
    throw new Error("Choose a video file to upload.");
  }

  const endpoint = upload?.endpoint;
  const headers = upload?.headers || {};

  if (!endpoint || !headers.AuthorizationSignature || !headers.AuthorizationExpire || !headers.LibraryId || !headers.VideoId) {
    throw new Error("The upload session is missing Bunny Stream credentials.");
  }

  const metadata = {
    filename: file.name || "video",
    filetype: file.type || "application/octet-stream",
    ...(upload?.metadata || {}),
  };

  const uploadMetadata = Object.entries(metadata)
    .filter(([, value]) => value !== undefined && value !== null && String(value) !== "")
    .map(([key, value]) => `${key} ${btoa(unescape(encodeURIComponent(String(value))))}`)
    .join(",");

  const createResponse = await fetch(endpoint, {
    method: "POST",
    headers: {
      ...headers,
      "Tus-Resumable": "1.0.0",
      "Upload-Length": String(file.size),
      "Upload-Metadata": uploadMetadata,
    },
  });

  if (!createResponse.ok) {
    throw new Error(`Unable to create Bunny upload (${createResponse.status}).`);
  }

  const uploadUrl = createResponse.headers.get("Location");
  if (!uploadUrl) {
    throw new Error("Bunny did not return an upload URL.");
  }

  const chunkSize = 8 * 1024 * 1024;
  let offset = 0;

  while (offset < file.size) {
    const chunk = file.slice(offset, Math.min(offset + chunkSize, file.size));
    const response = await fetch(uploadUrl, {
      method: "PATCH",
      headers: {
        ...headers,
        "Tus-Resumable": "1.0.0",
        "Upload-Offset": String(offset),
        "Content-Type": "application/offset+octet-stream",
      },
      body: chunk,
    });

    if (!response.ok) {
      throw new Error(`Bunny upload failed (${response.status}).`);
    }

    const nextOffset = Number(response.headers.get("Upload-Offset"));
    offset = Number.isFinite(nextOffset) && nextOffset > offset ? nextOffset : offset + chunk.size;
    onProgress?.(Math.min(100, Math.round((offset / file.size) * 100)));
  }

  return { uploadUrl, videoId: headers.VideoId };
}
