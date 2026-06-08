import {
  Autocomplete,
  InputLabel,
  InputAdornment,
  MenuItem,
  Select,
  TextField,
  FormControl,
} from "@mui/material";
import DatePicker from "react-datepicker";
import {
  FiAlertCircle,
  FiCheckCircle,
  FiLock,
  FiMail,
  FiPhone,
  FiUser,
} from "react-icons/fi";
import {
  findPhoneCountryByDialCode,
  normalizeLocalPhoneNumber,
  PROFILE_PHONE_COUNTRIES,
} from "./profilePhoneUtils";

function ProfilePhoneField({
  label,
  value,
  onChange,
  verified,
  disabled = false,
  helperText,
}) {
  const selectedCountry = findPhoneCountryByDialCode(value?.countryCode);

  return (
    <div className="tw:space-y-2">
      <div className="tw:flex tw:items-center tw:justify-between tw:gap-3">
        <label className="tw:block tw:text-xs tw:font-medium tw:text-gray-700">
          {label}
        </label>
        {verified ? (
          <span className="tw:inline-flex tw:items-center tw:gap-1 tw:text-xs tw:font-medium tw:text-emerald-700 tw:bg-emerald-50 tw:px-2.5 tw:py-1 tw:rounded-full">
            <FiCheckCircle /> Verified
          </span>
        ) : (
          <span className="tw:inline-flex tw:items-center tw:gap-1 tw:text-xs tw:font-medium tw:text-amber-700 tw:bg-amber-50 tw:px-2.5 tw:py-1 tw:rounded-full">
            <FiAlertCircle /> Unverified
          </span>
        )}
      </div>

      <div className="tw:grid tw:grid-cols-[minmax(118px,145px)_1fr] tw:gap-2">
        <Autocomplete
          value={selectedCountry}
          options={PROFILE_PHONE_COUNTRIES}
          disabled={disabled}
          autoHighlight
          clearOnEscape={false}
          disableClearable
          getOptionLabel={(option) =>
            `${option.flag} ${option.dialCode} ${option.country}`
          }
          isOptionEqualToValue={(option, selected) =>
            option.code === selected.code && option.dialCode === selected.dialCode
          }
          onChange={(_, country) => {
            if (!country) return;
            onChange({ ...value, countryCode: country.dialCode });
          }}
          renderOption={(props, option) => (
            <li {...props} key={`${option.code}-${option.dialCode}`}>
              <span className="tw:mr-2">{option.flag}</span>
              <span className="tw:font-medium tw:mr-2">{option.dialCode}</span>
              <span className="tw:text-gray-500">{option.country}</span>
            </li>
          )}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Code"
              size="medium"
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: "12px",
                  backgroundColor: disabled ? "#f3f4f6" : "white",
                },
              }}
            />
          )}
        />

        <TextField
          label="Phone number"
          value={value?.number || ""}
          disabled={disabled}
          onChange={(event) =>
            onChange({
              ...value,
              number: normalizeLocalPhoneNumber(event.target.value),
            })
          }
          fullWidth
          size="medium"
          variant="outlined"
          placeholder="8035429908"
          inputProps={{
            inputMode: "numeric",
            pattern: "[0-9]*",
            maxLength: 25,
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <FiPhone className="tw:text-gray-400" />
              </InputAdornment>
            ),
          }}
          sx={{
            "& .MuiOutlinedInput-root": {
              borderRadius: "12px",
              backgroundColor: disabled ? "#f3f4f6" : "white",
            },
          }}
        />
      </div>

      <p className="tw:m-0 tw:text-[11px] tw:leading-4 tw:text-gray-500">
        {helperText || "Select your country code, then enter the phone number without the country code."}
      </p>
    </div>
  );
}

export default function ProfileInfoCard({
  formData,
  onChange,
  username,
  canChangeUsername,
  phoneNumber,
  setPhoneNumber,
  recoveryPhoneNumber,
  setRecoveryPhoneNumber,
  emailVerified,
  emailTwoVerified,
  phoneVerified,
  phoneTwoVerified,
  dobDate,
  setDobDate,
  updating,
  setUsernameOpen,
  setPasswordOpen,
  setVerifyOpen,
  recoveryPhoneLocked,
}) {
  return (
    <div className="tw:bg-white tw:rounded-3xl tw:px-2 tw:md:px-6 tw:py-7 tw:border tw:border-gray-100 tw:shadow-sm tw:space-y-6">
      <span className="tw:text-sm tw:font-medium tw:text-gray-700">
        Edit Profile Info
      </span>

      <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-2 tw:gap-4 tw:mt-4">
        <TextField
          label="First Name"
          name="firstName"
          value={formData.firstName}
          onChange={onChange}
          fullWidth
          size="medium"
          variant="outlined"
          sx={{ "& .MuiOutlinedInput-root": { borderRadius: "12px" } }}
        />
        <TextField
          label="Last Name"
          name="lastName"
          value={formData.lastName}
          onChange={onChange}
          fullWidth
          size="medium"
          variant="outlined"
          sx={{ "& .MuiOutlinedInput-root": { borderRadius: "12px" } }}
        />
      </div>

      <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-2 tw:gap-4">
        <div>
          <TextField
            label="Email Address"
            name="email"
            value={formData.email}
            onChange={onChange}
            fullWidth
            size="medium"
            variant="outlined"
            disabled={emailVerified}
            InputProps={{
              startAdornment: <FiMail className="tw:mr-2 tw:text-gray-400" />,
            }}
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: "12px",
                backgroundColor: emailVerified ? "#f3f4f6" : "white",
              },
            }}
          />
          <div className="tw:mt-1">
            {emailVerified ? (
              <span className="tw:inline-flex tw:items-center tw:gap-1 tw:text-xs tw:font-medium tw:text-emerald-700 tw:bg-emerald-50 tw:px-2.5 tw:py-1 tw:rounded-full">
                <FiCheckCircle /> Verified
              </span>
            ) : (
              <span className="tw:inline-flex tw:items-center tw:gap-1 tw:text-xs tw:font-medium tw:text-amber-700 tw:bg-amber-50 tw:px-2.5 tw:py-1 tw:rounded-full">
                <FiAlertCircle /> Unverified
              </span>
            )}
          </div>
        </div>

        <div>
          <TextField
            label="Recovery Email"
            name="email_two"
            value={formData.email_two}
            onChange={onChange}
            fullWidth
            size="medium"
            variant="outlined"
            disabled={emailTwoVerified}
            InputProps={{
              startAdornment: <FiMail className="tw:mr-2 tw:text-gray-400" />,
            }}
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: "12px",
                backgroundColor: emailTwoVerified ? "#f3f4f6" : "white",
              },
            }}
          />
        </div>
      </div>

      <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-2 tw:gap-4">
        <ProfilePhoneField
          label="Primary Phone Number"
          value={phoneNumber}
          onChange={setPhoneNumber}
          verified={phoneVerified}
          helperText="Example: choose Nigeria +234, then enter 8035429908."
        />

        <ProfilePhoneField
          label="Recovery Phone"
          value={recoveryPhoneNumber}
          onChange={setRecoveryPhoneNumber}
          verified={phoneTwoVerified}
          disabled={recoveryPhoneLocked}
          helperText={
            recoveryPhoneLocked
              ? "This recovery phone is already saved. Contact support if you need to change it."
              : "Optional. Use a second number that can receive verification messages."
          }
        />
      </div>

      <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-2 tw:gap-4">
        <div>
          <label className="tw:block tw:text-xs tw:font-medium tw:text-gray-700 tw:mb-1">
            Date of Birth
          </label>
          <div className="tw:w-full tw:h-11 tw:rounded-2xl tw:border tw:border-gray-200 tw:flex tw:items-center tw:px-3 focus-within:tw:border-primary focus-within:tw:ring-2 focus-within:tw:ring-primary/20">
            <DatePicker
              selected={dobDate}
              onChange={(d) => setDobDate(d)}
              dateFormat="MM/dd/yyyy"
              placeholderText="MM/DD/YYYY"
              showMonthDropdown
              showYearDropdown
              dropdownMode="select"
              maxDate={new Date()}
              className="tw:w-full tw:outline-none tw:text-sm"
            />
          </div>
        </div>

        <FormControl
          fullWidth
          size="medium"
          sx={{
            "& .MuiOutlinedInput-root": { borderRadius: "12px" },
          }}
        >
          <InputLabel id="gender-label">Gender</InputLabel>
          <Select
            labelId="gender-label"
            label="Gender"
            name="gender"
            value={formData.gender}
            onChange={onChange}
          >
            <MenuItem value="">
              <em>Prefer not to say</em>
            </MenuItem>
            <MenuItem value="male">Male</MenuItem>
            <MenuItem value="female">Female</MenuItem>
            <MenuItem value="other">Other</MenuItem>
          </Select>
        </FormControl>
      </div>

      <TextField
        label="About Me"
        name="about"
        value={formData.about}
        onChange={onChange}
        fullWidth
        multiline
        minRows={3}
        variant="outlined"
        size="medium"
        placeholder="Tell organisers a bit about yourself..."
        sx={{
          "& .MuiOutlinedInput-root": { borderRadius: "12px" },
        }}
      />

      <div className="tw:pt-4 tw:space-y-3">
        <button
          type="button"
          onClick={() => setUsernameOpen(true)}
          className="tw:flex tw:items-center tw:justify-between tw:w-full tw:rounded-2xl tw:border tw:border-gray-100 tw:hover:border-gray-200 tw:bg-gray-50 tw:hover:bg-gray-100 tw:px-4 tw:py-3 tw:transition"
        >
          <span className="tw:flex tw:items-center tw:gap-2 tw:text-gray-800">
            <FiUser className="tw:text-gray-500" />
            <span className="tw:flex tw:flex-col tw:items-start">
              <span className="tw:font-medium tw:text-sm">Username</span>
              <span className="tw:text-xs tw:text-gray-500">
                {username ? `${username}` : "No username set"}
              </span>
              
            </span>
          </span>
          <span className="tw:flex tw:items-center tw:gap-2">
            <span
              className={`tw:text-xs tw:px-2 tw:py-1 tw:rounded-full ${
                canChangeUsername
                  ? "tw:bg-emerald-50 tw:text-emerald-700"
                  : "tw:bg-gray-100 tw:text-gray-600"
              }`}
            >
              {canChangeUsername ? "Edit" : "Unavailable"}
            </span>
            <span className="tw:text-gray-400 tw:text-lg">›</span>
          </span>
        </button>

        <button
          type="button"
          onClick={() => setPasswordOpen(true)}
          className="tw:flex tw:items-center tw:justify-between tw:w-full tw:rounded-2xl tw:border tw:border-gray-100 tw:hover:border-gray-200 tw:bg-gray-50 tw:hover:bg-gray-100 tw:px-4 tw:py-3 tw:transition"
        >
          <span className="tw:flex tw:items-center tw:gap-2 tw:text-gray-800">
            <FiLock className="tw:text-gray-500" />
            <span className="tw:font-medium tw:text-sm">Set Password</span>
          </span>
          <span className="tw:text-gray-400 tw:text-lg">›</span>
        </button>
      </div>
    </div>
  );
}
