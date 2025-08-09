// src/components/SingleImageUploader.tsx
import React, { useState } from "react";
import axios from "axios";

type Props = {
  onUploadComplete?: (url: string) => void;
};

const CLOUDINARY_UPLOAD_PRESET = "ml_default"; // 🔁 Replace
const CLOUDINARY_CLOUD_NAME = "salriopay-com"; // 🔁 Replace

const SingleImageUploader: React.FC<Props> = ({ onUploadComplete }) => {
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImage(file);
    setPreview(URL.createObjectURL(file));
  };

  const uploadImage = async () => {
    if (!image) return;

    setUploading(true);

    const formData = new FormData();
    formData.append("file", image);
    formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

    try {
      const res = await axios.post(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
        formData
      );

      if (onUploadComplete) onUploadComplete(res.data.secure_url);
    } catch (error) {
      console.error("Upload failed:", error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ border: "1px solid #ccc", padding: 20, borderRadius: 8 }}>
      <h3>Upload Image</h3>
      <input type="file" accept="image/*" onChange={handleFileChange} />

      {preview && (
        <div style={{ marginTop: 10 }}>
          <img
            src={preview}
            alt="preview"
            width={150}
            style={{ objectFit: "cover", borderRadius: 6 }}
          />
        </div>
      )}

      <button
        onClick={uploadImage}
        disabled={uploading || !image}
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

export default SingleImageUploader;
