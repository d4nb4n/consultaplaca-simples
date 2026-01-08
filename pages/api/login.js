import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();

  // Limpeza de dados: remove espaços e coloca e-mail em minúsculo
  const email = req.body.email ? req.body.email.trim().toLowerCase() : '';
  const password = req.body.password ? String(req.body.password).trim() : '';

  try {
    // Busca o usuário pelo e-mail
    const { data: user, error } = await supabase
      .from('usuarios')
      .select('*')
      .eq('email', email)
      .maybeSingle(); // Retorna null se não encontrar, em vez de erro 406

    if (error) throw error;

    if (!user) {
      return res.status(401).json({ erro: "E-mail não cadastrado." });
    }

    // Comparação exata da senha
    if (String(user.password).trim() !== password) {
      return res.status(401).json({ erro: "Senha incorreta." });
    }

    // Login com sucesso
    return res.status(200).json({ 
      sucesso: true, 
      user: { 
        nome: user.nome || user.name, 
        role: user.role, 
        email: user.email 
      } 
    });

  } catch (err) {
    console.error("Erro interno no Login:", err.message);
    return res.status(500).json({ erro: "Erro no servidor: " + err.message });
  }
}