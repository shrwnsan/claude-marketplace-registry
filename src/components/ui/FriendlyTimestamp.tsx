import React from 'react';
import { friendlyDateParts } from '../../utils/format';

interface FriendlyTimestampProps {
  iso: string;
  className?: string;
}

/** "Sept 18th 2026, 14:36 UTC+08:00" — ordinal superscripted, viewer-local. */
const FriendlyTimestamp: React.FC<FriendlyTimestampProps> = ({ iso, className }) => {
  const parts = friendlyDateParts(iso);
  if (!parts) {
    return <span className={className}>{iso}</span>;
  }
  return (
    <span className={className}>
      {parts.month} {parts.day}
      <sup>{parts.ordinal}</sup> {parts.year}, {parts.time} {parts.offset}
    </span>
  );
};

export default FriendlyTimestamp;
