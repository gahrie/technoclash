import React, { useState, useRef, useEffect } from "react";
import clsx from "clsx";
import ReactCrop, { centerCrop, makeAspectCrop } from "react-image-crop";
import { FaUserCircle } from "react-icons/fa";
import "react-image-crop/dist/ReactCrop.css";
import styles from "./UploadInput.module.scss";

const UploadInput = ({
    id,
    onChange,
    error,
    accept = "image/*",
    placeholder = "Choose a file",
    type = "file",
    initialPreview = null, // New prop for existing avatar
    ...props
}) => {
    const [fileName, setFileName] = useState("");
    const [preview, setPreview] = useState(initialPreview); // Initialize with initialPreview
    const [showCropModal, setShowCropModal] = useState(false);
    const [src, setSrc] = useState(null);
    const [crop, setCrop] = useState(null);
    const imgRef = useRef(null);

    // Update preview if initialPreview changes (e.g., on reset or initial load)
    useEffect(() => {
        setPreview(initialPreview);
    }, [initialPreview]);

    const handleFileChange = (e) => {
        e.preventDefault();
        const file = e.target.files[0];
        if (file) {
            setFileName(file.name);
            const reader = new FileReader();
            reader.onloadend = () => {
                if (type === "avatar") {
                    setSrc(reader.result);
                    setShowCropModal(true);
                } else {
                    setPreview(reader.result);
                    onChange(file);
                }
            };
            reader.readAsDataURL(file);
        }
    };

    const onImageLoad = (e) => {
        const { width, height } = e.currentTarget;
        const crop = centerCrop(
            makeAspectCrop(
                {
                    unit: "px",
                    width: Math.min(width, height) * 0.9,
                },
                1,
                width,
                height
            ),
            width,
            height
        );
        setCrop(crop);
    };

    const getCroppedImg = async (image, crop) => {
        const canvas = document.createElement("canvas");
        const scaleX = image.naturalWidth / image.width;
        const scaleY = image.naturalHeight / image.height;
        canvas.width = crop.width;
        canvas.height = crop.height;

        const ctx = canvas.getContext("2d");
        ctx.drawImage(
            image,
            crop.x * scaleX,
            crop.y * scaleY,
            crop.width * scaleX,
            crop.height * scaleY,
            0,
            0,
            crop.width,
            crop.height
        );

        return new Promise((resolve, reject) => {
            canvas.toBlob(
                (blob) => {
                    if (!blob) {
                        reject(new Error("Canvas is empty"));
                        return;
                    }
                    const file = new File([blob], "cropped.png", {
                        type: "image/png",
                    });
                    const previewUrl = URL.createObjectURL(blob);
                    resolve({ file, previewUrl });
                },
                "image/png",
                1
            );
        });
    };

    const handleCropChange = (newCrop) => {
        setCrop(newCrop);
    };

    const handleCropComplete = async () => {
        if (imgRef.current && crop) {
            const { file, previewUrl } = await getCroppedImg(
                imgRef.current,
                crop
            );
            setPreview(previewUrl);
            onChange(file);
            setShowCropModal(false);
            setSrc(null);
            setCrop(null);
        }
    };

    const handleCropCancel = () => {
        setShowCropModal(false);
        setSrc(null);
        setCrop(null);
        setFileName("");
        // Reset to initialPreview if available, otherwise clear preview
        setPreview(initialPreview);
    };

    return (
        <div className={styles.uploadContainer}>
            <label>Avatar</label>
            {type === "avatar" && (
                <div className={styles.avatarPreview}>
                    {preview ? (
                        <img
                            src={preview}
                            alt="Avatar preview"
                            className={styles.previewImage}
                        />
                    ) : (
                        <FaUserCircle className={styles.defaultAvatar} />
                    )}
                </div>
            )}
            <label htmlFor={id} className={styles.uploadLabel}>
                <input
                    id={id}
                    type="file"
                    accept={accept}
                    onChange={handleFileChange}
                    className={styles.uploadInput}
                    {...props}
                />
                <span className={styles.uploadButton}>Browse</span>
            </label>

            {error && <p className={styles.error}>{error}</p>}

            {showCropModal && (
                <div className={styles.cropModal}>
                    <div className={styles.cropModalContent}>
                        <h3>Crop Avatar</h3>
                        <ReactCrop
                            crop={crop}
                            onChange={handleCropChange}
                            circularCrop
                            aspect={1}
                            keepSelection
                        >
                            <img
                                ref={imgRef}
                                src={src}
                                alt="Crop"
                                onLoad={onImageLoad}
                                style={{ maxWidth: "100%" }}
                            />
                        </ReactCrop>
                        <div className={styles.cropButtons}>
                            <button
                                type="button"
                                onClick={handleCropComplete}
                                className={styles.cropConfirm}
                            >
                                Confirm
                            </button>
                            <button
                                type="button"
                                onClick={handleCropCancel}
                                className={styles.cropCancel}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UploadInput;
