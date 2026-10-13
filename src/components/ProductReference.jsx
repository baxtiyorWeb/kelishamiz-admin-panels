import React from "react";
import { Tag as AntTag, Tooltip } from "antd";
import { Tag as TagIcon, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";

/**
 * Reusable contextual product reference component
 * Renders thumbnail, product title, formatted price, seller context, and secondary technical ID
 */
export const ProductReference = ({
  product,
  id,
  title,
  price,
  currencyType = "UZS",
  imageUrl,
  ownerName,
  ownerId,
  linkable = true,
  size = "default",
  className = "",
  onClick,
}) => {
  const navigate = useNavigate();

  const productId = product?.id || id;
  const productTitle =
    product?.title ||
    title ||
    (productId ? `E’lon #${productId}` : "Mahsulot nomi mavjud emas");

  const productPrice = product?.price !== undefined ? product.price : price;
  const productCurrency = product?.currencyType || currencyType || "UZS";
  const firstImage = product?.images?.[0]?.url || product?.images?.[0] || product?.imageUrl || imageUrl;
  const seller = product?.profile?.fullName || product?.profile?.user?.username || ownerName;

  const handleClick = (e) => {
    if (onClick) {
      e.stopPropagation();
      onClick(product || { id: productId });
      return;
    }
    if (linkable && productId) {
      e.stopPropagation();
      navigate(`/products?search=${productId}`);
    }
  };

  const isSmall = size === "small";

  return (
    <div
      onClick={handleClick}
      className={`inline-flex items-center gap-2.5 group ${
        linkable && productId ? "cursor-pointer" : ""
      } ${className}`}
    >
      <div className="flex-shrink-0">
        {firstImage ? (
          <img
            src={firstImage}
            alt=""
            className={`${
              isSmall ? "w-8 h-8" : "w-10 h-10"
            } rounded-lg object-cover border border-slate-200 bg-slate-50`}
          />
        ) : (
          <div
            className={`${
              isSmall ? "w-8 h-8" : "w-10 h-10"
            } rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400`}
          >
            <TagIcon className={isSmall ? "w-3.5 h-3.5" : "w-4 h-4"} />
          </div>
        )}
      </div>

      <div className="flex flex-col min-w-0">
        <div className="flex items-center gap-1.5 leading-tight">
          <span
            className={`font-semibold text-slate-900 truncate max-w-[220px] ${
              isSmall ? "text-[11px]" : "text-xs"
            } ${linkable && productId ? "group-hover:text-blue-700 group-hover:underline" : ""}`}
            title={productTitle}
          >
            {productTitle}
          </span>
          {productId && (
            <span className="font-mono text-[10px] text-slate-400 bg-slate-100 px-1 py-0.2 rounded flex-shrink-0">
              #{productId}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono mt-0.5">
          {productPrice !== undefined && productPrice !== null ? (
            <span className="font-bold text-slate-700">
              {Number(productPrice).toLocaleString("uz-UZ")} {productCurrency}
            </span>
          ) : (
            <span className="text-slate-400">Narx kiritilmagan</span>
          )}

          {seller && (
            <span className="text-slate-500 font-sans truncate max-w-[120px]">
              • Sotuvchi: <strong className="font-semibold text-slate-700">{seller}</strong>
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductReference;
