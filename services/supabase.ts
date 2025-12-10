
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://shefpicgjngyqpeuwcgw.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNoZWZwaWNnam5neXFwZXV3Y2d3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUzNTc1ODksImV4cCI6MjA4MDkzMzU4OX0.t7gs82LKk6UHvYIp5cKVL6VJVnXcc5L0sp24pnhYRp4';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
