import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ erro: "Método não permitido" });

  const { email, password } = req.body;

  try {
    const { data: user, error } = await supabase
      .from('usuarios')
      .select('*')
      .eq('email', email)
      .eq('password', password) // Em produção, usaríamos hash Bcrypt aqui
      .single();

    if (error || !user) return res.status(401).json({ erro: "Credenciais inválidas" });

    return res.status(200).json({ 
      sucesso: true, 
      user: { nome: user.nome, role: user.role, email: user.email } 
    });
  } catch (err) {
    return res.status(500).json({ erro: err.message });
  }
}