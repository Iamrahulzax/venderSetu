import { Router, Request, Response } from 'express';
import { supabase, testSupabaseConnection } from '../config/supabase.js';

const router = Router();

/**
 * @route   GET /api/supabase/status
 * @desc    Test Supabase connection and verify project credentials
 * @access  Public
 */
router.get('/status', async (_req: Request, res: Response) => {
  const result = await testSupabaseConnection();
  res.json({
    success: result.connected,
    supabaseUrl: process.env.SUPABASE_URL || 'https://aaifibfkfzkqkipdolxg.supabase.co',
    message: result.message,
    timestamp: new Date().toISOString()
  });
});

/**
 * @route   POST /api/supabase/query
 * @desc    Generic endpoint to query a Supabase table from the backend
 * @access  Public
 */
router.post('/query', async (req: Request, res: Response) => {
  try {
    const { table, select = '*', limit = 10 } = req.body;
    if (!table) {
      return res.status(400).json({ success: false, message: 'Table name is required' });
    }

    const { data, error } = await supabase
      .from(table)
      .select(select)
      .limit(limit);

    if (error) {
      return res.status(400).json({ success: false, error: error.message });
    }

    res.json({ success: true, count: data?.length || 0, data });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
