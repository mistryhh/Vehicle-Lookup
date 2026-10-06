// supabase.js
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

export const supabase = createClient(
  'https://dngzewsfdlvcyaijpozy.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRuZ3pld3NmZGx2Y3lhaWpwb3p5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc0MjQ4OTksImV4cCI6MjA2MzAwMDg5OX0.iHpc9MxZ0sJdg2h48B-5ED9ylw3ugr0x1yf0sCLtZwM'
);
