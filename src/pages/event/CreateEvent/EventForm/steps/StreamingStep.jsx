import React from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import SelectField from "../../../../../component/form/SelectField";

const STREAM_OPTS = ["in_app", "rtmp", "zoom"].map((v) => ({
  value: v,
  label: v,
}));

const schema = z.object({
  streamingOption: z.string().min(1, "Please select a streaming option"),
  enableReplay: z.boolean().default(true),
  streamingDuration: z.string().optional(),
});

export default function StreamingStep({ defaultValues = {}, onBack, onNext }) {
  const {
    handleSubmit,
    register,
    formState: { errors },
    setValue,
    watch,
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      enableReplay: true,
      streamingOption: "",
      streamingDuration: "24",
      ...defaultValues,
    },
  });

  const duration = watch("streamingDuration");
  const selectedOption = watch("streamingOption");

  const submit = (v) => onNext(v);

  return (
    <form
      onSubmit={handleSubmit(submit)}
      className="tw:bg-white tw:rounded-2xl tw:p-5 tw:sm:p-7 tw:border tw:border-gray-100"
    >
      <span className="tw:block tw:text-lg tw:lg:text-2xl tw:sm:text-lg tw:font-semibold tw:mb-5">
        How will you stream this event?
      </span>

      <div className="tw:space-y-5">
        <SelectField
          label="Streaming Options*"
          value={selectedOption}
          onChange={(v) =>
            setValue("streamingOption", v, { shouldValidate: true })
          }
          options={STREAM_OPTS}
          error={errors?.streamingOption?.message}
        />

        <div className="tw:flex tw:items-center tw:justify-between">
          <span className="tw:text-[15px]">Enable Event Replay</span>
          <label className="tw:inline-flex tw:items-center tw:gap-2">
            <input
              type="checkbox"
              {...register("enableReplay")}
              className="tw:accent-primary"
            />
          </label>
        </div>

        <div>
          <label className="tw:block tw:text-[15px] tw:mb-1">
            Replay Duration
          </label>
          <div className="tw:flex tw:flex-wrap tw:gap-2">
            {["24", "48", "72"].map((h) => {
              const active = duration === h;
              return (
                <button
                  type="button"
                  key={h}
                  onClick={() => setValue("streamingDuration", h)}
                  className={`tw:px-3 tw:py-2 tw:rounded-xl! tw:text-[15px] ${
                    active
                      ? "tw:bg-primary tw:text-white"
                      : "tw:border tw:border-gray-200 tw:hover:bg-gray-50"
                  }`}
                >
                  {h} Hours
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="tw:flex tw:justify-between tw:mt-6">
        <button
          style={{
            borderRadius: 20,
          }}
          type="button"
          onClick={onBack}
          className="tw:px-4 tw:py-2 tw:rounded-xl! tw:border tw:border-gray-200 tw:hover:bg-gray-50"
        >
          Back
        </button>
        <button
          style={{
            borderRadius: 20,
          }}
          type="submit"
          className="tw:px-4 tw:py-2 tw:rounded-xl! tw:bg-primary tw:text-white tw:hover:bg-primarySecond"
        >
          Next
        </button>
      </div>
    </form>
  );
}
