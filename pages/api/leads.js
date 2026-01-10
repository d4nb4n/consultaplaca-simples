import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    const { data: leads, error } = await supabase
      .from('leads')
      .select('*')
      .eq('visivel', true)
      .order('id', { ascending: false }); // Ordenação por ID decrescente

    if (error) throw error;

    // Enviamos o objeto mais completo e sem renomear chaves críticas
    const formattedLeads = leads.map(lead => ({
      ...lead,
      display_id: String(lead.id).padStart(5, '0'),
      date: new Date(lead.created_at).toLocaleDateString('pt-BR'),
      hour: new Date(lead.created_at).toLocaleTimeString('pt-BR'),
      // Mantemos name, telefone, email, cep, etc., como estão no banco
    }));

    return res.status(200).json(formattedLeads);
  } catch (err) {
    return res.status(500).json({ erro: err.message });
  }
}