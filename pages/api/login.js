import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();

  const { email, password } = req.body;

  try {
    // Busca o usuário apenas pelo email primeiro
    const { data: user, error } = await supabase
      .from('usuarios')
      .select('*')
      .eq('email', email)
      .single();

    // Log para você ver no painel da Vercel
    console.log(`Tentativa de login para: ${email}`);

    if (error || !user) {
      console.log("Usuário não encontrado no banco.");
      return res.status(401).json({ erro: "Credenciais inválidas" });
    }

    // Compara a senha (simples para este estágio)
    if (user.password !== password) {
      console.log("Senha incorreta.");
      return res.status(401).json({ erro: "Credenciais inválidas" });
    }

    console.log("Login bem-sucedido!");
    return res.status(200).json({ 
      sucesso: true, 
      user: { nome: user.nome, role: user.role, email: user.email } 
    });
    
  } catch (err) {
    return res.status(500).json({ erro: err.message });
  }
}