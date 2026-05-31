import React, { Fragment, useMemo, useState } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { Autocomplete, TextField, Switch } from "@mui/material";
import { api, authHeaders } from "../../lib/apiClient";
import { showError, showPromise } from "../../component/ui/toast";

export default function AddWalletModal({
  open,
  onClose,
  token,
  options = [],
  onCreated,
}) {
  const [selectedCurrency, setSelectedCurrency] = useState(null);
  const [selectedNetwork, setSelectedNetwork] = useState("");
  const [address, setAddress] = useState("");
  const [networkType, setNetworkType] = useState("prod");
  const [isPrimary, setIsPrimary] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const networksForCurrency = useMemo(() => {
    if (!selectedCurrency) return [];
    return selectedCurrency.networks || [];
  }, [selectedCurrency]);

  function resetState() {
    setSelectedCurrency(null);
    setSelectedNetwork("");
    setAddress("");
    setNetworkType("prod");
    setIsPrimary(true);
    setSubmitting(false);
  }

  function handleClose() {
    if (submitting) return;
    resetState();
    onClose?.();
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!selectedCurrency) {
      showError("Select a crypto asset first.");
      return;
    }
    if (!selectedNetwork) {
      showError("Select a network for this asset.");
      return;
    }
    if (!address.trim()) {
      showError("Enter a wallet address.");
      return;
    }

    const payload = {
      currency: selectedCurrency.symbol,
      network: selectedNetwork,
      address: address.trim(),
      network_type: networkType,
      is_primary: isPrimary,
    };

    const request = api
      .post("/api/v1/crypto-wallets", payload, authHeaders(token))
      .then((res) => {
        // support both old and new response shapes
        const wallet =
          res?.data?.wallet || res?.data?.data || res?.data || null;
        const ownership = res?.data?.ownership || null;

        if (wallet && onCreated) {
          // send both wallet and ownership up
          onCreated(wallet, ownership);
        }

        resetState();
        onClose?.();
        return wallet;
      });

    setSubmitting(true);
    try {
      await showPromise(request, {
        loading: "Saving wallet…",
        success: "Wallet added successfully.",
        error: "Could not save wallet.",
      });
    } catch (err) {
      if (!err.__handled) {
        showError("Something went wrong while saving wallet.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog as="div" className="tw:relative tw:z-50" onClose={handleClose}>
        <Transition.Child
          as={Fragment}
          enter="tw:ease-out tw:duration-200"
          enterFrom="tw:opacity-0"
          enterTo="tw:opacity-100"
          leave="tw:ease-in tw:duration-150"
          leaveFrom="tw:opacity-100"
          leaveTo="tw:opacity-0"
        >
          <div className="tw:fixed tw:inset-0 tw:bg-black/40 tw:backdrop-blur-sm" />
        </Transition.Child>

        <div className="tw:fixed tw:inset-0 tw:overflow-y-auto">
          <div className="tw:flex tw:min-h-full tw:items-center tw:justify-center tw:px-4 tw:py-4 tw:sm:py-8">
            <Transition.Child
              as={Fragment}
              enter="tw:ease-out tw:duration-200"
              enterFrom="tw:opacity-0 tw:scale-95 tw:translate-y-2"
              enterTo="tw:opacity-100 tw:scale-100 tw:translate-y-0"
              leave="tw:ease-in tw:duration-150"
              leaveFrom="tw:opacity-100 tw:scale-100 tw:translate-y-0"
              leaveTo="tw:opacity-0 tw:scale-95 tw:translate-y-2"
            >
              <Dialog.Panel className="tw:w-full tw:max-w-xl tw:max-h-[70vh] tw:sm:max-h-[85vh] tw:overflow-y-auto tw:rounded-3xl tw:bg-white tw:border tw:border-[#ded6cd] tw:shadow-[0_18px_60px_rgba(15,23,42,0.18)] tw:p-6 tw:sm:p-7 tw:md:p-8">
                <div className="tw:flex tw:items-start tw:justify-between tw:gap-4">
                  <div className="tw:space-y-1.5">
                    <span className="tw:block tw:text-base tw:sm:text-lg tw:font-semibold tw:text-[#050505]">
                      Add crypto payout wallet
                    </span>
                    <span className="tw:block tw:text-xs tw:sm:text-sm tw:text-[#5f5a55]">
                      Connect a verified address where you want to receive your
                      event payouts and tips.
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={handleClose}
                    className="tw:shrink-0 tw:inline-flex tw:h-8 tw:w-8 tw:items-center tw:justify-center tw:rounded-full tw:bg-lightPurple tw:text-primary tw:hover:bg-[#e2d9ce] tw:transition"
                  >
                    <span className="tw:text-lg tw:leading-none">×</span>
                  </button>
                </div>

                <form
                  onSubmit={handleSubmit}
                  className="tw:mt-6 tw:space-y-5 tw:sm:space-y-6"
                >
                  {/* Asset (MUI ComboBox) */}
                  <div className="tw:space-y-2">
                    <span className="tw:block tw:text-xs tw:font-medium tw:tracking-wide tw:text-[#4e4942]">
                      Asset
                    </span>
                    <div className="tw:w-full">
                      <Autocomplete
                        options={options}
                        value={selectedCurrency}
                        onChange={(_, val) => {
                          setSelectedCurrency(val);
                          setSelectedNetwork("");
                        }}
                        size="small"
                        disableClearable={false}
                        getOptionLabel={(opt) =>
                          opt
                            ? `${opt.symbol?.toUpperCase()} • ${opt.name}`
                            : ""
                        }
                        isOptionEqualToValue={(opt, val) =>
                          opt?.symbol === val?.symbol
                        }
                        renderOption={(props, opt) => (
                          <li
                            {...props}
                            className="tw:flex tw:w-full tw:items-center tw:justify-between tw:px-3.5 tw:py-2.5 tw:cursor-pointer tw:text-sm tw:text-[#050505]"
                          >
                            <span className="tw:flex tw:flex-col tw:gap-0.5">
                              <span className="tw:text-sm tw:font-medium tw:text-[#050505]">
                                {opt.symbol?.toUpperCase()} • {opt.name}
                              </span>
                              <span className="tw:text-[11px] tw:text-[#6d655d]">
                                {(opt.networks || []).join(" • ")}
                              </span>
                            </span>
                          </li>
                        )}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            placeholder="Pick the asset you want to receive payouts in"
                            InputProps={{
                              ...params.InputProps,
                            }}
                            sx={{
                              "& .MuiOutlinedInput-root": {
                                borderRadius: "16px",
                                backgroundColor: "#e5e4e2",
                                fontSize: "0.8rem",
                                paddingRight: "10px",
                              },
                              "& .MuiOutlinedInput-notchedOutline": {
                                borderColor: "#ded6cd",
                              },
                              "&:hover .MuiOutlinedInput-notchedOutline": {
                                borderColor: "#c8beb2",
                              },
                              "&.Mui-focused .MuiOutlinedInput-notchedOutline":
                                {
                                  borderColor: "#050505",
                                },
                            }}
                          />
                        )}
                        noOptionsText="No crypto options available yet."
                      />
                    </div>
                  </div>

                  {/* Network */}
                  <div className="tw:space-y-2">
                    <span className="tw:block tw:text-xs tw:font-medium tw:tracking-wide tw:text-[#4e4942]">
                      Network
                    </span>
                    <div className="tw:flex tw:flex-wrap tw:gap-2">
                      {networksForCurrency.length ? (
                        networksForCurrency.map((net) => {
                          const active = selectedNetwork === net;
                          return (
                            <button
                              style={{
                                borderRadius: 16,
                              }}
                              type="button"
                              key={net}
                              onClick={() => setSelectedNetwork(net)}
                              className={[
                                "tw:px-3 tw:py-1.5 tw:rounded-full tw:text-[11px] tw:uppercase tw:tracking-wide tw:border tw:transition tw:flex tw:items-center tw:gap-1.5",
                                active
                                  ? "tw:border-primary tw:bg-lightPurple tw:text-primary"
                                  : "tw:border-[#ded6cd] tw:bg-[#e5e4e2] tw:text-[#625c55] tw:hover:border-[#c8beb2]",
                              ].join(" ")}
                            >
                              <span className="tw:inline-block tw:h-1.5 tw:w-1.5 tw:rounded-full tw:bg-primary" />
                              <span>{net}</span>
                            </button>
                          );
                        })
                      ) : (
                        <span className="tw:text-[11px] tw:text-[#8c8378]">
                          Pick an asset first to see available networks.
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Address */}
                  <div className="tw:space-y-2">
                    <span className="tw:block tw:text-xs tw:font-medium tw:tracking-wide tw:text-[#4e4942]">
                      Wallet address
                    </span>
                    <div className="tw:relative">
                      <textarea
                        rows={2}
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        className="tw:block tw:w-full tw:rounded-2xl tw:border tw:border-[#ded6cd] tw:bg-[#e5e4e2] tw:px-4 tw:py-3 tw:text-xs tw:text-[#050505] placeholder:tw:text-[#a89f95] focus:tw:outline-none focus:tw:ring-2 focus:tw:ring-primary/25 focus:tw:border-transparent tw:resize-none"
                        placeholder="Paste the exact address from your wallet app…"
                      />
                    </div>
                  </div>

                  {/* Network type + primary */}
                  <div className="tw:flex tw:flex-col tw:sm:flex-row tw:gap-4">
                    <div className="tw:flex-1 tw:space-y-2">
                    <span className="tw:block tw:text-xs tw:font-medium tw:tracking-wide tw:text-[#4e4942]">
                        Network type
                      </span>
                      <div className="tw:flex tw:gap-2">
                        {["prod", "testnet"].map((type) => {
                          const active = networkType === type;
                          return (
                            <button
                              style={{
                                borderRadius: 16,
                              }}
                              key={type}
                              type="button"
                              onClick={() => setNetworkType(type)}
                              className={[
                                "tw:flex-1 tw:px-3 tw:py-2 tw:rounded-2xl tw:text-[11px] tw:uppercase tw:tracking-wide tw:border tw:transition",
                                active
                                  ? "tw:border-primary tw:bg-lightPurple tw:text-primary"
                                  : "tw:border-[#E2E8F0] tw:bg-[#F8FAFC] tw:text-[#64748B] tw:hover:border-primary/60",
                              ].join(" ")}
                            >
                              <span>
                                {type === "prod" ? "Live payouts" : "Sandbox"}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Primary wallet with MUI Switch */}
                    <div className="tw:flex-1 tw:space-y-2">
                      <span className="tw:block tw:text-xs tw:font-medium tw:tracking-wide tw:text-[#56409E]">
                        Primary wallet
                      </span>
                      <div
                        style={{
                          borderRadius: 16,
                        }}
                        className={[
                          "tw:flex tw:w-full tw:items-center tw:justify-between tw:rounded-2xl tw:border tw:px-3 tw:py-2.5 tw:text-xs tw:transition",
                          isPrimary
                            ? "tw:bg-lightPurple tw:border-primary/80"
                            : "tw:bg-[#F8FAFC] tw:border-[#E2E8F0]",
                        ].join(" ")}
                      >
                        <span className="tw:flex tw:flex-col tw:gap-0.5">
                          <span className="tw:text-[11px] tw:text-[#0F172A]">
                            Make this wallet the default destination
                          </span>
                          <span className="tw:text-[10px] tw:text-[#64748B]">
                            Your primary wallet will be used for payouts unless
                            you choose a different one per event.
                          </span>
                        </span>
                        <Switch
                          checked={isPrimary}
                          onChange={(e) => setIsPrimary(e.target.checked)}
                          size="small"
                          sx={{
                            "& .MuiSwitch-switchBase.Mui-checked": {
                              color: "#050505",
                            },
                            "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track":
                              {
                                backgroundColor: "#050505",
                              },
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Footer actions */}
                  <div className="tw:mt-4 tw:flex tw:flex-col tw:sm:flex-row tw:items-center tw:justify-between tw:gap-3">
                    <div className="tw:flex tw:w-full tw:sm:w-auto tw:justify-end tw:gap-2">
                      <button
                        style={{
                          borderRadius: 16,
                        }}
                        type="button"
                        onClick={handleClose}
                        disabled={submitting}
                        className="tw:h-10 tw:px-4 tw:rounded-2xl tw:text-xs tw:font-medium tw:border tw:border-[#E2E8F0] tw:text-[#0F172A] tw:bg-white tw:hover:bg-[#F9FAFB] tw:transition disabled:tw:opacity-50"
                      >
                        <span>Cancel</span>
                      </button>
                      <button
                        style={{
                          borderRadius: 16,
                        }}
                        type="submit"
                        disabled={submitting}
                        className="tw:h-10 tw:px-5 tw:rounded-2xl tw:text-xs tw:font-semibold tw:text-white tw:bg-[linear-gradient(135deg,#050505,#2b2b2b)] tw:shadow-[0_12px_35px_rgba(0,0,0,0.24)] tw:hover:scale-[1.01] tw:transition tw:flex tw:items-center tw:gap-2 disabled:tw:opacity-60 disabled:tw:hover:scale-100"
                      >
                        {submitting && (
                          <span className="tw:inline-block tw:h-3 tw:w-3 tw:rounded-full tw:border tw:border-white/40 tw:border-t-transparent tw:animate-spin" />
                        )}
                        <span>{submitting ? "Saving…" : "Save wallet"}</span>
                      </button>
                    </div>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}
