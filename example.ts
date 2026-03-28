import { withType } from "./src/generateType";
import { User } from "./types/User";

// After the first run generates ./types/User.ts, import the type:
// import { User } from "./types/User";
// then use: withType<User>("User", data)

async function main() {
  const res = await fetch("https://api.kotofi.fun/api/v1/raydium-token/list?sort=lastTrade");
  const data = await res.json();

  // withType generates the type file AND returns the data typed as T
  const user = await withType<any>("RaydiumToken", data);

  console.log("Typed user:", user.name, user.email);
}

main().catch(console.error);
