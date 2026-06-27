import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Typography } from "@mui/material";
import { api } from "../../lib/apiClient";
import AdsRequestDialog from "./AdsRequestDialog";

function formatMoney(amount, currencyCode = "NGN") {
  try {
    const formatter = new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: currencyCode,
      minimumFractionDigits: 2,
    });
    return formatter.format(Number(amount || 0));
  } catch {
    return `${currencyCode} ${amount}`;
  }
}

function ShimmerCard() {
  return (
    <div className="ads-card tw:relative tw:overflow-hidden tw:rounded-4xl tw:border tw:border-white/70 tw:bg-white tw:p-6 tw:shadow-[0_25px_70px_rgba(15,23,42,0.08)]">
      <div className="ads-shimmer tw:absolute tw:inset-0" />
      <div className="tw:relative tw:space-y-4">
        <div className="tw:h-4 tw:w-24 tw:rounded-full tw:bg-slate-200/90" />
        <div className="tw:h-7 tw:w-2/3 tw:rounded-2xl tw:bg-slate-200/90" />
        <div className="tw:h-4 tw:w-full tw:rounded-full tw:bg-slate-200/90" />
        <div className="tw:h-4 tw:w-5/6 tw:rounded-full tw:bg-slate-200/90" />
        <div className="tw:mt-6 tw:h-12 tw:w-full tw:rounded-2xl tw:bg-slate-200/90" />
      </div>
    </div>
  );
}

export default function Ads() {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPackage, setSelectedPackage] = useState(null);

  useEffect(() => {
    let active = true;
    setLoading(true);

    api
      .get("/api/v1/ads/packages")
      .then((response) => {
        if (!active) return;
        setPackages(response?.data?.data || []);
      })
      .catch((error) => {
        console.error("Failed to load ads packages", error);
        toast.error("Unable to load ad plans right now");
      })
      .finally(() => {
        if (!active) return;
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const formattedPackages = useMemo(() => {
    return (packages || []).map((plan) => ({
      ...plan,
      formattedPrice: formatMoney(plan.price, plan.currency?.code || "NGN"),
    }));
  }, [packages]);

  const hasPlans = !loading && formattedPackages.length > 0;

  return (
    <div className="tw:font-sans tw:min-h-screen tw:px-4 tw:py-14 tw:md:px-10 tw:pt-0 tw:md:pt-32 tw:lg:pt-20">
      {/* local CSS for a nicer shimmer */}
      <style>{`
        .ads-shimmer {
          background: linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(148,163,184,0.25) 35%, rgba(255,255,255,0) 70%);
          transform: translateX(-120%);
          animation: adsShimmer 1.4s infinite;
        }
        @keyframes adsShimmer {
          0% { transform: translateX(-120%); }
          100% { transform: translateX(120%); }
        }
      `}</style>

      <div className="tw:mx-auto tw:flex tw:max-w-6xl tw:flex-col tw:gap-8">
        {/* HERO */}
        <div className="tw:relative tw:overflow-hidden tw:rounded-4xl tw:border tw:border-white/70 tw:bg-white/85 tw:p-8 tw:text-center tw:shadow-[0_30px_80px_rgba(15,23,42,0.10)]">
          <div className="tw:pointer-events-none tw:absolute tw:-top-24 tw:left-1/2 tw:h-64 tw:w-64 tw:-translate-x-1/2 tw:rounded-full tw:bg-primary/10 tw:blur-3xl" />
          <div className="tw:pointer-events-none tw:absolute tw:-bottom-24 tw:right-0 tw:h-64 tw:w-64 tw:rounded-full tw:bg-primary/10 tw:blur-3xl" />

          <Typography
            variant="span"
            component="span"
            className="tw:relative tw:text-3xl tw:font-bold tw:text-slate-900 tw:leading-tight tw:md:text-4xl"
          >
            Run ads and amplify your reach
          </Typography>

          <Typography className="tw:relative tw:mt-3 tw:text-base tw:text-slate-600 tw:md:text-lg">
            Pick a plan, upload your creative, set your schedule, and we’ll
            deliver it across the Xilolo community.
          </Typography>

          <div className="tw:relative tw:mx-auto tw:mt-6 tw:grid tw:max-w-3xl tw:grid-cols-1 tw:gap-3 tw:sm:grid-cols-3">
            <div className="tw:rounded-3xl tw:border tw:border-slate-200 tw:bg-white tw:px-4 tw:py-4">
              <div className="tw:text-xs tw:text-slate-500">Fast setup</div>
              <div className="tw:mt-1 tw:text-sm tw:font-semibold tw:text-slate-900">
                Upload + schedule
              </div>
            </div>
            <div className="tw:rounded-3xl tw:border tw:border-slate-200 tw:bg-white tw:px-4 tw:py-4">
              <div className="tw:text-xs tw:text-slate-500">Fair pricing</div>
              <div className="tw:mt-1 tw:text-sm tw:font-semibold tw:text-slate-900">
                Plans for every budget
              </div>
            </div>
            <div className="tw:rounded-3xl tw:border tw:border-slate-200 tw:bg-white tw:px-4 tw:py-4">
              <div className="tw:text-xs tw:text-slate-500">Clear delivery</div>
              <div className="tw:mt-1 tw:text-sm tw:font-semibold tw:text-slate-900">
                Duration + frequency
              </div>
            </div>
          </div>
        </div>

        {/* GRID */}
        <section className="tw:grid tw:grid-cols-1 tw:gap-5 tw:md:grid-cols-2 tw:lg:grid-cols-3">
          {loading &&
            Array.from({ length: 3 }).map((_, i) => <ShimmerCard key={i} />)}

          {!loading &&
            formattedPackages.map((plan) => (
              <article
                key={plan.id}
                className="tw:group tw:relative tw:flex tw:flex-col tw:justify-between tw:gap-5 tw:overflow-hidden tw:rounded-4xl tw:border tw:border-white/70 tw:bg-white tw:p-6 tw:shadow-[0_25px_70px_rgba(15,23,42,0.08)] tw:transition tw:duration-200 tw:hover:-translate-y-1"
              >
                {/* subtle accent */}
                <div className="tw:pointer-events-none tw:absolute tw:-top-24 tw:-right-24 tw:h-56 tw:w-56 tw:rounded-full tw:bg-primary/10 tw:blur-3xl tw:transition tw:duration-200 group-tw:hover:bg-primary/15" />

                <div className="tw:relative">
                  <div className="tw:flex tw:flex-wrap tw:items-center tw:gap-2">
                    <span className="tw:rounded-full tw:border tw:border-slate-200 tw:bg-slate-50 tw:px-3 tw:py-1 tw:text-[11px] tw:font-semibold tw:text-slate-700">
                      Ad Placement: {plan.placement.toUpperCase() || "Home & Stream"}
                    </span>
                    {/* <span className="tw:rounded-full tw:border tw:border-primary/20 tw:bg-primary/10 tw:px-3 tw:py-1 tw:text-[11px] tw:font-semibold tw:text-primary">
                      {String(plan.media_type || "image").toUpperCase()}
                    </span> */}
                  </div>

                  <Typography
                    variant="span"
                    className="tw:mt-3 tw:block tw:text-xl tw:font-semibold tw:text-slate-900"
                  >
                    {plan.name}
                  </Typography>

                  {plan.description && (
                    <Typography
                      variant="span"
                      className="tw:mt-2 tw:block tw:text-sm tw:leading-relaxed tw:text-slate-600"
                    >
                      {plan.description}
                    </Typography>
                  )}
                </div>

                <div className="tw:relative tw:space-y-3">
                  <div className="tw:flex tw:items-baseline tw:justify-between tw:gap-3">
                    <div className="tw:text-2xl tw:font-bold tw:text-slate-900">
                      {plan.formattedPrice}
                    </div>
                    <div className="tw:text-xs tw:text-slate-500">
                      {plan.duration_days
                        ? `${plan.duration_days} days`
                        : "Custom"}
                    </div>
                  </div>

                  <div className="tw:grid tw:grid-cols-2 tw:gap-2">
                    <div className="tw:rounded-3xl tw:border tw:border-slate-200 tw:bg-white tw:px-3 tw:py-3">
                      <div className="tw:text-[11px] tw:text-slate-500">
                        Delivery
                      </div>
                      <div className="tw:mt-1 tw:text-sm tw:font-semibold tw:text-slate-900">
                        {plan.display_duration
                          ? `${plan.display_duration}s`
                          : "—"}
                      </div>
                      <div className="tw:mt-1 tw:text-[11px] tw:text-slate-500">
                        {plan.frequency_limit
                          ? `${plan.frequency_limit} / ${plan.frequency_unit}`
                          : "—"}
                      </div>
                    </div>

                    <div className="tw:rounded-3xl tw:border tw:border-slate-200 tw:bg-white tw:px-3 tw:py-3">
                      <div className="tw:text-[11px] tw:text-slate-500">
                        Total plays
                      </div>
                      <div className="tw:mt-1 tw:text-sm tw:font-semibold tw:text-slate-900">
                        {plan.max_displays ? `${plan.max_displays}` : "—"}
                      </div>
                      <div className="tw:mt-1 tw:text-[11px] tw:text-slate-500">
                        {plan.duration_days
                          ? `in ${plan.duration_days} days`
                          : ""}
                      </div>
                    </div>
                  </div>

                  {plan.event_type?.name && (
                    <div className="tw:text-xs tw:text-slate-600">
                      Event:{" "}
                      <span className="tw:font-semibold">
                        {plan.event_type.name}
                      </span>
                    </div>
                  )}
                </div>

                <button
                  style={{
                    borderRadius: 12,
                    fontSize: 12,
                  }}
                  type="button"
                  onClick={() => setSelectedPackage(plan)}
                  className="tw:relative tw:w-full tw:rounded-2xl tw:bg-primary tw:px-6 tw:py-3 tw:text-sm tw:font-semibold tw:text-white tw:shadow-[0_16px_40px_rgba(99,102,241,0.20)] tw:transition tw:hover:brightness-95 active:tw:scale-[0.99]"
                >
                  Choose plan
                </button>
              </article>
            ))}
        </section>

        {/* EMPTY STATE */}
        {!loading && !hasPlans && (
          <div className="tw:rounded-4xl tw:border tw:border-slate-200 tw:bg-white tw:p-10 tw:text-center tw:shadow-[0_25px_70px_rgba(15,23,42,0.06)]">
            <div className="tw:text-lg tw:font-semibold tw:text-slate-900">
              No ad plans available right now
            </div>
            <div className="tw:mt-2 tw:text-sm tw:text-slate-600">
              Please check back shortly.
            </div>
          </div>
        )}
      </div>

      <AdsRequestDialog
        open={Boolean(selectedPackage)}
        selectedPackage={selectedPackage}
        onClose={() => setSelectedPackage(null)}
      />
    </div>
  );
}
