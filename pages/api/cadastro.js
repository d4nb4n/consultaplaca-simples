import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

export default async function handler(req, res) {
  // CONFIGURAÇÃO DE CORS - Isso resolve o erro da imagem
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ erro: "Método não permitido" });
  }

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
          placa: placa.toUpperCase(), 
          blindado: blindado || 'Não', 
          importado: importado || 'Não', 
          utilizacao: utilizacao || 'Particular',
          visivel: true,
          status: 'Novo'
        }
      ]);

    if (error) throw error;

    return res.status(200).json({ sucesso: true });
  } catch (err) {
    console.error("Erro no cadastro:", err.message);
    return res.status(500).json({ erro: err.message });
  }
}