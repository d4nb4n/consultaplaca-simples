import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();

  const { id, field, value } = req.body;

  // Mapeamento: O que vem do site -> O que está no Supabase
  const columnMap = {
    'vehicle': 'veiculo',
    'year': 'ano',
    'status': 'status'
  };

  const targetColumn = columnMap[field] || field;

  try {
    const { error } = await supabase
      .from('leads')
      .update({ [targetColumn]: value })
      .eq('id', id);

    if (error) throw error;
    return res.status(200).json({ sucesso: true });
  } catch (err) {
    return res.status(500).json({ erro: err.message });
  }
}