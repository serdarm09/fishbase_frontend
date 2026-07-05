## FishBase Frontend

Next.js 15 application for FishBase as a Base App ready standard web app. It handles Base wallet sign-in, animated map gameplay, daily claims, NFT management, and the fishing mini-game.

### Installation

```bash
npm install
```

### Required Environment Variables

Create `.env.local` from `env.local.sample`:

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_BASE_APP_ID=6a01ca209ee68cd142d1b1ac
NEXT_PUBLIC_CHAIN_ID=8453
NEXT_PUBLIC_BASE_RPC_URL=https://mainnet.base.org
NEXT_PUBLIC_BOOST_NFT_ADDRESS=0x41d14d5908a107bAa86b5CB3Fac4B9f0226A36eD
NEXT_PUBLIC_BOAT_NFT_ADDRESS=0x667dA3BB4EDaE93c71427D17D74Df430aA34B09F
NEXT_PUBLIC_FISH_TOKEN_ADDRESS=0x1208863b62dF2b0e086cE4ac98a7b099b52Ef104
NEXT_PUBLIC_GAME_CONTROLLER_ADDRESS=0xf1a37E37D2b1faFA9D495D50b7E82C33e9878FA1
NEXT_PUBLIC_USDC_ADDRESS=0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913
```

- `NEXT_PUBLIC_API_URL` should include `/api`; the helper automatically appends it if you omit the suffix.
- `NEXT_PUBLIC_APP_URL` must match the primary URL registered in Base.dev.
- `NEXT_PUBLIC_BASE_APP_ID` mirrors the Base.dev project id; the root layout also emits `base:app_id` for verification.
- Contract addresses can be updated once you deploy to Base.

### Development server

```bash
npm run dev
```

Navigate to [http://localhost:3000](http://localhost:3000) after the server starts.

### Notes

- Base App treats apps as standard web apps, so wallet login is the primary authentication path.
- Test/demo login has been removed; only Base wallet sign-in is exposed in the UI.
- Backend must expose Firebase service account variables and a strong `JWT_SECRET` for authentication and storage.
