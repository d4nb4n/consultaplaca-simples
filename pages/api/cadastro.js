import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();

  const body = req.body;

  try {
    const { error } = await supabase
      .from('leads')
      .insert([
        { 
          name: body.nome,           // DE: body.nome -> PARA: name (conforme banco)
          telefone: body.telefone,
          email: body.email || '',
          cep: body.cep || '',
          placa: body.placa ? body.placa.toUpperCase() : 'S/P',
          blindado: body.blindado || 'Não',
          importado: body.importado || 'Não',
          utilizacao: body.utilizacao || 'Particular', // Ajustado para 'utilizacao' sem acento conforme sua imagem
          status: 'Novo',
          visivel: true
        }
      ]);

    if (error) throw error;

    return res.status(200).json({ sucesso: true });
  } catch (err) {
    console.error("Erro detalhado:", err.message);
    return res.status(400).json({ erro: err.message });
  }
}