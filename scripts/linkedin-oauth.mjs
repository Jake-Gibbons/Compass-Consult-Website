const AUTHORIZE_URL = "https://www.linkedin.com/oauth/v2/authorization";
const TOKEN_URL = "https://www.linkedin.com/oauth/v2/accessToken";

function missing() {
  console.log("LinkedIn OAuth helper is not configured. Set LINKEDIN_CLIENT_ID, LINKEDIN_CLIENT_SECRET and LINKEDIN_REDIRECT_URI locally. Do not commit those values.");
  process.exit(0);
}

const clientId = process.env.LINKEDIN_CLIENT_ID;
const clientSecret = process.env.LINKEDIN_CLIENT_SECRET;
const redirectUri = process.env.LINKEDIN_REDIRECT_URI;
if (!clientId || !clientSecret || !redirectUri) missing();

const code = process.argv[2];
if (!code) {
  const url = new URL(AUTHORIZE_URL);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("scope", "r_organization_social");
  url.searchParams.set("state", "compass-company-news");
  console.log("Open this URL as a Compass Consult company page admin, then run this command again with the returned code:");
  console.log(url.toString());
  process.exit(0);
}

const response = await fetch(TOKEN_URL, {
  method: "POST",
  headers: { "Content-Type": "application/x-www-form-urlencoded" },
  body: new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri,
    client_id: clientId,
    client_secret: clientSecret
  })
});

if (!response.ok) {
  console.error(`LinkedIn token exchange failed (${response.status}).`);
  process.exit(1);
}

const payload = await response.json();
console.log("Copy these into GitHub Actions secrets. Do not commit them.");
console.log(`LINKEDIN_ACCESS_TOKEN=${payload.access_token || ""}`);
console.log(`LINKEDIN_REFRESH_TOKEN=${payload.refresh_token || ""}`);
if (payload.expires_in) console.log(`Access token expires in ${payload.expires_in} seconds.`);
