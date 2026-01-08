import { createClient } from '@supabase/supabase-js';

// Inicializa o cliente do Supabase usando as variáveis que configuraste no Vercel
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ erro: "Método não permitido" });

  const { nome, telefone, email, cep, placa, blindado, importado, utilizacao } = req.body;

  try {
    // Insere o lead diretamente na tabela 'leads' do Supabase
    // O 'id', 'created_at', 'status' e 'visivel' são preenchidos automaticamente pelo banco
    const { data, error } = await supabase
      .from('leads')
      .insert([
        { 
          nome, 
          telefone, 
          email: email || '', 
          cep: cep || '', 
          placa: placa.toUpperCase(), 
          blindado, 
          importado, 
          utilizacao 
        }
      ]);

    if (error) throw error;

    return res.status(200).json({ sucesso: true, mensagem: "Lead salvo no Supabase" });
  } catch (err) {
    console.error("Erro Supabase:", err.message);
    return res.status(500).json({ erro: "Falha ao salvar no banco de dados", detalhe: err.message });
  }
}