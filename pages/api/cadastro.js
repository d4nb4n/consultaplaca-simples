import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();

  // Verifica se as chaves existem no servidor
  if (!supabaseUrl || !supabaseAnonKey) {
    return res.status(500).json({ erro: "Configuração do Supabase ausente no Vercel." });
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  const { nome, telefone, email, cep, placa, blindado, importado, utilizacao } = req.body;

  try {
    const { data, error } = await supabase
      .from('leads')
      .insert([
        { 
          nome, 
          telefone, 
          email: email || '', 
          cep: cep || '', 
          placa: placa ? placa.toUpperCase() : 'S/P', 
          blindado: blindado || 'Não', 
          importado: importado || 'Não', 
          utilizacao: utilizacao || 'Particular',
          visivel: true,
          status: 'Novo'
        }
      ]);

    if (error) {
      console.error("Erro do Supabase:", error);
      return res.status(400).json({ erro: error.message });
    }

    return res.status(200).json({ sucesso: true });
  } catch (err) {
    return res.status(500).json({ erro: "Erro interno: " + err.message });
  }
}