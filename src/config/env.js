import { createClient } from "@supabase/supabase-js";

// Production Supabase
export const supabase = createClient(
  "https://svpzwuscvkpqrhupempr.supabase.co",
  import.meta.env.VITE_SUPABASE_PROD_API_KEY
);

export const supabaseUser = createClient(
  "https://fejpxbvhduhsghikdlmw.supabase.co",
  import.meta.env.VITE_SUPABASE_USER_API_KEY
);

// UAT Supabase
// export const supabase = createClient(
//   "https://jhoaxxnygytxlensdyoj.supabase.co",
//   import.meta.env.VITE_SUPABASE_UAT_API_KEY
// );

// export const API = "http://localhost:8000";
export const API =
  "https://mcore-backend-cgh7bzgtfkakd2a3.canadacentral-01.azurewebsites.net";
