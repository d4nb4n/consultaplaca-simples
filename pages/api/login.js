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
    const { data: user, error } = await supabase
      .from('usuarios')
      .select('*')
      .eq('email', email)
      .maybeSingle();

    if (error) throw error;

    if (!user) {
      return res.status(401).json({ erro: "Usuário não encontrado no banco." });
    }

    // Compara a senha exata do banco
    if (user.password !== password) {
      return res.status(401).json({ erro: "Senha incorreta." });
    }

    // Sucesso - Retorna os dados padronizados
    return res.status(200).json({ 
      sucesso: true, 
      user: { 
        nome: user.nome, 
        role: user.role, 
        email: user.email 
      } 
    });
  } catch (err) {
    return res.status(500).json({ erro: err.message });
  }
}