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
      .order('created_at', { ascending: false });

    if (error) throw error;

    const formattedLeads = leads.map(lead => ({
      id: String(lead.id).padStart(5, '0'), // Formata o ID int8 para ter 5 dígitos
      real_id: lead.id,
      name: lead.name, // Lendo da coluna 'name' em inglês
      phone: lead.telefone,
      plate: lead.placa,
      date: new Date(lead.created_at).toLocaleDateString('pt-BR'),
      hour: new Date(lead.created_at).toLocaleTimeString('pt-BR'),
      vehicle: lead.veiculo || 'Pendente',
      year: lead.ano || 'Pendente',
      status: lead.status || 'Novo',
      consultant: "Admin Master"
    }));

    return res.status(200).json(formattedLeads);
  } catch (err) {
    return res.status(500).json({ erro: err.message });
  }
}