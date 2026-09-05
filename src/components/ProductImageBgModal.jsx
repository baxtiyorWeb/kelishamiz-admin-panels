import React, { useState, useEffect, useRef } from "react";
import { Modal, message, Radio, Tooltip, Spin, Progress } from "antd";
import {
  Wand2,
  Check,
  X,
  RefreshCw,
  SlidersHorizontal,
  Layers,
  ArrowLeftRight,
  ShieldCheck,
  AlertCircle,
  Undo2,
  Sparkles,
} from "lucide-react";
import api from "../config/auth/api";

const checkerboardStyle = {
  backgroundColor: "#f8fafc",
  backgroundImage: `
    linear-gradient(45deg, #e2e8f0 25%, transparent 25%),
    linear-gradient(-45deg, #e2e8f0 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, #e2e8f0 75%),
    linear-gradient(-45deg, transparent 75%, #e2e8f0 75%)
  `,
  backgroundSize: "20px 20px",
  backgroundPosition: "0 0, 0 10px, 10px -10px, -10px 0px",
};

export const ProductImageBgModal = ({
  open,
  onClose,
  type = "product",
  productId,
  images = [],
  onSuccess,
}) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [previews, setPreviews] = useState({}); // { [imageId]: { previewBase64, status, errorMsg, width, height, sizeBytes } }
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMode, setSaveMode] = useState("replace"); // 'replace' | 'new_version'
  const [viewMode, setViewMode] = useState("side-by-side"); // 'side-by-side' | 'slider' | 'cutout-only'
  const [sliderPos, setSliderPos] = useState(50);
  const isDraggingRef = useRef(false);

  // Modal ochilganda holatni tozalash va birinchi rasmni avtomatik qayta ishlashga tayyorlash
  useEffect(() => {
    if (open && images.length > 0) {
      setActiveIndex(0);
      setPreviews({});
      // Birinchi rasmni avtomatik fonini tozalashni boshlash
      processImage(images[0].id);
    }
  }, [open, images]);

  const activeImage = images[activeIndex] || images[0];
  const activePreview = activeImage ? previews[activeImage.id] : null;

  // Bitta rasm fonini AI orqali tozalash
  const processImage = async (imageId) => {
    if (!imageId) return;
    if (type === "product" && !productId) return;

    setPreviews((prev) => ({
      ...prev,
      [imageId]: { ...(prev[imageId] || {}), status: "processing", errorMsg: null },
    }));
    setIsProcessing(true);

    try {
      const endpoint =
        type === "category"
          ? `/ai/categories/${imageId}/bg-remove/preview`
          : `/ai/products/${productId}/images/${imageId}/bg-remove/preview`;
      const res = await api.post(endpoint);
      const data = res.data?.content;
      const actualData = data?.content || data; // Handle double-nested 'content'

      setPreviews((prev) => ({
        ...prev,
        [imageId]: {
          status: "success",
          previewBase64: actualData.previewBase64,
          originalUrl: actualData.originalUrl,
          width: actualData.width,
          height: actualData.height,
          sizeBytes: actualData.sizeBytes,
          format: actualData.format,
        },
      }));
    } catch (err) {
      const errorMsg =
        err.response?.data?.message || err.message || "Fonni tozalashda xatolik yuz berdi";
      setPreviews((prev) => ({
        ...prev,
        [imageId]: {
          status: "error",
          errorMsg,
        },
      }));
      message.error(errorMsg);
    } finally {
      setIsProcessing(false);
    }
  };

  // Barcha tanlangan rasmlarni ketma-ket qayta ishlash
  const processAllImages = async () => {
    setIsProcessing(true);
    for (let i = 0; i < images.length; i++) {
      const img = images[i];
      if (previews[img.id]?.status !== "success") {
        setActiveIndex(i);
        await processImage(img.id);
      }
    }
    setIsProcessing(false);
  };

  // Natijani rad etish (faqat aktiv rasm uchun previewni bekor qilish)
  const handleReject = () => {
    if (!activeImage) return;
    setPreviews((prev) => {
      const copy = { ...prev };
      delete copy[activeImage.id];
      return copy;
    });
    message.info("Ushbu rasm uchun AI natijasi rad etildi.");
  };

  // Bitta aktiv rasmni saqlash
  const handleApplySingle = async () => {
    if (!activeImage || !activePreview?.previewBase64) {
      message.warning("Avval rasm fonini AI orqali tozalang!");
      return;
    }

    setIsSaving(true);
    try {
      const endpoint =
        type === "category"
          ? `/ai/categories/${activeImage.id}/bg-remove/apply`
          : `/ai/products/${productId}/images/${activeImage.id}/bg-remove/apply`;
      const payload =
        type === "category"
          ? { previewBase64: activePreview.previewBase64 }
          : { mode: saveMode, previewBase64: activePreview.previewBase64 };
      const res = await api.post(endpoint, payload);
      message.success(res.data?.message || "Rasm muvaffaqiyatli saqlandi!");

      if (onSuccess) onSuccess();

      // Agar bir nechta rasm bo'lsa, keyingisiga o'tish, aks holda modalni yopish
      if (images.length > 1 && activeIndex < images.length - 1) {
        setActiveIndex((prev) => prev + 1);
      } else {
        onClose();
      }
    } catch (err) {
      const errMsg =
        err.response?.data?.message || err.message || "Rasmni saqlashda xatolik yuz berdi";
      message.error(errMsg);
    } finally {
      setIsSaving(false);
    }
  };

  // Barcha muvaffaqiyatli tozalangan rasmlarni birdaniga saqlash
  const handleApplyAll = async () => {
    const readyItems = images
      .filter((img) => previews[img.id]?.status === "success")
      .map((img) => ({
        imageId: img.id,
        mode: saveMode,
        previewBase64: previews[img.id].previewBase64,
      }));

    if (readyItems.length === 0) {
      message.warning("Saqlash uchun tozalangan rasmlar mavjud emas!");
      return;
    }

    setIsSaving(true);
    try {
      if (type === "category") {
        await api.post(`/ai/categories/batch-bg-remove/apply`, {
          items: readyItems.map((it) => ({
            categoryId: it.imageId,
            previewBase64: it.previewBase64,
          })),
        });
      } else {
        await api.post(`/ai/products/${productId}/batch-bg-remove/apply`, {
          items: readyItems,
        });
      }
      message.success(`${readyItems.length} ta rasm muvaffaqiyatli saqlandi!`);
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      const errMsg =
        err.response?.data?.message || err.message || "Rasmlarni saqlashda xatolik yuz berdi";
      message.error(errMsg);
    } finally {
      setIsSaving(false);
    }
  };

  // Split-slider drag hodisalari
  const handleSliderMove = (e) => {
    if (!isDraggingRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const percent = Math.round((x / rect.width) * 100);
    setSliderPos(percent);
  };

  const processedCount = images.filter((img) => previews[img.id]?.status === "success").length;

  return (
    <Modal
      open={open}
      onCancel={() => {
        if (!isProcessing && !isSaving) onClose();
      }}
      footer={null}
      width={940}
      centered
      destroyOnClose
      className="!rounded-3xl overflow-hidden"
    >
      <div className="flex flex-col gap-4 -m-2">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-500 to-violet-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/20">
              <Wand2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900 m-0 flex items-center gap-2">
                AI Fonni Tozalash Markazi
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                  U²-Net & Sharp Engine
                </span>
              </h2>
              <p className="text-xs text-slate-500 m-0 mt-0.5">
                Mahsulot rasmidan fonni avtomatik ajratib, shaffof (transparent) holatga keltiradi. Asl rasm saqlanadi.
              </p>
            </div>
          </div>

          {/* View Mode Switcher */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl border border-slate-200/80">
            <button
              type="button"
              onClick={() => setViewMode("side-by-side")}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                viewMode === "side-by-side"
                  ? "bg-white text-indigo-600 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Yonma-yon
            </button>
            <button
              type="button"
              onClick={() => setViewMode("slider")}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                viewMode === "slider"
                  ? "bg-white text-indigo-600 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Slayder
            </button>
            <button
              type="button"
              onClick={() => setViewMode("cutout-only")}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                viewMode === "cutout-only"
                  ? "bg-white text-indigo-600 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Faqat Shaffof
            </button>
          </div>
        </div>

        {/* Multi-image thumbnail selector tabs */}
        {images.length > 1 && (
          <div className="flex items-center justify-between gap-3 p-2.5 bg-slate-50 rounded-2xl border border-slate-200/60">
            <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-[70%]">
              {images.map((img, idx) => {
                const p = previews[img.id];
                const isCurrent = idx === activeIndex;
                return (
                  <button
                    key={img.id}
                    type="button"
                    onClick={() => {
                      setActiveIndex(idx);
                      if (!previews[img.id]) {
                        processImage(img.id);
                      }
                    }}
                    className={`relative w-14 h-14 rounded-xl overflow-hidden border-2 transition-all shrink-0 cursor-pointer ${
                      isCurrent
                        ? "border-indigo-600 scale-105 shadow-sm"
                        : "border-slate-200 opacity-70 hover:opacity-100"
                    }`}
                  >
                    <img
                      src={p?.previewBase64 || img.imageUrl || img.url}
                      alt={`Thumb ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                    {p?.status === "success" && (
                      <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[9px] shadow-xs">
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                      </span>
                    )}
                    {p?.status === "processing" && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <Spin size="small" />
                      </div>
                    )}
                    <span className="absolute bottom-0.5 left-1 text-[9px] font-black text-white drop-shadow-md">
                      #{idx + 1}
                    </span>
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              disabled={isProcessing}
              onClick={processAllImages}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs border border-indigo-200 transition-all cursor-pointer disabled:opacity-50"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>Barchasini tozalash ({processedCount}/{images.length})</span>
            </button>
          </div>
        )}

        {/* Main Comparison Area */}
        <div className="relative min-h-[380px] rounded-2xl overflow-hidden border border-slate-200 bg-slate-900/5">
          {isProcessing && (
            <div className="absolute inset-0 z-30 bg-white/85 backdrop-blur-xs flex flex-col items-center justify-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center animate-bounce shadow-md">
                <Wand2 className="w-6 h-6" />
              </div>
              <div className="text-center">
                <div className="text-sm font-black text-slate-900">
                  AI Obyektni Ajratmoqda...
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  Piksel darajasidagi alfa-shaffoflik qatlami hisoblanmoqda (1-2 soniya)
                </div>
              </div>
              <Progress percent={75} status="active" showInfo={false} className="w-48 !m-0" />
            </div>
          )}

          {activePreview?.status === "error" ? (
            <div className="flex flex-col items-center justify-center h-[380px] p-6 text-center">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mb-3">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div className="text-sm font-black text-slate-900">Fonni tozalashda xatolik</div>
              <div className="text-xs text-rose-600 mt-1 max-w-md">{activePreview.errorMsg}</div>
              <button
                type="button"
                onClick={() => processImage(activeImage.id)}
                className="mt-4 px-4 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs cursor-pointer hover:bg-slate-800"
              >
                Qayta urinish
              </button>
            </div>
          ) : viewMode === "side-by-side" ? (
            /* SIDE BY SIDE VIEW */
            <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-200 h-full min-h-[380px]">
              {/* Original */}
              <div className="p-4 flex flex-col items-center justify-center relative bg-slate-50/70">
                <div className="absolute top-3 left-3 z-10 px-2.5 py-1 rounded-lg bg-slate-900/80 text-white font-bold text-[11px] backdrop-blur-xs">
                  Asl Rasm
                </div>
                <img
                  src={activeImage?.originalUrl || activeImage?.imageUrl || activeImage?.url}
                  alt="Original"
                  className="max-h-[320px] max-w-full object-contain rounded-xl shadow-xs"
                />
              </div>

              {/* Processed with Checkerboard */}
              <div
                style={checkerboardStyle}
                className="p-4 flex flex-col items-center justify-center relative"
              >
                <div className="absolute top-3 left-3 z-10 px-2.5 py-1 rounded-lg bg-emerald-600 text-white font-bold text-[11px] flex items-center gap-1 shadow-xs">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  AI Natijasi (Shaffof)
                </div>

                {activePreview?.previewBase64 ? (
                  <img
                    src={activePreview.previewBase64}
                    alt="Processed"
                    className="max-h-[320px] max-w-full object-contain drop-shadow-lg"
                  />
                ) : (
                  <div className="text-xs text-slate-400 font-semibold">
                    Qayta ishlash kutilmoqda...
                  </div>
                )}
              </div>
            </div>
          ) : viewMode === "slider" ? (
            /* INTERACTIVE SPLIT SLIDER VIEW */
            <div
              className="relative w-full h-[380px] select-none cursor-ew-resize overflow-hidden"
              style={checkerboardStyle}
              onMouseDown={() => (isDraggingRef.current = true)}
              onMouseUp={() => (isDraggingRef.current = false)}
              onMouseLeave={() => (isDraggingRef.current = false)}
              onMouseMove={handleSliderMove}
            >
              {/* Background: Processed Image */}
              <div className="absolute inset-0 flex items-center justify-center p-4">
                {activePreview?.previewBase64 && (
                  <img
                    src={activePreview.previewBase64}
                    alt="Processed"
                    className="max-h-[340px] max-w-full object-contain drop-shadow-lg pointer-events-none"
                  />
                )}
              </div>

              {/* Foreground: Original Image clipped */}
              <div
                className="absolute inset-0 flex items-center justify-center p-4 overflow-hidden bg-slate-100"
                style={{ clipPath: `inset(0 ${100 - sliderPos}% 0 0)` }}
              >
                <img
                  src={activeImage?.originalUrl || activeImage?.imageUrl || activeImage?.url}
                  alt="Original"
                  className="max-h-[340px] max-w-full object-contain pointer-events-none"
                />
              </div>

              {/* Divider line & handle */}
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-white shadow-xl flex items-center justify-center pointer-events-none"
                style={{ left: `${sliderPos}%` }}
              >
                <div className="w-8 h-8 rounded-full bg-white text-indigo-600 shadow-lg flex items-center justify-center border border-slate-200">
                  <ArrowLeftRight className="w-4 h-4" />
                </div>
              </div>

              <div className="absolute bottom-3 left-3 px-2 py-1 rounded-md bg-slate-900/80 text-white font-bold text-[10px]">
                Asl ({sliderPos}%)
              </div>
              <div className="absolute bottom-3 right-3 px-2 py-1 rounded-md bg-emerald-600/90 text-white font-bold text-[10px]">
                Shaffof ({100 - sliderPos}%)
              </div>
            </div>
          ) : (
            /* CUTOUT ONLY VIEW */
            <div
              style={checkerboardStyle}
              className="w-full h-[380px] p-6 flex items-center justify-center relative"
            >
              {activePreview?.previewBase64 ? (
                <img
                  src={activePreview.previewBase64}
                  alt="Processed cutout"
                  className="max-h-[340px] max-w-full object-contain drop-shadow-xl"
                />
              ) : (
                <div className="text-xs text-slate-400">Rasm yuklanmoqda...</div>
              )}
            </div>
          )}
        </div>

        {/* Save Mode Selector & Actions Footer */}
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {type === "category" ? (
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3.5 py-2 rounded-xl">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Kategoriya uchun asl rasm avtomatik saqlanadi va istalgan payt tiklanadi</span>
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              <span className="text-xs font-bold text-slate-700">Saqlash usuli:</span>
              <Radio.Group
                value={saveMode}
                onChange={(e) => setSaveMode(e.target.value)}
                disabled={isSaving}
                className="!flex gap-4"
              >
                <Radio value="replace">
                  <span className="text-xs font-semibold text-slate-800">
                    Aslini saqlab almashtirish
                  </span>
                </Radio>
                <Radio value="new_version">
                  <span className="text-xs font-semibold text-slate-800">
                    Yangi rasm sifatida qo'shish
                  </span>
                </Radio>
              </Radio.Group>
            </div>
          )}

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              disabled={isProcessing || isSaving}
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs border border-slate-200 transition-all cursor-pointer"
            >
              Bekor qilish
            </button>

            {activePreview?.status === "success" && (
              <button
                type="button"
                disabled={isProcessing || isSaving}
                onClick={handleReject}
                className="px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs border border-rose-200 transition-all cursor-pointer"
              >
                Natijani rad etish
              </button>
            )}

            <button
              type="button"
              disabled={isProcessing || isSaving}
              onClick={() => processImage(activeImage?.id)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-all cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isProcessing ? "animate-spin" : ""}`} />
              <span>Qayta ishlash</span>
            </button>

            {images.length > 1 && processedCount > 1 ? (
              <button
                type="button"
                disabled={isProcessing || isSaving}
                onClick={handleApplyAll}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md shadow-emerald-600/20 transition-all cursor-pointer disabled:opacity-50"
              >
                <Check className="w-4 h-4" />
                <span>{isSaving ? "Saqlanmoqda..." : `Barchasini saqlash (${processedCount} ta)`}</span>
              </button>
            ) : (
              <button
                type="button"
                disabled={isProcessing || isSaving || activePreview?.status !== "success"}
                onClick={handleApplySingle}
                className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs shadow-md shadow-indigo-600/20 transition-all cursor-pointer disabled:opacity-50"
              >
                <Check className="w-4 h-4" />
                <span>{isSaving ? "Saqlanmoqda..." : "Tasdiqlash & Saqlash"}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};
