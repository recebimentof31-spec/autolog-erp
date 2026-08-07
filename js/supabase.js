const SUPABASE_URL = "https://qqhemzjawgrvpfcmhzfr.supabase.co";
const SUPABASE_KEY = "sb_publishable_5BOw2uPipgP7OGk02Kbfsg_cN6nhp_q";

const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);

console.log("Supabase conectado!");