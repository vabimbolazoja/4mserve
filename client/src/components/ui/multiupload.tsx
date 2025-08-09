// src/components/MultiImageUploader.tsx
import React, { useState } from "react";
import axios from "axios";

type Props = {
  onUploadComplete?: (urls: string[]) => void;
};

type PreviewImage = {
  file: File;
  preview: string;
};

const CLOUDINARY_UPLOAD_PRESET = "ml_default" // 🔁 Replace
const CLOUDINARY_CLOUD_NAME = "salriopay-com"      // 🔁 Replace

const MultiImageUploader: React.FC<Props> = ({ onUploadComplete }) => {
  const [images, setImages] = useState<PreviewImage[]>([]);
  const [uploading, setUploading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;

    const filesArray = Array.from(e.target.files).map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }));

    setImages((prev) => [...prev, ...filesArray]);
  };

  const uploadImages = async () => {
    if (images.length === 0) return;

    setUploading(true);
    const uploadedUrls: string[] = [];

    for (const img of images) {
      const formData = new FormData();
      formData.append("file", img.file);
      formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

      try {
        const res = await axios.post(
          `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
          formData
        );

        uploadedUrls.push(res.data.secure_url);
      } catch (error) {
        console.error("Upload failed:", error);
      }
    }

    setUploading(false);
    if (onUploadComplete) onUploadComplete(uploadedUrls);
  };

  return (
    <div style={{ border: "1px solid #ccc", padding: 20, borderRadius: 8 }}>
      <h3>Upload Images</h3>
      <input
        type="file"
        multiple
        accept="image/*"
        onChange={handleFileChange}
      />

      <div style={{ display: "flex", gap: 10, marginTop: 10, flexWrap: "wrap" }}>
        {images.map((img, index) => (
          <img
            key={index}
            src={img.preview}
            alt={`preview-${index}`}
            width={100}
            style={{ objectFit: "cover", borderRadius: 6 }}
          />
        ))}
      </div>
      <button
        onClick={uploadImages}
        disabled={uploading}
        style={{
          marginTop: 10,
          padding: "8px 16px",
          backgroundColor: "#007bff",
          color: "#fff",
          border: "none",
          borderRadius: 4,
          cursor: uploading ? "not-allowed" : "pointer",
        }}
      >
        {uploading ? "Uploading..." : "Upload"}
      </button>
    </div>
  );
};

export default MultiImageUploader;
