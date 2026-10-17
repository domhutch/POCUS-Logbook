interface ReviewFieldProps {
  label: string;
  value: string;
}

export function ReviewField({ label, value }: ReviewFieldProps) {
  return (
    <div className="review-field">
      <dt>{label}</dt>
      <dd>{value.trim() || "Not recorded"}</dd>
    </div>
  );
}
