import React from 'react';
import { InfluencerManagementView } from './InfluencerManagementView';

interface TargetManagementViewProps {
  userRole?: string;
  onTargetUpdated?: () => void;
}

export const TargetManagementView: React.FC<TargetManagementViewProps> = ({ userRole, onTargetUpdated }) => {
  return (
    <InfluencerManagementView
      userRole={userRole}
      initialTab="targets"
      onTargetUpdated={onTargetUpdated}
    />
  );
};
