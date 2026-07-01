import { createClient } from '@supabase/supabase-js';
import { supabaseSimulation } from './supabaseSimulation';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Detect if we should run in simulation mode
export const isSimulationMode = 
  !supabaseUrl || 
  !supabaseAnonKey || 
  supabaseUrl === 'YOUR_SUPABASE_URL' || 
  supabaseUrl === '';

if (isSimulationMode) {
  console.info("%c[HQ Pickle DB] Running in Simulation Mode (LocalStorage fallback). Make a .env.local file to connect to real Supabase.", "color: #10b981; font-weight: bold; font-size: 11px;");
}

export const supabase = isSimulationMode 
  ? supabaseSimulation 
  : createClient(supabaseUrl, supabaseAnonKey);
