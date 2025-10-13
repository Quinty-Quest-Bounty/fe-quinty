"use client";

import { useAlertDialog } from "./useAlertDialog";

export const useShare = () => {
  const { showAlert } = useAlertDialog();

  const shareLink = (path: string, title?: string) => {
    const url = `${window.location.origin}${path}`;
    navigator.clipboard.writeText(url);

    showAlert({
      title: "Link Copied!",
      description: title || "Share link copied to clipboard",
      variant: "success",
    });
  };

  return { shareLink };
};
