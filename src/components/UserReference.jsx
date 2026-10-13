import React from "react";
import { Avatar, Tooltip } from "antd";
import { User, Phone } from "lucide-react";
import { useNavigate } from "react-router-dom";

/**
 * Reusable contextual user reference component
 * Renders avatar, human-readable name, phone (if available), and secondary technical ID
 */
export const UserReference = ({
  user,
  id,
  name,
  phone,
  avatar,
  showPhone = true,
  linkable = true,
  size = "default",
  className = "",
}) => {
  const navigate = useNavigate();

  const userId = user?.id || id;
  const displayName =
    user?.profile?.fullName ||
    user?.fullName ||
    user?.username ||
    name ||
    (userId ? `Foydalanuvchi #${userId}` : "Ism kiritilmagan");

  const displayPhone = user?.phone || user?.profile?.user?.phone || phone;
  const avatarUrl = user?.profile?.avatar || user?.avatar || avatar;
  const isBlocked = user?.isBlocked;
  const isSpam = user?.isSpam;

  const handleClick = (e) => {
    if (linkable && userId) {
      e.stopPropagation();
      navigate(`/users/${userId}`);
    }
  };

  const isSmall = size === "small";

  return (
    <div
      onClick={handleClick}
      className={`inline-flex items-center gap-2 group ${
        linkable && userId ? "cursor-pointer hover:opacity-90" : ""
      } ${className}`}
    >
      <div className="relative flex-shrink-0">
        <Avatar
          size={isSmall ? 24 : 30}
          src={avatarUrl}
          className="bg-blue-700 text-white font-bold text-xs border border-slate-200"
        >
          {(displayName || "U")[0]?.toUpperCase()}
        </Avatar>
        {(isBlocked || isSpam) && (
          <span
            className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-white ${
              isBlocked ? "bg-rose-500" : "bg-amber-500"
            }`}
            title={isBlocked ? "Bloklangan akkaunt" : "Spam akkaunt"}
          />
        )}
      </div>

      <div className="flex flex-col min-w-0">
        <div className="flex items-center gap-1.5 leading-tight">
          <span
            className={`font-semibold text-slate-900 truncate ${
              isSmall ? "text-[11px]" : "text-xs"
            } ${linkable && userId ? "group-hover:text-blue-700 group-hover:underline" : ""}`}
            title={displayName}
          >
            {displayName}
          </span>
          {userId && (
            <span className="font-mono text-[10px] text-slate-400 bg-slate-100 px-1 py-0.2 rounded flex-shrink-0">
              #{userId}
            </span>
          )}
        </div>

        {showPhone && displayPhone && (
          <div className="text-[10px] text-slate-500 font-mono flex items-center gap-1 mt-0.5">
            <Phone className="w-2.5 h-2.5 text-slate-400" />
            <span>{displayPhone}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserReference;
