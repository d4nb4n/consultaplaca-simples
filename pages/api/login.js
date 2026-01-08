import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();

  const email = req.body.email?.trim().toLowerCase();
  const password = String(req.body.password || '').trim();

  try {
    // TESTE 1: Tentar ler a tabela de LEADS (que sabemos que tem dados)
    const { data: leads, error: errorLeads } = await supabase.from('leads').select('id').limit(1);
    console.log("--- TESTE DE CONEXÃO ---");
    console.log("Conexão com Leads:", errorLeads ? "ERRO: " + errorLeads.message : "OK");

    // TESTE 2: Tentar ler a tabela de USUARIOS
    const { data: user, error } = await supabase
      .from('usuarios')
      .select('*')
      .eq('email', email)
      .maybeSingle();

    if (error) {
      console.log("Erro ao ler USUARIOS:", error.message);
      return res.status(500).json({ erro: "Erro no banco: " + error.message });
    }

    if (!user) {
      console.log("Usuário não encontrado para o e-mail:", email);
      return res.status(401).json({ erro: "Usuário não encontrado no banco." });
    }

    if (user.password !== password) {
      return res.status(401).json({ erro: "Senha incorreta." });
    }

    return res.status(200).json({ sucesso: true, user });

  } catch (err) {
    return res.status(500).json({ erro: "Erro Interno: " + err.message });
  }
}