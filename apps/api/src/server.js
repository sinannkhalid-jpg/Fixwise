import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

import { createIncidentRouter } from './routes/incidents.js';
import { createEvidenceRouter } from './routes/evidence.js';
import { createMunicipalityRouter } from './routes/municipalities.js';

dotenv.config({ path: '../../.env.local' });
dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// Initialize Supabase Client
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('CRITICAL: Supabase URL or Key missing. Check .env.local');
}

const supabase = createClient(supabaseUrl || '', supabaseKey || '');

// Health Check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'Fixwise API Gateway', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/v1/incidents', createIncidentRouter(supabase));
app.use('/api/v1/incidents', createEvidenceRouter(supabase));
app.use('/api/v1/municipalities', createMunicipalityRouter(supabase));

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled API Error:', err);
  res.status(500).json({ success: false, error: err.message || 'Internal Server Error' });
});

app.listen(PORT, () => {
  console.log(`🚀 Fixwise API Gateway running on port ${PORT}`);
});
