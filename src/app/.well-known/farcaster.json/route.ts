export async function GET() {
  const appUrl = "https://base.quinty.io";

  const manifest = {
    accountAssociation: {
      header: "",
      payload: "",
      signature: "",
    },
    frame: {
      version: "1",
      name: "Quinty",
      iconUrl: `${appUrl}/images/quinty-logo.png`,
      homeUrl: appUrl,
      imageUrl: `${appUrl}/images/quinty-green.png`,
      buttonTitle: "Open Quinty",
      splashImageUrl: `${appUrl}/images/quinty-green.png`,
      splashBackgroundColor: "#ffffff",
      webhookUrl: `${appUrl}/api/webhook`,
    },
    miniapp: {
      version: "1",
      name: "Quinty",
      homeUrl: appUrl,
      iconUrl: `${appUrl}/images/quinty-logo.png`,
      splashImageUrl: `${appUrl}/images/quinty-green.png`,
      splashBackgroundColor: "#ffffff",
      webhookUrl: `${appUrl}/api/webhook`,
      subtitle: "Trustless Quests & Bounties",
      description: "A trustless collaboration platform built on Base that combines on-chain bounties, grants, and crowdfunding with permanent soulbound reputation.",
      screenshotUrls: [
        `${appUrl}/images/quinty-green.png`,
      ],
      primaryCategory: "social",
      tags: ["quinty", "bounty", "quest", "base", "miniapp"],
      heroImageUrl: `${appUrl}/images/quinty-green.png`,
      tagline: "Escrow replaces trust with truth.",
      ogTitle: "Quinty - Quest and Bounty",
      ogDescription: "Trustless on-chain collaboration platform on Base.",
      ogImageUrl: `${appUrl}/images/quinty-green.png`,
      noindex: false
    }
  };

  return Response.json(manifest);
}
