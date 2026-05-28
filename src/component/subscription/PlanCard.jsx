import React, { useMemo } from "react";
import { Sparkles, Crown, Check } from "lucide-react";
import {
  normalizeFeatures,
  currencySymbol,
  formatMoney,
} from "../../utils/pricingHelpers";

export default function PlanCard({
  plan,
  billingInterval,
  selecting,
  isFreeEligibleGlobal,
  onSubscribe,
}) {
  const {
    name,
    description,
    monthly_price,
    yearly_discount_percent,
    currency,
    is_popular,
    is_free_eligible,
    color,
    features,
    level,
  } = plan;

  const featureList = useMemo(() => normalizeFeatures(features), [features]);

  const {
    displayPrice,
    subLabel,
    yearlyDiscountLabel,
    priceUnit,
    badgeLabel,
    badgeColorClass,
  } = useMemo(() => {
    const monthly = parseFloat(monthly_price || "0");
    const discountPercent = parseFloat(yearly_discount_percent || "0");

    const yearly =
      monthly > 0
        ? monthly *
          12 *
          (1 - (isNaN(discountPercent) ? 0 : discountPercent) / 100)
        : 0;

    const symbol = currencySymbol(currency);

    const monthlyText =
      monthly > 0 ? `${symbol}${formatMoney(monthly)}` : "Free";
    const yearlyText = yearly > 0 ? `${symbol}${formatMoney(yearly)}` : "Free";

    const price = billingInterval === "monthly" ? monthlyText : yearlyText;

    const unit =
      billingInterval === "monthly" ? "/month" : yearly > 0 ? "/year" : "";

    let discountLabel = "";
    if (
      billingInterval === "yearly" &&
      !isNaN(discountPercent) &&
      discountPercent > 0
    ) {
      discountLabel = `Save ${discountPercent}%`;
    }

    let badge = null;
    let badgeClass = "";

    if (is_popular) {
      badge = "Most popular";
      badgeClass = "tw:bg-primary/10 tw:text-primary tw:border-primary/30";
    } else if (is_free_eligible && isFreeEligibleGlobal) {
      badge = "Free month unlocked";
      badgeClass = "tw:bg-emerald-50 tw:text-emerald-700 tw:border-emerald-200";
    } else if (level === 1) {
      badge = "Perfect starter";
      badgeClass = "tw:bg-sky-50 tw:text-sky-700 tw:border-sky-200";
    }

    const sub =
      billingInterval === "monthly"
        ? "Billed every month"
        : "Pay once for 12 months";

    return {
      displayPrice: price,
      subLabel: sub,
      yearlyDiscountLabel: discountLabel,
      priceUnit: unit,
      badgeLabel: badge,
      badgeColorClass: badgeClass,
    };
  }, [
    monthly_price,
    yearly_discount_percent,
    currency,
    billingInterval,
    is_popular,
    is_free_eligible,
    isFreeEligibleGlobal,
    level,
  ]);

  const planAccent = color || "#050505";

  return (
    <div className="tw:relative tw:group tw:rounded-3xl tw:border tw:border-slate-200 tw:bg-white tw:p-5 tw:flex tw:flex-col tw:gap-4 tw:shadow-[0_18px_45px_rgba(15,23,42,0.06)] tw:hover:border-primary/70 tw:hover:shadow-[0_20px_55px_rgba(15,23,42,0.12)] tw:transition-all tw:duration-300">
      {/* Glow */}
      <div
        className="tw:absolute tw:-inset-px tw:rounded-3xl tw:opacity-0 group-tw:hover:opacity-100 tw:transition tw:duration-300 tw:-z-10"
        style={{
          background: `radial-gradient(circle at top, ${planAccent}12, transparent 55%)`,
        }}
      />

      {/* Header */}
      <div className="tw:flex tw:items-start tw:justify-between tw:gap-2">
        <div>
          <div className="tw:flex tw:items-center tw:gap-2">
            <span className="tw:text-base tw:font-semibold tw:text-slate-900">
              {name}
            </span>
            {badgeLabel && (
              <span
                className={`tw:text-[10px] tw:uppercase tw:tracking-[0.16em] tw:px-2.5 tw:py-[3px] tw:rounded-full tw:border tw:flex tw:items-center tw:gap-1 ${badgeColorClass}`}
              >
                {is_popular && (
                  <Crown className="tw:w-3 tw:h-3 tw:fill-current" />
                )}
                {badgeLabel}
              </span>
            )}
          </div>
          <span className="tw:mt-1 tw:block tw:text-xs tw:text-slate-500">
            {description}
          </span>
        </div>

        {is_popular && (
          <div className="tw:size-9 tw:rounded-2xl tw:bg-primary/10 tw:flex tw:items-center tw:justify-center tw:shrink-0 tw:border tw:border-primary/40">
            <Crown className="tw:w-4 tw:h-4 tw:text-primary" />
          </div>
        )}
      </div>

      {/* Price */}
      <div className="tw:flex tw:items-baseline tw:gap-2 tw:mt-1">
        <span className="tw:text-2xl tw:lg:text-3xl tw:font-semibold tw:text-slate-900">
          {displayPrice}
        </span>
        <span className="tw:text-xs tw:text-slate-500">{priceUnit}</span>
      </div>
      <div className="tw:flex tw:items-center tw:gap-2 tw:text-[11px] tw:text-slate-500">
        <span>{subLabel}</span>
        {yearlyDiscountLabel && (
          <span className="tw:px-2 tw:py-0.5 tw:rounded-full tw:bg-emerald-50 tw:text-emerald-700 tw:text-[10px]">
            {yearlyDiscountLabel}
          </span>
        )}
      </div>

      {/* Features */}
      {featureList.length > 0 && (
        <ul className="tw:mt-3 tw:space-y-1.5 tw:text-xs tw:text-slate-600">
          {featureList.map((item, idx) => (
            <li key={idx} className="tw:flex tw:items-start tw:gap-2">
              <div className="tw:mt-0.5 tw:shrink-0 tw:rounded-full tw:bg-primary/10 tw:size-4 tw:flex tw:items-center tw:justify-center">
                <Check className="tw:w-2.5 tw:h-2.5 tw:text-primary" />
              </div>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      )}

      {/* CTA */}
      <div className="tw:mt-4 tw:flex tw:flex-col tw:gap-2">
        <button
          style={{
            borderRadius: 10,
          }}
          type="button"
          onClick={onSubscribe}
          disabled={selecting}
          className="tw:w-full tw:px-4 tw:py-2.5 tw:rounded-2xl tw:bg-linear-to-r tw:from-primary tw:to-primarySecond tw:text-sm tw:font-medium tw:text-white tw:flex tw:items-center tw:justify-center tw:gap-2 tw:shadow-[0_16px_40px_rgba(0,0,0,0.24)] tw:hover:brightness-110 tw:disabled:opacity-60 tw:disabled:cursor-not-allowed tw:transition"
        >
          {selecting ? (
            <>
              <span className="tw:inline-block tw:size-3 tw:rounded-full tw:border-2 tw:border-white/40 tw:border-t-transparent tw:animate-spin" />
              <span>Connecting to Paystack…</span>
            </>
          ) : (
            <>
              <span>Choose this plan</span>
              <Sparkles className="tw:w-4 tw:h-4 tw:text-white/90" />
            </>
          )}
        </button>
        {is_free_eligible && (
          <span className="tw:text-[11px] tw:text-emerald-700 tw:bg-emerald-50 tw:px-2 tw:py-1 tw:rounded-xl tw:flex tw:items-center tw:gap-1.5">
            <Sparkles className="tw:w-3 tw:h-3 tw:text-emerald-600" />
            <span>
              Free cycles may be available when you hit your event targets.
            </span>
          </span>
        )}
      </div>
    </div>
  );
}
