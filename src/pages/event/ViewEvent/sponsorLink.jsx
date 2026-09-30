// Moved verbatim out of index.jsx so EventDetailView can render the sponsored-ticket
// section without a circular import. No behaviour change.
export function sponsorDisplayName(sponsor) {
  return sponsor?.username || sponsor?.user_name || sponsor?.name || "Someone";
}

export function sponsorProfilePath(sponsor) {
  const id = sponsor?.user_id || sponsor?.id || sponsor?.sponsor_user_id;
  return id ? `/profile/${id}` : null;
}

export function SponsorProfileLink({ sponsor, className = "" }) {
  const name = sponsorDisplayName(sponsor);
  const path = sponsorProfilePath(sponsor);

  if (!path) {
    return <span className={className}>{name}</span>;
  }

  return (
    <Link to={path} className={className}>
      {name}
    </Link>
  );
}
