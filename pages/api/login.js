import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();

  // Forçar a leitura do body se vier como string ou objeto
  let dados = req.body;
  if (typeof dados === 'string') {
    try { dados = JSON.parse(dados); } catch(e) {}
  }

  const email = dados.email ? dados.email.trim().toLowerCase() : '';
  const password = dados.password ? String(dados.password).trim() : '';

  console.log("--- TESTE DE CONEXÃO REFEITO ---");
  console.log("E-mail recebido no servidor:", email);

  if (!email) {
    return res.status(400).json({ erro: "O e-mail chegou vazio ao servidor." });
  }

  try {
    const { data: user, error } = await supabase
      .from('usuarios')
      .select('*')
      .eq('email', email)
      .maybeSingle();

    if (!user) {
      return res.status(401).json({ erro: "Utilizador não cadastrado no Supabase." });
    }

    if (String(user.password).trim() !== password) {
      return res.status(401).json({ erro: "Senha incorreta." });
    }

    return res.status(200).json({ sucesso: true, user });
  } catch (err) {
    return res.status(500).json({ erro: err.message });
  }
}