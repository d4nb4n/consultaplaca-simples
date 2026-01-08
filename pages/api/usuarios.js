import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    if (req.method === "POST") {
      const { nome, email, password, role } = req.body;
      const { error } = await supabase.from('usuarios').insert([{ nome, email, password, role }]);
      if (error) throw error;
      return res.status(200).json({ sucesso: true });
    }

    const { data: users, error } = await supabase.from('usuarios').select('id, nome, email, role');
    if (error) throw error;
    return res.status(200).json(users);
  } catch (err) {
    return res.status(500).json({ erro: err.message });
  }
}