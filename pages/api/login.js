import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();

  // Remove espaços em branco do e-mail para evitar erros de digitação
  const email = req.body.email ? req.body.email.trim().toLowerCase() : '';
  const password = req.body.password;

  try {
    const { data: user, error } = await supabase
      .from('usuarios')
      .select('*')
      .eq('email', email)
      .single();

    if (error || !user) {
      return res.status(401).json({ erro: "Utilizador não encontrado" });
    }

    // Compara com a coluna 'password' conforme sua imagem
    if (user.password !== password) {
      return res.status(401).json({ erro: "Senha incorreta" });
    }

    return res.status(200).json({ 
      sucesso: true, 
      user: { 
        nome: user.name || user.nome, // Aceita 'name' conforme sua imagem
        role: user.role, 
        email: user.email 
      } 
    });
  } catch (err) {
    return res.status(500).json({ erro: err.message });
  }
}