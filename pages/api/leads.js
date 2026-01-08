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

    // Ajuste de formato para o Frontend (mapeando campos do banco para o que o painel espera)
    const formattedLeads = leads.map(lead => ({
      id: lead.id.substring(0, 5), // ID curto de 5 caracteres
      real_id: lead.id, // ID completo para exclusão
      name: lead.nome,
      phone: lead.telefone,
      plate: lead.placa,
      date: new Date(lead.created_at).toLocaleDateString('pt-BR'),
      hour: new Date(lead.created_at).toLocaleTimeString('pt-BR'),
      vehicle: lead.veiculo,
      year: lead.ano,
      status: lead.status,
      consultant: "Admin Master" // Nome fixo por enquanto
    }));

    return res.status(200).json(formattedLeads);
  } catch (err) {
    return res.status(500).json({ erro: err.message });
  }
}