export function isUserAccountVerified(user) {
  if (!user) return false;

  return Boolean(
    user.email_verified ||
      user.email_verified_at ||
      user.phone_verified ||
      user.phone_verified_at
  );
}

export function mergeVerifiedContactUser(baseUser, responseUser, type, verifiedAt) {
  const nextUser = {
    ...(baseUser || {}),
    ...(responseUser || {}),
  };
  const timestamp = verifiedAt || new Date().toISOString();

  if (type === "phone") {
    nextUser.phone_verified = true;
    nextUser.phone_verified_at = nextUser.phone_verified_at || timestamp;
    return nextUser;
  }

  nextUser.email_verified = true;
  nextUser.email_verified_at = nextUser.email_verified_at || timestamp;
  return nextUser;
}
