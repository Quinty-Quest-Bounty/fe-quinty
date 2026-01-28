export async function GET() {
  const appUrl = "https://base.quinty.io";

  const manifest = {
    accountAssociation: {
    "header": "eyJmaWQiOjE1Nzc2MzIsInR5cGUiOiJhdXRoIiwia2V5IjoiMHhBMWQ0YTYzNDkwMjU5NTkzMmM2RDlmY2REZjZCNDRCRDcyMTE1OUMwIn0",
    "payload": "eyJkb21haW4iOiJiYXNlLnF1aW50eS5pbyJ9",
    "signature": "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAASAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAFwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABuIQXyOQUZBKZYFFlBFew7RkYkWP3U8gF0uT43fe54BZBWmSbqAuCx4t2fxvpWSxlYA0kDabE_zRv_R_gzxKZSQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAl8ZgIay2xclZzG8RWZzuWvO8j9R0fus3XxDee9lRlVy8dAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACKeyJ0eXBlIjoid2ViYXV0aG4uZ2V0IiwiY2hhbGxlbmdlIjoiNnVkOEdYWm9VQ0t3UzFYS0VKYXhnUjBTbGNTV1dUckVJZlFkN0NMMklYOCIsIm9yaWdpbiI6Imh0dHBzOi8va2V5cy5jb2luYmFzZS5jb20iLCJjcm9zc09yaWdpbiI6ZmFsc2V9AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"
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
      description: "A trustless collaboration platform",
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
