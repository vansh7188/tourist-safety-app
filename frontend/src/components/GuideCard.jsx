import React from "react";
import { FaStar, FaMapMarkerAlt, FaLanguage, FaCertificate, FaCalendarCheck } from "react-icons/fa";

export default function GuideCard({ guide, onSelect, onBook }) {
  const {
    _id,
    userId,
    city,
    bio,
    languages = [],
    specialties = [],
    pricing = {},
    rating = { average: 0, count: 0 },
    coverPhoto,
    experienceYears,
    verified,
    totalBookings = 0,
    distanceMeters,
  } = guide;

  const distanceKm = distanceMeters ? (distanceMeters / 1000).toFixed(1) : null;
  const guideName = userId?.name || "Local Guide";

  return (
    <article className="feature-grid-card flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200/80 bg-white/90 p-4 shadow-sm transition-all hover:shadow-md">
      <div>
        <div className="relative mb-3 h-40 w-full overflow-hidden rounded-xl bg-slate-100">
          {coverPhoto ? (
            <img
              src={coverPhoto}
              alt={guideName}
              className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-tr from-teal-700 to-sky-600 text-3xl font-black text-white">
              {guideName.charAt(0)}
            </div>
          )}
          {verified && (
            <span className="absolute top-2 left-2 flex items-center gap-1 rounded-full bg-emerald-600 px-2.5 py-0.5 text-[11px] font-bold text-white shadow">
              <FaCertificate className="text-[10px]" /> Verified
            </span>
          )}
          {distanceKm && (
            <span className="absolute bottom-2 right-2 rounded-full bg-slate-900/75 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur-sm">
              {distanceKm} km away
            </span>
          )}
        </div>

        <div className="mb-2 flex items-start justify-between gap-2">
          <div>
            <h3 className="text-base font-extrabold text-slate-900">{guideName}</h3>
            {city && (
              <p className="flex items-center gap-1 text-xs text-slate-500">
                <FaMapMarkerAlt className="text-teal-600" /> {city}
              </p>
            )}
          </div>
          <div className="flex items-center gap-1 rounded-lg bg-amber-50 px-2 py-1 text-xs font-bold text-amber-700">
            <FaStar className="text-amber-500" />
            <span>{rating.average ? rating.average.toFixed(1) : "New"}</span>
            {rating.count > 0 && <span className="text-[10px] text-amber-600 font-normal">({rating.count})</span>}
          </div>
        </div>

        {bio && (
          <p className="mb-3 line-clamp-2 text-xs leading-relaxed text-slate-600">
            {bio}
          </p>
        )}

        {specialties.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-1">
            {specialties.slice(0, 3).map((spec, i) => (
              <span
                key={i}
                className="rounded-md bg-teal-50 px-2 py-0.5 text-[10px] font-semibold text-teal-700"
              >
                {spec}
              </span>
            ))}
            {specialties.length > 3 && (
              <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-500">
                +{specialties.length - 3}
              </span>
            )}
          </div>
        )}

        {languages.length > 0 && (
          <p className="mb-3 flex items-center gap-1.5 text-[11px] text-slate-500">
            <FaLanguage className="text-teal-600 text-sm" />
            <span className="truncate">{languages.join(", ")}</span>
          </p>
        )}
      </div>

      <div className="border-t border-slate-100 pt-3">
        <div className="mb-3 flex items-baseline justify-between">
          <div>
            <span className="text-xs text-slate-400">Starting from</span>
            <div className="text-base font-extrabold text-slate-900">
              ₹{pricing.hourly || pricing.halfDay || pricing.fullDay || 0}
              <span className="text-xs font-normal text-slate-500">
                /{pricing.hourly ? "hr" : pricing.halfDay ? "half-day" : "day"}
              </span>
            </div>
          </div>
          {experienceYears > 0 && (
            <span className="text-[11px] font-semibold text-slate-500">
              {experienceYears} yr{experienceYears > 1 ? "s" : ""} exp
            </span>
          )}
        </div>

        <div className="flex gap-2">
          {onSelect && (
            <button
              type="button"
              onClick={() => onSelect(guide)}
              className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100"
            >
              Details
            </button>
          )}
          {onBook && (
            <button
              type="button"
              onClick={() => onBook(guide)}
              className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-[#04617B] px-3 py-2 text-xs font-bold text-white shadow-sm hover:bg-[#034d62]"
            >
              <FaCalendarCheck /> Book Now
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
